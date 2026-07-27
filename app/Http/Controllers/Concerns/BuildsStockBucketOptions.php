<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Product;

/**
 * Membangun daftar "bucket" stok yang bisa dipilih di form stok
 * (penyesuaian, opname, transfer).
 *
 * Stok TIDAK disimpan per produk, melainkan per kombinasi
 * produk + variant + satuan + cabang — lihat unique index
 * `product_stocks_bucket_unique`. Form stok karena itu harus memilih BUCKET,
 * bukan produk: kalau yang dikirim hanya `product_id`, seluruh koreksi
 * mendarat di bucket dasar (variant NULL, satuan NULL) yang untuk produk
 * bervariant justru tidak pernah dipakai berjualan.
 *
 * Polanya meniru PurchaseController::productsForPurchaseForm() supaya form
 * stok dan form pembelian melihat data yang sama persis.
 */
trait BuildsStockBucketOptions
{
    /**
     * @return array<int, array<string, mixed>> daftar rata (flat), siap dipakai
     *                                          sebagai opsi dropdown
     */
    protected function stockBucketOptions(int $storeId): array
    {
        $products = Product::forStore($storeId)
            ->where('is_active', true)
            ->where('track_stock', true)
            ->with([
                'variants' => fn ($q) => $q->where('is_active', true),
                'variants.packagingUnits',
                'packagingUnits' => fn ($q) => $q->whereNull('variant_id'),
                'stocks' => fn ($q) => $q->where('store_id', $storeId),
            ])
            ->orderBy('name')
            ->get();

        $buckets = [];

        foreach ($products as $product) {
            // Stok dipecah per cabang, bukan dijumlahkan. Transfer memilih
            // cabang asalnya sendiri di form, sedangkan penyesuaian/opname
            // memakai cabang aktif — keduanya butuh angka per cabang.
            $stockByBranch = function ($variantId, $unitId) use ($product) {
                return $product->stocks
                    ->where('variant_id', $variantId)
                    ->where('packaging_unit_id', $unitId)
                    ->groupBy(fn ($row) => (string) $row->branch_id)
                    ->map(fn ($rows) => (float) $rows->sum('quantity') - (float) $rows->sum('reserved_quantity'))
                    ->toArray();
            };

            $make = function ($variant, $unit) use ($product, $stockByBranch) {
                $variantId = $variant?->id;
                $unitId = $unit?->id;

                $label = $product->name;
                if ($variant) {
                    $label .= ' — '.$variant->name;
                }
                if ($unit) {
                    $label .= ' — '.$unit->name;
                }

                return [
                    // Kunci gabungan: dua bucket berbeda dari produk yang sama
                    // harus bisa ditambahkan bersamaan ke satu dokumen.
                    'key' => sprintf('%d-%s-%s', $product->id, $variantId ?? '', $unitId ?? ''),
                    'product_id' => $product->id,
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $unitId,
                    'label' => $label,
                    'product_name' => $product->name,
                    'variant_name' => $variant?->name,
                    'unit_name' => $unit?->name,
                    'sku' => $variant?->sku ?: $product->sku,
                    'conversion_qty' => $unit?->conversion_qty,
                    'cost_price' => (float) ($variant?->cost_price ?: $product->cost_price ?: 0),
                    // Dipakai helper konversi satuan di frontend.
                    'type' => $product->type,
                    'unit' => $product->unit,
                    'base_unit' => $product->base_unit,
                    'base_unit_conversion' => $product->base_unit_conversion,
                    'stock_by_branch' => $stockByBranch($variantId, $unitId),
                ];
            };

            // Produk bervariant: stoknya hidup di variant, jadi bucket dasar
            // produk sengaja TIDAK ditawarkan — menawarkannya hanya akan
            // membuat koreksi mendarat di bucket yang tak pernah dijual.
            if ($product->variants->isNotEmpty()) {
                foreach ($product->variants as $variant) {
                    $buckets[] = $make($variant, null);

                    foreach ($variant->packagingUnits as $unit) {
                        $buckets[] = $make($variant, $unit);
                    }
                }

                continue;
            }

            $buckets[] = $make(null, null);

            foreach ($product->packagingUnits as $unit) {
                $buckets[] = $make(null, $unit);
            }
        }

        return $buckets;
    }
}
