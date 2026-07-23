<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleSplitPayer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $storeId = session('current_store_id') ?? $user->stores()->first()?->id;

        // ── Date range ──────────────────────────────────────
        $from = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $to = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        // ── Branch filter ───────────────────────────────────
        $canViewAll = $user->can('sale.void');
        $branchIds = null;

        if (! $canViewAll) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled('branch_ids')) {
            $branchIds = array_map(
                'intval',
                (array) $request->input('branch_ids'),
            );
        }

        $branches = Branch::where('store_id', $storeId)
            ->where('is_active', true)
            ->get(['id', 'code', 'name']);

        // ── Scope helper ────────────────────────────────────
        $saleScope = function ($q) use ($storeId, $branchIds, $from, $to) {
            $q->where('store_id', $storeId)
                ->where('status', 'completed')
                ->whereBetween('sale_date', [$from, $to]);
            if ($branchIds) {
                $q->whereIn('branch_id', $branchIds);
            }
        };

        $purchaseScope = function ($q) use ($storeId, $from, $to) {
            $q->where('store_id', $storeId)
                ->where('status', 'completed')
                ->whereBetween('purchase_date', [$from, $to]);
        };

        $expenseScope = function ($q) use ($storeId, $from, $to) {
            $q->where('store_id', $storeId)->whereBetween('expense_date', [
                $from,
                $to,
            ]);
        };

        // ── Summary ─────────────────────────────────────────
        $totalSales = (float) Sale::where($saleScope)->sum('grand_total');
        $totalPurchases = (float) Purchase::where($purchaseScope)->sum(
            'grand_total',
        );
        $totalExpenses = (float) Expense::where($expenseScope)->sum('amount');
        $totalTransactions = Sale::where($saleScope)->count();
        $profit = $totalSales - $totalPurchases - $totalExpenses;

        // ── Rounding total ────────────────────────────────────
        $totalRoundingSales = (float) Sale::where($saleScope)->sum('rounding_adjustment');
        $totalRoundingPayers = (float) SaleSplitPayer::whereHas('sale', $saleScope)
            ->where('status', 'paid')
            ->sum('rounding_adjustment');
        $totalRounding = $totalRoundingSales + $totalRoundingPayers;

        // ── Daily breakdown ─────────────────────────────────
        $dailyBreakdown = Sale::where($saleScope)
            ->select(
                DB::raw('DATE(sale_date) as date'),
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count'),
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(
                fn ($d) => [
                    'date' => $d->date,
                    'total' => (float) $d->total,
                    'count' => $d->count,
                ],
            );

        // ── Top products ────────────────────────────────────
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->when(
                $branchIds,
                fn ($q) => $q->whereIn('sales.branch_id', $branchIds),
            )
            ->select(
                'products.name',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.subtotal) as revenue'),
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        // ── Payment breakdown ───────────────────────────────
        $paymentBreakdown = DB::table('sale_payments')
            ->join(
                'payment_methods',
                'sale_payments.payment_method_id',
                '=',
                'payment_methods.id',
            )
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->when(
                $branchIds,
                fn ($q) => $q->whereIn('sales.branch_id', $branchIds),
            )
            ->select(
                'payment_methods.name',
                DB::raw('SUM(sale_payments.amount) as total'),
                DB::raw('COUNT(*) as count'),
            )
            ->groupBy('payment_methods.id', 'payment_methods.name')
            ->orderByDesc('total')
            ->get();

        // ── Category breakdown ──────────────────────────────
        $categoryBreakdown = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin(
                'categories',
                'products.category_id',
                '=',
                'categories.id',
            )
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->when(
                $branchIds,
                fn ($q) => $q->whereIn('sales.branch_id', $branchIds),
            )
            ->select(
                DB::raw("COALESCE(categories.name, 'Tanpa Kategori') as name"),
                DB::raw('SUM(sale_items.subtotal) as revenue'),
                DB::raw('SUM(sale_items.quantity) as qty'),
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('revenue')
            ->get();

        return Inertia::render('Admin/Reports/Index', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'branches' => $branches,
            'branchIds' => $branchIds ?? [],
            'summary' => [
                'total_sales' => $totalSales,
                'total_purchases' => $totalPurchases,
                'total_expenses' => $totalExpenses,
                'profit' => $profit,
                'total_transactions' => $totalTransactions,
                'total_rounding' => $totalRounding,
            ],
            'dailyBreakdown' => $dailyBreakdown,
            'topProducts' => $topProducts,
            'paymentBreakdown' => $paymentBreakdown,
            'categoryBreakdown' => $categoryBreakdown,
        ]);
    }

    // ── Purchase Report ────────────────────────────────────
    public function purchases(Request $request)
    {
        $storeId = session('current_store_id');
        $from = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $to = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $purchases = Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('purchase_date', [$from, $to])
            ->with('supplier:id,name')
            ->orderByDesc('purchase_date')
            ->limit(50)
            ->get();

        $summary = [
            'total' => (float) Purchase::where('store_id', $storeId)->where('status', 'completed')->whereBetween('purchase_date', [$from, $to])->sum('grand_total'),
            'count' => Purchase::where('store_id', $storeId)->where('status', 'completed')->whereBetween('purchase_date', [$from, $to])->count(),
        ];

        $dailyTrend = Purchase::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereBetween('purchase_date', [$from, $to])
            ->select(DB::raw('DATE(purchase_date) as date'), DB::raw('SUM(grand_total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')->orderBy('date')->get();

        $bySupplier = DB::table('purchases')
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->where('purchases.store_id', $storeId)
            ->where('purchases.status', 'completed')
            ->whereBetween('purchases.purchase_date', [$from, $to])
            ->select('suppliers.name', DB::raw('SUM(purchases.grand_total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total')->limit(10)->get();

        return Inertia::render('Admin/Reports/Purchases', [
            'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'summary' => $summary, 'dailyTrend' => $dailyTrend, 'bySupplier' => $bySupplier,
            'purchases' => $purchases,
        ]);
    }

    // ── Stock Report ───────────────────────────────────────
    public function stock(Request $request)
    {
        $storeId = session('current_store_id');

        $products = DB::table('product_stocks')
            ->join('products', 'product_stocks.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('product_stocks.store_id', $storeId)
            ->where('products.is_active', true)
            ->select(
                'products.id', 'products.name', 'products.sku',
                DB::raw('COALESCE(categories.name, \'Tanpa Kategori\') as category'),
                DB::raw('SUM(product_stocks.quantity) as total_stock'),
                DB::raw('MIN(product_stocks.quantity) as min_stock'),
            )
            ->groupBy('products.id', 'products.name', 'products.sku', 'categories.name')
            ->orderBy('products.name')
            ->get();

        $lowStock = $products->filter(fn ($p) => $p->total_stock > 0 && $p->total_stock <= 5);
        $outOfStock = $products->filter(fn ($p) => $p->total_stock <= 0);

        $byCategory = $products->groupBy('category')->map(fn ($items, $cat) => [
            'category' => $cat,
            'count' => $items->count(),
            'total_stock' => (int) $items->sum('total_stock'),
        ])->values()->sortByDesc('total_stock')->values();

        return Inertia::render('Admin/Reports/Stock', [
            'summary' => [
                'total_products' => $products->count(),
                'low_stock' => $lowStock->count(),
                'out_of_stock' => $outOfStock->count(),
            ],
            'lowStock' => $lowStock->values()->take(20),
            'byCategory' => $byCategory,
        ]);
    }

    // ── Expense Report ─────────────────────────────────────
    public function expenses(Request $request)
    {
        $storeId = session('current_store_id');
        $from = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $to = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $expenses = Expense::where('store_id', $storeId)
            ->whereBetween('expense_date', [$from, $to])
            ->with('expenseCategory:id,name')
            ->orderByDesc('expense_date')
            ->limit(50)
            ->get();

        $summary = [
            'total' => (float) $expenses->sum('amount'),
            'count' => $expenses->count(),
        ];

        $dailyTrend = Expense::where('store_id', $storeId)
            ->whereBetween('expense_date', [$from, $to])
            ->select(DB::raw('DATE(expense_date) as date'), DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')->orderBy('date')->get();

        $byCategory = DB::table('expenses')
            ->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->where('expenses.store_id', $storeId)
            ->whereBetween('expenses.expense_date', [$from, $to])
            ->select(DB::raw('COALESCE(expense_categories.name, \'Lainnya\') as name'), DB::raw('SUM(expenses.amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->orderByDesc('total')->get();

        return Inertia::render('Admin/Reports/Expenses', [
            'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'summary' => $summary, 'dailyTrend' => $dailyTrend, 'byCategory' => $byCategory,
            'expenses' => $expenses,
        ]);
    }

    // ── Shift Report ───────────────────────────────────────
    public function shifts(Request $request)
    {
        $storeId = session('current_store_id');
        $from = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $to = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $shifts = DB::table('cashier_shifts')
            ->join('users', 'cashier_shifts.user_id', '=', 'users.id')
            ->leftJoin('branches', 'cashier_shifts.branch_id', '=', 'branches.id')
            ->where('cashier_shifts.store_id', $storeId)
            ->whereBetween('cashier_shifts.opened_at', [$from, $to])
            ->select(
                'cashier_shifts.*', 'users.name as user_name',
                DB::raw('COALESCE(branches.name, \'-\') as branch_name'),
            )
            ->orderByDesc('cashier_shifts.opened_at')
            ->limit(50)
            ->get();

        $summary = [
            'total_shifts' => $shifts->count(),
            'total_opening' => (float) $shifts->sum('opening_cash'),
            'total_closing' => (float) $shifts->sum('closing_cash'),
        ];

        $byCashier = $shifts->groupBy('user_name')->map(fn ($items, $name) => [
            'name' => $name,
            'count' => $items->count(),
            'total_opening' => (float) $items->sum('opening_cash'),
        ])->values()->sortByDesc('count')->values();

        return Inertia::render('Admin/Reports/Shifts', [
            'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'summary' => $summary, 'byCashier' => $byCashier, 'shifts' => $shifts,
        ]);
    }

    // ── Commission Report ──────────────────────────────────
    public function commissions(Request $request)
    {
        $storeId = session('current_store_id');
        $from = $request->start_date ? Carbon::parse($request->start_date)->startOfDay() : Carbon::now()->startOfMonth();
        $to = $request->end_date ? Carbon::parse($request->end_date)->endOfDay() : Carbon::now()->endOfDay();

        $commissions = DB::table('employee_commissions')
            ->join('employees', 'employee_commissions.employee_id', '=', 'employees.id')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->where('employee_commissions.store_id', $storeId)
            ->whereBetween('employee_commissions.commission_date', [$from, $to])
            ->select(
                'employee_commissions.*', 'users.name as employee_name',
            )
            ->orderByDesc('employee_commissions.commission_date')
            ->limit(50)
            ->get();

        $summary = [
            'total' => (float) $commissions->sum('amount'),
            'pending' => (float) $commissions->where('status', 'pending')->sum('amount'),
            'approved' => (float) $commissions->where('status', 'approved')->sum('amount'),
            'count' => $commissions->count(),
        ];

        $byEmployee = $commissions->groupBy('employee_name')->map(fn ($items, $name) => [
            'name' => $name,
            'total' => (float) $items->sum('amount'),
            'count' => $items->count(),
        ])->values()->sortByDesc('total')->values();

        return Inertia::render('Admin/Reports/Commissions', [
            'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'summary' => $summary, 'byEmployee' => $byEmployee, 'commissions' => $commissions,
        ]);
    }
}
