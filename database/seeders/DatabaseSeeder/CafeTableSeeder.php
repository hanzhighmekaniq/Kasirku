<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\CafeTable;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CafeTableSeeder extends Seeder
{
    public function run(): void
    {
        // FnB store yg punya meja cafe
        $store2 = Store::where("code", "STORE002")->firstOrFail();
        $br1 = Branch::where("store_id", $store2->id)
            ->where("code", "BR2A")
            ->firstOrFail();
        $br2 = Branch::where("store_id", $store2->id)
            ->where("code", "BR2B")
            ->firstOrFail();

        // Branch 1 — Pusat (indoor + outdoor)
        $tablesBr1 = [
            [
                "table_number" => "A1",
                "zone" => "Indoor",
                "capacity" => 2,
                "status" => "available",
            ],
            [
                "table_number" => "A2",
                "zone" => "Indoor",
                "capacity" => 2,
                "status" => "occupied",
            ],
            [
                "table_number" => "A3",
                "zone" => "Indoor",
                "capacity" => 4,
                "status" => "available",
            ],
            [
                "table_number" => "B1",
                "zone" => "Indoor",
                "capacity" => 4,
                "status" => "available",
            ],
            [
                "table_number" => "B2",
                "zone" => "Indoor",
                "capacity" => 6,
                "status" => "reserved",
            ],
            [
                "table_number" => "B3",
                "zone" => "Indoor",
                "capacity" => 6,
                "status" => "available",
            ],
            [
                "table_number" => "O1",
                "zone" => "Outdoor",
                "capacity" => 2,
                "status" => "available",
            ],
            [
                "table_number" => "O2",
                "zone" => "Outdoor",
                "capacity" => 4,
                "status" => "available",
            ],
            [
                "table_number" => "O3",
                "zone" => "Outdoor",
                "capacity" => 8,
                "status" => "available",
            ],
        ];

        foreach ($tablesBr1 as $t) {
            CafeTable::firstOrCreate(
                ["branch_id" => $br1->id, "table_number" => $t["table_number"]],
                array_merge($t, [
                    "store_id" => $store2->id,
                    "is_active" => true,
                ]),
            );
        }

        // Branch 2 — UGM
        $tablesBr2 = [
            [
                "table_number" => "C1",
                "zone" => "Indoor",
                "capacity" => 2,
                "status" => "available",
            ],
            [
                "table_number" => "C2",
                "zone" => "Indoor",
                "capacity" => 4,
                "status" => "available",
            ],
            [
                "table_number" => "C3",
                "zone" => "Indoor",
                "capacity" => 4,
                "status" => "occupied",
            ],
            [
                "table_number" => "D1",
                "zone" => "Outdoor",
                "capacity" => 6,
                "status" => "available",
            ],
        ];

        foreach ($tablesBr2 as $t) {
            CafeTable::firstOrCreate(
                ["branch_id" => $br2->id, "table_number" => $t["table_number"]],
                array_merge($t, [
                    "store_id" => $store2->id,
                    "is_active" => true,
                ]),
            );
        }
    }
}
