<?php

namespace Database\Seeders;

use Database\Seeders\DatabaseSeeder\BranchSeeder;
use Database\Seeders\DatabaseSeeder\CafeTableSeeder;
use Database\Seeders\DatabaseSeeder\CashierShiftSeeder;
use Database\Seeders\DatabaseSeeder\CategorySeeder;
use Database\Seeders\DatabaseSeeder\CustomerSeeder;
use Database\Seeders\DatabaseSeeder\EmployeeSeeder;
use Database\Seeders\DatabaseSeeder\ExpenseCategorySeeder;
use Database\Seeders\DatabaseSeeder\ExpenseSeeder;
use Database\Seeders\DatabaseSeeder\FeatureDetailSeeder;
use Database\Seeders\DatabaseSeeder\FeatureSeeder;
use Database\Seeders\DatabaseSeeder\FnbCategorySeeder;
use Database\Seeders\DatabaseSeeder\FnbCustomerSeeder;
use Database\Seeders\DatabaseSeeder\FnbEmployeeSeeder;
use Database\Seeders\DatabaseSeeder\FnbExpenseCategorySeeder;
use Database\Seeders\DatabaseSeeder\FnbExpenseSeeder;
use Database\Seeders\DatabaseSeeder\FnbModifierSeeder;
use Database\Seeders\DatabaseSeeder\FnbOwnerSeeder;
use Database\Seeders\DatabaseSeeder\FnbProductSeeder;
use Database\Seeders\DatabaseSeeder\FnbProductStockSeeder;
use Database\Seeders\DatabaseSeeder\FnbPurchaseSeeder;
use Database\Seeders\DatabaseSeeder\FnbRecipeSeeder;
use Database\Seeders\DatabaseSeeder\FnbSaleSeeder;
use Database\Seeders\DatabaseSeeder\FnbSupplierSeeder;
use Database\Seeders\DatabaseSeeder\FnbUserSeeder;
use Database\Seeders\DatabaseSeeder\FnbWasteSeeder;
use Database\Seeders\DatabaseSeeder\PaymentMethodSeeder;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Database\Seeders\DatabaseSeeder\PlanSeeder;
use Database\Seeders\DatabaseSeeder\ProductSeeder;
use Database\Seeders\DatabaseSeeder\ProductStockSeeder;
use Database\Seeders\DatabaseSeeder\PurchaseSeeder;
use Database\Seeders\DatabaseSeeder\RoleSeeder;
use Database\Seeders\DatabaseSeeder\SaleSeeder;
use Database\Seeders\DatabaseSeeder\StockMovementSeeder;
use Database\Seeders\DatabaseSeeder\StoreSeeder;
use Database\Seeders\DatabaseSeeder\StoreTypeSeeder;
use Database\Seeders\DatabaseSeeder\SupplierSeeder;
use Database\Seeders\DatabaseSeeder\ThemePresetSeeder;
use Database\Seeders\DatabaseSeeder\UserSeeder;
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
            StoreTypeSeeder::class,
            FeatureSeeder::class,
            FeatureDetailSeeder::class,
            PlanSeeder::class,
            PermissionSeeder::class,
            ThemePresetSeeder::class,

            // ── Struktur ──────────────────────────────────────────
            StoreSeeder::class,
            BranchSeeder::class,
            UserSeeder::class,
            RoleSeeder::class,
            PaymentMethodSeeder::class,

            // ── Data Operasional Retail (STORE001) ─────────────────
            EmployeeSeeder::class,
            SupplierSeeder::class,
            CustomerSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            ProductStockSeeder::class,
            CashierShiftSeeder::class,
            PurchaseSeeder::class,
            SaleSeeder::class,
            ExpenseCategorySeeder::class,
            ExpenseSeeder::class,
            StockMovementSeeder::class,

            // ── Data Operasional FnB (STORE002) ────────────────────
            CafeTableSeeder::class,
            FnbOwnerSeeder::class,
            FnbUserSeeder::class,
            FnbEmployeeSeeder::class,
            FnbSupplierSeeder::class,
            FnbCustomerSeeder::class,
            FnbCategorySeeder::class,
            FnbProductSeeder::class,
            FnbModifierSeeder::class,
            FnbRecipeSeeder::class,
            FnbProductStockSeeder::class,
            FnbPurchaseSeeder::class,
            FnbSaleSeeder::class,
            FnbExpenseCategorySeeder::class,
            FnbExpenseSeeder::class,
            FnbWasteSeeder::class,
        ]);
    }
}
