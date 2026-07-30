<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * PlanSeeder — identik dengan DevSeeder\PlanSeeder.
 *
 * @see \Database\Seeders\DevSeeder\PlanSeeder
 */
class PlanSeeder extends Seeder
{
    private const FREE_STARTER_CODES = [
        'dashboard',
        'basic_pos',
        'product',
        'category',
        'payment_method',
        'report',
        'settings',
    ];

    private const PRO_EXCLUDED_CODES = [
        'payment_gateway',
        'stock_transfer',
        'sidebar_order',
    ];

    public function run(): void
    {
        Plan::updateOrCreate(
            ['code' => 'free'],
            [
                'label' => 'Free',
                'description' => 'Mulai gratis, rasakan fitur dasar POS tanpa batas waktu.',
                'price' => 0,
                'price_yearly' => 0,
                'max_users' => 1,
                'max_branches' => 1,
                'max_stores' => 1,
                'max_products' => 100,
                'max_transactions_per_month' => 150,
                'trial_days' => 0,
                'is_active' => true,
                'is_popular' => false,
                'is_seasonal' => false,
                'seasonal_label' => null,
                'sort_order' => 1,
            ],
        );

        Plan::updateOrCreate(
            ['code' => 'starter'],
            [
                'label' => 'Starter',
                'description' => 'Cocok untuk toko baru yang ingin fitur dasar tanpa batasan produk dan transaksi.',
                'price' => 19000,
                'price_yearly' => 179000,
                'max_users' => 1,
                'max_branches' => 1,
                'max_stores' => 1,
                'max_products' => null,
                'max_transactions_per_month' => null,
                'trial_days' => 0,
                'is_active' => true,
                'is_popular' => false,
                'is_seasonal' => false,
                'seasonal_label' => null,
                'sort_order' => 2,
            ],
        );

        Plan::updateOrCreate(
            ['code' => 'pro'],
            [
                'label' => 'Pro',
                'description' => 'Fitur lengkap untuk bisnis yang sedang berkembang. Tambah cabang & user sesuai kebutuhan.',
                'price' => 29000,
                'price_yearly' => 249000,
                'max_users' => 3,
                'max_branches' => 1,
                'max_stores' => 1,
                'max_products' => null,
                'max_transactions_per_month' => null,
                'trial_days' => 7,
                'is_active' => true,
                'is_popular' => true,
                'is_seasonal' => false,
                'seasonal_label' => null,
                'sort_order' => 3,
            ],
        );

        Plan::updateOrCreate(
            ['code' => 'business'],
            [
                'label' => 'Business',
                'description' => 'Untuk bisnis multi-cabang dan multi-store. Semua fitur aktif.',
                'price' => 79000,
                'price_yearly' => 699000,
                'max_users' => 20,
                'max_branches' => 15,
                'max_stores' => 3,
                'max_products' => null,
                'max_transactions_per_month' => null,
                'trial_days' => 14,
                'is_active' => true,
                'is_popular' => false,
                'is_seasonal' => false,
                'seasonal_label' => null,
                'sort_order' => 4,
            ],
        );

        Plan::whereIn('code', ['basic', 'unlimited'])
            ->update(['is_active' => false]);

        $freeStarterIds = Feature::whereIn('code', self::FREE_STARTER_CODES)->pluck('id');
        $proIds = Feature::whereNotIn('code', self::PRO_EXCLUDED_CODES)->pluck('id');
        $allIds = Feature::pluck('id');

        foreach (['free', 'starter'] as $code) {
            Plan::where('code', $code)->first()?->features()->sync($freeStarterIds);
        }
        Plan::where('code', 'pro')->first()?->features()->sync($proIds);
        Plan::where('code', 'business')->first()?->features()->sync($allIds);
    }
}
