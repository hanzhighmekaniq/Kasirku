<?php

namespace Database\Seeders\DevSeeder;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * PlanSeeder — definisi lengkap 4 paket + fitur yang disertakan.
 *
 * PENTING:
 * - Harus dijalankan SETELAH FeatureSeeder agar feature codes sudah ada.
 * - Blok "Attach features to plans" yang dulu ada di FeatureSeeder telah
 *   DIPINDAH ke sini supaya satu sumber kebenaran dan tidak saling ketimpa.
 * - PlanAddonSeeder harus dijalankan SETELAH seeder ini.
 *
 * Struktur paket:
 *   free     – batas ketat, fitur dasar saja, tanpa add-on
 *   starter  – harga entry, fitur sama dg free tapi limit unlimited, tanpa add-on (decoy)
 *   pro      – fitur lengkap kecuali payment_gateway/stock_transfer/sidebar_order
 *   business – semua fitur, multi-store, bisa tambah add-on
 */
class PlanSeeder extends Seeder
{
    /** Feature codes untuk paket Free dan Starter (identik). */
    private const FREE_STARTER_CODES = [
        'dashboard',
        'basic_pos',
        'product',
        'category',
        'payment_method',
        'report',
        'settings',
    ];

    /** Feature codes yang DIKECUALIKAN dari paket Pro. */
    private const PRO_EXCLUDED_CODES = [
        'payment_gateway',
        'stock_transfer',
        'sidebar_order',
    ];

    public function run(): void
    {
        // ── 1. Buat/perbarui 4 plan ─────────────────────────────────

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

        // Nonaktifkan plan lama yang sudah tidak dipakai (jika masih ada di DB).
        Plan::whereIn('code', ['basic', 'unlimited'])
            ->update(['is_active' => false]);

        // ── 2. Attach fitur ke plan ─────────────────────────────────
        // Dipindah dari FeatureSeeder ke sini supaya tidak saling ketimpa.

        $free = Plan::where('code', 'free')->first();
        $starter = Plan::where('code', 'starter')->first();
        $pro = Plan::where('code', 'pro')->first();
        $business = Plan::where('code', 'business')->first();

        $freeStarterIds = Feature::whereIn('code', self::FREE_STARTER_CODES)
            ->pluck('id');

        $proIds = Feature::whereNotIn('code', self::PRO_EXCLUDED_CODES)
            ->pluck('id');

        $allIds = Feature::pluck('id');

        if ($free) {
            $free->features()->sync($freeStarterIds);
        }
        if ($starter) {
            $starter->features()->sync($freeStarterIds);
        }
        if ($pro) {
            $pro->features()->sync($proIds);
        }
        if ($business) {
            $business->features()->sync($allIds);
        }
    }
}
