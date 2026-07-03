<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class DashboardController extends Controller
{
    public function index()
    {
        $totalStores = Store::count();
        $activeStores = Store::where("is_active", true)->count();
        $totalUsers = User::count();
        $totalRevenue = Sale::where("status", "completed")->sum("grand_total");
        $todaySales = Sale::where("status", "completed")
            ->whereDate("sale_date", today())
            ->sum("grand_total");

        $recentStores = Store::withCount(["users", "sales"])
            ->orderByDesc("created_at")
            ->limit(5)
            ->get([
                "id",
                "code",
                "name",
                "store_type",
                "is_active",
                "created_at",
            ]);

        $storeRevenues = Store::select(
            "stores.id",
            "stores.name",
            "stores.store_type",
            DB::raw("SUM(sales.grand_total) as revenue"),
            DB::raw("COUNT(sales.id) as sale_count"),
        )
            ->leftJoin("sales", function ($j) {
                $j->on("sales.store_id", "=", "stores.id")->where(
                    "sales.status",
                    "completed",
                );
            })
            ->groupBy("stores.id", "stores.name", "stores.store_type")
            ->orderByDesc("revenue")
            ->limit(8)
            ->get();

        // Ringkasan role per store
        $storeTypes = Store::select("store_type", DB::raw("count(*) as total"))
            ->groupBy("store_type")
            ->pluck("total", "store_type");

        return Inertia::render("Developer/Dashboard", [
            "stats" => [
                "total_stores" => $totalStores,
                "active_stores" => $activeStores,
                "total_users" => $totalUsers,
                "total_revenue" => (float) $totalRevenue,
                "today_sales" => (float) $todaySales,
            ],
            "recentStores" => $recentStores,
            "storeRevenues" => $storeRevenues,
            "storeTypes" => $storeTypes,
        ]);
    }
}
