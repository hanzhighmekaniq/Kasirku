<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockOpnameController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        [$storeId] = $this->storeScope();

        $opnames = StockOpname::with('user')
            ->where('store_id', $storeId)
            ->latest()
            ->get();

        $stats = [
            'total' => $opnames->count(),
            'draft' => $opnames->where('status', 'draft')->count(),
            'in_progress' => $opnames->where('status', 'in_progress')->count(),
            'completed' => $opnames->where('status', 'completed')->count(),
            'cancelled' => $opnames->where('status', 'cancelled')->count(),
        ];

        return Inertia::render('Admin/Stock/Opname/Index', [
            'opnames' => $opnames,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        [$storeId] = $this->storeScope();

        return Inertia::render('Admin/Stock/Opname/Create', [
            'products' => Product::forStore($storeId)
                ->with([
                    'stocks' => function ($q) use ($storeId) {
                        $q->where('store_id', $storeId);
                    },
                ])
                ->where('is_active', true)
                ->where('track_stock', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'opname_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
            'items.*.system_qty' => 'required|integer|min:0',
            'items.*.counted_qty' => 'required|integer|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        $storeId = session('current_store_id') ?? $request->user()->store?->id;
        $opnameNo = $this->generateNumber($validated['opname_date']);

        DB::beginTransaction();
        try {
            $opname = StockOpname::create([
                'store_id' => $storeId,
                'user_id' => $request->user()->id,
                'opname_no' => $opnameNo,
                'opname_date' => $validated['opname_date'],
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $diff = $item['counted_qty'] - $item['system_qty'];
                $variantId = $item['variant_id'] ?? null;
                $packagingUnitId = $item['packaging_unit_id'] ?? null;

                // Ambil average_cost dari bucket yang tepat
                $stock = ProductStock::where('product_id', $item['product_id'])
                    ->where('variant_id', $variantId)
                    ->where('packaging_unit_id', $packagingUnitId)
                    ->where('store_id', $storeId)
                    ->first();
                $unitCost = $stock->average_cost ?? 0;

                StockOpnameItem::create([
                    'stock_opname_id' => $opname->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $packagingUnitId,
                    'system_qty' => $item['system_qty'],
                    'counted_qty' => $item['counted_qty'],
                    'difference_qty' => $diff,
                    'unit_cost' => $unitCost,
                    'total_cost' => abs($diff) * $unitCost,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return redirect()
                ->route('admin.stock-opnames.show', $opname)
                ->with('success', 'Stock opname berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'items' => 'Gagal menyimpan: '.$e->getMessage(),
            ]);
        }
    }

    public function show(StockOpname $stockOpname)
    {
        $stockOpname->load(['items.product', 'items.variant', 'items.packagingUnit', 'user']);

        return Inertia::render('Admin/Stock/Opname/Show', [
            'opname' => $stockOpname,
        ]);
    }

    public function destroy(StockOpname $stockOpname)
    {
        if (! in_array($stockOpname->status, ['draft', 'cancelled'])) {
            return back()->withErrors([
                'status' => 'Hanya opname draft/dibatalkan yang dapat dihapus.',
            ]);
        }

        $stockOpname->delete();

        return redirect()
            ->route('admin.stock-opnames.index')
            ->with('success', 'Stock opname berhasil dihapus.');
    }

    public function updateStatus(Request $request, StockOpname $stockOpname)
    {
        $request->validate([
            'status' => 'required|in:completed,cancelled',
        ]);

        if (! in_array($stockOpname->status, ['draft', 'in_progress'])) {
            return back()->withErrors([
                'status' => 'Status opname tidak dapat diubah.',
            ]);
        }

        DB::beginTransaction();
        try {
            $stockOpname->update(['status' => $request->status]);

            if ($request->status === 'completed') {
                foreach ($stockOpname->items as $item) {
                    $diff = $item->difference_qty;
                    if ($diff === 0) {
                        continue;
                    }

                    // Bucket-aware: key lengkap dengan variant_id + packaging_unit_id
                    $stock = ProductStock::firstOrCreate(
                        [
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'packaging_unit_id' => $item->packaging_unit_id,
                            'store_id' => $stockOpname->store_id,
                        ],
                        [
                            'quantity' => 0,
                            'reserved_quantity' => 0,
                            'average_cost' => 0,
                        ],
                    );

                    if ($diff > 0) {
                        $stock->increment('quantity', $diff);
                        $type = 'opname_adjustment';
                    } else {
                        $stock->decrement('quantity', abs($diff));
                        $type = 'opname_adjustment';
                    }

                    StockMovement::create([
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'packaging_unit_id' => $item->packaging_unit_id,
                        'store_id' => $stockOpname->store_id,
                        'branch_id' => $stockOpname->branch_id,
                        'reference_type' => StockOpname::class,
                        'reference_id' => $stockOpname->id,
                        'movement_type' => $type,
                        'quantity' => abs($diff),
                        'unit_cost' => $item->unit_cost,
                        'reference_no' => $stockOpname->opname_no,
                        'notes' => $item->notes ?? "Opname #{$stockOpname->opname_no}",
                        'moved_at' => now(),
                    ]);
                }
            }

            DB::commit();

            return back()->with(
                'success',
                'Status opname berhasil diperbarui.',
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
        $prefix = 'OPN-'.date('Ymd', strtotime($date));
        $last = StockOpname::where('opname_no', 'like', $prefix.'%')
            ->orderByDesc('opname_no')
            ->first();

        if ($last) {
            $seq = intval(substr($last->opname_no, -3)) + 1;
        } else {
            $seq = 1;
        }

        return $prefix.'-'.str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
