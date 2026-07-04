<?php

namespace Database\Seeders;

use App\Models\CafeTable;
use App\Models\Expense;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeder khusus untuk demo multi-branch.
 *
 * Branch 1 (Pusat) sudah punya data dari Seeder lain.
 * Seeder ini menambah data untuk Branch 2 (UGM) supaya keliatan bedanya.
 *
 * Perbedaan yang dibuat:
 *  - Stok: beda jumlah (lebih dikit di UGM karena cabang kecil)
 *  - Penjualan: produk beda, harga beda (menu khusus UGM), jumlah transaksi lebih sedikit
 *  - Meja: sudah ada dari CafeTableSeeder (C1-C4 vs A1-O3)
 *  - Pengeluaran: kategori & nominal beda
 *  - Stock Movement: beda pola
 */
class BranchDemoSeeder extends Seeder
{
    public function run(): void
    {
        $storeId = 1; // Kopi Senja
        $branchId = 2; // Cabang UGM

        $owner1 = User::where("email", "owner1@gmail.com")->value("id");
        $kasir2 = User::where("email", "dewi@gmail.com")->value("id"); // Dewi - kasir Branch 2

        $this->seedStocks($storeId, $branchId);
        $this->seedSales($storeId, $branchId, $kasir2);
        $this->seedPurchases($storeId, $branchId, $owner1);
        $this->seedExpenses($storeId, $branchId, $owner1);
        $this->seedStockMovements($storeId, $branchId);
    }

    /**
     * Stok sekarang dikelola di tingkat store (bukan branch).
     * Lihat ProductStockSeeder untuk data stok.
     */
    private function seedStocks(int $storeId, int $branchId): void
    {
        // Tidak perlu lagi — stok dikelola di tingkat store
    }

    /**
     * Penjualan UGM — beda pola dari Pusat:
     *  - Lebih banyak takeaway (mahasiswa)
     *  - Menu favorit: Kopi Hitam & Teh Tarik (murah)
     *  - Jam ramai: siang 11-13 (jam istirahat kuliah)
     *  - 8 transaksi (vs 8 di Pusat) tapi total revenue lebih kecil
     */
    private function seedSales(
        int $storeId,
        int $branchId,
        int $kasirDewi,
    ): void {
        $sales = [
            // === Hari ini 21 Juni 2026 ===
            [
                "sale_no" => "SJ-20260621-011",
                "sale_date" => "2026-06-21 07:45:00",
                "user_id" => $kasirDewi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 3, "quantity" => 3, "price" => 18000], // 3 Kopi Hitam (favorit mahasiswa)
                ],
                "payment_method_id" => 2, // QRIS
                "paid_amount" => 54000,
            ],
            [
                "sale_no" => "SJ-20260621-012",
                "sale_date" => "2026-06-21 10:30:00",
                "user_id" => $kasirDewi,
                "customer_id" => null,
                "order_type" => "dine_in",
                "items" => [
                    ["product_id" => 5, "quantity" => 1, "price" => 22000], // Espresso
                    ["product_id" => 14, "quantity" => 1, "price" => 15000], // Pisang Goreng
                ],
                "payment_method_id" => 1, // Cash
                "paid_amount" => 37000,
            ],
            [
                "sale_no" => "SJ-20260621-013",
                "sale_date" => "2026-06-21 11:15:00",
                "user_id" => $kasirDewi,
                "customer_id" => 2, // Dedi
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 9, "quantity" => 2, "price" => 20000], // 2 Teh Tarik
                    ["product_id" => 12, "quantity" => 1, "price" => 22000], // Mie Goreng
                ],
                "payment_method_id" => 5, // GoPay
                "paid_amount" => 62000,
            ],
            [
                "sale_no" => "SJ-20260621-014",
                "sale_date" => "2026-06-21 12:00:00",
                "user_id" => $kasirDewi,
                "customer_id" => null,
                "order_type" => "dine_in",
                "items" => [
                    ["product_id" => 3, "quantity" => 1, "price" => 18000], // Kopi Hitam
                    ["product_id" => 11, "quantity" => 1, "price" => 28000], // Nasi Goreng
                ],
                "payment_method_id" => 1,
                "paid_amount" => 46000,
            ],

            // === Kemarin 20 Juni 2026 ===
            [
                "sale_no" => "SJ-20260620-011",
                "sale_date" => "2026-06-20 08:30:00",
                "user_id" => $kasirDewi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 4, "quantity" => 1, "price" => 28000], // Kopi Susu
                    ["product_id" => 14, "quantity" => 1, "price" => 15000], // Pisang Goreng
                ],
                "payment_method_id" => 2, // QRIS
                "paid_amount" => 43000,
            ],
            [
                "sale_no" => "SJ-20260620-012",
                "sale_date" => "2026-06-20 11:45:00",
                "user_id" => $kasirDewi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 3, "quantity" => 2, "price" => 18000], // 2 Kopi Hitam
                ],
                "payment_method_id" => 1,
                "paid_amount" => 36000,
            ],
            [
                "sale_no" => "SJ-20260620-013",
                "sale_date" => "2026-06-20 13:20:00",
                "user_id" => $kasirDewi,
                "customer_id" => 4, // Fajar
                "order_type" => "dine_in",
                "items" => [
                    ["product_id" => 9, "quantity" => 1, "price" => 20000], // Teh Tarik
                    ["product_id" => 13, "quantity" => 1, "price" => 38000], // Combo
                ],
                "payment_method_id" => 1,
                "paid_amount" => 58000,
            ],

            // === 19 Juni 2026 ===
            [
                "sale_no" => "SJ-20260619-011",
                "sale_date" => "2026-06-19 09:15:00",
                "user_id" => $kasirDewi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 3, "quantity" => 4, "price" => 18000], // 4 Kopi Hitam (group mahasiswa)
                ],
                "payment_method_id" => 2,
                "paid_amount" => 72000,
            ],
        ];

        foreach ($sales as $data) {
            $items = $data["items"];
            $paymentMethodId = $data["payment_method_id"];
            unset($data["items"]);
            unset($data["payment_method_id"]);

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item["price"] * $item["quantity"];
            }

            $data["subtotal"] = $subtotal;
            $data["discount_amount"] = 0;
            $data["tax_amount"] = 0;
            $data["shipping_amount"] = 0;
            $data["grand_total"] = $subtotal;
            $data["change_amount"] = $data["paid_amount"] - $subtotal;
            $data["status"] = "completed";
            $data["payment_status"] = "paid";
            $data["store_id"] = $storeId;
            $data["branch_id"] = $branchId;

            $sale = Sale::create($data);

            foreach ($items as $item) {
                SaleItem::create([
                    "sale_id" => $sale->id,
                    "product_id" => $item["product_id"],
                    "quantity" => $item["quantity"],
                    "price" => $item["price"],
                    "discount_amount" => 0,
                    "subtotal" => $item["price"] * $item["quantity"],
                ]);
            }

            SalePayment::create([
                "sale_id" => $sale->id,
                "payment_method_id" => $paymentMethodId,
                "paid_at" => $data["sale_date"],
                "amount" => $data["paid_amount"],
            ]);
        }
    }

    /**
     * Pembelian UGM — lebih jarang, volume lebih kecil.
     */
    private function seedPurchases(
        int $storeId,
        int $branchId,
        int $owner1,
    ): void {
        $purchases = [
            [
                "purchase_no" => "PO-20260618-011",
                "purchase_date" => "2026-06-18 09:00:00",
                "supplier_id" => 1,
                "user_id" => $owner1,
                "items" => [
                    [
                        "product_id" => 1,
                        "quantity" => 3,
                        "cost_price" => 120000,
                    ], // 3 kg Arabika (Pusat: 10kg)
                    ["product_id" => 2, "quantity" => 2, "cost_price" => 85000], // 2 kg Robusta (Pusat: 5kg)
                ],
                "paid_amount" => 530000,
                "payment_method_id" => 3, // BCA
            ],
            [
                "purchase_no" => "PO-20260614-012",
                "purchase_date" => "2026-06-14 10:00:00",
                "supplier_id" => 2,
                "user_id" => $owner1,
                "items" => [
                    ["product_id" => 3, "quantity" => 5, "cost_price" => 18000], // 5L Susu Fresh (Pusat: 20L)
                ],
                "paid_amount" => 90000,
                "payment_method_id" => 1,
            ],
            [
                "purchase_no" => "PO-20260610-013",
                "purchase_date" => "2026-06-10 14:00:00",
                "supplier_id" => 4,
                "user_id" => $owner1,
                "items" => [
                    ["product_id" => 5, "quantity" => 3, "cost_price" => 14000], // 3kg Gula (Pusat: 10kg)
                    ["product_id" => 11, "quantity" => 5, "cost_price" => 8000], // 5kg Nasi (Pusat: 20kg)
                ],
                "paid_amount" => 82000,
                "payment_method_id" => 1,
            ],
        ];

        foreach ($purchases as $data) {
            $items = $data["items"];
            $paymentMethodId = $data["payment_method_id"];
            unset($data["items"]);
            unset($data["payment_method_id"]);

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item["cost_price"] * $item["quantity"];
            }

            $data["subtotal"] = $subtotal;
            $data["discount_amount"] = 0;
            $data["tax_amount"] = 0;
            $data["shipping_amount"] = 0;
            $data["grand_total"] = $subtotal;
            $data["paid_amount"] = $data["paid_amount"];
            $data["status"] = "completed";
            $data["payment_status"] = "paid";
            $data["store_id"] = $storeId;
            $data["branch_id"] = $branchId;

            $purchase = Purchase::create($data);

            foreach ($items as $item) {
                PurchaseItem::create([
                    "purchase_id" => $purchase->id,
                    "product_id" => $item["product_id"],
                    "quantity" => $item["quantity"],
                    "cost_price" => $item["cost_price"],
                    "subtotal" => $item["cost_price"] * $item["quantity"],
                ]);
            }

            PurchasePayment::create([
                "purchase_id" => $purchase->id,
                "payment_method_id" => $paymentMethodId,
                "paid_at" => $data["purchase_date"],
                "amount" => $data["paid_amount"],
            ]);
        }
    }

    /**
     * Pengeluaran UGM — beda kategori & nominal dari Pusat.
     * UGM: sewa lebih murah (area kampus), listrik lebih kecil.
     */
    private function seedExpenses(
        int $storeId,
        int $branchId,
        int $owner1,
    ): void {
        $expenses = [
            [
                "expense_no" => "EXP-20260621-011",
                "expense_category_id" => 1, // Listrik & Air
                "user_id" => $owner1,
                "expense_date" => "2026-06-21 08:00:00",
                "amount" => 800000, // Lebih kecil dari Pusat
                "notes" => "Tagihan listrik bulan Juni - UGM",
            ],
            [
                "expense_no" => "EXP-20260619-012",
                "expense_category_id" => 3, // Gaji Karyawan
                "user_id" => $owner1,
                "expense_date" => "2026-06-19 10:00:00",
                "amount" => 2500000, // Gaji 1 karyawan (Pusat: 3.5jt)
                "notes" => "Gaji barista UGM - Juni",
            ],
            [
                "expense_no" => "EXP-20260616-013",
                "expense_category_id" => 6, // Marketing
                "user_id" => $owner1,
                "expense_date" => "2026-06-16 09:00:00",
                "amount" => 150000,
                "notes" => "Promo diskon mahasiswa awal semester",
            ],
            [
                "expense_no" => "EXP-20260612-014",
                "expense_category_id" => 2, // Sewa
                "user_id" => $owner1,
                "expense_date" => "2026-06-12 08:00:00",
                "amount" => 4000000, // Sewa lebih murah (area kampus)
                "notes" => "Sewa tempat bulan Juni - UGM",
            ],
        ];

        foreach ($expenses as $i => $data) {
            Expense::create(
                array_merge($data, [
                    "store_id" => $storeId,
                    "branch_id" => $branchId,
                ]),
            );
        }
    }

    /**
     * Stock movements UGM — mencatat semua pergerakan stok di cabang ini.
     */
    private function seedStockMovements(int $storeId, int $branchId): void
    {
        $movements = [
            // Pembelian masuk
            [
                "product_id" => 1,
                "movement_type" => "purchase_in",
                "quantity" => 3000, // 3kg Arabika masuk
                "unit_cost" => 120000,
                "reference_no" => "PO-20260618-011",
                "notes" => "Restock Biji Kopi Arabika - UGM",
                "moved_at" => "2026-06-18 09:30:00",
            ],
            [
                "product_id" => 3,
                "movement_type" => "purchase_in",
                "quantity" => 5000, // 5L Susu Fresh masuk
                "unit_cost" => 18000,
                "reference_no" => "PO-20260614-012",
                "notes" => "Restock Susu Fresh - UGM",
                "moved_at" => "2026-06-14 10:30:00",
            ],

            // Penjualan keluar
            [
                "product_id" => 3,
                "movement_type" => "sale_out",
                "quantity" => -3000, // 3 Kopi Hitam terjual (3 × 1000g)
                "unit_cost" => 120000,
                "reference_no" => "SJ-20260621-011",
                "notes" => "Penjualan Kopi Hitam x3 - UGM",
                "moved_at" => "2026-06-21 07:50:00",
            ],
            [
                "product_id" => 9,
                "movement_type" => "sale_out",
                "quantity" => -2000, // 2 Teh Tarik (2 × 1000ml)
                "unit_cost" => 5000,
                "reference_no" => "SJ-20260621-013",
                "notes" => "Penjualan Teh Tarik x2 - UGM",
                "moved_at" => "2026-06-21 11:20:00",
            ],

            // Adjustment (opname)
            [
                "product_id" => 5,
                "movement_type" => "adjustment_in",
                "quantity" => 200,
                "unit_cost" => 14000,
                "reference_no" => "ADJ-20260615-011",
                "notes" => "Koreksi stok Gula Pasir UGM +200g karena selisih",
                "moved_at" => "2026-06-15 16:00:00",
            ],
        ];

        foreach ($movements as $m) {
            StockMovement::create(
                array_merge($m, [
                    "store_id" => $storeId,
                    "branch_id" => $branchId,
                    "reference_type" => null,
                    "reference_id" => null,
                ]),
            );
        }
    }
}
