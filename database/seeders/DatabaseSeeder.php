<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Urutan seed harus mengikuti dependency foreign key:
     *
     * 1.  RolePermissionSeeder  — roles & permissions (Spatie)
     * 2.  StoreSeeder           — master toko (6 store, 6 tipe kasir)
     * 3.  BranchSeeder          — cabang per toko
     * 4.  UserSeeder            — user + assign roles Spatie + pivot user_store
     * 5.  EmployeeSeeder        — karyawan (FK: store, branch, user)
     * 6.  CategorySeeder        — kategori produk per store
     * 7.  SupplierSeeder        — supplier per store
     * 8.  CustomerSeeder        — pelanggan per store
     * 9.  PaymentMethodSeeder   — metode pembayaran
     * 10. CafeTableSeeder       — meja cafe (store FnB saja)
     * 11. ExpenseCategorySeeder — kategori pengeluaran
     * 12. ProductModifierSeeder — modifier group + modifier item (FnB)
     * 13. ProductSeeder         — semua produk (bahan baku, jadi, jasa, rental)
     * 14. ProductBatchSeeder    — batch / expired (retail saja)
     * 15. ProductStockSeeder    — stok awal per store/branch
     * 16. ProductRecipeSeeder   — resep bahan baku (FnB)
     * 17. PromotionSeeder       — promo aktif & expired
     * 18. CashierShiftSeeder    — shift kasir demo
     * 19. SaleSeeder            — transaksi FnB + retail (store 1 & 2)
     * 20. PurchaseSeeder        — pembelian stok
     * 21. ExpenseSeeder         — pengeluaran operasional
     * 22. StockMovementSeeder   — pergerakan stok manual
     * 23. WasteSeeder           — pemborosan / barang rusak
     * 24. BranchDemoSeeder      — data demo branch 2 (UGM)
     * 25. DemoDataSeeder        — data demo store 2 multi-branch
     * 26. MembershipSeeder      — paket membership + assign ke customer
     * 27. ServiceSaleSeeder     — transaksi service (barber) + rental
     *                             + antrian + komisi karyawan
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
            PaymentMethodSeeder::class,
            ExpenseCategorySeeder::class,

            // ── Demo data: bertahap per toko (uncomment sesuai kebutuhan) ──
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
