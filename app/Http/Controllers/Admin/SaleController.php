<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SaleController extends Controller
{
    use HasStoreScope;

    public function index(Request $request)
    {
        /** @var User|null $user */
        $user = Auth::user();
        $storeId = session('current_store_id');

        // Branch filter: query param > session
        // User tanpa sale.void (kasir) selalu terkunci ke branch-nya sendiri
        $canViewAll = $user->can('sale.void');

        $branchId =
            $request->input('branch_id') ?:
            session('current_branch_id') ?? session('branch_id');

        // Jika tidak punya sale.void, paksa ke branch sendiri
        if (! $canViewAll && ! $branchId) {
            $branchId = $user->branch_id ?? null;
        }

        $branches = Branch::where('store_id', $storeId)
            ->where('is_active', true)
            ->get(['id', 'code', 'name']);

        $query = Sale::where('store_id', $storeId)
            ->with(['customer', 'user', 'branch', 'table'])
            ->latest();

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        // User tanpa sale.void hanya lihat transaksi miliknya sendiri
        if (! $canViewAll) {
            $query->where('user_id', $user->id);
        }

        // Filter: date range
        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->input('date_to'));
        }

        // Filter: payment status
        if (
            $request->filled('payment_status') &&
            $request->input('payment_status') !== 'all'
        ) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        $sales = $query->get();

        $stats = [
            'total' => $sales->count(),
            'completed' => $sales->where('status', 'completed')->count(),
            'draft' => $sales->where('status', 'draft')->count(),
            'cancelled' => $sales->where('status', 'cancelled')->count(),
            'totalRevenue' => $sales
                ->where('status', 'completed')
                ->sum('grand_total'),
        ];

        $activeFilters = [
            'branch_id' => $request->input('branch_id', ''),
            'date_from' => $request->input('date_from', ''),
            'date_to' => $request->input('date_to', ''),
            'payment_status' => $request->input('payment_status', 'all'),
        ];

        $store = Store::with('storeType')->find($storeId);

        return Inertia::render('Admin/Sales/Index', [
            'sales' => $sales,
            'stats' => $stats,
            'branches' => $branches,
            'currentBranchId' => $branchId ? (string) $branchId : '',
            'activeFilters' => $activeFilters,
            'storeType' => $store?->getRelation('storeType')?->code ?? 'retail',
        ]);
    }

    public function show(Sale $sale)
    {
        $sale->load([
            'customer',
            'user',
            'items.product',
            'payments.paymentMethod',
            'table',
        ]);
        $sale->load([
            'pgTransactions' => function ($q) {
                $q->orderByDesc('created_at');
            },
        ]);

        $store = Store::with('storeType')->find($sale->store_id);
        $storeType = $store?->getRelation('storeType')?->code ?? 'retail';

        return Inertia::render('Admin/Sales/Show', [
            'sale' => $sale,
            'storeType' => $storeType,
            'canUpdateServiceStatus' => in_array($sale->pos_mode, ['service', 'laundry']) &&
                (request()->user()->can('sale.create') ||
                    request()->user()->can('sale.void')),
            'canUpdateRentalStatus' => $sale->pos_mode === 'rental' &&
                (request()->user()->can('sale.create') ||
                    request()->user()->can('sale.void')),
            'canCheckInTicket' => $sale->pos_mode === 'ticket' &&
                (request()->user()->can('sale.create') ||
                    request()->user()->can('sale.void')),
            'canCheckOutHospitality' => $sale->pos_mode === 'hospitality' &&
                (request()->user()->can('sale.create') ||
                    request()->user()->can('sale.void')),
            'canExitParking' => $sale->pos_mode === 'parking' &&
                (request()->user()->can('sale.create') ||
                    request()->user()->can('sale.void')),
            'canEndSession' => $sale->pos_mode === 'session' &&
                (request()->user()->can('sale.create') ||
                    request()->user()->can('sale.void')),
        ]);
    }

    public function print(Sale $sale)
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $storeId = session('current_store_id');

        if ($storeId && (int) $sale->store_id !== (int) $storeId) {
            abort(
                403,
                'Akses ditolak. Transaksi ini bukan dari toko aktif kamu.',
            );
        }

        if (
            ! $user->can('sale.void') &&
            (int) $sale->user_id !== (int) $user->id
        ) {
            abort(
                403,
                'Akses ditolak. Struk ini bukan transaksi milik akun kamu.',
            );
        }

        $sale->load([
            'customer',
            'user',
            'items.product',
            'payments.paymentMethod',
            'table',
        ]);

        $store = Store::find($sale->store_id);

        // JSON response untuk modal di Index (Accept: application/json)
        if (request()->expectsJson()) {
            return response()->json([
                'sale' => $sale,
                'storeName' => $store?->name ?? 'Toko',
            ]);
        }

        return Inertia::render('Admin/Sales/Print', [
            'sale' => $sale,
            'storeName' => $store?->name ?? 'Toko',
        ]);
    }

    public function destroy(Sale $sale)
    {
        if ($sale->status === 'completed') {
            // Reverse stock for completed sales — bucket-aware
            foreach ($sale->items as $item) {
                $product = $item->product;
                if ($product && $product->track_stock) {
                    $stock = ProductStock::where([
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'packaging_unit_id' => $item->packaging_unit_id,
                        'store_id' => $sale->store_id,
                    ])->first();
                    if ($stock) {
                        $stock->increment('quantity', $item->quantity);
                    }
                }
            }
        }

        $sale->delete();

        return redirect()
            ->route('admin.sales.index')
            ->with('success', 'Penjualan berhasil dihapus.');
    }

    // ── Lifecycle endpoints untuk tipe toko non-retail ──────────────

    public function updateServiceStatus(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if((int) $sale->store_id !== (int) $storeId, 404);
        abort_unless(
            $request->user()->can('sale.create') ||
                $request->user()->can('sale.void'),
            403,
        );

        $validated = $request->validate([
            'service_status' => ['required', 'in:waiting,in_progress,done'],
        ]);

        $update = ['service_status' => $validated['service_status']];

        if (
            $validated['service_status'] === 'in_progress' &&
            ! $sale->service_started_at
        ) {
            $update['service_started_at'] = now();
        }
        if (
            $validated['service_status'] === 'done' &&
            ! $sale->service_finished_at
        ) {
            $update['service_finished_at'] = now();
        }

        $sale->update($update);

        return back()->with('success', 'Status pengerjaan diperbarui.');
    }

    public function updateRentalStatus(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if((int) $sale->store_id !== (int) $storeId, 404);
        abort_unless(
            $request->user()->can('sale.create') ||
                $request->user()->can('sale.void'),
            403,
        );

        $validated = $request->validate([
            'rental_status' => [
                'required',
                'in:active,returned,overdue,cancelled',
            ],
        ]);

        $update = ['rental_status' => $validated['rental_status']];

        if ($validated['rental_status'] === 'returned') {
            $update['actual_return_at'] = now();
        }

        $sale->update($update);

        return back()->with('success', 'Status sewa diperbarui.');
    }

    public function checkOutHospitality(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if((int) $sale->store_id !== (int) $storeId, 404);
        abort_unless(
            $request->user()->can('sale.create') ||
                $request->user()->can('sale.void'),
            403,
        );
        abort_unless(
            $sale->pos_mode === 'hospitality',
            422,
            'Bukan transaksi hospitality.',
        );

        if ($sale->rental_status === 'returned') {
            return back()->with('error', 'Tamu ini sudah check-out.');
        }

        $sale->update([
            'rental_status' => 'returned',
            'actual_return_at' => now(),
        ]);

        return back()->with('success', 'Check-out berhasil dicatat.');
    }

    public function exitParking(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if((int) $sale->store_id !== (int) $storeId, 404);
        abort_unless(
            $request->user()->can('sale.create') ||
                $request->user()->can('sale.void'),
            403,
        );
        abort_unless(
            $sale->pos_mode === 'parking',
            422,
            'Bukan transaksi parkir.',
        );

        if ($sale->exit_at) {
            return back()->with(
                'error',
                'Kendaraan ini sudah tercatat keluar.',
            );
        }

        $sale->update(['exit_at' => now()]);

        return back()->with(
            'success',
            'Kendaraan berhasil dicatat keluar. '.($sale->plate_number ?? ''),
        );
    }

    public function endSession(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if((int) $sale->store_id !== (int) $storeId, 404);
        abort_unless(
            $request->user()->can('sale.create') ||
                $request->user()->can('sale.void'),
            403,
        );
        abort_unless(
            $sale->pos_mode === 'session',
            422,
            'Bukan transaksi session.',
        );

        if ($sale->session_status === 'ended') {
            return back()->with('error', 'Sesi ini sudah berakhir.');
        }

        $sale->update([
            'session_status' => 'ended',
            'session_ended_at' => now(),
        ]);

        return back()->with(
            'success',
            'Sesi '.($sale->unit_name ?? '').' berhasil diakhiri.',
        );
    }
}
