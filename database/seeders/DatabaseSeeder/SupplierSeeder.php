<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Store;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $storeKopiSenja = Store::where("code", "STORE002")->firstOrFail();
        $storeMinimarket = Store::where("code", "STORE001")->firstOrFail();
        $storeBarbershop = Store::where("code", "STORE003")->firstOrFail();

        // STORE002 — Kopi Senja (cafe)
        Supplier::firstOrCreate(
            ["store_id" => $storeKopiSenja->id, "code" => "SUP0001"],
            [
                "name" => "CV Kopi Nusantara",
                "contact_person" => "Budi Santoso",
                "phone" => "081200000001",
                "email" => "order@kopinusantara.com",
                "address" => "Jl. Veteran No. 20, Jakarta Selatan",
            ],
        );
        Supplier::firstOrCreate(
            ["store_id" => $storeKopiSenja->id, "code" => "SUP0002"],
            [
                "name" => "PT Susu Segar Indonesia",
                "contact_person" => "Andi Wijaya",
                "phone" => "081200000002",
                "email" => "sales@sususegar.co.id",
                "address" => "Jl. Raya Bogor Km 30, Bogor",
            ],
        );
        Supplier::firstOrCreate(
            ["store_id" => $storeKopiSenja->id, "code" => "SUP0003"],
            [
                "name" => "Toko Bahan Kue Makmur",
                "phone" => "081200000003",
                "address" => "Pasar Pusat, Blok D No. 5, Yogyakarta",
            ],
        );

        // STORE001 — Minimarket Sejahtera
        Supplier::firstOrCreate(
            ["store_id" => $storeMinimarket->id, "code" => "SUP0001"],
            [
                "name" => "UD Sembako Jaya",
                "contact_person" => "Hendra Kurniawan",
                "phone" => "081200000004",
                "email" => "sembakojaya@gmail.com",
                "address" => "Jl. Magelang Km 8, Sleman",
            ],
        );
        Supplier::firstOrCreate(
            ["store_id" => $storeMinimarket->id, "code" => "SUP0002"],
            [
                "name" => "PT Minuman Nusantara",
                "contact_person" => "Sari Dewi",
                "phone" => "081200000005",
                "email" => "order@minumannusantara.com",
                "address" => "Jl. Industri No. 12, Tangerang",
            ],
        );

        // STORE003 — Barbershop
        Supplier::firstOrCreate(
            ["store_id" => $storeBarbershop->id, "code" => "SUP0001"],
            [
                "name" => "Distributor Produk Salon Indo",
                "contact_person" => "Rahmat",
                "phone" => "081200000006",
                "address" => "Jl. Tentara Pelajar No. 5, Yogyakarta",
            ],
        );
    }
}
