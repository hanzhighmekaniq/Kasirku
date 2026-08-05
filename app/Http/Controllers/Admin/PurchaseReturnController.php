<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\Store;
use App\Services\Stock\StockMutation;
use App\Services\Stock\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseReturnController extends Controller
{
    /**
     * Resolve store type code dari toko aktif di session.
     */
    private function resolveStoreType(): string
    {
        $storeId = session('current_store_id');

        return Store::with('storeType')
            ->find($storeId)
            ?->getRelation('storeType')?->code ?? 'retail';
    }

    public function index()
    {
        $storeId = session('current_store_id');

        $returns = PurchaseReturn::whereHas('purchase', fn ($q) => $q->where('store_id', $storeId))
            ->with(['supplier', 'purchase'])
            ->withCount('items')
            ->latest()
            ->get();

        return Inertia::render('Admin/PurchaseReturns/Index', [
            'purchaseReturns' => $returns,
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    public function create()
    {
        $storeId = session('current_store_id');

        // Only completed purchases from this store can be returned
        $purchases = Purchase::where('status', 'completed')
            ->where('store_id', $storeId)
            ->with('supplier:id,name')
            ->withCount('items')
            ->latest()
            ->get();

        return Inertia::render('Admin/PurchaseReturns/Create', [
            'purchases' => $purchases,
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'purchase_id' => [
                'required',
                'exists:purchases,id',
                function ($attribute, $value, $fail) use ($storeId) {
                    $purchase = Purchase::find($value);
                    if (! $purchase || $purchase->store_id != $storeId) {
                        $fail('Pembelian tidak ditemukan di toko ini.');
                    }
                },
            ],
            'return_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.purchase_item_id' => 'nullable|exists:purchase_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.cost_price' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string|max:500',
        ]);

        $purchase = Purchase::findOrFail($validated['purchase_id']);

        // Validate: each return qty must not exceed returnable qty.
        // Kunci utamanya purchase_item_id, bukan product_id, karena satu produk
        // bisa muncul beberapa kali dalam satu pembelian dengan variant atau
        // satuan yang berbeda. Mencari lewat product_id saja bisa memvalidasi
        // baris yang salah.
        foreach ($validated['items'] as $item) {
            $purchaseItem = ! empty($item['purchase_item_id'])
                ? $purchase->items()->whereKey($item['purchase_item_id'])->first()
                : $purchase->items()->where('product_id', $item['product_id'])->first();

            if (! $purchaseItem) {
                abort(422, "Produk {$item['product_id']} tidak ditemukan di pembelian ini.");
            }

            // Calculate already returned qty for this purchase_item
            $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $purchaseItem->id)
                ->whereHas('purchaseReturn', fn ($q) => $q->where('status', '!=', 'cancelled'))
                ->sum('quantity');

            $returnable = $purchaseItem->quantity - $alreadyReturned;
            if ($item['quantity'] > $returnable) {
                abort(422, "Jumlah retur {$item['quantity']} melebihi sisa yang bisa diretur ({$returnable}) untuk produk {$purchaseItem->product->name}.");
            }
        }

        return DB::transaction(function () use ($validated, $purchase) {
            // Generate return number
            $dateStr = now()->format('Ymd');
            $lastReturn = PurchaseReturn::where('return_no', 'like', "RET-{$dateStr}-%")
                ->count();
            $returnNo = 'RET-'.$dateStr.'-'.str_pad($lastReturn + 1, 3, '0', STR_PAD_LEFT);

            // Calculate totals
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['quantity'] * $item['cost_price'];
            }

            $return = PurchaseReturn::create([
                'purchase_id' => $purchase->id,
                'supplier_id' => $purchase->supplier_id,
                'user_id' => Auth::user()->id,
                'return_no' => $returnNo,
                'return_date' => $validated['return_date'],
                'subtotal' => $subtotal,
                'total_amount' => $subtotal,
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed',
            ]);

            // Create return items
            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['cost_price'];

                // Ambil bucket dari PurchaseItem asal. Key-nya opsional di
                // validasi, jadi pakai ?? null supaya tidak memicu undefined key.
                $purchaseItem = ! empty($item['purchase_item_id'])
                    ? PurchaseItem::find($item['purchase_item_id'])
                    : null;
                $variantId = $purchaseItem?->variant_id;
                $packagingUnitId = $purchaseItem?->packaging_unit_id;
                $batchNo = $purchaseItem?->batch_no;

                $return->items()->create([
                    'purchase_item_id' => $item['purchase_item_id'] ?? null,
                    'product_id' => $item['product_id'],
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $packagingUnitId,
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                    'subtotal' => $itemSubtotal,
                    'reason' => $item['reason'] ?? null,
                ]);

                // Reduce stock — batch-aware, movement dicatat oleh StockService
                $this->adjustStock(
                    $item['product_id'],
                    $variantId,
                    $packagingUnitId,
                    $item['quantity'],
                    $purchase,
                    false,
                    $batchNo,
                );
            }

            // Reverse payment since status is completed immediately
            $returnAmount = $subtotal;
            $newPaid = max(0, $purchase->paid_amount - $returnAmount);
            $paymentStatus = 'unpaid';
            if ($newPaid >= $purchase->grand_total && $purchase->grand_total > 0) {
                $paymentStatus = 'paid';
            } elseif ($newPaid > 0) {
                $paymentStatus = 'partial';
            }
            $purchase->update([
                'paid_amount' => $newPaid,
                'payment_status' => $paymentStatus,
            ]);

            return redirect()->route('admin.purchase-returns.index')
                ->with('success', 'Retur pembelian berhasil dibuat.');
        });
    }

    public function show(PurchaseReturn $purchaseReturn)
    {
        $storeId = session('current_store_id');
        abort_unless($purchaseReturn->purchase->store_id == $storeId, 404);

        $purchaseReturn->load([
            'purchase',
            'supplier',
            'user',
            'items.product',
            'items.variant',
            'items.packagingUnit',
            'items.purchaseItem',
        ]);

        return Inertia::render('Admin/PurchaseReturns/Show', [
            'purchaseReturn' => $purchaseReturn,
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    public function destroy(PurchaseReturn $purchaseReturn)
    {
        $storeId = session('current_store_id');
        abort_unless($purchaseReturn->purchase->store_id == $storeId, 404);

        if ($purchaseReturn->status !== 'draft') {
            return back()->withErrors(['error' => 'Hanya retur draft yang dapat dihapus. Retur selesai harus dibatalkan terlebih dahulu.']);
        }

        $purchaseReturn->items()->delete();
        $purchaseReturn->delete();

        return redirect()->route('admin.purchase-returns.index')
            ->with('success', 'Retur pembelian berhasil dihapus.');
    }

    public function updateStatus(Request $request, PurchaseReturn $purchaseReturn)
    {
        $validated = $request->validate([
            'status' => 'required|in:cancelled',
        ]);

        if ($purchaseReturn->status !== 'completed') {
            return back()->withErrors(['error' => 'Hanya retur selesai yang dapat dibatalkan.']);
        }

        return DB::transaction(function () use ($purchaseReturn) {
            $purchase = $purchaseReturn->purchase;

            // Reverse stock adjustments — bucket-aware.
            // StockService sudah mencatat StockMovement sendiri lewat
            // recordMovement(), jadi jangan menulis movement manual di sini.
            foreach ($purchaseReturn->items as $item) {
                $this->adjustStock($item['product_id'], $item->variant_id, $item->packaging_unit_id, $item['quantity'], $purchase, true);
            }

            // Restore purchase payment
            $returnAmount = $purchaseReturn->total_amount;
            $newPaid = $purchase->paid_amount + $returnAmount;

            $paymentStatus = 'unpaid';
            if ($newPaid >= $purchase->grand_total && $purchase->grand_total > 0) {
                $paymentStatus = 'paid';
            } elseif ($newPaid > 0) {
                $paymentStatus = 'partial';
            }

            $purchase->update([
                'paid_amount' => $newPaid,
                'payment_status' => $paymentStatus,
            ]);

            $purchaseReturn->update(['status' => 'cancelled']);

            return redirect()->route('admin.purchase-returns.index')
                ->with('success', 'Retur pembelian berhasil dibatalkan.');
        });
    }

    /**
     * Load purchase items for AJAX/Inertia fetch when selecting a purchase.
     */
    public function getPurchaseItems(Purchase $purchase)
    {
        $storeId = session('current_store_id');
        abort_unless($purchase->store_id == $storeId, 404);

        $purchase->load(['items.product', 'items.variant', 'items.packagingUnit', 'supplier']);

        return response()->json([
            'purchase' => [
                'id' => $purchase->id,
                'purchase_no' => $purchase->purchase_no,
                'supplier' => ['id' => $purchase->supplier->id, 'name' => $purchase->supplier->name],
                'items' => $purchase->items->map(function ($item) {
                    $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                        ->whereHas('purchaseReturn', fn ($q) => $q->where('status', '!=', 'cancelled'))
                        ->sum('quantity');

                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'packaging_unit_id' => $item->packaging_unit_id,
                        'variant_name' => $item->variant?->name,
                        'packaging_unit_name' => $item->packagingUnit?->name,
                        'product_name' => $item->product->name,
                        'product_sku' => $item->product->sku,
                        'quantity' => $item->quantity,
                        'cost_price' => $item->cost_price,
                        'subtotal' => $item->subtotal,
                        'returned_qty' => $alreadyReturned,
                        'returnable_qty' => $item->quantity - $alreadyReturned,
                    ];
                }),
            ],
        ]);
    }

    private function adjustStock(
        int $productId,
        ?int $variantId,
        ?int $packagingUnitId,
        int $quantity,
        Purchase $purchase,
        bool $isReversal = false,
        ?string $batchNo = null,
    ): void {
        $product = Product::find($productId);
        if (! $product?->track_stock) {
            return;
        }

        $stockQty = $product->toBaseUnit((float) $quantity);

        // Cari batch spesifik dari batch_no agar potong batch yang tepat
        $productBatchId = null;
        if ($batchNo && $product->track_batch) {
            $productBatchId = ProductBatch::where([
                'product_id' => $productId,
                'variant_id' => $variantId,
                'packaging_unit_id' => $packagingUnitId,
                'store_id' => $purchase->store_id,
                'branch_id' => $purchase->branch_id,
                'batch_no' => $batchNo,
            ])->value('id');
        }

        $mutation = new StockMutation(
            productId: $productId,
            variantId: $variantId,
            packagingUnitId: $packagingUnitId,
            storeId: $purchase->store_id,
            branchId: $purchase->branch_id,
            quantity: $stockQty,
            movementType: $isReversal ? 'purchase_return_cancel' : 'purchase_return',
            referenceType: Purchase::class,
            referenceId: $purchase->id,
            referenceNo: $purchase->purchase_no,
            productBatchId: $productBatchId,
            notes: $isReversal
                ? "Pembatalan retur pembelian #{$purchase->purchase_no}"
                : "Retur pembelian #{$purchase->purchase_no}",
        );

        $stockService = app(StockService::class);
        if ($isReversal) {
            $stockService->increase($mutation);
        } else {
            $stockService->decrease($mutation);
        }
    }
}
