<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        // Store STORE002 = Warung Kopi Senja (cafe), Branch BR2A = Malioboro
        // product_ids: 3=kopi hitam(18k), 4=kopi susu(28k), 5=espresso(22k),
        //   6=cappuccino(30k), 7=latte(32k), 8=matcha(30k), 9=teh tarik(20k),
        //   10=jus jeruk(22k), 11=nasi goreng(28k), 12=mie goreng(22k),
        //   13=roti bakar(18k), 14=pisang goreng(15k), 15=combo(38k)
        // payment_methods: 1=CASH, 2=QRIS, 3=BCA, 5=GoPay
        $storeId = Store::where("code", "STORE002")->value("id");
        $branchId = Branch::where("code", "BR2A")->value("id");

        // User lookups by email (Kopi Senja employees)
        $andi = User::where("email", "kasir.s2a@gmail.com")->value("id");
        $dewi = User::where("email", "barista.s2a@gmail.com")->value("id");

        $sales = [
            // === Hari ini 21 Juni 2026 ===
            [
                "sale_no" => "SJ-20260621-001",
                "sale_date" => "2026-06-21 08:15:00",
                "user_id" => $andi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 4, "quantity" => 2, "price" => 28000], // 2 Kopi Susu
                    ["product_id" => 13, "quantity" => 1, "price" => 38000], // 1 Combo
                ],
                "payment_method_id" => 2, // QRIS
                "paid_amount" => 94000,
            ],
            [
                "sale_no" => "SJ-20260621-002",
                "sale_date" => "2026-06-21 09:30:00",
                "user_id" => $dewi,
                "customer_id" => 1, // Rina
                "order_type" => "dine_in",
                "items" => [
                    ["product_id" => 6, "quantity" => 2, "price" => 30000], // 2 Cappuccino
                    ["product_id" => 11, "quantity" => 1, "price" => 28000], // 1 Nasi Goreng
                ],
                "payment_method_id" => 1, // Cash
                "paid_amount" => 100000,
            ],
            [
                "sale_no" => "SJ-20260621-003",
                "sale_date" => "2026-06-21 10:05:00",
                "user_id" => $andi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 3, "quantity" => 1, "price" => 18000], // Kopi Hitam
                    ["product_id" => 14, "quantity" => 2, "price" => 15000], // 2 Pisang Goreng
                ],
                "payment_method_id" => 5, // GoPay
                "paid_amount" => 48000,
            ],
            [
                "sale_no" => "SJ-20260621-004",
                "sale_date" => "2026-06-21 11:45:00",
                "user_id" => $andi,
                "customer_id" => 2, // Dedi
                "order_type" => "dine_in",
                "items" => [
                    ["product_id" => 8, "quantity" => 1, "price" => 30000], // Matcha
                    ["product_id" => 7, "quantity" => 1, "price" => 32000], // Latte
                ],
                "payment_method_id" => 1,
                "paid_amount" => 70000,
            ],
            [
                "sale_no" => "SJ-20260621-005",
                "sale_date" => "2026-06-21 13:20:00",
                "user_id" => $andi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 4, "quantity" => 3, "price" => 28000], // 3 Kopi Susu
                    ["product_id" => 9, "quantity" => 1, "price" => 20000], // Teh Tarik
                ],
                "payment_method_id" => 2,
                "paid_amount" => 104000,
            ],
            // === Kemarin 20 Juni 2026 ===
            [
                "sale_no" => "SJ-20260620-001",
                "sale_date" => "2026-06-20 08:00:00",
                "user_id" => $andi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 5, "quantity" => 2, "price" => 22000], // 2 Espresso
                ],
                "payment_method_id" => 1,
                "paid_amount" => 44000,
            ],
            [
                "sale_no" => "SJ-20260620-002",
                "sale_date" => "2026-06-20 10:30:00",
                "user_id" => $andi,
                "customer_id" => 3, // Maya
                "order_type" => "dine_in",
                "items" => [
                    ["product_id" => 4, "quantity" => 1, "price" => 28000],
                    ["product_id" => 12, "quantity" => 1, "price" => 22000],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 50000,
            ],
            [
                "sale_no" => "SJ-20260620-003",
                "sale_date" => "2026-06-20 14:15:00",
                "user_id" => $andi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 6, "quantity" => 2, "price" => 30000],
                    ["product_id" => 10, "quantity" => 1, "price" => 22000],
                ],
                "payment_method_id" => 3, // BCA
                "paid_amount" => 82000,
            ],
            [
                "sale_no" => "SJ-20260620-004",
                "sale_date" => "2026-06-20 16:00:00",
                "user_id" => $dewi,
                "customer_id" => null,
                "order_type" => "dine_in",
                "items" => [
                    ["product_id" => 7, "quantity" => 1, "price" => 32000],
                    ["product_id" => 13, "quantity" => 1, "price" => 38000],
                ],
                "payment_method_id" => 2,
                "paid_amount" => 70000,
            ],
            // === 19 Juni 2026 ===
            [
                "sale_no" => "SJ-20260619-001",
                "sale_date" => "2026-06-19 09:00:00",
                "user_id" => $andi,
                "customer_id" => 4, // Fajar
                "order_type" => "dine_in",
                "items" => [
                    ["product_id" => 4, "quantity" => 2, "price" => 28000],
                    ["product_id" => 11, "quantity" => 1, "price" => 28000],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 100000,
            ],
            [
                "sale_no" => "SJ-20260619-002",
                "sale_date" => "2026-06-19 12:00:00",
                "user_id" => $dewi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 9, "quantity" => 2, "price" => 20000],
                    ["product_id" => 14, "quantity" => 1, "price" => 15000],
                ],
                "payment_method_id" => 5,
                "paid_amount" => 55000,
            ],
            [
                "sale_no" => "SJ-20260619-003",
                "sale_date" => "2026-06-19 15:30:00",
                "user_id" => $andi,
                "customer_id" => null,
                "order_type" => "takeaway",
                "items" => [
                    ["product_id" => 8, "quantity" => 3, "price" => 30000],
                    ["product_id" => 3, "quantity" => 1, "price" => 18000],
                ],
                "payment_method_id" => 1,
                "paid_amount" => 115000,
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
            $data["pos_mode"] = "fnb";
            $data["status"] = "completed";
            $data["payment_status"] = "paid";
            $data["store_id"] = $storeId;
            $data["branch_id"] = $branchId;

            $sale = Sale::create($data);

            foreach ($items as $item) {
                $itemSubtotal = $item["price"] * $item["quantity"];
                SaleItem::create([
                    "sale_id" => $sale->id,
                    "product_id" => $item["product_id"],
                    "quantity" => $item["quantity"],
                    "price" => $item["price"],
                    "discount_amount" => 0,
                    "subtotal" => $itemSubtotal,
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
}
