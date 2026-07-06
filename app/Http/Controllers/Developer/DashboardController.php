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

        $recentStores = Store::with('storeType')
            ->withCount(["users", "sales"])
            ->select(
                "stores.id",
                "stores.code",
                "stores.name",
                "stores.store_type_id",
                "stores.is_active",
                "stores.created_at",
            )
            ->orderByDesc("stores.created_at")
            ->limit(5)
            ->get()
            ->map(function ($store) {
                return [
                    'id' => $store->id,
                    'code' => $store->code,
                    'name' => $store->name,
                    'store_type' => $store->store_type,
                    'is_active' => $store->is_active,
                    'created_at' => $store->created_at,
                    'users_count' => $store->users_count,
                    'sales_count' => $store->sales_count,
                ];
            });

        $storeRevenues = Store::with('storeType')
            ->select(
                "stores.id",
                "stores.name",
                "stores.store_type_id",
                DB::raw("SUM(sales.grand_total) as revenue"),
                DB::raw("COUNT(sales.id) as sale_count"),
            )
            ->leftJoin("sales", function ($j) {
                $j->on("sales.store_id", "=", "stores.id")->where(
                    "sales.status",
                    "completed",
                );
            })
            ->groupBy("stores.id", "stores.name", "stores.store_type_id")
            ->orderByDesc("revenue")
            ->limit(8)
            ->get()
            ->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'store_type' => $store->store_type,
                    'revenue' => $store->revenue,
                    'sale_count' => $store->sale_count,
                ];
            });

        // Ringkasan role per store
        $storeTypes = Store::join(
            "store_types",
            "stores.store_type_id",
            "=",
            "store_types.id",
        )
            ->select(
                "store_types.code as store_type",
                DB::raw("count(*) as total"),
            )
            ->groupBy("store_types.code")
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
