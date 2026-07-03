<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;

class FeatureSeeder extends Seeder
{
    public function run(): void
    {
        $features = [
            [
                "code" => "basic_pos",
                "label" => "POS / Kasir",
                "category" => "pos",
                "sort_order" => 1,
                "applicable_types" => [
                    "retail",
                    "fnb",
                    "service",
                    "rental",
                    "ticket",
                    "hospitality",
                ],
            ],
            [
                "code" => "stock",
                "label" => "Manajemen Stok",
                "category" => "inventory",
                "sort_order" => 2,
                "applicable_types" => ["retail", "fnb", "rental"],
            ],
            [
                "code" => "purchase",
                "label" => "Pembelian",
                "category" => "inventory",
                "sort_order" => 3,
                "applicable_types" => ["retail", "fnb", "rental"],
            ],
            [
                "code" => "batch",
                "label" => "Batch & Expired",
                "category" => "inventory",
                "sort_order" => 4,
                "applicable_types" => ["retail", "fnb"],
            ],
            [
                "code" => "expiry",
                "label" => "Kadaluarsa",
                "category" => "inventory",
                "sort_order" => 5,
                "applicable_types" => ["retail", "fnb"],
            ],
            [
                "code" => "promo",
                "label" => "Promosi",
                "category" => "pos",
                "sort_order" => 6,
                "applicable_types" => ["retail", "fnb", "service", "ticket"],
            ],
            [
                "code" => "sale_return",
                "label" => "Retur Penjualan",
                "category" => "pos",
                "sort_order" => 7,
                "applicable_types" => ["retail", "fnb"],
            ],
            [
                "code" => "recipe",
                "label" => "Resep Produk",
                "category" => "inventory",
                "sort_order" => 8,
                "applicable_types" => ["fnb"],
            ],
            [
                "code" => "modifier",
                "label" => "Modifier",
                "category" => "inventory",
                "sort_order" => 9,
                "applicable_types" => ["fnb"],
            ],
            [
                "code" => "table",
                "label" => "Meja Cafe",
                "category" => "pos",
                "sort_order" => 10,
                "applicable_types" => ["fnb", "hospitality"],
            ],
            [
                "code" => "kitchen",
                "label" => "Kitchen Display",
                "category" => "pos",
                "sort_order" => 11,
                "applicable_types" => ["fnb"],
            ],
            [
                "code" => "waste",
                "label" => "Waste",
                "category" => "inventory",
                "sort_order" => 12,
                "applicable_types" => ["fnb"],
            ],
            [
                "code" => "queue",
                "label" => "Antrian",
                "category" => "crm",
                "sort_order" => 13,
                "applicable_types" => ["service"],
            ],
            [
                "code" => "booking",
                "label" => "Booking",
                "category" => "crm",
                "sort_order" => 14,
                "applicable_types" => [
                    "fnb",
                    "service",
                    "rental",
                    "ticket",
                    "hospitality",
                ],
            ],
            [
                "code" => "commission",
                "label" => "Komisi",
                "category" => "crm",
                "sort_order" => 15,
                "applicable_types" => ["service"],
            ],
            [
                "code" => "membership",
                "label" => "Membership",
                "category" => "crm",
                "sort_order" => 16,
                "applicable_types" => ["service", "hospitality"],
            ],
            [
                "code" => "deposit",
                "label" => "Deposit",
                "category" => "finance",
                "sort_order" => 17,
                "applicable_types" => ["service", "rental", "hospitality"],
            ],
            [
                "code" => "report",
                "label" => "Laporan",
                "category" => "finance",
                "sort_order" => 18,
                "applicable_types" => [
                    "retail",
                    "fnb",
                    "service",
                    "rental",
                    "ticket",
                    "hospitality",
                ],
            ],
            [
                "code" => "payment_gateway",
                "label" => "Payment Gateway",
                "category" => "finance",
                "sort_order" => 19,
                "applicable_types" => [
                    "retail",
                    "fnb",
                    "service",
                    "rental",
                    "ticket",
                    "hospitality",
                ],
            ],
            [
                "code" => "stock_opname",
                "label" => "Stock Opname",
                "category" => "inventory",
                "sort_order" => 20,
                "applicable_types" => ["retail", "fnb"],
            ],
        ];

        foreach ($features as $f) {
            Feature::firstOrCreate(["code" => $f["code"]], $f);
        }

        // Attach features to plans
        $free = Plan::where("code", "free")->first();
        $basic = Plan::where("code", "basic")->first();
        $pro = Plan::where("code", "pro")->first();

        if ($free) {
            $free
                ->planFeatures()
                ->sync(
                    Feature::whereIn("code", [
                        "basic_pos",
                        "stock",
                        "purchase",
                        "promo",
                    ])->pluck("id"),
                );
        }
        if ($basic) {
            $basic
                ->planFeatures()
                ->sync(
                    Feature::whereIn("code", [
                        "basic_pos",
                        "stock",
                        "purchase",
                        "batch",
                        "expiry",
                        "promo",
                        "sale_return",
                        "recipe",
                        "modifier",
                        "table",
                        "kitchen",
                        "waste",
                        "queue",
                        "booking",
                        "commission",
                        "membership",
                        "deposit",
                        "report",
                        "payment_gateway",
                        "stock_opname",
                    ])->pluck("id"),
                );
        }
        if ($pro) {
            $pro->planFeatures()->sync(Feature::pluck("id")); // all features
        }
    }
}
