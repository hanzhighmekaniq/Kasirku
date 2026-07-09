<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\Expense;
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
        $storeId = session("current_store_id") ?? $user->stores()->first()?->id;

        // ── Date range ──────────────────────────────────────
        $from = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $to = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        // ── Branch filter ───────────────────────────────────
        $canViewAll = $user->can("sale.void");
        $branchIds = null;

        if (!$canViewAll) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled("branch_ids")) {
            $branchIds = array_map(
                "intval",
                (array) $request->input("branch_ids"),
            );
        }

        $branches = Branch::where("store_id", $storeId)
            ->where("is_active", true)
            ->get(["id", "code", "name"]);

        // ── Scope helper ────────────────────────────────────
        $saleScope = function ($q) use ($storeId, $branchIds, $from, $to) {
            $q->where("store_id", $storeId)
                ->where("status", "completed")
                ->whereBetween("sale_date", [$from, $to]);
            if ($branchIds) {
                $q->whereIn("branch_id", $branchIds);
            }
        };

        $purchaseScope = function ($q) use ($storeId, $from, $to) {
            $q->where("store_id", $storeId)
                ->where("status", "completed")
                ->whereBetween("purchase_date", [$from, $to]);
        };

        $expenseScope = function ($q) use ($storeId, $from, $to) {
            $q->where("store_id", $storeId)->whereBetween("expense_date", [
                $from,
                $to,
            ]);
        };

        // ── Summary ─────────────────────────────────────────
        $totalSales = (float) Sale::where($saleScope)->sum("grand_total");
        $totalPurchases = (float) Purchase::where($purchaseScope)->sum(
            "grand_total",
        );
        $totalExpenses = (float) Expense::where($expenseScope)->sum("amount");
        $totalTransactions = Sale::where($saleScope)->count();
        $profit = $totalSales - $totalPurchases - $totalExpenses;

        // ── Daily breakdown ─────────────────────────────────
        $dailyBreakdown = Sale::where($saleScope)
            ->select(
                DB::raw("DATE(sale_date) as date"),
                DB::raw("SUM(grand_total) as total"),
                DB::raw("COUNT(*) as count"),
            )
            ->groupBy("date")
            ->orderBy("date")
            ->get()
            ->map(
                fn($d) => [
                    "date" => $d->date,
                    "total" => (float) $d->total,
                    "count" => $d->count,
                ],
            );

        // ── Top products ────────────────────────────────────
        $topProducts = DB::table("sale_items")
            ->join("sales", "sale_items.sale_id", "=", "sales.id")
            ->join("products", "sale_items.product_id", "=", "products.id")
            ->where("sales.store_id", $storeId)
            ->where("sales.status", "completed")
            ->whereBetween("sales.sale_date", [$from, $to])
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->select(
                "products.name",
                DB::raw("SUM(sale_items.quantity) as qty"),
                DB::raw("SUM(sale_items.subtotal) as revenue"),
            )
            ->groupBy("products.id", "products.name")
            ->orderByDesc("revenue")
            ->limit(10)
            ->get();

        // ── Payment breakdown ───────────────────────────────
        $paymentBreakdown = DB::table("sale_payments")
            ->join(
                "payment_methods",
                "sale_payments.payment_method_id",
                "=",
                "payment_methods.id",
            )
            ->join("sales", "sale_payments.sale_id", "=", "sales.id")
            ->where("sales.store_id", $storeId)
            ->where("sales.status", "completed")
            ->whereBetween("sales.sale_date", [$from, $to])
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->select(
                "payment_methods.name",
                DB::raw("SUM(sale_payments.amount) as total"),
                DB::raw("COUNT(*) as count"),
            )
            ->groupBy("payment_methods.id", "payment_methods.name")
            ->orderByDesc("total")
            ->get();

        // ── Category breakdown ──────────────────────────────
        $categoryBreakdown = DB::table("sale_items")
            ->join("sales", "sale_items.sale_id", "=", "sales.id")
            ->join("products", "sale_items.product_id", "=", "products.id")
            ->leftJoin(
                "categories",
                "products.category_id",
                "=",
                "categories.id",
            )
            ->where("sales.store_id", $storeId)
            ->where("sales.status", "completed")
            ->whereBetween("sales.sale_date", [$from, $to])
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->select(
                DB::raw("COALESCE(categories.name, 'Tanpa Kategori') as name"),
                DB::raw("SUM(sale_items.subtotal) as revenue"),
                DB::raw("SUM(sale_items.quantity) as qty"),
            )
            ->groupBy("categories.id", "categories.name")
            ->orderByDesc("revenue")
            ->get();

        return Inertia::render("Admin/Reports/Index", [
            "from" => $from->toDateString(),
            "to" => $to->toDateString(),
            "branches" => $branches,
            "branchIds" => $branchIds ?? [],
            "summary" => [
                "total_sales" => $totalSales,
                "total_purchases" => $totalPurchases,
                "total_expenses" => $totalExpenses,
                "profit" => $profit,
                "total_transactions" => $totalTransactions,
            ],
            "dailyBreakdown" => $dailyBreakdown,
            "topProducts" => $topProducts,
            "paymentBreakdown" => $paymentBreakdown,
            "categoryBreakdown" => $categoryBreakdown,
        ]);
    }
}
