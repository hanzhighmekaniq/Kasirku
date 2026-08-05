<?php

namespace App\Services\Stock;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

/**
 * Pintu tunggal untuk semua mutasi stok.
 *
 * Sebelum refactor ini, 26 titik di 12 file masing-masing membuat bucket
 * ProductStock dan StockMovement sendiri — dengan cara yang sedikit berbeda
 * dan sering lupa menyertakan branch_id. Akibatnya:
 *
 *   1. Penjualan di cabang 2 bisa mengurangi stok cabang 1.
 *   2. Bisa muncul baris hantu product_stocks ber-branch_id NULL.
 *   3. Setiap perbaikan aturan (mis. FEFO, batch) harus diulang di 12 file.
 *
 * Dengan service ini resolusi bucket dan pencatatan movement terpusat. Kalau
 * nanti ada FEFO, cukup ubah decrease() — semua pemanggil otomatis ikut.
 *
 * Migrasi bertahap: setiap controller dipindah satu per satu. Selama migrasi,
 * service ini dan kode lama boleh berjalan berdampingan — keduanya menghasilkan
 * perilaku yang sama karena logikanya identik.
 */
final class StockService
{
    /**
     * Tambah stok dan catat pergerakan masuk.
     *
     * Juga memperbarui moving average cost bucket (pola yang sama dengan
     * PurchaseController yang sudah benar).
     *
     * Menggunakan DB::transaction + lockForUpdate untuk mencegah race condition
     * pada perhitungan moving average cost.
     */
    public function increase(StockMutation $m): void
    {
        DB::transaction(function () use ($m) {
            $stock = $this->resolveBucketLocked($m);

            $oldQty = (float) $stock->quantity;
            $oldCost = (float) $stock->average_cost;
            $newQty = $oldQty + $m->quantity;

            // Moving average: ((oldQty × oldCost) + (newQty × newCost)) ÷ totalQty
            if ($newQty > 0 && $m->unitCost > 0) {
                $avg = ($oldQty * $oldCost + $m->quantity * $m->unitCost) / $newQty;
                $stock->update(['quantity' => $newQty, 'average_cost' => round($avg, 2)]);
            } else {
                $stock->increment('quantity', $m->quantity);
            }

            $product = Product::find($m->productId);
            if ($product && $product->track_batch && $m->productBatchId) {
                $batch = ProductBatch::lockForUpdate()->find($m->productBatchId);
                if ($batch) {
                    $batch->increment('quantity', $m->quantity);
                }
            }

            $this->recordMovement($m);
        });
    }

    /**
     * Kurangi stok dan catat pergerakan keluar.
     *
     * Kalau `$m->revertAvgCost === true` (mis. pembatalan pembelian),
     * average_cost direvisi seolah qty ini tidak pernah masuk.
     *
     * Kalau `$m->productBatchId` diisi, batch tersebut langsung dikurangi
     * (cocok untuk retur pembelian / penyesuaian batch spesifik).
     * Tanpa `productBatchId`, sistem pakai urutan FEFO otomatis.
     *
     * @return array<int, array{batch_id: int, quantity: float}>
     *                                                           List batch yang terpotong beserta jumlahnya.
     *                                                           Kosong jika produk tidak track_batch.
     */
    public function decrease(StockMutation $m): array
    {
        return DB::transaction(function () use ($m) {
            $stock = $this->resolveBucketLocked($m);

            $oldQty = (float) $stock->quantity;

            if ($oldQty < $m->quantity) {
                $product = Product::find($m->productId);
                $productName = $product?->name ?? "ID#{$m->productId}";
                throw new \RuntimeException(
                    "Stok \"{$productName}\" tidak cukup. Dibutuhkan {$m->quantity}, tersedia {$oldQty}."
                );
            }

            $stock->decrement('quantity', $m->quantity);

            if ($m->revertAvgCost && $m->unitCost > 0) {
                $remainingQty = $oldQty - $m->quantity;
                $oldCost = (float) $stock->fresh()->average_cost;

                if ($remainingQty <= 0) {
                    $stock->update(['average_cost' => 0]);
                } else {
                    $revertCost = ($oldQty * $oldCost - $m->quantity * $m->unitCost) / $remainingQty;
                    $stock->update(['average_cost' => round(max(0, $revertCost), 2)]);
                }
            }

            $batchDeductions = [];

            $product = Product::find($m->productId);
            if ($product && $product->track_batch) {
                if ($m->productBatchId) {
                    $specificBatch = ProductBatch::lockForUpdate()->find($m->productBatchId);
                    if ($specificBatch) {
                        $take = min((float) $specificBatch->quantity, (float) $m->quantity);
                        if ($take > 0) {
                            $specificBatch->decrement('quantity', $take);
                            $batchDeductions[] = ['batch_id' => $specificBatch->id, 'quantity' => $take];
                        }
                    }
                } else {
                    $remainingQty = (float) $m->quantity;

                    $batches = ProductBatch::where([
                        'product_id' => $m->productId,
                        'variant_id' => $m->variantId,
                        'packaging_unit_id' => $m->packagingUnitId,
                        'store_id' => $m->storeId,
                        'branch_id' => $m->branchId,
                    ])
                        ->where('quantity', '>', 0)
                        ->orderByRaw('expiry_date IS NULL ASC, expiry_date ASC')
                        ->orderBy('purchase_date', 'asc')
                        ->lockForUpdate()
                        ->get();

                    foreach ($batches as $batch) {
                        if ($remainingQty <= 0) {
                            break;
                        }

                        $take = min((float) $batch->quantity, $remainingQty);
                        $batch->decrement('quantity', $take);
                        $remainingQty -= $take;
                        $batchDeductions[] = ['batch_id' => $batch->id, 'quantity' => $take];
                    }
                }
            }

            $this->recordMovement($m);

            return $batchDeductions;
        });
    }

    /**
     * Stok tersedia di bucket ini.
     */
    public function available(StockMutation $m): float
    {
        $stock = ProductStock::where($m->bucketKey())->first();

        return $stock
            ? max(0, (float) $stock->quantity - (float) $stock->reserved_quantity)
            : 0.0;
    }

    /**
     * Validasi bahwa semua item punya stok cukup di bucket yang tepat.
     *
     * Sengaja dipisah dari decrease() supaya pemanggil bisa melakukan
     * pre-check semua item sebelum memutong satu pun — mencegah kondisi
     * "item 1 berhasil dipotong, item 2 gagal karena stok kurang".
     *
     * Produk yang punya resep (FnB) dilewati — pemotongan bahan bakunya
     * terjadi di decreaseRecipeIngredients() dengan aturan sendiri.
     *
     * @param  array<int, array<string, mixed>>  $items  baris item dari request
     *
     * @throws \RuntimeException jika ada item yang stoknya tidak cukup
     */
    public function assertSufficientStock(array $items, int $storeId, ?int $branchId): void
    {
        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            if (! $product || ! $product->track_stock || $product->recipes()->exists()) {
                continue;
            }

            $available = ProductStock::where([
                'product_id' => $item['product_id'],
                'variant_id' => $item['variant_id'] ?? null,
                'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                'store_id' => $storeId,
                'branch_id' => $branchId,
            ])->sum('quantity');

            if ($available < $item['quantity']) {
                $unitLabel = ! empty($item['unit_name']) ? " ({$item['unit_name']})" : '';
                throw new \RuntimeException(
                    "Stok \"{$product->name}{$unitLabel}\" tidak cukup. ".
                    "Dibutuhkan {$item['quantity']}, tersedia {$available}.",
                );
            }
        }
    }

    /**
     * Potong stok bahan baku sesuai resep — khusus produk FnB berkomposisi.
     *
     * Memindahkan logika yang sebelumnya terduplikasi di FinalizesSaleStock,
     * KasirController, dan PaymentGatewayController.
     *
     * @param  array<string, mixed>  $item  baris item penjualan
     * @param  Product  $product  produk jadi yang punya resep
     * @param  string  $referenceType  kelas model referensi (Sale::class)
     * @param  string  $referenceNo  nomor transaksi untuk notes
     * @return array{ingredientCost: float, snapshot: array<int, array<string, mixed>>}
     */
    public function decreaseRecipeIngredients(
        array $item,
        Product $product,
        string $referenceType,
        int $referenceId,
        string $referenceNo,
        int $storeId,
        int $branchId,
        ?\DateTimeImmutable $movedAt = null,
    ): array {
        $snapshot = [];
        $ingredientCost = 0.0;
        $now = $movedAt ?? now();

        foreach ($product->recipes as $recipe) {
            $needed = (float) $recipe->quantity * (float) $item['quantity'];

            if ($recipe->is_nullable) {
                $rawStock = $recipe->rawMaterial->stocks
                    ->where('store_id', $storeId)
                    ->where('branch_id', $branchId)
                    ->sum('quantity');
                if ($rawStock <= 0) {
                    continue;
                }
            }

            $costPerUnit = $recipe->rawMaterial->costPerBaseUnit();
            $ingredientCost += $needed * $costPerUnit;

            $snapshot[] = [
                'raw_material_id' => $recipe->raw_material_id,
                'raw_material_name' => $recipe->rawMaterial->name,
                'quantity_per_unit' => (float) $recipe->quantity,
                'total_quantity' => $needed,
                'unit' => $recipe->unit,
                'cost_price' => $costPerUnit,
                'total_cost' => $needed * $costPerUnit,
                'is_nullable' => $recipe->is_nullable,
            ];

            $this->decrease(new StockMutation(
                productId: $recipe->raw_material_id,
                variantId: null,
                packagingUnitId: null,
                storeId: $storeId,
                branchId: $branchId,
                quantity: $needed,
                unitCost: $costPerUnit,
                movementType: 'sale_out',
                referenceType: $referenceType,
                referenceId: $referenceId,
                referenceNo: $referenceNo,
                notes: "Penjualan #{$referenceNo} — bahan untuk {$product->name}",
                movedAt: (string) $now,
            ));
        }

        return compact('ingredientCost', 'snapshot');
    }

    // ── Private ──────────────────────────────────────────────────────────

    /**
     * Temukan atau buat baris stok untuk bucket ini (tanpa lock).
     *
     * Satu-satunya tempat di codebase yang boleh membuat baris ProductStock
     * baru. Ini menjamin kunci selalu lengkap — tidak ada lagi baris hantu
     * ber-branch_id NULL.
     */
    private function resolveBucket(StockMutation $m): ProductStock
    {
        return ProductStock::firstOrCreate(
            $m->bucketKey(),
            ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
        );
    }

    /**
     * Resolve bucket dengan row-level lock (untuk decrease atomic).
     */
    private function resolveBucketLocked(StockMutation $m): ProductStock
    {
        return ProductStock::lockForUpdate()->firstOrCreate(
            $m->bucketKey(),
            ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
        );
    }

    private function recordMovement(StockMutation $m): void
    {
        StockMovement::create(
            $m->bucketKey() + $m->movementData(),
        );
    }
}
