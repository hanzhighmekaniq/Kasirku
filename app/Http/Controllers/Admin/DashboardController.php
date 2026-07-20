<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Expense;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Store;
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

        // Get all active branches for the branch filter
        $branches = Branch::where('store_id', $storeId)
            ->where('is_active', true)
            ->get(['id', 'code', 'name']);

        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfDay();

        // ── Scope helper for branch + kasir filtering ─────────
        $saleScope = function ($q) use (
            $storeId,
            $branchIds,
            $user,
            $canViewAll,
        ) {
            $q->where('store_id', $storeId)->where('status', 'completed');
            if ($branchIds) {
                $q->whereIn('branch_id', $branchIds);
            }
            if (! $canViewAll) {
                $q->where('user_id', $user->id);
            }
        };

        // ── Today stats ───────────────────────────────────────
        $todaySales = Sale::where($saleScope)
            ->whereDate('sale_date', $today)
            ->sum('grand_total');
        $todayCount = Sale::where($saleScope)
            ->whereDate('sale_date', $today)
            ->count();
        $monthSales = Sale::where($saleScope)
            ->whereBetween('sale_date', [$monthStart, $monthEnd])
            ->sum('grand_total');
        $monthCount = Sale::where($saleScope)
            ->whereBetween('sale_date', [$monthStart, $monthEnd])
            ->count();

        // ── Yesterday stats (for trend comparison) ─────────────
        $yesterdaySales = Sale::where($saleScope)
            ->whereDate('sale_date', $yesterday)
            ->sum('grand_total');
        $yesterdayCount = Sale::where($saleScope)
            ->whereDate('sale_date', $yesterday)
            ->count();

        // ── Trend helpers ─────────────────────────────────────
        $calcTrend = function ($current, $previous) {
            if ($previous <= 0) {
                return $current > 0 ? 100.0 : 0.0;
            }

            return round((($current - $previous) / $previous) * 100, 1);
        };
        $todaySalesTrend = $calcTrend($todaySales, $yesterdaySales);
        $todayCountTrend = $calcTrend($todayCount, $yesterdayCount);
        $aovToday = $todayCount > 0 ? $todaySales / $todayCount : 0;
        $aovYesterday = $yesterdayCount > 0 ? $yesterdaySales / $yesterdayCount : 0;
        $aovTrend = $calcTrend($aovToday, $aovYesterday);

        // ── Hourly trend today ────────────────────────────────
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

        // ── Products (stock is store-scoped, no branch_id column) ─
        $totalProducts = Product::forStore($storeId)
            ->where('is_active', true)
            ->count();
        $lowStockProducts = ProductStock::where(
            'product_stocks.store_id',
            $storeId,
        )
            ->join('products', 'product_stocks.product_id', '=', 'products.id')
            ->where('products.is_active', true)
            ->where('products.track_stock', true)
            ->whereRaw(
                '(product_stocks.quantity - product_stocks.reserved_quantity) <= products.stock_minimum',
            )
            ->count();

        // ── Recent sales (last 5) ──────────────────────────────
        $recentSales = Sale::where($saleScope)
            ->with('user:id,name')
            ->orderByDesc('sale_date')
            ->limit(5)
            ->get([
                'id',
                'sale_no',
                'sale_date',
                'grand_total',
                'payment_status',
                'user_id',
            ]);

        // ── Per-branch breakdown (hanya user dengan akses penuh) ────────
        $branchBreakdown = [];
        if ($canViewAll) {
            $store = Store::find($storeId);
            if ($store) {
                $branchBreakdown = $store
                    ->branches()
                    ->where('is_active', true)
                    ->get(['id', 'name', 'code'])
                    ->map(function ($branch) use (
                        $storeId,
                        $today,
                        $monthStart,
                        $monthEnd,
                    ) {
                        $q = Sale::where('store_id', $storeId)
                            ->where('branch_id', $branch->id)
                            ->where('status', 'completed');

                        return [
                            'id' => $branch->id,
                            'name' => $branch->name,
                            'code' => $branch->code,
                            'today_sales' => (float) (clone $q)
                                ->whereDate('sale_date', $today)
                                ->sum('grand_total'),
                            'month_sales' => (float) (clone $q)
                                ->whereBetween('sale_date', [
                                    $monthStart,
                                    $monthEnd,
                                ])
                                ->sum('grand_total'),
                            'today_count' => (clone $q)
                                ->whereDate('sale_date', $today)
                                ->count(),
                        ];
                    })
                    ->toArray();
            }
        }

        // ── Multi-store overview (user dengan akses penuh & > 1 store) ────────
        $storeOverview = [];
        if ($canViewAll) {
            $userStores = $user
                ->stores()
                ->with('storeType')
                ->get([
                    'stores.id',
                    'stores.name',
                    'stores.store_type_id',
                    'stores.code',
                ]);
            if ($userStores->count() > 1) {
                $storeOverview = $userStores
                    ->map(function ($store) use (
                        $today,
                        $monthStart,
                        $monthEnd,
                    ) {
                        $q = Sale::where('store_id', $store->id)->where(
                            'status',
                            'completed',
                        );

                        return [
                            'id' => $store->id,
                            'name' => $store->name,
                            'code' => $store->code,
                            'store_type' => $store->getRelation('storeType')
                                ?->code,
                            'today_sales' => (float) (clone $q)
                                ->whereDate('sale_date', $today)
                                ->sum('grand_total'),
                            'month_sales' => (float) (clone $q)
                                ->whereBetween('sale_date', [
                                    $monthStart,
                                    $monthEnd,
                                ])
                                ->sum('grand_total'),
                            'today_count' => (clone $q)
                                ->whereDate('sale_date', $today)
                                ->count(),
                        ];
                    })
                    ->toArray();
            }
        }

        // ── Top products today ────────────────────────────────
        $topToday = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereDate('sales.sale_date', $today)
            ->when(
                $branchIds,
                fn ($q) => $q->whereIn('sales.branch_id', $branchIds),
            )
            ->when(
                ! $canViewAll,
                fn ($q) => $q->where('sales.user_id', $user->id),
            )
            ->select(
                'products.name',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.subtotal) as revenue'),
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // ── Weekly trend (last 7 days) ──────────────────────────
        $weeklySales = collect();
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::today()->subDays($i);
            $dayName = $day->isoFormat('dddd'); // e.g. "Senin"
            $shortName = $day->isoFormat('dd'); // e.g. "Sn"
            $total = Sale::where($saleScope)
                ->whereDate('sale_date', $day)
                ->sum('grand_total');
            $count = Sale::where($saleScope)
                ->whereDate('sale_date', $day)
                ->count();
            $weeklySales->push([
                'day' => $shortName,
                'fullDate' => $day->isoFormat('D MMM'),
                'total' => (float) $total,
                'count' => $count,
            ]);
        }

        // ── Additional stats: profit, inventory, expenses ──
        $todayPurchases = Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('purchase_date', $today)
            ->sum('grand_total');

        $todayExpenses = Expense::where('store_id', $storeId)
            ->whereDate('expense_date', $today)
            ->sum('amount');

        $monthPurchases = Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('purchase_date', [$monthStart, $monthEnd])
            ->sum('grand_total');

        $monthExpenses = Expense::where('store_id', $storeId)
            ->whereBetween('expense_date', [$monthStart, $monthEnd])
            ->sum('amount');

        $todayProfit = $todaySales - $todayPurchases - $todayExpenses;
        $monthProfit = $monthSales - $monthPurchases - $monthExpenses;

        // Yesterday profit (for trend)
        $yesterdayPurchases = Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('purchase_date', $yesterday)
            ->sum('grand_total');
        $yesterdayExpenses = Expense::where('store_id', $storeId)
            ->whereDate('expense_date', $yesterday)
            ->sum('amount');
        $yesterdayProfit = $yesterdaySales - $yesterdayPurchases - $yesterdayExpenses;
        $todayProfitTrend = $calcTrend($todayProfit, $yesterdayProfit);

        // Inventory value (stok × average_cost per bucket, bukan product.cost_price)
        $inventoryValue =
            ProductStock::where('product_stocks.store_id', $storeId)
                ->join(
                    'products',
                    'product_stocks.product_id',
                    '=',
                    'products.id',
                )
                ->where('products.is_active', true)
                ->where('products.track_stock', true)
                ->select(
                    DB::raw(
                        'SUM((product_stocks.quantity - product_stocks.reserved_quantity) * COALESCE(product_stocks.average_cost, products.cost_price)) as total',
                    ),
                )
                ->value('total') ?? 0;

        // ── Shift stats ────────────────────────────────────────
        $openShifts = CashierShift::where('store_id', $storeId)
            ->where('status', 'open')
            ->count();
        $todayShifts = CashierShift::where('store_id', $storeId)
            ->whereDate('created_at', $today)
            ->count();
        $activeShift = null;
        if (! $canViewAll) {
            $activeShift = CashierShift::where('store_id', $storeId)
                ->where('user_id', $user->id)
                ->where('status', 'open')
                ->first();
        }

        // ── Payment method distribution (this month) ─────────────
        $paymentDist = DB::table('sale_payments')
            ->join(
                'payment_methods',
                'sale_payments.payment_method_id',
                '=',
                'payment_methods.id',
            )
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$monthStart, $monthEnd])
            ->when(
                $branchIds,
                fn ($q) => $q->whereIn('sales.branch_id', $branchIds),
            )
            ->when(
                ! $canViewAll,
                fn ($q) => $q->where('sales.user_id', $user->id),
            )
            ->select(
                'payment_methods.name',
                DB::raw('SUM(sale_payments.amount) as total'),
                DB::raw('COUNT(*) as count'),
            )
            ->groupBy('payment_methods.id', 'payment_methods.name')
            ->orderByDesc('total')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'mode' => $canViewAll ? 'admin' : 'kasir',
            'currentStore' => $storeId
                ? Store::with('storeType')->find($storeId, [
                    'id',
                    'name',
                    'store_type_id',
                ])
                : null,
            'branches' => $branches,
            'filters' => [
                'branch_ids' => $branchIds ?? [],
            ],
            'stats' => [
                'today_sales' => (float) $todaySales,
                'today_count' => $todayCount,
                'today_sales_trend' => $todaySalesTrend,
                'today_count_trend' => $todayCountTrend,
                'aov_today' => (float) $aovToday,
                'aov_trend' => $aovTrend,
                'month_sales' => (float) $monthSales,
                'month_count' => $monthCount,
                'today_purchases' => (float) $todayPurchases,
                'today_expenses' => (float) $todayExpenses,
                'month_purchases' => (float) $monthPurchases,
                'month_expenses' => (float) $monthExpenses,
                'today_profit' => (float) $todayProfit,
                'today_profit_trend' => $todayProfitTrend,
                'month_profit' => (float) $monthProfit,
                'inventory_value' => (float) $inventoryValue,
                'low_stock' => $lowStockProducts,
                'total_products' => $totalProducts,
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
        ]);
    }
}
