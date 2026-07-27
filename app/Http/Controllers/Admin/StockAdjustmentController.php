<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BuildsStockBucketOptions;
use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentItem;
use App\Services\Stock\StockMutation;
use App\Services\Stock\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    use BuildsStockBucketOptions;
    use HasStoreScope;

    public function index()
    {
        [$storeId] = $this->storeScope();

        $adjustments = StockAdjustment::with('user')
            ->where('store_id', $storeId)
            ->latest()
            ->get();

        $stats = [
            'total' => $adjustments->count(),
            'draft' => $adjustments->where('status', 'draft')->count(),
            'approved' => $adjustments->where('status', 'approved')->count(),
            'rejected' => $adjustments->where('status', 'rejected')->count(),
        ];

        return Inertia::render('Admin/Stock/Adjustment/Index', [
            'adjustments' => $adjustments,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        [$storeId] = $this->storeScope();

        return Inertia::render('Admin/Stock/Adjustment/Create', [
            'buckets' => $this->stockBucketOptions($storeId),
            'currentBranchId' => session('current_branch_id'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'adjustment_date' => 'required|date',
            'reason' => 'nullable|string|max:150',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
            'items.*.system_qty' => 'required|integer|min:0',
            'items.*.actual_qty' => 'required|integer|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        // `branch_id` WAJIB direkam di dokumennya. Persetujuan memakai
        // $adjustment->branch_id sebagai kunci bucket — kalau di sini kosong,
        // selisihnya mendarat di baris ber-cabang NULL yang tidak pernah
        // tampil di halaman stok mana pun.
        [$storeId, $branchId] = $this->storeScope();
        $adjNo = $this->generateNumber($validated['adjustment_date']);

        DB::beginTransaction();
        try {
            $adjustment = StockAdjustment::create([
                'store_id' => $storeId,
                'branch_id' => $branchId,
                'user_id' => $request->user()->id,
                'adjustment_no' => $adjNo,
                'adjustment_date' => $validated['adjustment_date'],
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                $diff = $item['actual_qty'] - $item['system_qty'];
                $variantId = $item['variant_id'] ?? null;
                $packagingUnitId = $item['packaging_unit_id'] ?? null;

                // Ambil average_cost dari bucket yang tepat
                $stock = ProductStock::where('product_id', $item['product_id'])
                    ->where('variant_id', $variantId)
                    ->where('packaging_unit_id', $packagingUnitId)
                    ->where('store_id', $storeId)
                    ->first();
                $unitCost = $stock->average_cost ?? 0;

                StockAdjustmentItem::create([
                    'stock_adjustment_id' => $adjustment->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $packagingUnitId,
                    'system_qty' => $item['system_qty'],
                    'actual_qty' => $item['actual_qty'],
                    'difference_qty' => $diff,
                    'unit_cost' => $unitCost,
                    'total_cost' => abs($diff) * $unitCost,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return redirect()
                ->route('admin.stock-adjustments.show', $adjustment)
                ->with('success', 'Penyesuaian stok berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'items' => 'Gagal menyimpan: '.$e->getMessage(),
            ]);
        }
    }

    public function show(StockAdjustment $stockAdjustment)
    {
        $stockAdjustment->load(['items.product', 'items.variant', 'items.packagingUnit', 'user']);

        return Inertia::render('Admin/Stock/Adjustment/Show', [
            'adjustment' => $stockAdjustment,
        ]);
    }

    public function destroy(StockAdjustment $stockAdjustment)
    {
        if ($stockAdjustment->status !== 'draft') {
            return back()->withErrors([
                'status' => 'Hanya penyesuaian draft yang dapat dihapus.',
            ]);
        }

        $stockAdjustment->delete();

        return redirect()
            ->route('admin.stock-adjustments.index')
            ->with('success', 'Penyesuaian stok berhasil dihapus.');
    }

    /**
     * Quick stock adjustment (IN/OUT) dari product list.
     * Auto-approved — langsung update stok tanpa workflow draft.
     */
    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|numeric|min:0.0001',
            'reason' => 'nullable|string|max:150',
            'notes' => 'nullable|string|max:2000',
            'cost_price' => 'nullable|numeric|min:0',
        ]);

        $storeId = session('current_store_id');
        $branchId = session('current_branch_id');
        $product = Product::findOrFail($validated['product_id']);
        $variantId = $validated['variant_id'] ?? null;
        $packagingUnitId = $validated['packaging_unit_id'] ?? null;

        // Satu bucket stok dikunci LIMA kolom sekaligus, termasuk branch_id.
        // Kalau branch_id tidak ikut jadi kunci, penyesuaian di cabang aktif
        // bisa mendarat di baris cabang lain (baris pertama yang ketemu),
        // sementara halaman produk membaca cabang aktif — hasilnya stok
        // terlihat sama sekali tidak berubah setelah disimpan.
        $bucketKeys = [
            'product_id' => $product->id,
            'variant_id' => $variantId,
            'packaging_unit_id' => $packagingUnitId,
            'store_id' => $storeId,
            'branch_id' => $branchId,
        ];

        $productStock = ProductStock::where($bucketKeys)->first();
        $currentStock = $productStock->quantity ?? 0;

        // Validasi: stok tidak mencukupi untuk OUT
        if (
            $validated['type'] === 'out' &&
            $currentStock < $validated['quantity']
        ) {
            return back()->withErrors([
                'quantity' => "Stok tidak mencukupi. Stok saat ini: {$currentStock}.",
            ]);
        }

        $unitCost = $validated['cost_price'] ?? $productStock->average_cost ?? $product->cost_price ?? 0;

        if ($validated['type'] === 'in') {
            $systemQty = (float) $currentStock;
            $actualQty = $systemQty + (float) $validated['quantity'];
            $diff = (float) $validated['quantity'];
        } else {
            $systemQty = (float) $currentStock;
            $actualQty = $systemQty - (float) $validated['quantity'];
            $diff = -(float) $validated['quantity'];
        }

        DB::beginTransaction();
        try {
            $adjustment = StockAdjustment::create([
                'store_id' => $storeId,
                'branch_id' => $branchId,
                'user_id' => $request->user()->id,
                'adjustment_no' => $this->generateNumber(now()->toDateString()),
                'adjustment_date' => now(),
                'reason' => $validated['reason'] ?? 'Penyesuaian cepat',
                'notes' => $validated['notes'] ?? null,
                'status' => 'approved',
            ]);

            StockAdjustmentItem::create([
                'stock_adjustment_id' => $adjustment->id,
                'product_id' => $product->id,
                'variant_id' => $variantId,
                'packaging_unit_id' => $packagingUnitId,
                'system_qty' => $systemQty,
                'actual_qty' => $actualQty,
                'difference_qty' => $diff,
                'unit_cost' => $unitCost,
                'total_cost' => abs($diff) * $unitCost,
                'notes' => $validated['notes'] ?? null,
            ]);

            $stockService = app(StockService::class);
            $mutationBase = [
                'productId' => $product->id,
                'variantId' => $variantId,
                'packagingUnitId' => $packagingUnitId,
                'storeId' => $storeId,
                'branchId' => $branchId,
                'unitCost' => (float) $unitCost,
                'referenceType' => StockAdjustment::class,
                'referenceId' => $adjustment->id,
                'referenceNo' => $adjustment->adjustment_no,
                'notes' => $validated['notes'] ?? "Penyesuaian #{$adjustment->adjustment_no}",
            ];

            if ($diff > 0) {
                $stockService->increase(new StockMutation(
                    ...$mutationBase,
                    quantity: $diff,
                    movementType: 'adjustment_in',
                ));
            } else {
                $stockService->decrease(new StockMutation(
                    ...$mutationBase,
                    quantity: abs($diff),
                    movementType: 'adjustment_out',
                ));
            }

            DB::commit();

            return redirect()
                ->back()
                ->with('success', 'Stok berhasil disesuaikan.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'items' => 'Gagal menyimpan: '.$e->getMessage(),
            ]);
        }
    }

    public function updateStatus(
        Request $request,
        StockAdjustment $stockAdjustment,
    ) {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        if ($stockAdjustment->status !== 'draft') {
            return back()->withErrors([
                'status' => 'Hanya penyesuaian draft yang dapat diubah statusnya.',
            ]);
        }

        DB::beginTransaction();
        try {
            $stockAdjustment->update(['status' => $request->status]);

            if ($request->status === 'approved') {
                $stockService = app(StockService::class);

                foreach ($stockAdjustment->items as $item) {
                    $diff = $item->difference_qty;
                    if ($diff === 0) {
                        continue;
                    }

                    $mutationBase = [
                        'productId' => $item->product_id,
                        'variantId' => $item->variant_id,
                        'packagingUnitId' => $item->packaging_unit_id,
                        'storeId' => $stockAdjustment->store_id,
                        'branchId' => $stockAdjustment->branch_id,
                        'unitCost' => (float) $item->unit_cost,
                        'referenceType' => StockAdjustment::class,
                        'referenceId' => $stockAdjustment->id,
                        'referenceNo' => $stockAdjustment->adjustment_no,
                        'notes' => $item->notes ?? "Penyesuaian #{$stockAdjustment->adjustment_no}",
                    ];

                    if ($diff > 0) {
                        $stockService->increase(new StockMutation(
                            ...$mutationBase,
                            quantity: (float) $diff,
                            movementType: 'adjustment_in',
                        ));
                    } else {
                        $stockService->decrease(new StockMutation(
                            ...$mutationBase,
                            quantity: abs((float) $diff),
                            movementType: 'adjustment_out',
                        ));
                    }
                }
            }

            DB::commit();

            return back()->with(
                'success',
                'Status penyesuaian berhasil diperbarui.',
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'status' => 'Gagal memperbarui status: '.$e->getMessage(),
            ]);
        }
    }

    private function generateNumber($date)
    {
        $prefix = 'ADJ-'.date('Ymd', strtotime($date));
        $last = StockAdjustment::where('adjustment_no', 'like', $prefix.'%')
            ->orderByDesc('adjustment_no')
            ->first();

        if ($last) {
            $seq = intval(substr($last->adjustment_no, -3)) + 1;
        } else {
            $seq = 1;
        }

        return $prefix.'-'.str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
