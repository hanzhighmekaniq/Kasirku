<?php

namespace Database\Seeders\DevSeeder;

use App\Models\Plan;
use App\Models\PlanAddon;
use Illuminate\Database\Seeder;

/**
 * PlanAddonSeeder — seed katalog add-on per plan.
 *
 * Free & Starter tidak punya add-on.
 * Pro: tambah cabang + tambah user.
 * Business: tambah store + tambah cabang + tambah user (harga user lebih tinggi).
 *
 * PENTING: Harus dijalankan SETELAH PlanSeeder.
 */
class PlanAddonSeeder extends Seeder
{
    public function run(): void
    {
        $addons = [
            'pro' => [
                [
                    'code' => 'branch',
                    'label' => 'Tambah Cabang',
                    'price' => 19000,
                    'description' => 'Tambahkan 1 cabang aktif di luar batas paket Pro.',
                    'sort_order' => 1,
                ],
                [
                    'code' => 'user',
                    'label' => 'Tambah User',
                    'price' => 5000,
                    'description' => 'Tambahkan 1 akun pengguna di luar batas paket Pro.',
                    'sort_order' => 2,
                ],
            ],
            'business' => [
                [
                    'code' => 'store',
                    'label' => 'Tambah Store',
                    'price' => 39000,
                    'description' => 'Tambahkan 1 toko baru di luar batas paket Business.',
                    'sort_order' => 1,
                ],
                [
                    'code' => 'branch',
                    'label' => 'Tambah Cabang',
                    'price' => 19000,
                    'description' => 'Tambahkan 1 cabang aktif di luar batas paket Business.',
                    'sort_order' => 2,
                ],
                [
                    'code' => 'user',
                    'label' => 'Tambah User',
                    'price' => 9000,
                    'description' => 'Tambahkan 1 akun pengguna di luar batas paket Business.',
                    'sort_order' => 3,
                ],
            ],
        ];

        foreach ($addons as $planCode => $items) {
            $plan = Plan::where('code', $planCode)->first();

            if (! $plan) {
                continue;
            }

            foreach ($items as $item) {
                PlanAddon::updateOrCreate(
                    [
                        'plan_id' => $plan->id,
                        'code' => $item['code'],
                    ],
                    [
                        'label' => $item['label'],
                        'price' => $item['price'],
                        'description' => $item['description'],
                        'sort_order' => $item['sort_order'],
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
