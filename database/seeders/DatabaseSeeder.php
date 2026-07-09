<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * DatabaseSeeder — Full Demo
 *
 * Dijalankan dengan: php artisan migrate:fresh --seed
 *
 * Mengisi SEMUA data: sistem + data operasional lengkap (produk, transaksi, dll).
 * Cocok untuk demo / simulasi real.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // ── Sistem ─────────────────────────────────────────────
            \Database\Seeders\DatabaseSeeder\StoreTypeSeeder::class,
            \Database\Seeders\DatabaseSeeder\FeatureSeeder::class,
            \Database\Seeders\DatabaseSeeder\FeatureDetailSeeder::class,
            \Database\Seeders\DatabaseSeeder\PlanSeeder::class,
            \Database\Seeders\DatabaseSeeder\PermissionSeeder::class,

            // ── Struktur ───────────────────────────────────────────
            \Database\Seeders\DatabaseSeeder\StoreSeeder::class,
            \Database\Seeders\DatabaseSeeder\BranchSeeder::class,
            \Database\Seeders\DatabaseSeeder\UserSeeder::class,
            \Database\Seeders\DatabaseSeeder\RoleSeeder::class,
            \Database\Seeders\DatabaseSeeder\PaymentMethodSeeder::class,

            // ── Data Operasional ───────────────────────────────────
            \Database\Seeders\DatabaseSeeder\EmployeeSeeder::class,
            \Database\Seeders\DatabaseSeeder\SupplierSeeder::class,
            \Database\Seeders\DatabaseSeeder\CustomerSeeder::class,
            \Database\Seeders\DatabaseSeeder\ProductSeeder::class,
            \Database\Seeders\DatabaseSeeder\CafeTableSeeder::class,
            \Database\Seeders\DatabaseSeeder\CashierShiftSeeder::class,
            \Database\Seeders\DatabaseSeeder\SaleSeeder::class,
            \Database\Seeders\DatabaseSeeder\PurchaseSeeder::class,
            \Database\Seeders\DatabaseSeeder\ExpenseCategorySeeder::class,
            \Database\Seeders\DatabaseSeeder\ExpenseSeeder::class,
            \Database\Seeders\DatabaseSeeder\StockMovementSeeder::class,
        ]);
    }
}
