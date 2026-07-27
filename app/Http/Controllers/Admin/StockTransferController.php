<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BuildsStockBucketOptions;
use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\ProductStock;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Services\Stock\StockMutation;
use App\Services\Stock\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    use BuildsStockBucketOptions;
    use HasStoreScope;

    public function index()
    {
        [$storeId, $branchId] = $this->storeScope();

        $transfers = StockTransfer::with(['fromBranch', 'toBranch', 'user'])
            ->where('store_id', $storeId)
            ->when($branchId, function ($q) use ($branchId) {
                $q->where(function ($sq) use ($branchId) {
                    $sq->where('from_branch_id', $branchId)
                        ->orWhere('to_branch_id', $branchId);
                });
            })
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
        [$storeId, $branchId] = $this->storeScope();

        return Inertia::render('Admin/Stock/Transfer/Create', [
            'buckets' => $this->stockBucketOptions($storeId),
            'branches' => Branch::where('store_id', $storeId)
                ->where('is_active', true)
                ->get(),
            'currentBranchId' => $branchId,
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

        [$storeId, $branchId] = $this->storeScope();

        if ($branchId) {
            $validated['from_branch_id'] = $branchId;
        }

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
                $stockService = app(StockService::class);

                foreach ($stockTransfer->items as $item) {
                    // Baca average_cost cabang asal sebelum dipotong,
                    // supaya nilai modal ikut berpindah ke cabang tujuan.
                    $fromExisting = ProductStock::where([
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'packaging_unit_id' => $item->packaging_unit_id,
                        'store_id' => $stockTransfer->store_id,
                        'branch_id' => $stockTransfer->from_branch_id,
                    ])->first();

                    $unitCost = (float) ($fromExisting?->average_cost ?? 0);

                    // 1. Kurangi stok di cabang asal
                    $stockService->decrease(new StockMutation(
                        productId: $item->product_id,
                        variantId: $item->variant_id,
                        packagingUnitId: $item->packaging_unit_id,
                        storeId: $stockTransfer->store_id,
                        branchId: $stockTransfer->from_branch_id,
                        quantity: (float) $item->quantity,
                        unitCost: $unitCost,
                        movementType: 'transfer_out',
                        referenceType: StockTransfer::class,
                        referenceId: $stockTransfer->id,
                        referenceNo: $stockTransfer->transfer_no,
                        notes: 'Transfer keluar ke '.$stockTransfer->toBranch->name,
                    ));

                    // 2. Tambah stok di cabang tujuan (modal ikut dari cabang asal)
                    $stockService->increase(new StockMutation(
                        productId: $item->product_id,
                        variantId: $item->variant_id,
                        packagingUnitId: $item->packaging_unit_id,
                        storeId: $stockTransfer->store_id,
                        branchId: $stockTransfer->to_branch_id,
                        quantity: (float) $item->quantity,
                        unitCost: $unitCost,
                        movementType: 'transfer_in',
                        referenceType: StockTransfer::class,
                        referenceId: $stockTransfer->id,
                        referenceNo: $stockTransfer->transfer_no,
                        notes: 'Transfer masuk dari '.$stockTransfer->fromBranch->name,
                    ));
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
