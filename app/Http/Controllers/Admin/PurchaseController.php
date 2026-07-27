<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\Supplier;
use App\Services\Stock\StockMutation;
use App\Services\Stock\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        [$storeId, $branchId] = $this->storeScope();

        $query = Purchase::where('store_id', $storeId)
            ->with('supplier')
            ->latest();
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $purchases = $query->get();

        $stats = [
            'total' => $purchases->count(),
            'draft' => $purchases->where('status', 'draft')->count(),
            'completed' => $purchases->where('status', 'completed')->count(),
            'unpaid' => $purchases->where('payment_status', 'unpaid')->count(),
        ];

        $store = Store::with('storeType')->find($storeId);
        $storeTypeCode = $store?->getRelation('storeType')?->code ?? 'retail';

        return Inertia::render('Admin/Purchases/Index', [
            'purchases' => $purchases,
            'stats' => $stats,
            'storeType' => $storeTypeCode,
        ]);
    }

    public function create(Request $request)
    {
        [$storeId] = $this->storeScope();

        $store = Store::with('storeType')->find($storeId);
        $storeTypeCode = $store?->getRelation('storeType')?->code ?? 'retail';

        // Pre-fill from product list redirect
        $prefill = null;
        if ($request->has('product_id') && $request->has('supplier_id')) {
            $prefillProduct = Product::find($request->query('product_id'));
            if ($prefillProduct) {
                $variantId = $request->query('variant_id');
                $variant = $variantId
                    ? $prefillProduct->variants()->find($variantId)
                    : null;

                // Pembelian bisa diarahkan ke bucket satuan tertentu (mis. Dus),
                // bukan hanya satuan dasar — dipakai tombol "Beli" per satuan
                // di baris detail halaman produk.
                $unitId = $request->query('packaging_unit_id');
                $unit = $unitId
                    ? $prefillProduct->packagingUnits()->find($unitId)
                    : null;

                $prefill = [
                    'supplier_id' => (int) $request->query('supplier_id'),
                    'product_id' => $prefillProduct->id,
                    'product_name' => $prefillProduct->name,
                    'product_sku' => $variant?->sku ?? $prefillProduct->sku,
                    'cost_price' => $variant?->cost_price ?? $prefillProduct->cost_price ?? 0,
                    'variant_id' => $variant?->id,
                    'variant_name' => $variant?->name,
                    'packaging_unit_id' => $unit?->id,
                    'unit_name' => $unit?->name,
                ];
            }
        }

        return Inertia::render('Admin/Purchases/Create', [
            'suppliers' => Supplier::where('store_id', $storeId)->get(),
            'products' => $this->productsForPurchaseForm($storeId),
            'paymentMethods' => PaymentMethod::forStore($storeId)
                ->where('is_active', true)
                ->get(),
            'storeType' => $storeTypeCode,
            'prefill' => $prefill,
        ]);
    }

    /**
     * Produk untuk form pembelian, lengkap dengan variant + packaging unit +
     * stok per bucket, supaya staf bisa pilih persis "Produk → Variant →
     * Unit" dan lihat stok masing-masing sebelum input qty pembelian.
     */
    private function productsForPurchaseForm(int $storeId)
    {
        return Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->with([
                'variants' => fn ($q) => $q->where('is_active', true),
                'variants.packagingUnits',
                'packagingUnits' => fn ($q) => $q->whereNull('variant_id'),
                'stocks' => fn ($q) => $q->where('store_id', $storeId),
            ])
            ->get()
            ->map(function ($p) {
                $bucketStock = fn ($variantId, $packagingUnitId) => $p->stocks
                    ->where('variant_id', $variantId)
                    ->where('packaging_unit_id', $packagingUnitId)
                    ->sum('quantity');

                $p->stock = $bucketStock(null, null);

                $p->variants->each(function ($v) use ($bucketStock) {
                    $v->stock = $bucketStock($v->id, null);
                    $v->packagingUnits->each(function ($u) use ($bucketStock, $v) {
                        $u->stock = $bucketStock($v->id, $u->id);
                    });
                });

                $p->packagingUnits->each(function ($u) use ($bucketStock) {
                    $u->stock = $bucketStock(null, $u->id);
                });

                unset($p->stocks);

                return $p;
            });
    }

    public function store(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_amount' => 'nullable|numeric|min:0',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
            'items.*.unit_name' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.cost_price' => 'required|numeric|min:0',
            'items.*.batch_no' => 'nullable|string|max:100',
            'items.*.expiry_date' => 'nullable|date',
        ]);

        DB::beginTransaction();
        try {
            // Generate purchase_no: PO-YYYYMMDD-NNN
            $date = now()->format('Ymd');
            $last = Purchase::where('purchase_no', 'like', "PO-{$date}-%")
                ->orderByRaw(
                    'CAST(SUBSTRING(purchase_no, 13) AS UNSIGNED) DESC',
                )
                ->first();
            $next = $last ? ((int) substr($last->purchase_no, 12)) + 1 : 1;
            $purchaseNo = "PO-{$date}-".str_pad($next, 3, '0', STR_PAD_LEFT);

            // Calculate subtotal from items
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['quantity'] * $item['cost_price'];
            }

            $discount = $validated['discount_amount'] ?? 0;
            $tax = $validated['tax_amount'] ?? 0;
            $shipping = $validated['shipping_amount'] ?? 0;
            $grandTotal = $subtotal - $discount + $tax + $shipping;
            $paidAmount = $validated['paid_amount'] ?? 0;

            $status = 'draft';
            $paymentStatus = 'unpaid';
            if ($paidAmount >= $grandTotal && $grandTotal > 0) {
                $paymentStatus = 'paid';
                $status = 'completed';
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'partial';
            }

            $purchase = Purchase::create([
                'store_id' => $storeId,
                'branch_id' => $branchId,
                'supplier_id' => $validated['supplier_id'],
                'user_id' => Auth::id(),
                'purchase_no' => $purchaseNo,
                'purchase_date' => $validated['purchase_date'],
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'tax_amount' => $tax,
                'shipping_amount' => $shipping,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'status' => $status,
                'payment_status' => $paymentStatus,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create purchase items
            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                    'unit_name' => $item['unit_name'] ?? null,
                    'batch_no' => $item['batch_no'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                    'subtotal' => $item['quantity'] * $item['cost_price'],
                ]);
            }

            // Jika ada pembayaran, catat sebagai payment
            if ($paidAmount > 0 && ($validated['payment_method_id'] ?? false)) {
                PurchasePayment::create([
                    'purchase_id' => $purchase->id,
                    'payment_method_id' => $validated['payment_method_id'],
                    'paid_at' => $validated['purchase_date'],
                    'amount' => $paidAmount,
                ]);
            }

            // Jika langsung completed (lunas), tambah stok sekaligus
            if ($status === 'completed') {
                $stockService = app(StockService::class);

                foreach ($purchase->items as $item) {
                    $product = Product::find($item->product_id);
                    if ($product?->track_stock) {
                        $stockQty = $item->stockQuantity();
                        $stockCost = $item->stockUnitCost();

                        $stockService->increase(new StockMutation(
                            productId: $item->product_id,
                            variantId: $item->variant_id,
                            packagingUnitId: $item->packaging_unit_id,
                            storeId: $storeId,
                            branchId: $branchId,
                            quantity: $stockQty,
                            unitCost: $stockCost,
                            movementType: 'purchase_in',
                            referenceType: Purchase::class,
                            referenceId: $purchase->id,
                            referenceNo: $purchase->purchase_no,
                            notes: "Pembelian #{$purchase->purchase_no}",
                        ));

                        // Auto-set supplier default pada produk
                        $product->update(['supplier_id' => $purchase->supplier_id]);
                    }

                    // Buat batch otomatis untuk produk yang track_batch = true
                    if ($product?->track_batch) {
                        $this->createBatchFromPurchaseItem($item, $purchase, $storeId, $branchId);
                    }
                }
            }

            DB::commit();

            return redirect()
                ->route('admin.purchases.show', $purchase->id)
                ->with('success', 'Pembelian berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with('error', 'Gagal membuat pembelian: '.$e->getMessage());
        }
    }

    public function show(Purchase $purchase)
    {
        $purchase->load([
            'supplier',
            'items.product',
            'items.variant',
            'items.packagingUnit',
            'payments.paymentMethod',
            'user',
        ]);

        $store = Store::with('storeType')->find($purchase->store_id);
        $storeTypeCode = $store?->getRelation('storeType')?->code ?? 'retail';

        return Inertia::render('Admin/Purchases/Show', [
            'purchase' => $purchase,
            'storeType' => $storeTypeCode,
        ]);
    }

    public function edit(Purchase $purchase)
    {
        $storeId = $this->storeScope()[0];

        // Only draft purchases can be edited
        if ($purchase->status !== 'draft') {
            return redirect()
                ->route('admin.purchases.show', $purchase->id)
                ->with(
                    'error',
                    'Hanya pembelian dengan status draft yang dapat diedit.',
                );
        }

        $purchase->load([
            'supplier',
            'items.product',
            'items.variant',
            'items.packagingUnit',
            'payments.paymentMethod',
        ]);

        $store = Store::with('storeType')->find($storeId);
        $storeTypeCode = $store?->getRelation('storeType')?->code ?? 'retail';

        return Inertia::render('Admin/Purchases/Edit', [
            'purchase' => $purchase,
            'suppliers' => Supplier::where('store_id', $storeId)->get(),
            'products' => $this->productsForPurchaseForm($storeId),
            'paymentMethods' => PaymentMethod::forStore($storeId)
                ->where('is_active', true)
                ->get(),
            'storeType' => $storeTypeCode ?? 'retail',
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        if ($purchase->status !== 'draft') {
            return redirect()
                ->route('admin.purchases.show', $purchase->id)
                ->with(
                    'error',
                    'Hanya pembelian dengan status draft yang dapat diedit.',
                );
        }

        $storeId = $this->storeScope()[0];

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_amount' => 'nullable|numeric|min:0',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'paid_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
            'items.*.unit_name' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.cost_price' => 'required|numeric|min:0',
            'items.*.batch_no' => 'nullable|string|max:100',
            'items.*.expiry_date' => 'nullable|date',
        ]);

        DB::beginTransaction();
        try {
            // Replace items — safe karena draft (belum ada stok movement)
            $purchase->items()->delete();
            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                    'unit_name' => $item['unit_name'] ?? null,
                    'batch_no' => $item['batch_no'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                    'subtotal' => $item['quantity'] * $item['cost_price'],
                ]);
            }
            $purchase->load('items');

            // Recalculate from new items
            $subtotal = 0;
            foreach ($purchase->items as $item) {
                $subtotal += $item->quantity * $item->cost_price;
            }

            $discount = $validated['discount_amount'] ?? 0;
            $tax = $validated['tax_amount'] ?? 0;
            $shipping = $validated['shipping_amount'] ?? 0;
            $grandTotal = $subtotal - $discount + $tax + $shipping;
            $paidAmount = $validated['paid_amount'] ?? 0;

            $status = 'draft';
            $paymentStatus = 'unpaid';
            if ($paidAmount >= $grandTotal && $grandTotal > 0) {
                $paymentStatus = 'paid';
                $status = 'completed';
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'partial';
            }

            $wasDraft = $purchase->status === 'draft';

            $purchase->update([
                'supplier_id' => $validated['supplier_id'],
                'purchase_date' => $validated['purchase_date'],
                'discount_amount' => $discount,
                'tax_amount' => $tax,
                'shipping_amount' => $shipping,
                'subtotal' => $subtotal,
                'grand_total' => $grandTotal,
                'status' => $status,
                'payment_status' => $paymentStatus,
                'paid_amount' => $paidAmount,
            ]);

            // If moving from draft to completed, update stock
            if ($wasDraft && $status === 'completed') {
                $stockService = app(StockService::class);

                foreach ($purchase->items as $item) {
                    $product = Product::find($item->product_id);
                    if ($product?->track_stock) {
                        $stockQty = $item->stockQuantity();
                        $stockCost = $item->stockUnitCost();

                        $alreadyRecorded = StockMovement::where([
                            'reference_type' => Purchase::class,
                            'reference_id' => $purchase->id,
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'packaging_unit_id' => $item->packaging_unit_id,
                            'movement_type' => 'purchase_in',
                        ])->exists();

                        if (! $alreadyRecorded) {
                            $stockService->increase(new StockMutation(
                                productId: $item->product_id,
                                variantId: $item->variant_id,
                                packagingUnitId: $item->packaging_unit_id,
                                storeId: $storeId,
                                branchId: $purchase->branch_id,
                                quantity: $stockQty,
                                unitCost: $stockCost,
                                movementType: 'purchase_in',
                                referenceType: Purchase::class,
                                referenceId: $purchase->id,
                                referenceNo: $purchase->purchase_no,
                                notes: "Pembelian #{$purchase->purchase_no}",
                            ));
                        }
                    }

                    if ($product?->track_batch) {
                        $this->createBatchFromPurchaseItem($item, $purchase, $storeId, $purchase->branch_id);
                    }
                }
            }

            // Update/create payment
            if ($paidAmount > 0 && ($validated['payment_method_id'] ?? false)) {
                $existingPayment = $purchase->payments()->first();
                if ($existingPayment) {
                    $existingPayment->update([
                        'payment_method_id' => $validated['payment_method_id'],
                        'paid_at' => $validated['purchase_date'],
                        'amount' => $paidAmount,
                    ]);
                } else {
                    PurchasePayment::create([
                        'purchase_id' => $purchase->id,
                        'payment_method_id' => $validated['payment_method_id'],
                        'paid_at' => $validated['purchase_date'],
                        'amount' => $paidAmount,
                    ]);
                }
            }

            DB::commit();

            return redirect()
                ->route('admin.purchases.show', $purchase->id)
                ->with('success', 'Pembelian berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with(
                    'error',
                    'Gagal memperbarui pembelian: '.$e->getMessage(),
                );
        }
    }

    public function destroy(Purchase $purchase)
    {
        if ($purchase->status === 'completed') {
            $stockService = app(StockService::class);

            foreach ($purchase->items as $item) {
                $product = $item->product;
                if ($product?->track_stock) {
                    $stockQty = $item->stockQuantity();
                    $stockCost = $item->stockUnitCost();

                    $stockService->decrease(new StockMutation(
                        productId: $item->product_id,
                        variantId: $item->variant_id,
                        packagingUnitId: $item->packaging_unit_id,
                        storeId: $purchase->store_id,
                        branchId: $purchase->branch_id,
                        quantity: $stockQty,
                        unitCost: $stockCost,
                        movementType: 'purchase_out',
                        referenceType: Purchase::class,
                        referenceId: $purchase->id,
                        referenceNo: $purchase->purchase_no,
                        notes: "Pembelian #{$purchase->purchase_no} — dihapus",
                        revertAvgCost: true,
                    ));
                }
            }
        }

        $purchase->delete();

        return redirect()
            ->route('admin.purchases.index')
            ->with('success', 'Pembelian berhasil dihapus.');
    }

    public function updateStatus(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'status' => 'required|in:completed,cancelled',
        ]);

        $oldStatus = $purchase->status;
        $newStatus = $validated['status'];

        DB::beginTransaction();

        try {
            $stockService = app(StockService::class);

            if ($oldStatus !== 'completed' && $newStatus === 'completed') {
                // Mark as completed — add stock
                foreach ($purchase->items as $item) {
                    $product = $item->product;
                    if ($product?->track_stock) {
                        $stockService->increase(new StockMutation(
                            productId: $item->product_id,
                            variantId: $item->variant_id,
                            packagingUnitId: $item->packaging_unit_id,
                            storeId: $purchase->store_id,
                            branchId: $purchase->branch_id,
                            quantity: $item->stockQuantity(),
                            unitCost: $item->stockUnitCost(),
                            movementType: 'purchase_in',
                            referenceType: Purchase::class,
                            referenceId: $purchase->id,
                            referenceNo: $purchase->purchase_no,
                            notes: "Pembelian #{$purchase->purchase_no} — diubah ke selesai",
                        ));
                    }

                    if ($product?->track_batch) {
                        $this->createBatchFromPurchaseItem($item, $purchase, $purchase->store_id, $purchase->branch_id);
                    }
                }
            } elseif ($oldStatus === 'completed' && $newStatus === 'cancelled') {
                // Cancel completed — reverse stock
                foreach ($purchase->items as $item) {
                    $product = $item->product;
                    if ($product?->track_stock) {
                        $stockService->decrease(new StockMutation(
                            productId: $item->product_id,
                            variantId: $item->variant_id,
                            packagingUnitId: $item->packaging_unit_id,
                            storeId: $purchase->store_id,
                            branchId: $purchase->branch_id,
                            quantity: $item->stockQuantity(),
                            unitCost: $item->stockUnitCost(),
                            movementType: 'purchase_out',
                            referenceType: Purchase::class,
                            referenceId: $purchase->id,
                            referenceNo: $purchase->purchase_no,
                            notes: "Pembelian #{$purchase->purchase_no} — dibatalkan",
                            revertAvgCost: true,
                        ));
                    }
                }
            }

            // Update payment_status based on paid vs grand_total
            $paymentStatus = $purchase->payment_status;
            if ($newStatus === 'cancelled') {
                $paymentStatus = 'unpaid';
            }

            $purchase->update([
                'status' => $newStatus,
                'payment_status' => $paymentStatus,
            ]);

            DB::commit();

            return back()->with(
                'success',
                'Status pembelian berhasil diperbarui.',
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with(
                'error',
                'Gagal memperbarui status: '.$e->getMessage(),
            );
        }
    }

    /**
     * Update stock bucket's average_cost using moving average method.
     * Called after purchase stock increment. Each bucket (product + variant +
     * packaging_unit combination) keeps its own independent average cost —
     * buying by "dus" and by "pcs" never mix their modal calculation.
     */
    private function updateBucketAverageCost(
        ProductStock $stock,
        float $newPrice,
        float $newQty,
        float $oldQtyBefore,
    ): void {
        $oldCost = (float) $stock->average_cost;
        $totalQty = $oldQtyBefore + $newQty;

        if ($totalQty > 0) {
            $avgCost =
                ($oldQtyBefore * $oldCost + $newQty * $newPrice) / $totalQty;
        } else {
            $avgCost = $newPrice;
        }

        $stock->update(['average_cost' => round($avgCost, 2)]);
    }

    /**
     * Revert stock bucket's average_cost when purchase is cancelled/deleted.
     * Removes the purchase contribution from the moving average.
     */
    private function revertBucketAverageCost(
        ProductStock $stock,
        float $removedPrice,
        float $removedQty,
        float $oldQtyBefore,
    ): void {
        $oldCost = (float) $stock->average_cost;
        $remainingQty = $oldQtyBefore - $removedQty;

        if ($remainingQty <= 0) {
            $stock->update(['average_cost' => 0]);
        } else {
            $revertCost =
                ($oldQtyBefore * $oldCost - $removedQty * $removedPrice) /
                $remainingQty;
            $stock->update([
                'average_cost' => round(max(0, $revertCost), 2),
            ]);
        }
    }

    /**
     * Buat batch otomatis dari satu baris pembelian.
     *
     * Dipanggil saat pembelian berstatus completed, hanya untuk produk
     * yang track_batch = true. Kalau batch dengan nomor yang sama sudah
     * ada (mis. update() dipanggil dua kali karena idempotency), baris
     * yang sudah ada dibiarkan — tidak duplikat, tidak error.
     *
     * Nomor batch: pakai field yang dikirim form (`batch_no`), atau
     * auto-generate dari nomor PO + urutan baris kalau kosong.
     */
    private function createBatchFromPurchaseItem(
        PurchaseItem $item,
        Purchase $purchase,
        int $storeId,
        ?int $branchId,
    ): void {
        $batchNo = $item->batch_no ?? null;

        if (! $batchNo) {
            $seq = $item->id % 1000;
            $batchNo = $purchase->purchase_no.'-'.str_pad($seq, 3, '0', STR_PAD_LEFT);
        }

        ProductBatch::firstOrCreate(
            [
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'packaging_unit_id' => $item->packaging_unit_id,
                'batch_no' => $batchNo,
            ],
            [
                'store_id' => $storeId,
                'branch_id' => $branchId,
                'purchase_date' => $purchase->purchase_date,
                'expiry_date' => $item->expiry_date ?? null,
                'quantity' => $item->quantity,
                'cost_price' => $item->cost_price,
            ],
        );
    }
}
