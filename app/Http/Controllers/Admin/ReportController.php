<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Purchase;
use App\Models\Expense;
use App\Models\Store;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $storeId =
            session("current_store_id") ?? $user?->stores()->first()?->id;

        // ── Date range ──────────────────────────────────────
        $from = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();
        $to = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        // ── Branch filter ─────────────────────────────────────
        // User tanpa sale.void (kasir) → paksa ke branch sendiri
        // User dengan sale.void (admin/owner/supervisor) → bisa pilih branch
        $canViewAll = $user->can('sale.void');
        $branchIds  = null;
        if (!$canViewAll) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled("branch_ids")) {
            $branchIds = (array) $request->input("branch_ids");
        }

        $scopeQuery = function ($q) use ($storeId, $branchIds) {
            $q->where("store_id", $storeId);
            if ($branchIds) {
                $q->whereIn("branch_id", $branchIds);
            }
        };

        // ── Summary ──────────────────────────────────────────
        $totalSales = Sale::where("status", "completed")
            ->whereBetween("sale_date", [$from, $to])
            ->where($scopeQuery)
            ->sum("grand_total");

        $salesCount = Sale::where("status", "completed")
            ->whereBetween("sale_date", [$from, $to])
            ->where($scopeQuery)
            ->count();

        $totalPurchases = Purchase::where("status", "completed")
            ->whereBetween("purchase_date", [$from, $to])
            ->where($scopeQuery)
            ->sum("grand_total");

        $purchaseCount = Purchase::where("status", "completed")
            ->whereBetween("purchase_date", [$from, $to])
            ->where($scopeQuery)
            ->count();

        $totalExpenses = Expense::whereBetween("expense_date", [$from, $to])
            ->where($scopeQuery)
            ->sum("amount");

        // Returns — join through sales/purchases
        $totalSaleReturns = DB::table("sale_returns")
            ->join("sales", "sale_returns.sale_id", "=", "sales.id")
            ->where("sale_returns.status", "completed")
            ->whereBetween("sale_returns.return_date", [$from, $to])
            ->where("sales.store_id", $storeId)
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->sum("sale_returns.total_amount");

        $totalPurchaseReturns = DB::table("purchase_returns")
            ->join(
                "purchases",
                "purchase_returns.purchase_id",
                "=",
                "purchases.id",
            )
            ->where("purchase_returns.status", "completed")
            ->whereBetween("purchase_returns.return_date", [$from, $to])
            ->where("purchases.store_id", $storeId)
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("purchases.branch_id", $branchIds),
            )
            ->sum("purchase_returns.total_amount");

        // COGS
        $cogs = DB::table("sale_items")
            ->join("sales", "sale_items.sale_id", "=", "sales.id")
            ->join("products", "sale_items.product_id", "=", "products.id")
            ->where("sales.status", "completed")
            ->whereBetween("sales.sale_date", [$from, $to])
            ->where("sales.store_id", $storeId)
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->sum(DB::raw("sale_items.quantity * products.cost_price"));

        $grossProfit = $totalSales - $cogs;
        $netProfit =
            $grossProfit -
            $totalExpenses +
            $totalPurchaseReturns -
            $totalSaleReturns;

        $summary = compact(
            "totalSales",
            "totalPurchases",
            "totalExpenses",
            "cogs",
            "grossProfit",
            "netProfit",
            "salesCount",
            "purchaseCount",
            "totalSaleReturns",
            "totalPurchaseReturns",
        );

        // ── Daily Sales Trend ────────────────────────────────
        $dailySales = Sale::where("status", "completed")
            ->whereBetween("sale_date", [$from, $to])
            ->where($scopeQuery)
            ->select(
                DB::raw("DATE(sale_date) as date"),
                DB::raw("SUM(grand_total) as total"),
                DB::raw("COUNT(*) as count"),
            )
            ->groupBy("date")
            ->orderBy("date")
            ->get();

        // ── Top Products ─────────────────────────────────────
        $topProducts = DB::table("sale_items")
            ->join("sales", "sale_items.sale_id", "=", "sales.id")
            ->join("products", "sale_items.product_id", "=", "products.id")
            ->where("sales.status", "completed")
            ->whereBetween("sales.sale_date", [$from, $to])
            ->where("sales.store_id", $storeId)
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->select(
                "products.id",
                "products.name",
                "products.sku",
                DB::raw("SUM(sale_items.quantity) as total_qty"),
                DB::raw("SUM(sale_items.subtotal) as total_revenue"),
                DB::raw("products.cost_price as avg_cost"),
            )
            ->groupBy(
                "products.id",
                "products.name",
                "products.sku",
                "products.cost_price",
            )
            ->orderByDesc("total_revenue")
            ->limit(10)
            ->get()
            ->map(
                fn($i) => tap(
                    $i,
                    fn($item) => ($item->profit =
                        $item->total_revenue -
                        $item->total_qty * $item->avg_cost),
                ),
            );

        // ── Sales by Payment ─────────────────────────────────
        $salesByPayment = SalePayment::whereHas(
            "sale",
            fn($q) => $q
                ->where("status", "completed")
                ->whereBetween("sale_date", [$from, $to])
                ->where("store_id", $storeId)
                ->when(
                    $branchIds,
                    fn($sq) => $sq->whereIn("branch_id", $branchIds),
                ),
        )
            ->join(
                "payment_methods",
                "sale_payments.payment_method_id",
                "=",
                "payment_methods.id",
            )
            ->select(
                "payment_methods.name",
                DB::raw("SUM(sale_payments.amount) as total"),
                DB::raw("COUNT(*) as count"),
            )
            ->groupBy("payment_methods.name")
            ->orderByDesc("total")
            ->get();

        // ── Sales by Category ────────────────────────────────
        $salesByCategory = SaleItem::whereHas(
            "sale",
            fn($q) => $q
                ->where("status", "completed")
                ->whereBetween("sale_date", [$from, $to])
                ->where("store_id", $storeId)
                ->when(
                    $branchIds,
                    fn($sq) => $sq->whereIn("branch_id", $branchIds),
                ),
        )
            ->join("products", "sale_items.product_id", "=", "products.id")
            ->leftJoin(
                "categories",
                "products.category_id",
                "=",
                "categories.id",
            )
            ->select(
                DB::raw('COALESCE(categories.name, "Lainnya") as category'),
                DB::raw("SUM(sale_items.subtotal) as total"),
                DB::raw("SUM(sale_items.quantity) as qty"),
            )
            ->groupBy("category")
            ->orderByDesc("total")
            ->get();

        // ── Expenses by Category ─────────────────────────────
        $expensesByCategory = Expense::whereBetween("expense_date", [
            $from,
            $to,
        ])
            ->where("expenses.store_id", $storeId)
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("expenses.branch_id", $branchIds),
            )
            ->leftJoin(
                "expense_categories",
                "expenses.expense_category_id",
                "=",
                "expense_categories.id",
            )
            ->select(
                DB::raw(
                    'COALESCE(expense_categories.name, "Lainnya") as category',
                ),
                DB::raw("SUM(expenses.amount) as total"),
                DB::raw("COUNT(*) as count"),
            )
            ->groupBy("category")
            ->orderByDesc("total")
            ->get();

        // ── Recent transactions ───────────────────────────────
        $recentSales = Sale::where("status", "completed")
            ->whereBetween("sale_date", [$from, $to])
            ->where($scopeQuery)
            ->with("user:id,name")
            ->orderByDesc("sale_date")
            ->limit(5)
            ->get([
                "id",
                "sale_no",
                "sale_date",
                "grand_total",
                "paid_amount",
                "payment_status",
                "user_id",
            ]);

        $recentPurchases = Purchase::where("status", "completed")
            ->whereBetween("purchase_date", [$from, $to])
            ->where($scopeQuery)
            ->with("supplier:id,name")
            ->orderByDesc("purchase_date")
            ->limit(5)
            ->get([
                "id",
                "purchase_no",
                "purchase_date",
                "grand_total",
                "paid_amount",
                "payment_status",
                "supplier_id",
            ]);

        // ── Cash Flow (inflow vs outflow per day) ────────────
        $salesInflow = Sale::where("status", "completed")
            ->whereBetween("sale_date", [$from, $to])
            ->where($scopeQuery)
            ->select(
                DB::raw("DATE(sale_date) as date"),
                DB::raw("SUM(grand_total) as inflow"),
            )
            ->groupBy("date")
            ->orderBy("date")
            ->get();

        $purchaseOutflow = Purchase::where("status", "completed")
            ->whereBetween("purchase_date", [$from, $to])
            ->where($scopeQuery)
            ->select(
                DB::raw("DATE(purchase_date) as date"),
                DB::raw("SUM(grand_total) as outflow"),
            )
            ->groupBy("date")
            ->orderBy("date")
            ->get();

        $expenseOutflow = Expense::whereBetween("expense_date", [$from, $to])
            ->where($scopeQuery)
            ->select(
                DB::raw("DATE(expense_date) as date"),
                DB::raw("SUM(amount) as outflow"),
            )
            ->groupBy("date")
            ->orderBy("date")
            ->get();

        $cf = [];
        foreach ([$salesInflow, $purchaseOutflow, $expenseOutflow] as $set) {
            foreach ($set as $row) {
                $d = $row->date;
                if (!isset($cf[$d])) {
                    $cf[$d] = ["date" => $d, "inflow" => 0, "outflow" => 0];
                }
                if (isset($row->inflow)) {
                    $cf[$d]["inflow"] += (float) $row->inflow;
                }
                if (isset($row->outflow)) {
                    $cf[$d]["outflow"] += (float) $row->outflow;
                }
            }
        }
        $cashFlow = collect($cf)->sortKeys()->values();

        // ── Inventory Value (store-wide) ────────────────────
        $inventoryItems = DB::table("product_stocks")
            ->join("products", "product_stocks.product_id", "=", "products.id")
            ->where("product_stocks.store_id", $storeId)
            ->where("products.is_active", true)
            ->where("product_stocks.quantity", ">", 0)
            ->select(
                "products.id",
                "products.name",
                "products.sku",
                DB::raw("product_stocks.quantity as stock_qty"),
                DB::raw("product_stocks.reserved_quantity as reserved_qty"),
                DB::raw(
                    "(product_stocks.quantity - product_stocks.reserved_quantity) as available_qty",
                ),
                DB::raw(
                    "(product_stocks.quantity - product_stocks.reserved_quantity) * products.cost_price as total_value",
                ),
            )
            ->orderByDesc("total_value")
            ->limit(20)
            ->get();

        $totalInventoryValue = $inventoryItems->sum("total_value");

        // ── Low Stock Products ──────────────────────────────
        $lowStockProducts = DB::table("products")
            ->join("product_stocks", function ($j) use ($storeId) {
                $j->on("product_stocks.product_id", "=", "products.id")->where(
                    "product_stocks.store_id",
                    "=",
                    $storeId,
                );
            })
            ->where("products.track_stock", true)
            ->where("products.is_active", true)
            ->where("products.stock_minimum", ">", 0)
            ->whereRaw(
                "(product_stocks.quantity - product_stocks.reserved_quantity) <= products.stock_minimum",
            )
            ->select(
                "products.id",
                "products.name",
                "products.sku",
                "products.stock_minimum",
                DB::raw("product_stocks.quantity as stock_qty"),
                DB::raw("product_stocks.reserved_quantity as reserved_qty"),
                DB::raw(
                    "(product_stocks.quantity - product_stocks.reserved_quantity) as available_qty",
                ),
            )
            ->orderByRaw(
                "(product_stocks.quantity - product_stocks.reserved_quantity) ASC",
            )
            ->limit(20)
            ->get();

        // ── Top Customers ───────────────────────────────────
        $topCustomers = DB::table("sales")
            ->join("customers", "sales.customer_id", "=", "customers.id")
            ->where("sales.store_id", $storeId)
            ->where("sales.status", "completed")
            ->whereBetween("sales.sale_date", [$from, $to])
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->select(
                "customers.id",
                "customers.name",
                "customers.phone",
                "customers.tier",
                DB::raw("COUNT(sales.id) as transaction_count"),
                DB::raw("SUM(sales.grand_total) as total_spent"),
                DB::raw("MAX(sales.sale_date) as last_visit"),
            )
            ->groupBy(
                "customers.id",
                "customers.name",
                "customers.phone",
                "customers.tier",
            )
            ->orderByDesc("total_spent")
            ->limit(10)
            ->get();

        // ── Expiring Batches (30 hari ke depan) ─────────────
        $now = Carbon::now();
        $thirtyDaysLater = Carbon::now()->addDays(30);
        $expiringBatches = DB::table("product_batches")
            ->join("products", "product_batches.product_id", "=", "products.id")
            ->where("product_batches.store_id", $storeId)
            ->where("product_batches.quantity", ">", 0)
            ->whereBetween("product_batches.expiry_date", [
                $now,
                $thirtyDaysLater,
            ])
            ->select(
                "product_batches.id",
                "product_batches.batch_no",
                "product_batches.expiry_date",
                "product_batches.quantity",
                "product_batches.cost_price",
                "products.id as product_id",
                "products.name as product_name",
                "products.sku",
            )
            ->orderBy("product_batches.expiry_date")
            ->limit(20)
            ->get()
            ->map(
                fn($b) => tap($b, function ($item) {
                    $exp = Carbon::parse($item->expiry_date);
                    $item->days_left = Carbon::now()
                        ->startOfDay()
                        ->diffInDays($exp, false);
                    $item->total_value =
                        $item->quantity * (float) $item->cost_price;
                }),
            );

        // ── Waste Summary ───────────────────────────────────
        $wasteTotal = DB::table("waste_items")
            ->join("wastes", "waste_items.waste_id", "=", "wastes.id")
            ->where("wastes.store_id", $storeId)
            ->where("wastes.status", "completed")
            ->whereBetween("wastes.waste_date", [$from, $to])
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("wastes.branch_id", $branchIds),
            )
            ->sum("waste_items.total_cost");

        $wasteByCategory = DB::table("waste_items")
            ->join("wastes", "waste_items.waste_id", "=", "wastes.id")
            ->where("wastes.store_id", $storeId)
            ->where("wastes.status", "completed")
            ->whereBetween("wastes.waste_date", [$from, $to])
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("wastes.branch_id", $branchIds),
            )
            ->select(
                "waste_items.waste_category",
                DB::raw("SUM(waste_items.total_cost) as total"),
                DB::raw("SUM(waste_items.quantity) as qty"),
                DB::raw("COUNT(*) as items_count"),
            )
            ->groupBy("waste_items.waste_category")
            ->orderByDesc("total")
            ->get();

        $topWasteProducts = DB::table("waste_items")
            ->join("wastes", "waste_items.waste_id", "=", "wastes.id")
            ->join("products", "waste_items.product_id", "=", "products.id")
            ->where("wastes.store_id", $storeId)
            ->where("wastes.status", "completed")
            ->whereBetween("wastes.waste_date", [$from, $to])
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("wastes.branch_id", $branchIds),
            )
            ->select(
                "products.id",
                "products.name",
                "products.sku",
                DB::raw("SUM(waste_items.quantity) as total_qty"),
                DB::raw("SUM(waste_items.total_cost) as total_cost"),
                DB::raw("waste_items.waste_category"),
            )
            ->groupBy(
                "products.id",
                "products.name",
                "products.sku",
                "waste_items.waste_category",
            )
            ->orderByDesc("total_cost")
            ->limit(10)
            ->get();

        // ── Supplier Performance ────────────────────────────
        $supplierPerformance = DB::table("suppliers")
            ->leftJoin("purchases", function ($j) use (
                $storeId,
                $from,
                $to,
                $branchIds,
            ) {
                $j->on("purchases.supplier_id", "=", "suppliers.id")
                    ->where("purchases.store_id", "=", $storeId)
                    ->where("purchases.status", "=", "completed")
                    ->whereBetween("purchases.purchase_date", [$from, $to]);
                if ($branchIds) {
                    $j->whereIn("purchases.branch_id", $branchIds);
                }
            })
            ->leftJoin("purchase_returns", function ($j) use (
                $storeId,
                $from,
                $to,
            ) {
                $j->on("purchase_returns.supplier_id", "=", "suppliers.id")
                    ->where("purchase_returns.status", "=", "completed")
                    ->whereBetween("purchase_returns.return_date", [
                        $from,
                        $to,
                    ]);
            })
            ->select(
                "suppliers.id",
                "suppliers.name",
                "suppliers.code",
                DB::raw("COUNT(DISTINCT purchases.id) as purchase_count"),
                DB::raw(
                    "COALESCE(SUM(purchases.grand_total), 0) as total_purchases",
                ),
                DB::raw(
                    "COALESCE(SUM(purchase_returns.total_amount), 0) as total_returns",
                ),
            )
            ->groupBy("suppliers.id", "suppliers.name", "suppliers.code")
            ->orderByDesc("total_purchases")
            ->limit(10)
            ->get()
            ->map(
                fn($s) => tap(
                    $s,
                    fn($item) => ($item->net_spent =
                        $item->total_purchases - $item->total_returns),
                ),
            );

        // ── Promotion Effectiveness ─────────────────────────
        $promotionEffectiveness = SaleItem::whereHas(
            "sale",
            fn($q) => $q
                ->where("status", "completed")
                ->where("store_id", $storeId)
                ->whereBetween("sale_date", [$from, $to])
                ->when(
                    $branchIds,
                    fn($sq) => $sq->whereIn("branch_id", $branchIds),
                ),
        )
            ->whereNotNull("promotion_id")
            ->join(
                "promotions",
                "sale_items.promotion_id",
                "=",
                "promotions.id",
            )
            ->select(
                "promotions.id",
                "promotions.code",
                "promotions.name",
                "promotions.type",
                DB::raw("COUNT(DISTINCT sale_items.sale_id) as use_count"),
                DB::raw("COUNT(sale_items.id) as items_count"),
                DB::raw(
                    "COALESCE(SUM(sale_items.promo_discount), 0) as total_discount",
                ),
                DB::raw(
                    "COALESCE(SUM(sale_items.subtotal + sale_items.promo_discount), 0) as gross_revenue",
                ),
            )
            ->groupBy(
                "promotions.id",
                "promotions.code",
                "promotions.name",
                "promotions.type",
            )
            ->orderByDesc("total_discount")
            ->limit(10)
            ->get();

        $store       = Store::find($storeId);
        $storeType   = $store?->store_type ?? 'retail';
        $allBranches = Branch::where("store_id", $storeId)
            ->where("is_active", true)
            ->orderBy("name")
            ->get(["id", "code", "name"]);

        // Tentukan section yang relevan per store type
        $hasStock    = in_array($storeType, ['retail', 'fnb', 'rental']);
        $hasSupplier = in_array($storeType, ['retail', 'fnb', 'rental']);
        $hasWaste    = $storeType === 'fnb';
        $hasCashFlow = in_array($storeType, ['retail', 'fnb', 'service', 'rental']);

        return Inertia::render("Admin/Reports/Index", [
            "summary" => [
                "total_sales"             => $summary["totalSales"],
                "total_purchases"         => $hasSupplier ? $summary["totalPurchases"] : 0,
                "total_expenses"          => $summary["totalExpenses"],
                "cogs"                    => $summary["cogs"],
                "gross_profit"            => $summary["grossProfit"],
                "net_profit"              => $summary["netProfit"],
                "sales_count"             => $summary["salesCount"],
                "purchase_count"          => $hasSupplier ? $summary["purchaseCount"] : 0,
                "total_sale_returns"      => $summary["totalSaleReturns"],
                "total_purchase_returns"  => $hasSupplier ? $summary["totalPurchaseReturns"] : 0,
            ],
            "dailySales"              => $dailySales,
            "topProducts"             => $topProducts,
            "salesByPayment"          => $salesByPayment,
            "salesByCategory"         => $salesByCategory,
            "expensesByCategory"      => $expensesByCategory,
            "recentSales"             => $recentSales,
            "recentPurchases"         => $hasSupplier ? $recentPurchases : [],
            "cashFlow"                => $hasCashFlow ? $cashFlow : collect([]),
            "inventoryItems"          => $hasStock ? $inventoryItems : collect([]),
            "totalInventoryValue"     => $hasStock ? $totalInventoryValue : 0,
            "lowStockProducts"        => $hasStock ? $lowStockProducts : collect([]),
            "topCustomers"            => $topCustomers,
            "expiringBatches"         => $hasStock ? $expiringBatches : collect([]),
            "wasteTotal"              => $hasWaste ? $wasteTotal : 0,
            "wasteByCategory"         => $hasWaste ? $wasteByCategory : collect([]),
            "topWasteProducts"        => $hasWaste ? $topWasteProducts : collect([]),
            "supplierPerformance"     => $hasSupplier ? $supplierPerformance : collect([]),
            "promotionEffectiveness"  => $promotionEffectiveness,
            "filters" => [
                "start_date" => $from->format("Y-m-d"),
                "end_date"   => $to->format("Y-m-d"),
                "branch_ids" => $branchIds ?? [],
            ],
            "branches"  => $allBranches,
            "storeType" => $storeType,
            "canViewAll" => $canViewAll,
        ]);
    }
}
