<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        $typeId = fn($code) => StoreType::where("code", $code)->value("id");
        $planId = fn($code) => Plan::where("code", $code)->value("id");

        $stores = [
            [
                "code" => "STORE001",
                "name" => "Minimarket Sejahtera",
                "store_type_id" => $typeId("retail"),
                "plan_id" => $planId("free"),
                "max_users" => 1,
                "max_branches" => 1,
            ],
            [
                "code" => "STORE002",
                "name" => "Warung Kopi Senja",
                "store_type_id" => $typeId("fnb"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
            ],
            [
                "code" => "STORE003",
                "name" => "Barbershop Rapi",
                "store_type_id" => $typeId("service"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
            ],
            [
                "code" => "STORE004",
                "name" => "Sewa Alat Jaya",
                "store_type_id" => $typeId("rental"),
                "plan_id" => $planId("pro"),
                "max_users" => 20,
                "max_branches" => 10,
            ],
            [
                "code" => "STORE005",
                "name" => "Bioskop Nusantara",
                "store_type_id" => $typeId("ticket"),
                "plan_id" => $planId("free"),
                "max_users" => 1,
                "max_branches" => 1,
            ],
            [
                "code" => "STORE006",
                "name" => "Villa Sunrise",
                "store_type_id" => $typeId("hospitality"),
                "plan_id" => $planId("pro"),
                "max_users" => 20,
                "max_branches" => 10,
            ],
            [
                "code" => "STORE007",
                "name" => "Parkir Jayabaya",
                "store_type_id" => $typeId("parking"),
                "plan_id" => $planId("unlimited"),
                "max_users" => 999,
                "max_branches" => 999,
            ],
            [
                "code" => "STORE008",
                "name" => "GamerZone",
                "store_type_id" => $typeId("session"),
                "plan_id" => $planId("unlimited"),
                "max_users" => 999,
                "max_branches" => 999,
            ],
        ];

        foreach ($stores as $data) {
            Store::firstOrCreate(
                ["code" => $data["code"]],
                array_merge($data, [
                    "currency" => "IDR",
                    "decimal_places" => 0,
                    "timezone" => "Asia/Jakarta",
                    "tax_inclusive" => false,
                    "default_tax_rate" => 0,
                    "is_active" => true,
                ]),
            );
        }
    }
}
