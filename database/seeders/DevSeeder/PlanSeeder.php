<?php

namespace Database\Seeders\DevSeeder;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * PlanSeeder — buat plan dan attach SEMUA fitur ke SEMUA plan (unlimited).
 *
 * PENTING: Harus dijalankan SETELAH FeatureSeeder agar feature codes sudah ada.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        // ── Buat plan ─────────────────────────────────────────────────
        Plan::updateOrCreate(
            ['code' => 'free'],
            [
                'label' => 'Free',
                'description' => 'Paket gratis untuk pemula. Semua fitur dasar.',
                'max_users' => 1,
                'max_branches' => 1,
                'price' => 0,
                'trial_days' => 0,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        Plan::updateOrCreate(
            ['code' => 'basic'],
            [
                'label' => 'Basic',
                'description' => 'Paket standar untuk bisnis berkembang.',
                'max_users' => 5,
                'max_branches' => 3,
                'price' => 199000,
                'trial_days' => 14,
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        Plan::updateOrCreate(
            ['code' => 'pro'],
            [
                'label' => 'Pro',
                'description' => 'Paket premium tanpa batasan. Semua fitur unlocked.',
                'max_users' => 999,
                'max_branches' => 999,
                'price' => 499000,
                'trial_days' => 7,
                'sort_order' => 3,
                'is_active' => true,
            ],
        );

        Plan::updateOrCreate(
            ['code' => 'unlimited'],
            [
                'label' => 'Unlimited',
                'description' => 'Paket tanpa batas. Semua fitur + prioritas support.',
                'max_users' => 999,
                'max_branches' => 999,
                'price' => 999000,
                'trial_days' => 0,
                'sort_order' => 4,
                'is_active' => true,
            ],
        );

        // ── Attach SEMUA fitur ke SEMUA plan (unlimited) ──────────────
        $allFeatureIds = Feature::pluck('id');

        Plan::all()->each(function ($plan) use ($allFeatureIds) {
            $plan->features()->sync($allFeatureIds);
        });
    }
}
