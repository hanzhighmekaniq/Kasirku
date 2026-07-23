<?php

namespace Database\Seeders;

use Database\Seeders\DevSeeder\BranchSeeder;
use Database\Seeders\DevSeeder\FeatureDetailSeeder;
use Database\Seeders\DevSeeder\FeatureSeeder;
use Database\Seeders\DevSeeder\PaymentGatewaySeeder;
use Database\Seeders\DevSeeder\PaymentMethodSeeder;
use Database\Seeders\DevSeeder\PermissionSeeder;
use Database\Seeders\DevSeeder\PlanSeeder;
use Database\Seeders\DevSeeder\RoleSeeder;
use Database\Seeders\DevSeeder\StoreSeeder;
use Database\Seeders\DevSeeder\StoreTypeSeeder;
use Database\Seeders\DevSeeder\UserSeeder;
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
            StoreTypeSeeder::class,
            FeatureSeeder::class,
            FeatureDetailSeeder::class,
            PlanSeeder::class,
            PermissionSeeder::class,

            // ── Struktur ───────────────────────────────────────────
            StoreSeeder::class,
            BranchSeeder::class,
            UserSeeder::class,
            RoleSeeder::class,
            PaymentMethodSeeder::class,
            PaymentGatewaySeeder::class,
        ]);
    }
}
