<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        [$storeId] = $this->storeScope();

        $transfers = StockTransfer::with(['fromBranch', 'toBranch', 'user'])
            ->where('store_id', $storeId)
            ->latest()
            ->get();

        $stats = [
            'total' => $transfers->count(),
            'pending' => $transfers->where('status', 'pending')->count(),
            'in_transit' => $transfers->where('status', 'in_transit')->count(),
            'received' => $transfers->where('status', 'received')->count(),
            'cancelled' => $transfers->where('status', 'cancelled')->count(),
        ];

        return Inertia::render('Admin/Stock/Transfer/Index', [
            'transfers' => $transfers,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        [$storeId] = $this->storeScope();

        return Inertia::render('Admin/Stock/Transfer/Create', [
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
            'branches' => Branch::where('store_id', $storeId)
                ->where('is_active', true)
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_branch_id' => 'required|exists:branches,id',
            'to_branch_id' => 'required|exists:branches,id|different:from_branch_id',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
        ]);

        $storeId = session('current_store_id') ?? $request->user()->store?->id;
        $transferNo = $this->generateNumber($validated['transfer_date']);

        DB::beginTransaction();
        try {
            $transfer = StockTransfer::create([
                'store_id' => $storeId,
                'from_branch_id' => $validated['from_branch_id'],
                'to_branch_id' => $validated['to_branch_id'],
                'user_id' => $request->user()->id,
                'transfer_no' => $transferNo,
                'transfer_date' => $validated['transfer_date'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return redirect()
                ->route('admin.stock-transfers.show', $transfer)
                ->with('success', 'Transfer stok berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'items' => 'Gagal menyimpan: '.$e->getMessage(),
            ]);
        }
    }

    public function show(StockTransfer $stockTransfer)
    {
        $stockTransfer->load([
            'items.product',
            'items.variant',
            'items.packagingUnit',
            'fromBranch',
            'toBranch',
            'user',
        ]);

        return Inertia::render('Admin/Stock/Transfer/Show', [
            'transfer' => $stockTransfer,
        ]);
    }

    public function destroy(StockTransfer $stockTransfer)
    {
        if (! in_array($stockTransfer->status, ['pending', 'cancelled'])) {
            return back()->withErrors([
                'status' => 'Hanya transfer pending/dibatalkan yang dapat dihapus.',
            ]);
        }

        $stockTransfer->delete();

        return redirect()
            ->route('admin.stock-transfers.index')
            ->with('success', 'Transfer stok berhasil dihapus.');
    }

    public function updateStatus(Request $request, StockTransfer $stockTransfer)
    {
        $request->validate([
            'status' => 'required|in:in_transit,received,cancelled',
        ]);

        $allowed = match ($stockTransfer->status) {
            'pending' => ['in_transit', 'cancelled'],
            'in_transit' => ['received', 'cancelled'],
            default => [],
        };

        if (! in_array($request->status, $allowed)) {
            return back()->withErrors([
                'status' => 'Transisi status tidak valid.',
            ]);
        }

        DB::beginTransaction();
        try {
            $stockTransfer->update(['status' => $request->status]);

            if ($request->status === 'received') {
                foreach ($stockTransfer->items as $item) {
                    $variantId = $item->variant_id;
                    $packagingUnitId = $item->packaging_unit_id;

                    // 1. Kurangi stok di cabang asal (from_branch)
                    $fromStock = ProductStock::firstOrCreate(
                        [
                            'product_id' => $item->product_id,
                            'variant_id' => $variantId,
                            'packaging_unit_id' => $packagingUnitId,
                            'store_id' => $stockTransfer->store_id,
                        ],
                        [
                            'quantity' => 0,
                            'reserved_quantity' => 0,
                            'average_cost' => 0,
                        ],
                    );
                    $fromStock->decrement('quantity', $item->quantity);

                    // 2. Tambah stok di cabang tujuan (to_branch)
                    $toStock = ProductStock::firstOrCreate(
                        [
                            'product_id' => $item->product_id,
                            'variant_id' => $variantId,
                            'packaging_unit_id' => $packagingUnitId,
                            'store_id' => $stockTransfer->store_id,
                        ],
                        [
                            'quantity' => 0,
                            'reserved_quantity' => 0,
                            'average_cost' => $fromStock->average_cost,
                        ],
                    );
                    $toStock->increment('quantity', $item->quantity);

                    // 3. Catat StockMovement untuk audit trail
                    StockMovement::create([
                        'product_id' => $item->product_id,
                        'variant_id' => $variantId,
                        'packaging_unit_id' => $packagingUnitId,
                        'store_id' => $stockTransfer->store_id,
                        'branch_id' => $stockTransfer->from_branch_id,
                        'reference_type' => StockTransfer::class,
                        'reference_id' => $stockTransfer->id,
                        'movement_type' => 'transfer_out',
                        'quantity' => $item->quantity,
                        'unit_cost' => $fromStock->average_cost,
                        'reference_no' => $stockTransfer->transfer_no,
                        'notes' => 'Transfer keluar ke '.
                            $stockTransfer->toBranch->name,
                        'moved_at' => now(),
                    ]);

                    StockMovement::create([
                        'product_id' => $item->product_id,
                        'variant_id' => $variantId,
                        'packaging_unit_id' => $packagingUnitId,
                        'store_id' => $stockTransfer->store_id,
                        'branch_id' => $stockTransfer->to_branch_id,
                        'reference_type' => StockTransfer::class,
                        'reference_id' => $stockTransfer->id,
                        'movement_type' => 'transfer_in',
                        'quantity' => $item->quantity,
                        'unit_cost' => $fromStock->average_cost,
                        'reference_no' => $stockTransfer->transfer_no,
                        'notes' => 'Transfer masuk dari '.
                            $stockTransfer->fromBranch->name,
                        'moved_at' => now(),
                    ]);
                }
            }

            DB::commit();

            return back()->with(
                'success',
                'Status transfer berhasil diperbarui.',
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
        $prefix = 'TRF-'.date('Ymd', strtotime($date));
        $last = StockTransfer::where('transfer_no', 'like', $prefix.'%')
            ->orderByDesc('transfer_no')
            ->first();

        if ($last) {
            $seq = intval(substr($last->transfer_no, -3)) + 1;
        } else {
            $seq = 1;
        }

        return $prefix.'-'.str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
