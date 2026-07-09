<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Customer;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $storeMinimarket = Store::where("code", "STORE001")->firstOrFail();
        $storeKopiSenja = Store::where("code", "STORE002")->firstOrFail();
        $storeBarbershop = Store::where("code", "STORE003")->firstOrFail();
        $storeSewaAlat = Store::where("code", "STORE004")->firstOrFail();

        // ── Store STORE002: Kopi Senja ───────────────────────────────
        Customer::firstOrCreate(
            ["store_id" => $storeKopiSenja->id, "code" => "CST001"],
            [
                "name" => "Rina Marlina",
                "phone" => "081300000001",
                "email" => "rina@gmail.com",
                "address" => "Jl. Setiabudi No. 10, Yogyakarta",
                "birth_date" => "1995-03-15",
                "gender" => "female",
                "points" => 1500,
                "tier" => "gold",
                "total_spent" => 750000,
                "deposit_balance" => 50000,
                "last_visit_at" => "2026-06-18 10:30:00",
            ],
        );
        Customer::firstOrCreate(
            ["store_id" => $storeKopiSenja->id, "code" => "CST002"],
            [
                "name" => "Dedi Kurniawan",
                "phone" => "081300000002",
                "email" => "dedi@gmail.com",
                "address" => "Jl. Gejayan No. 25, Yogyakarta",
                "birth_date" => "1990-07-20",
                "gender" => "male",
                "points" => 600,
                "tier" => "silver",
                "total_spent" => 320000,
                "deposit_balance" => 0,
                "last_visit_at" => "2026-06-19 14:15:00",
            ],
        );
        Customer::firstOrCreate(
            ["store_id" => $storeKopiSenja->id, "code" => "CST003"],
            [
                "name" => "Maya Putri",
                "phone" => "081300000003",
                "email" => null,
                "birth_date" => null,
                "gender" => "female",
                "points" => 100,
                "tier" => "bronze",
                "total_spent" => 45000,
                "deposit_balance" => 0,
                "last_visit_at" => "2026-06-20 09:00:00",
            ],
        );

        // ── Store STORE001: Minimarket ──────────────────────────────
        Customer::firstOrCreate(
            ["store_id" => $storeMinimarket->id, "code" => "CST001"],
            [
                "name" => "Fajar Nugroho",
                "phone" => "081300000004",
                "email" => "fajar@outlook.com",
                "address" => "Jl. Kaliurang No. 100, Sleman",
                "birth_date" => "1988-11-05",
                "gender" => "male",
                "points" => 300,
                "tier" => "silver",
                "total_spent" => 180000,
                "deposit_balance" => 0,
                "last_visit_at" => "2026-06-17 16:45:00",
            ],
        );
        Customer::firstOrCreate(
            ["store_id" => $storeMinimarket->id, "code" => "CST002"],
            [
                "name" => "Ayu Lestari",
                "phone" => "081300000005",
                "email" => null,
                "birth_date" => null,
                "gender" => "female",
                "points" => 50,
                "tier" => "bronze",
                "total_spent" => 25000,
                "deposit_balance" => 0,
                "last_visit_at" => "2026-06-20 11:20:00",
            ],
        );

        // ── Store STORE003: Barbershop ──────────────────────────────
        Customer::firstOrCreate(
            ["store_id" => $storeBarbershop->id, "code" => "CST001"],
            [
                "name" => "Hendra Wijaya",
                "phone" => "081300000006",
                "email" => "hendra@yahoo.com",
                "birth_date" => "1992-04-12",
                "gender" => "male",
                "points" => 200,
                "tier" => "silver",
                "total_spent" => 150000,
                "deposit_balance" => 0,
                "notes" => "Suka potongan undercut",
                "last_visit_at" => "2026-06-18 15:00:00",
            ],
        );
        Customer::firstOrCreate(
            ["store_id" => $storeBarbershop->id, "code" => "CST002"],
            [
                "name" => "Bagas Pratama",
                "phone" => "081300000007",
                "email" => null,
                "birth_date" => "1998-09-23",
                "gender" => "male",
                "points" => 80,
                "tier" => "bronze",
                "total_spent" => 60000,
                "deposit_balance" => 0,
                "notes" => "Langganan potong + cuci",
                "last_visit_at" => "2026-06-20 10:00:00",
            ],
        );

        // ── Store STORE004: Sewa Alat Jaya ──────────────────────────
        Customer::firstOrCreate(
            ["store_id" => $storeSewaAlat->id, "code" => "CST001"],
            [
                "name" => "Rini Suryani",
                "phone" => "081300000008",
                "email" => "rini@gmail.com",
                "birth_date" => "1993-06-01",
                "gender" => "female",
                "points" => 400,
                "tier" => "gold",
                "total_spent" => 320000,
                "deposit_balance" => 100000,
                "notes" => "Pelanggan langganan bulanan",
                "last_visit_at" => "2026-06-20 09:00:00",
            ],
        );
        Customer::firstOrCreate(
            ["store_id" => $storeSewaAlat->id, "code" => "CST002"],
            [
                "name" => "Yoga Pratama",
                "phone" => "081300000009",
                "email" => null,
                "birth_date" => null,
                "gender" => "male",
                "points" => 50,
                "tier" => "bronze",
                "total_spent" => 35000,
                "deposit_balance" => 0,
                "last_visit_at" => "2026-06-19 14:00:00",
            ],
        );
    }
}
