<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashierShift;
use App\Models\Product;
use App\Models\Sale;
use App\Models\ProductStock;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        /** @var User $user */
        if ($user->isDeveloper()) {
            return redirect()->route("developer.dashboard");
        }

        $storeId = session("current_store_id") ?? $user->stores()->first()?->id;

        // User tanpa sale.void (kasir) selalu terkunci ke branch-nya sendiri
        $canViewAll = $user->can('sale.void');
        $branchIds  = null;
        if (!$canViewAll) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled("branch_ids")) {
            $branchIds = (array) $request->input("branch_ids");
        }

        // Get all active branches for the branch filter
        $branches = \App\Models\Branch::where("store_id", $storeId)
            ->where("is_active", true)
            ->get(["id", "code", "name"]);

        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfDay();

        // ── Scope helper for branch + kasir filtering ─────────
        $saleScope = function ($q) use ($storeId, $branchIds, $user, $canViewAll) {
            $q->where("store_id", $storeId)->where("status", "completed");
            if ($branchIds) {
                $q->whereIn("branch_id", $branchIds);
            }
            if (!$canViewAll) {
                $q->where("user_id", $user->id);
            }
        };

        // ── Today stats ───────────────────────────────────────
        $todaySales = Sale::where($saleScope)
            ->whereDate("sale_date", $today)
            ->sum("grand_total");
        $todayCount = Sale::where($saleScope)
            ->whereDate("sale_date", $today)
            ->count();
        $monthSales = Sale::where($saleScope)
            ->whereBetween("sale_date", [$monthStart, $monthEnd])
            ->sum("grand_total");
        $monthCount = Sale::where($saleScope)
            ->whereBetween("sale_date", [$monthStart, $monthEnd])
            ->count();

        // ── Hourly trend today ────────────────────────────────
        $hourlySales = Sale::where($saleScope)
            ->whereDate("sale_date", $today)
            ->select(
                DB::raw("HOUR(sale_date) as hour"),
                DB::raw("SUM(grand_total) as total"),
                DB::raw("COUNT(*) as count"),
            )
            ->groupBy("hour")
            ->orderBy("hour")
            ->get();

        // ── Products (stock is store-scoped, no branch_id column) ─
        $totalProducts = Product::forStore($storeId)
            ->where("is_active", true)
            ->count();
        $lowStockProducts = ProductStock::where(
            "product_stocks.store_id",
            $storeId,
        )
            ->join("products", "product_stocks.product_id", "=", "products.id")
            ->where("products.is_active", true)
            ->where("products.track_stock", true)
            ->whereRaw(
                "(product_stocks.quantity - product_stocks.reserved_quantity) <= products.stock_minimum",
            )
            ->count();

        // ── Recent sales (last 5) ──────────────────────────────
        $recentSales = Sale::where($saleScope)
            ->with("user:id,name")
            ->orderByDesc("sale_date")
            ->limit(5)
            ->get([
                "id",
                "sale_no",
                "sale_date",
                "grand_total",
                "payment_status",
                "user_id",
            ]);

        // ── Per-branch breakdown (hanya user dengan akses penuh) ────────
        $branchBreakdown = [];
        if ($canViewAll) {
            $store = Store::find($storeId);
            if ($store) {
                $branchBreakdown = $store
                    ->branches()
                    ->where("is_active", true)
                    ->get(["id", "name", "code"])
                    ->map(function ($branch) use (
                        $storeId,
                        $today,
                        $monthStart,
                        $monthEnd,
                    ) {
                        $q = Sale::where("store_id", $storeId)
                            ->where("branch_id", $branch->id)
                            ->where("status", "completed");
                        return [
                            "id" => $branch->id,
                            "name" => $branch->name,
                            "code" => $branch->code,
                            "today_sales" => (float) (clone $q)
                                ->whereDate("sale_date", $today)
                                ->sum("grand_total"),
                            "month_sales" => (float) (clone $q)
                                ->whereBetween("sale_date", [
                                    $monthStart,
                                    $monthEnd,
                                ])
                                ->sum("grand_total"),
                            "today_count" => (clone $q)
                                ->whereDate("sale_date", $today)
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
                ->get([
                    "stores.id",
                    "stores.name",
                    "stores.store_type",
                    "stores.code",
                ]);
            if ($userStores->count() > 1) {
                $storeOverview = $userStores
                    ->map(function ($store) use (
                        $today,
                        $monthStart,
                        $monthEnd,
                    ) {
                        $q = Sale::where("store_id", $store->id)->where(
                            "status",
                            "completed",
                        );
                        return [
                            "id" => $store->id,
                            "name" => $store->name,
                            "code" => $store->code,
                            "store_type" => $store->store_type,
                            "today_sales" => (float) (clone $q)
                                ->whereDate("sale_date", $today)
                                ->sum("grand_total"),
                            "month_sales" => (float) (clone $q)
                                ->whereBetween("sale_date", [
                                    $monthStart,
                                    $monthEnd,
                                ])
                                ->sum("grand_total"),
                            "today_count" => (clone $q)
                                ->whereDate("sale_date", $today)
                                ->count(),
                        ];
                    })
                    ->toArray();
            }
        }

        // ── Top products today ────────────────────────────────
        $topToday = DB::table("sale_items")
            ->join("sales", "sale_items.sale_id", "=", "sales.id")
            ->join("products", "sale_items.product_id", "=", "products.id")
            ->where("sales.store_id", $storeId)
            ->where("sales.status", "completed")
            ->whereDate("sales.sale_date", $today)
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->when(
                !$canViewAll,
                fn($q) => $q->where("sales.user_id", $user->id),
            )
            ->select(
                "products.name",
                DB::raw("SUM(sale_items.quantity) as qty"),
                DB::raw("SUM(sale_items.subtotal) as revenue"),
            )
            ->groupBy("products.id", "products.name")
            ->orderByDesc("revenue")
            ->limit(5)
            ->get();

        // ── Weekly trend (last 7 days) ──────────────────────────
        $weeklySales = collect();
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::today()->subDays($i);
            $dayName = $day->isoFormat("dddd"); // e.g. "Senin"
            $shortName = $day->isoFormat("dd"); // e.g. "Sn"
            $total = Sale::where($saleScope)
                ->whereDate("sale_date", $day)
                ->sum("grand_total");
            $count = Sale::where($saleScope)
                ->whereDate("sale_date", $day)
                ->count();
            $weeklySales->push([
                "day" => $shortName,
                "fullDate" => $day->isoFormat("D MMM"),
                "total" => (float) $total,
                "count" => $count,
            ]);
        }

        // ── Shift stats ────────────────────────────────────────
        $openShifts = CashierShift::where("store_id", $storeId)
            ->where("status", "open")
            ->count();
        $todayShifts = CashierShift::where("store_id", $storeId)
            ->whereDate("created_at", $today)
            ->count();
        $activeShift = null;
        if (!$canViewAll) {
            $activeShift = CashierShift::where("store_id", $storeId)
                ->where("user_id", $user->id)
                ->where("status", "open")
                ->first();
        }

        // ── Payment method distribution (this month) ─────────────
        $paymentDist = DB::table("sale_payments")
            ->join(
                "payment_methods",
                "sale_payments.payment_method_id",
                "=",
                "payment_methods.id",
            )
            ->join("sales", "sale_payments.sale_id", "=", "sales.id")
            ->where("sales.store_id", $storeId)
            ->where("sales.status", "completed")
            ->whereBetween("sales.sale_date", [$monthStart, $monthEnd])
            ->when(
                $branchIds,
                fn($q) => $q->whereIn("sales.branch_id", $branchIds),
            )
            ->when(
                !$canViewAll,
                fn($q) => $q->where("sales.user_id", $user->id),
            )
            ->select(
                "payment_methods.name",
                DB::raw("SUM(sale_payments.amount) as total"),
                DB::raw("COUNT(*) as count"),
            )
            ->groupBy("payment_methods.id", "payment_methods.name")
            ->orderByDesc("total")
            ->get();

        return Inertia::render("Admin/Dashboard", [
            "mode" => $canViewAll ? "admin" : "kasir",
            "currentStore" => $storeId
                ? Store::find($storeId, ["id", "name", "store_type"])
                : null,
            "branches" => $branches,
            "filters" => [
                "branch_ids" => $branchIds ?? [],
            ],
            "stats" => [
                "today_sales" => (float) $todaySales,
                "today_count" => $todayCount,
                "month_sales" => (float) $monthSales,
                "month_count" => $monthCount,
                "low_stock" => $lowStockProducts,
                "total_products" => $totalProducts,
                "open_shifts" => $openShifts,
                "today_shifts" => $todayShifts,
            ],
            "hourlySales" => $hourlySales,
            "recentSales" => $recentSales,
            "branchBreakdown" => $branchBreakdown,
            "storeOverview" => $storeOverview,
            "topToday" => $topToday,
            "weeklySales" => $weeklySales,
            "paymentDist" => $paymentDist,
            "activeShift" => $activeShift,
        ]);
    }
}
