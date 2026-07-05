<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Urutan seed harus mengikuti dependency foreign key:
     *
     * 1.  StoreTypeSeeder       — tipe toko yang tersedia
     * 2.  PlanSeeder            — paket langganan
     * 3.  FeatureSeeder         — fitur per tipe toko
     * 4.  StoreSeeder           — 8 toko (1 per tipe)
     * 5.  BranchSeeder          — 2 cabang per toko = 16 branch
     * 6.  RolePermissionSeeder  — permissions global + roles per store (Spatie)
     * 7.  UserSeeder            — developer + 8 owner (owner bukan karyawan)
     * 8.  EmployeeSeeder        — 4 karyawan per toko (2 per branch), tiap karyawan punya akun user
     * 9.  PaymentMethodSeeder   — metode pembayaran per store
     * 10. ExpenseCategorySeeder — kategori pengeluaran
     * 11. FullDemoSeeder        — data demo bisnis (produk, penjualan, dll)
     */
    public function run(): void
    {
        $this->call([
            // ── Core: wajib ─────────────────────────────────────────
            StoreTypeSeeder::class,
            PlanSeeder::class,
            FeatureSeeder::class,
            StoreSeeder::class,
            BranchSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            EmployeeSeeder::class,     // karyawan per branch (bukan owner)
            PaymentMethodSeeder::class,
            ExpenseCategorySeeder::class,

            // ── Full relational demo data for 8 store types ───────────
            FullDemoSeeder::class,

            // ── Legacy demo data: bertahap per toko (uncomment sesuai kebutuhan) ──
            // EmployeeSeeder::class,    // perlu update untuk 8 store
            // CategorySeeder::class,    // perlu update untuk 8 store
            // SupplierSeeder::class,    // perlu update untuk 8 store
            // CustomerSeeder::class,    // perlu update untuk 8 store
            // CafeTableSeeder::class,   // perlu update
            // ProductSeeder::class,     // perlu update untuk 8 store
            // PromotionSeeder::class,   // perlu update untuk 8 store
            // ProductBatchSeeder::class,
            // ProductStockSeeder::class,
            // ProductRecipeSeeder::class,
            // ProductModifierSeeder::class,
            // CashierShiftSeeder::class,
            // SaleSeeder::class,
            // PurchaseSeeder::class,
            // ExpenseSeeder::class,
            // StockMovementSeeder::class,
            // WasteSeeder::class,
            // MembershipSeeder::class,
            // ServiceSaleSeeder::class,
            // BranchDemoSeeder::class,
            // DemoDataSeeder::class,
        ]);
    }
}
