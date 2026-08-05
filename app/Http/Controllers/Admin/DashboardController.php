<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Customer;
use App\Models\EmployeeCommission;
use App\Models\Expense;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        /** @var User $user */
        if ($user->isDeveloper()) {
            return redirect()->route('developer.dashboard');
        }

        $storeId = session('current_store_id') ?? $user->stores()->first()?->id;

        // User tanpa sale.void (kasir) selalu terkunci ke branch-nya sendiri
        $canViewAll = $user->can('sale.void');
        $branchIds = null;
        if (! $canViewAll) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled('branch_ids')) {
            $branchIds = (array) $request->input('branch_ids');
        }

        // ── Period filter (default: today) ────────────────────
        $period = $request->input('period', 'today'); // today | week | month

        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfDay();
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfDay();
        $prevWeekStart = Carbon::now()->subWeek()->startOfWeek();
        $prevWeekEnd = Carbon::now()->subWeek()->endOfWeek();
        $prevMonthStart = Carbon::now()->subMonth()->startOfMonth();
        $prevMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        // Resolve period boundaries + previous period boundaries for trend
        [$periodStart, $periodEnd, $prevStart, $prevEnd] = match ($period) {
            'week' => [$weekStart,  $weekEnd,  $prevWeekStart,  $prevWeekEnd],
            'month' => [$monthStart, $monthEnd, $prevMonthStart, $prevMonthEnd],
            default => [$today,      Carbon::now()->endOfDay(), $yesterday, $yesterday->copy()->endOfDay()],
        };

        // Get all active branches for the branch filter
        $branches = Branch::where('store_id', $storeId)
            ->where('is_active', true)
            ->get(['id', 'code', 'name']);

        // ── Scope helper for branch + kasir filtering ─────────
        $saleScope = function ($q) use ($storeId, $branchIds, $user, $canViewAll) {
            $q->where('store_id', $storeId)->where('status', 'completed');
            if ($branchIds) {
                $q->whereIn('branch_id', $branchIds);
            }
            if (! $canViewAll) {
                $q->where('user_id', $user->id);
            }
        };

        // ── Period sales ──────────────────────────────────────
        $periodSales = Sale::where($saleScope)
            ->whereBetween('sale_date', [$periodStart, $periodEnd])
            ->sum('grand_total');
        $periodCount = Sale::where($saleScope)
            ->whereBetween('sale_date', [$periodStart, $periodEnd])
            ->count();

        // ── Previous period (for trend comparison) ────────────
        $prevSales = Sale::where($saleScope)
            ->whereBetween('sale_date', [$prevStart, $prevEnd])
            ->sum('grand_total');
        $prevCount = Sale::where($saleScope)
            ->whereBetween('sale_date', [$prevStart, $prevEnd])
            ->count();

        // Keep today/month always available for other sections that are
        // period-independent (hourly chart, weekly trend, payment dist bulan ini)
        $todaySales = $period === 'today' ? $periodSales
            : Sale::where($saleScope)->whereDate('sale_date', $today)->sum('grand_total');
        $todayCount = $period === 'today' ? $periodCount
            : Sale::where($saleScope)->whereDate('sale_date', $today)->count();
        $monthSales = Sale::where($saleScope)
            ->whereBetween('sale_date', [$monthStart, $monthEnd])
            ->sum('grand_total');
        $monthCount = Sale::where($saleScope)
            ->whereBetween('sale_date', [$monthStart, $monthEnd])
            ->count();

        // ── Trend helpers ─────────────────────────────────────
        $calcTrend = function ($current, $previous) {
            if ($previous <= 0) {
                return $current > 0 ? 100.0 : 0.0;
            }

            return round((($current - $previous) / $previous) * 100, 1);
        };

        $salesTrend = $calcTrend($periodSales, $prevSales);
        $countTrend = $calcTrend($periodCount, $prevCount);
        $aov = $periodCount > 0 ? $periodSales / $periodCount : 0;
        $prevAov = $prevCount > 0 ? $prevSales / $prevCount : 0;
        $aovTrend = $calcTrend($aov, $prevAov);

        // Backward-compat aliases (Hero Card and remaining stat cards use these)
        $todaySalesTrend = $period === 'today' ? $salesTrend
            : $calcTrend($todaySales, Sale::where($saleScope)->whereDate('sale_date', $yesterday)->sum('grand_total'));
        $todayCountTrend = $period === 'today' ? $countTrend
            : $calcTrend($todayCount, Sale::where($saleScope)->whereDate('sale_date', $yesterday)->count());
        $aovToday = $todayCount > 0 ? $todaySales / $todayCount : 0;
        $aovYesterday = 0;
        if ($period !== 'today') {
            $yCount = Sale::where($saleScope)->whereDate('sale_date', $yesterday)->count();
            $ySales = Sale::where($saleScope)->whereDate('sale_date', $yesterday)->sum('grand_total');
            $aovYesterday = $yCount > 0 ? $ySales / $yCount : 0;
        }
        $aovTodayTrend = $calcTrend($aovToday, $aovYesterday);

        // ── Hourly trend (always today) ───────────────────────
        $hourlySales = Sale::where($saleScope)
            ->whereDate('sale_date', $today)
            ->select(
                DB::raw('HOUR(sale_date) as hour'),
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count'),
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        // ── Products ──────────────────────────────────────────
        $totalProducts = Product::forStore($storeId)->where('is_active', true)->count();
        $lowStockProducts = ProductStock::where('product_stocks.store_id', $storeId)
            ->join('products', 'product_stocks.product_id', '=', 'products.id')
            ->where('products.is_active', true)
            ->where('products.track_stock', true)
            ->whereRaw('(product_stocks.quantity - product_stocks.reserved_quantity) <= products.stock_minimum')
            ->count();

        // ── Recent sales (last 5) ─────────────────────────────
        $recentSales = Sale::where($saleScope)
            ->with('user:id,name')
            ->orderByDesc('sale_date')
            ->limit(5)
            ->get(['id', 'sale_no', 'sale_date', 'grand_total', 'payment_status', 'user_id']);

        // ── Per-branch breakdown (single grouped query) ───────
        $branchBreakdown = [];
        if ($canViewAll) {
            $branchStats = Sale::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where(function ($q) use ($today, $monthStart, $monthEnd) {
                    $q->whereDate('sale_date', $today)
                        ->orWhereBetween('sale_date', [$monthStart, $monthEnd]);
                })
                ->select(
                    'branch_id',
                    DB::raw('SUM(CASE WHEN DATE(sale_date) = "'.$today->toDateString().'" THEN grand_total ELSE 0 END) as today_sales'),
                    DB::raw('SUM(CASE WHEN sale_date >= "'.$monthStart->toDateTimeString().'" AND sale_date <= "'.$monthEnd->toDateTimeString().'" THEN grand_total ELSE 0 END) as month_sales'),
                    DB::raw('COUNT(CASE WHEN DATE(sale_date) = "'.$today->toDateString().'" THEN 1 END) as today_count'),
                )
                ->groupBy('branch_id')
                ->get()
                ->keyBy('branch_id');

            $branchBreakdown = Branch::where('store_id', $storeId)
                ->where('is_active', true)
                ->get(['id', 'name', 'code'])
                ->map(fn ($branch) => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'today_sales' => (float) ($branchStats[$branch->id]->today_sales ?? 0),
                    'month_sales' => (float) ($branchStats[$branch->id]->month_sales ?? 0),
                    'today_count' => (int) ($branchStats[$branch->id]->today_count ?? 0),
                ])
                ->toArray();
        }

        // ── Multi-store overview (single grouped query) ───────
        $storeOverview = [];
        if ($canViewAll) {
            $userStores = $user->stores()->with('storeType')
                ->get(['stores.id', 'stores.name', 'stores.store_type_id', 'stores.code']);
            if ($userStores->count() > 1) {
                $storeIds = $userStores->pluck('id')->toArray();
                $storeStats = Sale::whereIn('store_id', $storeIds)
                    ->where('status', 'completed')
                    ->where(function ($q) use ($today, $monthStart, $monthEnd) {
                        $q->whereDate('sale_date', $today)
                            ->orWhereBetween('sale_date', [$monthStart, $monthEnd]);
                    })
                    ->select(
                        'store_id',
                        DB::raw('SUM(CASE WHEN DATE(sale_date) = "'.$today->toDateString().'" THEN grand_total ELSE 0 END) as today_sales'),
                        DB::raw('SUM(CASE WHEN sale_date >= "'.$monthStart->toDateTimeString().'" AND sale_date <= "'.$monthEnd->toDateTimeString().'" THEN grand_total ELSE 0 END) as month_sales'),
                        DB::raw('COUNT(CASE WHEN DATE(sale_date) = "'.$today->toDateString().'" THEN 1 END) as today_count'),
                    )
                    ->groupBy('store_id')
                    ->get()
                    ->keyBy('store_id');

                $storeOverview = $userStores->map(fn ($store) => [
                    'id' => $store->id,
                    'name' => $store->name,
                    'code' => $store->code,
                    'store_type' => $store->getRelation('storeType')?->code,
                    'today_sales' => (float) ($storeStats[$store->id]->today_sales ?? 0),
                    'month_sales' => (float) ($storeStats[$store->id]->month_sales ?? 0),
                    'today_count' => (int) ($storeStats[$store->id]->today_count ?? 0),
                ])->toArray();
            }
        }

        // ── Top products (period-aware) ───────────────────────
        $topToday = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$periodStart, $periodEnd])
            ->when($branchIds, fn ($q) => $q->whereIn('sales.branch_id', $branchIds))
            ->when(! $canViewAll, fn ($q) => $q->where('sales.user_id', $user->id))
            ->select(
                'products.name',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.subtotal) as revenue'),
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // ── Weekly trend (last 7 days, single grouped query) ──
        $weekStart7 = Carbon::today()->subDays(6)->startOfDay();
        $weekEnd7 = Carbon::today()->endOfDay();

        $weeklyStats = Sale::where($saleScope)
            ->whereBetween('sale_date', [$weekStart7, $weekEnd7])
            ->select(
                DB::raw('DATE(sale_date) as sale_date'),
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count'),
            )
            ->groupBy('sale_date')
            ->get()
            ->keyBy(fn ($r) => Carbon::parse($r->sale_date)->toDateString());

        $weeklySales = collect();
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::today()->subDays($i);
            $dateKey = $day->toDateString();
            $weeklySales->push([
                'day' => $day->isoFormat('dd'),
                'fullDate' => $day->isoFormat('D MMM'),
                'total' => (float) ($weeklyStats[$dateKey]->total ?? 0),
                'count' => (int) ($weeklyStats[$dateKey]->count ?? 0),
            ]);
        }

        // ── Profit & expenses (period-aware) ──────────────────
        $periodPurchases = Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('purchase_date', [$periodStart, $periodEnd])
            ->sum('grand_total');
        $periodExpenses = Expense::where('store_id', $storeId)
            ->whereBetween('expense_date', [$periodStart, $periodEnd])
            ->sum('amount');
        $periodProfit = $periodSales - $periodPurchases - $periodExpenses;

        $prevPurchases = Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('purchase_date', [$prevStart, $prevEnd])
            ->sum('grand_total');
        $prevExpenses = Expense::where('store_id', $storeId)
            ->whereBetween('expense_date', [$prevStart, $prevEnd])
            ->sum('amount');
        $prevProfit = $prevSales - $prevPurchases - $prevExpenses;
        $profitTrend = $calcTrend($periodProfit, $prevProfit);

        // Always today for stat cards that are non-period-aware
        $todayPurchases = $period === 'today' ? $periodPurchases
            : Purchase::where('store_id', $storeId)->where('status', 'completed')->whereDate('purchase_date', $today)->sum('grand_total');
        $todayExpenses = $period === 'today' ? $periodExpenses
            : Expense::where('store_id', $storeId)->whereDate('expense_date', $today)->sum('amount');

        $monthPurchases = Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('purchase_date', [$monthStart, $monthEnd])
            ->sum('grand_total');
        $monthExpenses = Expense::where('store_id', $storeId)
            ->whereBetween('expense_date', [$monthStart, $monthEnd])
            ->sum('amount');
        $monthProfit = $monthSales - $monthPurchases - $monthExpenses;
        $todayProfit = $todaySales - $todayPurchases - $todayExpenses;

        // Inventory value
        $inventoryValue = ProductStock::where('product_stocks.store_id', $storeId)
            ->join('products', 'product_stocks.product_id', '=', 'products.id')
            ->where('products.is_active', true)
            ->where('products.track_stock', true)
            ->select(DB::raw('SUM((product_stocks.quantity - product_stocks.reserved_quantity) * COALESCE(product_stocks.average_cost, products.cost_price)) as total'))
            ->value('total') ?? 0;

        // ── Shift stats ───────────────────────────────────────
        $openShifts = CashierShift::where('store_id', $storeId)->where('status', 'open')->count();
        $todayShifts = CashierShift::where('store_id', $storeId)->whereDate('created_at', $today)->count();
        $activeShift = null;
        if (! $canViewAll) {
            $activeShift = CashierShift::where('store_id', $storeId)
                ->where('user_id', $user->id)
                ->where('status', 'open')
                ->first();
        }

        // ── Payment distribution (always this month) ──────────
        $paymentDist = DB::table('sale_payments')
            ->join('payment_methods', 'sale_payments.payment_method_id', '=', 'payment_methods.id')
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$monthStart, $monthEnd])
            ->when($branchIds, fn ($q) => $q->whereIn('sales.branch_id', $branchIds))
            ->when(! $canViewAll, fn ($q) => $q->where('sales.user_id', $user->id))
            ->select(
                'payment_methods.name',
                DB::raw('SUM(sale_payments.amount) as total'),
                DB::raw('COUNT(*) as count'),
            )
            ->groupBy('payment_methods.id', 'payment_methods.name')
            ->orderByDesc('total')
            ->get();

        // ── "Perlu Tindakan" section ──────────────────────────
        // Hanya untuk admin (canViewAll), kasir tidak perlu lihat ini

        // 1. Shift lama belum ditutup (> 8 jam) — paling urgent
        $staleShifts = [];
        if ($canViewAll) {
            $staleShifts = CashierShift::where('store_id', $storeId)
                ->where('status', 'open')
                ->where('opened_at', '<=', Carbon::now()->subHours(8))
                ->with('user:id,name', 'branch:id,name')
                ->orderBy('opened_at')
                ->limit(5)
                ->get(['id', 'shift_no', 'opened_at', 'opening_cash', 'user_id', 'branch_id'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'shift_no' => $s->shift_no,
                    'opened_at' => $s->opened_at->toISOString(),
                    'opening_cash' => (float) $s->opening_cash,
                    'user_name' => $s->user?->name ?? '—',
                    'branch_name' => $s->branch?->name ?? '—',
                ])
                ->toArray();
        }

        // 2. Piutang jatuh tempo (due_date <= today dan belum lunas)
        $overdueDebts = [];
        if ($canViewAll) {
            $overdueDebts = Customer::where('store_id', $storeId)
                ->where('debt_balance', '>', 0)
                ->whereHas('debtLogs', fn ($q) => $q
                    ->where('type', 'add')
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<=', $today)
                )
                ->orderByDesc('debt_balance')
                ->limit(5)
                ->get(['id', 'name', 'phone', 'debt_balance'])
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'phone' => $c->phone,
                    'balance' => (float) $c->debt_balance,
                ])
                ->toArray();
        }

        // 3. Stok menipis — list produk (bukan cuma count)
        $lowStockList = [];
        if ($canViewAll) {
            $lowStockList = ProductStock::where('product_stocks.store_id', $storeId)
                ->join('products', 'product_stocks.product_id', '=', 'products.id')
                ->where('products.is_active', true)
                ->where('products.track_stock', true)
                ->whereRaw('(product_stocks.quantity - product_stocks.reserved_quantity) <= products.stock_minimum')
                ->select(
                    'products.id',
                    'products.name',
                    'products.stock_minimum',
                    DB::raw('(product_stocks.quantity - product_stocks.reserved_quantity) as current_stock'),
                )
                ->orderByRaw('(product_stocks.quantity - product_stocks.reserved_quantity) ASC')
                ->limit(5)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'current_stock' => (float) $p->current_stock,
                    'stock_minimum' => (float) $p->stock_minimum,
                ])
                ->toArray();
        }

        // 4. Komisi karyawan pending approval
        $pendingCommissions = [];
        if ($canViewAll) {
            $pendingCommissions = EmployeeCommission::pending()
                ->where('store_id', $storeId)
                ->with('employee:id,name')
                ->orderBy('commission_date')
                ->limit(5)
                ->get(['id', 'employee_id', 'commission_date', 'commission_amount', 'type'])
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'employee_name' => $c->employee?->name ?? '—',
                    'commission_date' => $c->commission_date->toDateString(),
                    'commission_amount' => (float) $c->commission_amount,
                    'type' => $c->type,
                ])
                ->toArray();
        }

        return Inertia::render('Admin/Dashboard', [
            'mode' => $canViewAll ? 'admin' : 'kasir',
            'period' => $period,
            'currentStore' => $storeId
                ? Store::with('storeType')->find($storeId, ['id', 'name', 'store_type_id'])
                : null,
            'branches' => $branches,
            'filters' => ['branch_ids' => $branchIds ?? []],
            'stats' => [
                // Period-aware stats (berubah sesuai switcher)
                'period_sales' => (float) $periodSales,
                'period_count' => $periodCount,
                'period_purchases' => (float) $periodPurchases,
                'period_expenses' => (float) $periodExpenses,
                'period_profit' => (float) $periodProfit,
                'period_aov' => (float) $aov,
                'sales_trend' => $salesTrend,
                'count_trend' => $countTrend,
                'aov_trend' => $aovTrend,
                'profit_trend' => $profitTrend,

                // Always-today stats (Hero Card + backward compat)
                'today_sales' => (float) $todaySales,
                'today_count' => $todayCount,
                'today_sales_trend' => $todaySalesTrend,
                'today_count_trend' => $todayCountTrend,
                'aov_today' => (float) $aovToday,
                'aov_trend' => $aovTodayTrend,
                'today_purchases' => (float) $todayPurchases,
                'today_expenses' => (float) $todayExpenses,
                'today_profit' => (float) $todayProfit,
                'today_profit_trend' => $calcTrend($todayProfit, 0),

                // Month stats
                'month_sales' => (float) $monthSales,
                'month_count' => $monthCount,
                'month_purchases' => (float) $monthPurchases,
                'month_expenses' => (float) $monthExpenses,
                'month_profit' => (float) $monthProfit,

                // Store-wide (not period-filtered)
                'low_stock' => $lowStockProducts,
                'total_products' => $totalProducts,
                'inventory_value' => (float) $inventoryValue,
                'open_shifts' => $openShifts,
                'today_shifts' => $todayShifts,
            ],
            'hourlySales' => $hourlySales,
            'recentSales' => $recentSales,
            'branchBreakdown' => $branchBreakdown,
            'storeOverview' => $storeOverview,
            'topToday' => $topToday,
            'weeklySales' => $weeklySales,
            'paymentDist' => $paymentDist,
            'activeShift' => $activeShift,
            // "Perlu Tindakan" — hanya admin
            'actionItems' => [
                'stale_shifts' => $staleShifts,
                'overdue_debts' => $overdueDebts,
                'low_stock_list' => $lowStockList,
                'pending_commissions' => $pendingCommissions,
            ],
        ]);
    }
}
