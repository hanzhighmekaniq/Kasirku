<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlanSubscription;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalStores = Store::count();
        $activeStores = Store::where('is_active', true)->count();
        $totalUsers = User::count();
        $totalRevenue = Sale::where('status', 'completed')->sum('grand_total');
        $todaySales = Sale::where('status', 'completed')
            ->whereDate('sale_date', today())
            ->sum('grand_total');

        $recentStores = Store::with('storeType')
            ->withCount(['users', 'sales'])
            ->select(
                'stores.id',
                'stores.code',
                'stores.name',
                'stores.store_type_id',
                'stores.is_active',
                'stores.created_at',
            )
            ->orderByDesc('stores.created_at')
            ->limit(5)
            ->get()
            ->map(function ($store) {
                return [
                    'id' => $store->id,
                    'code' => $store->code,
                    'name' => $store->name,
                    'store_type' => $store->getRelation('storeType')?->code,
                    'is_active' => $store->is_active,
                    'created_at' => $store->created_at,
                    'users_count' => $store->users_count,
                    'sales_count' => $store->sales_count,
                ];
            });

        $storeRevenues = Store::with('storeType')
            ->select(
                'stores.id',
                'stores.name',
                'stores.store_type_id',
                DB::raw('SUM(sales.grand_total) as revenue'),
                DB::raw('COUNT(sales.id) as sale_count'),
            )
            ->leftJoin('sales', function ($j) {
                $j->on('sales.store_id', '=', 'stores.id')->where(
                    'sales.status',
                    'completed',
                );
            })
            ->groupBy('stores.id', 'stores.name', 'stores.store_type_id')
            ->orderByDesc('revenue')
            ->limit(8)
            ->get()
            ->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'store_type' => $store->getRelation('storeType')?->code,
                    'revenue' => $store->revenue,
                    'sale_count' => $store->sale_count,
                ];
            });

        // Ringkasan role per store
        $storeTypes = Store::join(
            'store_types',
            'stores.store_type_id',
            '=',
            'store_types.id',
        )
            ->select(
                'store_types.code as store_type',
                DB::raw('count(*) as total'),
            )
            ->groupBy('store_types.code')
            ->pluck('total', 'store_type');

        return Inertia::render('Developer/Dashboard', [
            'stats' => [
                'total_stores' => $totalStores,
                'active_stores' => $activeStores,
                'total_users' => $totalUsers,
                'total_revenue' => (float) $totalRevenue,
                'today_sales' => (float) $todaySales,
            ],
            'recentStores' => $recentStores,
            'storeRevenues' => $storeRevenues,
            'storeTypes' => $storeTypes,
            'businessMetrics' => $this->businessMetrics(),
        ]);
    }

    /**
     * Metrik bisnis platform — MRR, distribusi plan, trial vs expired,
     * growth toko baru per bulan, dan konversi trial-to-paid.
     *
     * MRR dihitung dari toko AKTIF × harga bulanan plan-nya masing-masing.
     * Ini pendekatan sederhana (bukan proration harian) karena platform
     * belum punya sistem billing/invoice sungguhan — cukup representatif
     * untuk gambaran kesehatan bisnis di level developer.
     */
    private function businessMetrics(): array
    {
        $mrr = Store::query()
            ->join('plans', 'plans.id', '=', 'stores.plan_id')
            ->where('stores.is_active', true)
            ->sum('plans.price');

        $planDistribution = Store::query()
            ->join('plans', 'plans.id', '=', 'stores.plan_id')
            ->select('plans.code as plan_code', 'plans.label as plan_label', DB::raw('count(*) as total'))
            ->groupBy('plans.code', 'plans.label')
            ->orderByDesc('total')
            ->get();

        $trialActive = Store::whereNotNull('plan_expires_at')
            ->where('plan_expires_at', '>=', now())
            ->count();

        $trialExpiredNotSwept = Store::whereNotNull('plan_expires_at')
            ->where('plan_expires_at', '<', now())
            ->count();

        // Growth toko baru per bulan, 6 bulan terakhir (termasuk bulan ini)
        $growthRaw = Store::query()
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('count(*) as total'))
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month')
            ->pluck('total', 'month');

        $growth = [];
        for ($i = 5; $i >= 0; $i--) {
            $key = now()->subMonths($i)->format('Y-m');
            $growth[] = [
                'month' => $key,
                'label' => now()->subMonths($i)->translatedFormat('M Y'),
                'total' => $growthRaw[$key] ?? 0,
            ];
        }

        // Trial-to-paid conversion: dari riwayat plan yang reason-nya
        // trial_expired (turun ke free) vs upgraded (naik ke plan berbayar)
        // setelah sempat trial (started dari plan dengan trial_days > 0).
        $trialExpiredCount = PlanSubscription::where('reason', 'trial_expired')->count();
        $upgradedFromTrialCount = PlanSubscription::where('reason', 'upgraded')->count();
        $totalTrialOutcomes = $trialExpiredCount + $upgradedFromTrialCount;
        $conversionRate = $totalTrialOutcomes > 0
            ? round(($upgradedFromTrialCount / $totalTrialOutcomes) * 100, 1)
            : null;

        return [
            'mrr' => (float) $mrr,
            'plan_distribution' => $planDistribution,
            'trial_active' => $trialActive,
            'trial_expired_not_swept' => $trialExpiredNotSwept,
            'growth' => $growth,
            'trial_to_paid' => [
                'converted' => $upgradedFromTrialCount,
                'expired_to_free' => $trialExpiredCount,
                'conversion_rate' => $conversionRate,
            ],
        ];
    }
}
