<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Expense;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo Data Lengkap — Verifikasi Filter Branch
 * ══════════════════════════════════════════════════════════
 *
 * Tujuan:
 *   2 owner login, masing-masing punya 1 toko dan 2 branch.
 *   Data di setiap branch sengaja dibuat BERBEDA agar filter
 *   branch di Dashboard & Laporan menunjukkan perubahan.
 *
 * Owner:
 *   owner1@gmail.com  → Store 1 (Kopi Senja)   → Branch 1 + 2
 *   owner2@gmail.com → Store 2 (Minimarket)   → Branch 3 + 4
 *
 * Perbedaan data per branch:
 *   Store 1, Branch 1 (Pusat):  ~Rp 889k — 12 transaksi (ramai)
 *   Store 1, Branch 2 (UGM):    ~Rp 452k — 8 transaksi (sedang)
 *   Store 2, Branch 3 (Pusat):  ~Rp 923k — 10 transaksi (ramai)
 *   Store 2, Branch 4 (Babarsari): ~Rp 255k — 6 transaksi (sepi)
 *
 * Password semua: password
 * ══════════════════════════════════════════════════════════
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $store1 = Store::where("code", "STORE001")->firstOrFail();
        $store2 = Store::where("code", "STORE002")->firstOrFail();
        $branch1 = Branch::where("store_id", $store1->id)
            ->where("code", "BR001")
            ->firstOrFail();
        $branch2 = Branch::where("store_id", $store1->id)
            ->where("code", "BR002")
            ->firstOrFail();
        $branch3 = Branch::where("store_id", $store2->id)
            ->where("code", "BR003")
            ->firstOrFail();
        $branch4 = Branch::where("store_id", $store2->id)
            ->where("code", "BR004")
            ->firstOrFail();

        $this->seedMinimarketPusatSales($store2->id, $branch3->id);
        $this->seedMinimarketBabarsariSales($store2->id, $branch4->id);
        $this->seedBabarsariExpenses($store2->id, $branch4->id);
    }

    // ═══════════════════════════════════════════════════════
    //  STORE 2 — MINIMARKET SEJAHTERA
    // ═══════════════════════════════════════════════════════

    /**
     * Branch 3 (Pusat) — 10 transaksi, ramai
     * Produk minimarket ID 26-33:
     *   26=Indomie(3500), 27=Teh Botol(5000), 28=Aqua(4000),
     *   29=Beras 5kg(65000), 30=Minyak 1L(18000), 31=Gula 1kg(15000),
     *   32=Susu Kental(11000), 33=Kopi Torabika(3000)
     */
    private function seedMinimarketPusatSales(int $storeId, int $branchId): void
    {
        $userId = User::where("email", "rizki@gmail.com")->value("id") ?? 1;

        $sales = [
            // === 21 Juni 2026 ===
            [
                "sale_no" => "SJ-20260621-021",
                "sale_date" => "2026-06-21 07:30:00",
                "user_id" => $userId,
                "customer_id" => 4, // Fajar
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 26, "quantity" => 5, "price" => 3500],
                    ["product_id" => 32, "quantity" => 1, "price" => 11000],
                ],
                "payment_method_id" => 1, // Cash
                "paid_amount" => 28500,
            ],
            [
                "sale_no" => "SJ-20260621-022",
                "sale_date" => "2026-06-21 09:15:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 29, "quantity" => 1, "price" => 65000],
                    ["product_id" => 30, "quantity" => 2, "price" => 18000],
                ],
                "payment_method_id" => 2, // QRIS
                "paid_amount" => 101000,
            ],
            [
                "sale_no" => "SJ-20260621-023",
                "sale_date" => "2026-06-21 10:00:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 31, "quantity" => 2, "price" => 15000],
                    ["product_id" => 32, "quantity" => 3, "price" => 11000],
                    ["product_id" => 33, "quantity" => 5, "price" => 3000],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 78000,
            ],
            [
                "sale_no" => "SJ-20260621-024",
                "sale_date" => "2026-06-21 11:30:00",
                "user_id" => $userId,
                "customer_id" => 5, // Ayu
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 27, "quantity" => 10, "price" => 5000],
                    ["product_id" => 26, "quantity" => 5, "price" => 3500],
                ],
                "payment_method_id" => 5, // GoPay
                "paid_amount" => 67500,
            ],
            [
                "sale_no" => "SJ-20260621-025",
                "sale_date" => "2026-06-21 14:00:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 28, "quantity" => 12, "price" => 4000],
                    ["product_id" => 33, "quantity" => 10, "price" => 3000],
                ],
                "payment_method_id" => 2,
                "paid_amount" => 78000,
            ],

            // === 20 Juni 2026 ===
            [
                "sale_no" => "SJ-20260620-021",
                "sale_date" => "2026-06-20 08:00:00",
                "user_id" => $userId,
                "customer_id" => 6, // Hendra
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 29, "quantity" => 2, "price" => 65000],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 130000,
            ],
            [
                "sale_no" => "SJ-20260620-022",
                "sale_date" => "2026-06-20 10:30:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 30, "quantity" => 3, "price" => 18000],
                    ["product_id" => 31, "quantity" => 2, "price" => 15000],
                ],
                "payment_method_id" => 3, // BCA
                "paid_amount" => 84000,
            ],
            [
                "sale_no" => "SJ-20260620-023",
                "sale_date" => "2026-06-20 15:00:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 26, "quantity" => 10, "price" => 3500],
                    ["product_id" => 27, "quantity" => 6, "price" => 5000],
                    ["product_id" => 28, "quantity" => 6, "price" => 4000],
                ],
                "payment_method_id" => 2,
                "paid_amount" => 89000,
            ],

            // === 19 Juni 2026 ===
            [
                "sale_no" => "SJ-20260619-021",
                "sale_date" => "2026-06-19 09:00:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 32, "quantity" => 5, "price" => 11000],
                    ["product_id" => 33, "quantity" => 12, "price" => 3000],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 91000,
            ],
            [
                "sale_no" => "SJ-20260619-022",
                "sale_date" => "2026-06-19 13:00:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 29, "quantity" => 1, "price" => 65000],
                    ["product_id" => 30, "quantity" => 2, "price" => 18000],
                    ["product_id" => 31, "quantity" => 3, "price" => 15000],
                    ["product_id" => 27, "quantity" => 4, "price" => 5000],
                ],
                "payment_method_id" => 5,
                "paid_amount" => 166000,
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
     * Branch 4 (Babarsari) — 6 transaksi, lebih sepi
     * Produk yang sama, volume lebih kecil
     */
    private function seedMinimarketBabarsariSales(
        int $storeId,
        int $branchId,
    ): void {
        $userId = User::where("email", "sari@gmail.com")->value("id") ?? 1;
        $ownerId = User::where("email", "owner2@gmail.com")->value("id") ?? 1;

        $sales = [
            [
                "sale_no" => "SJ-20260621-031",
                "sale_date" => "2026-06-21 08:00:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 33, "quantity" => 3, "price" => 3000],
                    ["product_id" => 26, "quantity" => 2, "price" => 3500],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 16000,
            ],
            [
                "sale_no" => "SJ-20260621-032",
                "sale_date" => "2026-06-21 10:00:00",
                "user_id" => $ownerId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 28, "quantity" => 5, "price" => 4000],
                    ["product_id" => 27, "quantity" => 3, "price" => 5000],
                ],
                "payment_method_id" => 2,
                "paid_amount" => 35000,
            ],
            [
                "sale_no" => "SJ-20260621-033",
                "sale_date" => "2026-06-21 12:30:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 31, "quantity" => 1, "price" => 15000],
                    ["product_id" => 30, "quantity" => 1, "price" => 18000],
                    ["product_id" => 32, "quantity" => 2, "price" => 11000],
                ],
                "payment_method_id" => 5,
                "paid_amount" => 55000,
            ],
            [
                "sale_no" => "SJ-20260620-031",
                "sale_date" => "2026-06-20 09:00:00",
                "user_id" => $userId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 26, "quantity" => 5, "price" => 3500],
                    ["product_id" => 33, "quantity" => 5, "price" => 3000],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 32500,
            ],
            [
                "sale_no" => "SJ-20260620-032",
                "sale_date" => "2026-06-20 14:00:00",
                "user_id" => $ownerId,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 28, "quantity" => 3, "price" => 4000],
                    ["product_id" => 27, "quantity" => 2, "price" => 5000],
                ],
                "payment_method_id" => 2,
                "paid_amount" => 22000,
            ],
            [
                "sale_no" => "SJ-20260619-031",
                "sale_date" => "2026-06-19 11:00:00",
                "user_id" => $ownerId,
                "customer_id" => 6, // Hendra
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 29, "quantity" => 1, "price" => 65000],
                    ["product_id" => 31, "quantity" => 2, "price" => 15000],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 95000,
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
     * Tambahan pengeluaran untuk Branch 4 (Babarsari)
     * — lebih kecil dari Pusat karena cabang lebih kecil
     */
    private function seedBabarsariExpenses(int $storeId, int $branchId): void
    {
        $owner2 = User::where("email", "owner2@gmail.com")->value("id");

        $expenses = [
            [
                "expense_no" => "EXP-20260621-021",
                "expense_category_id" => 1, // Listrik & Air
                "user_id" => $owner2,
                "expense_date" => "2026-06-21 09:00:00",
                "amount" => 450000,
                "notes" => "Tagihan listrik bulan Juni - Babarsari",
            ],
            [
                "expense_no" => "EXP-20260615-022",
                "expense_category_id" => 5, // Perlengkapan
                "user_id" => $owner2,
                "expense_date" => "2026-06-15 10:00:00",
                "amount" => 85000,
                "notes" => "Pembelian rak display baru - Babarsari",
            ],
            [
                "expense_no" => "EXP-20260619-023",
                "expense_category_id" => 4, // Perawatan
                "user_id" => $owner2,
                "expense_date" => "2026-06-19 14:00:00",
                "amount" => 200000,
                "notes" => "Servis freezer - Babarsari",
            ],
        ];

        foreach ($expenses as $data) {
            Expense::create(
                array_merge($data, [
                    "store_id" => $storeId,
                    "branch_id" => $branchId,
                ]),
            );
        }
    }
}
