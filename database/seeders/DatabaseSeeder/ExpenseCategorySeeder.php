<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\ExpenseCategory;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $stores = Store::all();

        foreach ($stores as $store) {
            $typeCode = $store->getRelationValue("storeType")?->code;

            $categories = match ($typeCode) {
                "retail" => [
                    [
                        "code" => "OPERATIONAL",
                        "name" => "Operasional",
                        "description" => "Listrik, air, internet",
                    ],
                    [
                        "code" => "SUPPLIES",
                        "name" => "Perlengkapan",
                        "description" => "ATK, kebersihan",
                    ],
                    [
                        "code" => "MAINTENANCE",
                        "name" => "Perawatan",
                        "description" => "Servis alat, renovasi",
                    ],
                ],
                "fnb" => [
                    [
                        "code" => "INGREDIENTS",
                        "name" => "Bahan Baku",
                        "description" => "Bahan makanan & minuman",
                    ],
                    [
                        "code" => "OPERATIONAL",
                        "name" => "Operasional",
                        "description" => "Gas, listrik, air",
                    ],
                    [
                        "code" => "EQUIPMENT",
                        "name" => "Peralatan",
                        "description" => "Alat masak, mesin kopi",
                    ],
                ],
                default => [
                    [
                        "code" => "OPERATIONAL",
                        "name" => "Operasional",
                        "description" => "Biaya operasional harian",
                    ],
                    [
                        "code" => "MAINTENANCE",
                        "name" => "Perawatan",
                        "description" => "Perbaikan & servis",
                    ],
                ],
            };

            foreach ($categories as $cat) {
                ExpenseCategory::firstOrCreate(
                    ["store_id" => $store->id, "code" => $cat["code"]],
                    [
                        "name" => $cat["name"],
                        "description" => $cat["description"],
                    ],
                );
            }
        }
    }
}
