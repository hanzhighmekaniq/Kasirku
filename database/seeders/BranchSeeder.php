<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Store;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $store1 = Store::where("code", "STORE001")->firstOrFail();
        $store2 = Store::where("code", "STORE002")->firstOrFail();
        $store3 = Store::where("code", "STORE003")->firstOrFail();
        $store4 = Store::where("code", "STORE004")->firstOrFail();
        $store5 = Store::where("code", "STORE005")->firstOrFail();
        $store6 = Store::where("code", "STORE006")->firstOrFail();
        $store7 = Store::where("code", "STORE007")->firstOrFail();
        $store8 = Store::where("code", "STORE008")->firstOrFail();

        // Store 1 — Minimarket Sejahtera (Retail)
        Branch::firstOrCreate(
            ["store_id" => $store1->id, "code" => "BR001"],
            [
                "name" => "Minimarket Sejahtera - Pusat",
                "phone" => "085678901234",
                "address" => "Jl. Solo No. 15, Sleman",
                "is_active" => true,
            ],
        );
        Branch::firstOrCreate(
            ["store_id" => $store1->id, "code" => "BR002"],
            [
                "name" => "Minimarket Sejahtera - Babarsari",
                "phone" => "085678901235",
                "address" => "Jl. Babarsari No. 10, Depok, Sleman",
                "is_active" => true,
            ],
        );

        // Store 2 — Kopi Senja (FnB)
        Branch::firstOrCreate(
            ["store_id" => $store2->id, "code" => "BR003"],
            [
                "name" => "Kopi Senja - Pusat",
                "phone" => "081234567890",
                "address" => "Jl. Malioboro No. 88, Yogyakarta",
                "is_active" => true,
            ],
        );
        Branch::firstOrCreate(
            ["store_id" => $store2->id, "code" => "BR004"],
            [
                "name" => "Kopi Senja - Cabang UGM",
                "phone" => "081234567891",
                "address" => "Jl. Kaliurang Km 5, Sleman",
                "is_active" => true,
            ],
        );

        // Store 3 — Barbershop Rapi (Service)
        Branch::firstOrCreate(
            ["store_id" => $store3->id, "code" => "BR005"],
            [
                "name" => "Barbershop Rapi - Pusat",
                "phone" => "082112345678",
                "address" => "Jl. Sudirman No. 12, Yogyakarta",
                "is_active" => true,
            ],
        );

        // Store 4 — Sewa Alat Jaya (Rental)
        Branch::firstOrCreate(
            ["store_id" => $store4->id, "code" => "BR006"],
            [
                "name" => "Sewa Alat Jaya - Pusat",
                "phone" => "083198765432",
                "address" => "Jl. Magelang No. 45, Sleman",
                "is_active" => true,
            ],
        );

        // Store 5 — Bioskop Nusantara (Ticket)
        Branch::firstOrCreate(
            ["store_id" => $store5->id, "code" => "BR007"],
            [
                "name" => "Bioskop Nusantara - Pusat",
                "phone" => "081299887766",
                "address" => "Jl. Pahlawan No. 5, Yogyakarta",
                "is_active" => true,
            ],
        );

        // Store 6 — Villa Sunrise (Hospitality)
        Branch::firstOrCreate(
            ["store_id" => $store6->id, "code" => "BR008"],
            [
                "name" => "Villa Sunrise - Pusat",
                "phone" => "085600112233",
                "address" => "Jl. Kaliurang Km 20, Sleman",
                "is_active" => true,
            ],
        );

        // Store 7 — Parkir Jayabaya (Parking)
        Branch::firstOrCreate(
            ["store_id" => $store7->id, "code" => "BR009"],
            [
                "name" => "Parkir Jayabaya - Pusat",
                "phone" => "081355667788",
                "address" => "Jl. Taman Siswa No. 10, Yogyakarta",
                "is_active" => true,
            ],
        );

        // Store 8 — GamerZone (Session)
        Branch::firstOrCreate(
            ["store_id" => $store8->id, "code" => "BR010"],
            [
                "name" => "GamerZone - Pusat",
                "phone" => "081377889900",
                "address" => "Jl. Gejayan No. 99, Sleman",
                "is_active" => true,
            ],
        );
    }
}
