<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasStoreScope;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KitchenController extends Controller
{
    use HasStoreScope;

    /**
     * Halaman Kitchen Display — tampil semua order yang belum served
     * Permission: kitchen.view
     */
    public function index(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();

        $query = Sale::with([
            'items.product:id,name',
            'table:id,table_number',
            'user:id,name',
        ])
        ->where('store_id', $storeId)
        ->where('pos_mode', 'fnb')
        ->whereIn('kitchen_status', ['pending', 'cooking', 'ready'])
        ->whereDate('sale_date', today())
        ->latest('sale_date');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $orders = $query->get([
            'id', 'sale_no', 'table_id', 'user_id', 'order_type',
            'kitchen_status', 'kitchen_printed_at', 'sale_date',
            'notes', 'branch_id', 'store_id',
        ]);

        // Stats
        $stats = [
            'pending' => $orders->where('kitchen_status', 'pending')->count(),
            'cooking' => $orders->where('kitchen_status', 'cooking')->count(),
            'ready'   => $orders->where('kitchen_status', 'ready')->count(),
        ];

        return Inertia::render('Admin/Kitchen/Index', [
            'orders'    => $orders,
            'stats'     => $stats,
            'canUpdate' => $request->user()->can('kitchen.update'),
        ]);
    }

    /**
     * Update kitchen_status order
     * Permission: kitchen.update
     */
    public function updateStatus(Request $request, Sale $sale)
    {
        abort_unless($request->user()->can('kitchen.update'), 403);
        [$storeId] = $this->storeScope();
        abort_if($sale->store_id !== $storeId, 404);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,cooking,ready,served'],
        ]);

        $update = ['kitchen_status' => $validated['status']];

        // Jika baru diprint (pending → cooking), catat waktu print
        if ($validated['status'] === 'cooking' && !$sale->kitchen_printed_at) {
            $update['kitchen_printed_at'] = now();
        }

        $sale->update($update);

        return response()->json([
            'success' => true,
            'status'  => $validated['status'],
        ]);
    }
}
