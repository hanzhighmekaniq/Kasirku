<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * DevSeeder — Development / Testing
 *
 * Dijalankan dengan: php artisan migrate:fresh --seed --seeder=DevSeeder
 *
 * Mengisi HANYA data sistem: fitur, plan, toko, branch, user, permission.
 * TANPA data operasional (produk, transaksi, pembelian, dll).
 * Cocok untuk testing fitur satu per satu.
 */
class DevSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // ── Sistem ─────────────────────────────────────────────
            \Database\Seeders\DevSeeder\StoreTypeSeeder::class,
            \Database\Seeders\DevSeeder\FeatureSeeder::class,
            \Database\Seeders\DevSeeder\FeatureDetailSeeder::class,
            \Database\Seeders\DevSeeder\PlanSeeder::class,
            \Database\Seeders\DevSeeder\PermissionSeeder::class,

            // ── Struktur ───────────────────────────────────────────
            \Database\Seeders\DevSeeder\StoreSeeder::class,
            \Database\Seeders\DevSeeder\BranchSeeder::class,
            \Database\Seeders\DevSeeder\UserSeeder::class,
            \Database\Seeders\DevSeeder\RoleSeeder::class,
            \Database\Seeders\DevSeeder\PaymentMethodSeeder::class,
        ]);
    }
}
