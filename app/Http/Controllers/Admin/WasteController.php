<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BuildsStockBucketOptions;
use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Waste;
use App\Models\WasteItem;
use App\Services\Stock\StockMutation;
use App\Services\Stock\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WasteController extends Controller
{
    use BuildsStockBucketOptions;
    use HasStoreScope;

    public function index()
    {
        [$storeId] = $this->storeScope();

        $wastes = Waste::with('user')
            ->where('store_id', $storeId)
            ->latest()
            ->get();

        $stats = [
            'total' => $wastes->count(),
            'draft' => $wastes->where('status', 'draft')->count(),
            'approved' => $wastes->where('status', 'approved')->count(),
            'rejected' => $wastes->where('status', 'rejected')->count(),
        ];

        return Inertia::render('Admin/Stock/Waste/Index', [
            'wastes' => $wastes,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        [$storeId, $branchId] = $this->storeScope();

        return Inertia::render('Admin/Stock/Waste/Create', [
            'buckets' => $this->stockBucketOptions($storeId),
            'currentBranchId' => $branchId,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'waste_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.waste_category' => 'required|string|in:tumpahan,kedaluwarsa,rusak,hilang,lainnya',
            'items.*.notes' => 'nullable|string',
        ]);

        // Dulu memakai $request->user()->store (toko milik user), berbeda dari
        // storeScope() yang dipakai index()/create() — pada akun multi-toko
        // keduanya bisa menunjuk toko berbeda. Disamakan supaya waste tercatat
        // di toko yang sedang dibuka, dan cabangnya ikut terisi.
        [$storeId, $branchId] = $this->storeScope();
        $wasteNo = $this->generateNumber($validated['waste_date']);

        DB::beginTransaction();
        try {
            $waste = Waste::create([
                'store_id' => $storeId,
                'branch_id' => $branchId,
                'user_id' => $request->user()->id,
                'waste_no' => $wasteNo,
                'waste_date' => $validated['waste_date'],
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);

                // Modal mengikuti bucket: variant punya cost_price sendiri.
                $variant = ! empty($item['variant_id'])
                    ? $product?->variants()->find($item['variant_id'])
                    : null;
                $unitCost = (float) ($variant?->cost_price ?: $product?->cost_price ?: 0);

                WasteItem::create([
                    'waste_id' => $waste->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_cost' => $unitCost,
                    'total_cost' => $unitCost * $item['quantity'],
                    'waste_category' => $item['waste_category'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return redirect()
                ->route('admin.wastes.show', $waste)
                ->with('success', 'Catat waste berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'items' => 'Gagal menyimpan: '.$e->getMessage(),
            ]);
        }
    }

    public function show(Waste $waste)
    {
        $waste->load(['items.product', 'user']);

        return Inertia::render('Admin/Stock/Waste/Show', [
            'waste' => $waste,
        ]);
    }

    public function destroy(Waste $waste)
    {
        if ($waste->status !== 'draft') {
            return back()->withErrors([
                'status' => 'Hanya waste draft yang dapat dihapus.',
            ]);
        }

        $waste->delete();

        return redirect()
            ->route('admin.wastes.index')
            ->with('success', 'Catat waste berhasil dihapus.');
    }

    public function updateStatus(Request $request, Waste $waste)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        if ($waste->status !== 'draft') {
            return back()->withErrors([
                'status' => 'Hanya waste draft yang dapat diubah statusnya.',
            ]);
        }

        DB::beginTransaction();
        try {
            $waste->update(['status' => $request->status]);

            if ($request->status === 'approved') {
                $stockService = app(StockService::class);

                foreach ($waste->items as $item) {
                    $qty = (float) $item->quantity;
                    if ($qty <= 0) {
                        continue;
                    }

                    $available = $stockService->available(new StockMutation(
                        productId: $item->product_id,
                        variantId: $item->variant_id,
                        packagingUnitId: $item->packaging_unit_id,
                        storeId: $waste->store_id,
                        branchId: $waste->branch_id,
                        quantity: $qty,
                    ));

                    // Tidak blokir kalau stok kurang — catat sebanyak yang ada,
                    // sisanya diabaikan (dicatat sebagai temuan opname).
                    $actualQty = min($qty, $available);

                    if ($actualQty > 0) {
                        $stockService->decrease(new StockMutation(
                            productId: $item->product_id,
                            variantId: $item->variant_id,
                            packagingUnitId: $item->packaging_unit_id,
                            storeId: $waste->store_id,
                            branchId: $waste->branch_id,
                            quantity: $actualQty,
                            unitCost: (float) $item->unit_cost,
                            movementType: 'waste',
                            referenceType: Waste::class,
                            referenceId: $waste->id,
                            referenceNo: $waste->waste_no,
                            notes: "Waste: {$item->waste_category}".($item->notes ? " - {$item->notes}" : ''),
                        ));
                    }
                }
            }

            DB::commit();

            return back()->with('success', 'Status waste berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'status' => 'Gagal memperbarui status: '.$e->getMessage(),
            ]);
        }
    }

    private function generateNumber($date)
    {
        $prefix = 'WST-'.date('Ymd', strtotime($date));
        $last = Waste::where('waste_no', 'like', $prefix.'%')
            ->orderByDesc('waste_no')
            ->first();

        if ($last) {
            $seq = intval(substr($last->waste_no, -3)) + 1;
        } else {
            $seq = 1;
        }

        return $prefix.'-'.str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
