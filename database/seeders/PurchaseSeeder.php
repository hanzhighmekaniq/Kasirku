<?php

namespace Database\Seeders;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\User;
use Illuminate\Database\Seeder;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        // User lookups by email
        $owner1 = User::where("email", "owner1@gmail.com")->value("id");
        $owner2 = User::where("email", "owner2@gmail.com")->value("id");

        $purchases = [
            // ═══ Store 1 — Kopi Senja, Bahan Baku Cafe ═══════════════════
            // Branch 1 (Pusat)
            [
                "purchase_no" => "PO-20260615-001",
                "purchase_date" => "2026-06-15 09:00:00",
                "store_id" => 1,
                "branch_id" => 1,
                "supplier_id" => 1,
                "user_id" => $owner1,
                "items" => [
                    [
                        "product_id" => 1,
                        "quantity" => 10,
                        "cost_price" => 120000,
                    ], // 10 kg Arabika
                    ["product_id" => 2, "quantity" => 5, "cost_price" => 85000], // 5 kg Robusta
                ],
                "paid_amount" => 1625000,
                "payment_method_id" => 3, // BCA
            ],
            [
                "purchase_no" => "PO-20260612-002",
                "purchase_date" => "2026-06-12 10:30:00",
                "store_id" => 1,
                "branch_id" => 1,
                "supplier_id" => 2,
                "user_id" => $owner1,
                "items" => [
                    [
                        "product_id" => 3,
                        "quantity" => 20,
                        "cost_price" => 18000,
                    ], // 20L Susu Fresh
                    [
                        "product_id" => 4,
                        "quantity" => 10,
                        "cost_price" => 22000,
                    ], // 10L Susu Evap
                ],
                "paid_amount" => 580000,
                "payment_method_id" => 1, // Cash
            ],
            [
                "purchase_no" => "PO-20260610-003",
                "purchase_date" => "2026-06-10 08:00:00",
                "store_id" => 1,
                "branch_id" => 1,
                "supplier_id" => 4,
                "user_id" => $owner1,
                "items" => [
                    [
                        "product_id" => 5,
                        "quantity" => 10,
                        "cost_price" => 14000,
                    ], // 10kg Gula
                    ["product_id" => 9, "quantity" => 30, "cost_price" => 2200], // 30kg Telur
                    [
                        "product_id" => 11,
                        "quantity" => 20,
                        "cost_price" => 8000,
                    ], // 20kg Nasi
                ],
                "paid_amount" => 346000,
                "payment_method_id" => 1,
            ],

            // ═══ Store 2 — Minimarket Sejahtera ════════════════════════════
            // Branch 3 (Pusat) — stok minimarket
            [
                "purchase_no" => "PO-20260608-004",
                "purchase_date" => "2026-06-08 14:00:00",
                "store_id" => 2,
                "branch_id" => 3,
                "supplier_id" => 5,
                "user_id" => $owner2,
                "items" => [
                    [
                        "product_id" => 25,
                        "quantity" => 100,
                        "cost_price" => 2500,
                    ], // 100 Indomie
                    [
                        "product_id" => 26,
                        "quantity" => 48,
                        "cost_price" => 3500,
                    ], // 48 Teh Botol
                    [
                        "product_id" => 27,
                        "quantity" => 60,
                        "cost_price" => 3000,
                    ], // 60 Aqua
                    [
                        "product_id" => 32,
                        "quantity" => 60,
                        "cost_price" => 2000,
                    ], // 60 Kopi Torabika
                ],
                "paid_amount" => 756000,
                "payment_method_id" => 3,
            ],
            [
                "purchase_no" => "PO-20260605-005",
                "purchase_date" => "2026-06-05 11:00:00",
                "store_id" => 2,
                "branch_id" => 3,
                "supplier_id" => 4,
                "user_id" => $owner2,
                "items" => [
                    [
                        "product_id" => 28,
                        "quantity" => 15,
                        "cost_price" => 55000,
                    ], // 15 Beras 5kg
                    [
                        "product_id" => 29,
                        "quantity" => 20,
                        "cost_price" => 14000,
                    ], // 20 Minyak 1L
                    [
                        "product_id" => 30,
                        "quantity" => 25,
                        "cost_price" => 12000,
                    ], // 25 Gula 1kg
                    [
                        "product_id" => 31,
                        "quantity" => 24,
                        "cost_price" => 8000,
                    ], // 24 Susu Kental
                ],
                "paid_amount" => 1573000,
                "payment_method_id" => 3,
            ],

            // Branch 4 (Babarsari) — pembelian kecil
            [
                "purchase_no" => "PO-20260618-006",
                "purchase_date" => "2026-06-18 09:00:00",
                "store_id" => 2,
                "branch_id" => 4,
                "supplier_id" => 5,
                "user_id" => $owner2,
                "items" => [
                    [
                        "product_id" => 25,
                        "quantity" => 30,
                        "cost_price" => 2500,
                    ], // 30 Indomie
                    [
                        "product_id" => 27,
                        "quantity" => 24,
                        "cost_price" => 3000,
                    ], // 24 Aqua
                ],
                "paid_amount" => 147000,
                "payment_method_id" => 1,
            ],
        ];

        foreach ($purchases as $data) {
            $items = $data["items"];
            $paymentMethodId = $data["payment_method_id"] ?? 1;
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
            $data["status"] = "received";
            $data["payment_status"] = "paid";

            $purchase = Purchase::create($data);

            foreach ($items as $item) {
                $itemSubtotal = $item["cost_price"] * $item["quantity"];
                PurchaseItem::create([
                    "purchase_id" => $purchase->id,
                    "product_id" => $item["product_id"],
                    "quantity" => $item["quantity"],
                    "cost_price" => $item["cost_price"],
                    "subtotal" => $itemSubtotal,
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
}
