<?php

namespace Database\Seeders;

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

        // 1 — Minimarket Sejahtera (Retail)
        Store::firstOrCreate(
            ["code" => "STORE001"],
            [
                "name" => "Minimarket Sejahtera",
                "store_type_id" => $typeId("retail"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
                "currency" => "IDR",
                "decimal_places" => 0,
                "timezone" => "Asia/Jakarta",
                "tax_inclusive" => false,
                "default_tax_rate" => 0,
                "phone" => "085678901234",
                "email" => "info@sejahtera.com",
                "address" => "Jl. Solo No. 15, Sleman",
                "receipt_header" => "Minimarket Sejahtera",
                "receipt_footer" => "Belanja hemat, hidup sejahtera! 🛒",
                "is_active" => true,
            ],
        );

        // 2 — Warung Kopi Senja (F&B)
        Store::firstOrCreate(
            ["code" => "STORE002"],
            [
                "name" => "Warung Kopi Senja",
                "store_type_id" => $typeId("fnb"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
                "currency" => "IDR",
                "decimal_places" => 0,
                "timezone" => "Asia/Jakarta",
                "tax_inclusive" => false,
                "default_tax_rate" => 0,
                "phone" => "081234567890",
                "email" => "info@kopisenja.com",
                "address" => "Jl. Malioboro No. 88, Yogyakarta",
                "receipt_header" => "Warung Kopi Senja",
                "receipt_footer" => "Terima kasih telah berkunjung! ☕",
                "is_active" => true,
            ],
        );

        // 3 — Barbershop Rapi (Service)
        Store::firstOrCreate(
            ["code" => "STORE003"],
            [
                "name" => "Barbershop Rapi",
                "store_type_id" => $typeId("service"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
                "currency" => "IDR",
                "decimal_places" => 0,
                "timezone" => "Asia/Jakarta",
                "tax_inclusive" => false,
                "default_tax_rate" => 0,
                "phone" => "082112345678",
                "email" => "info@barbershoprapi.com",
                "address" => "Jl. Sudirman No. 12, Yogyakarta",
                "receipt_header" => "Barbershop Rapi",
                "receipt_footer" => "Tampil keren bersama kami! ✂️",
                "is_active" => true,
            ],
        );

        // 4 — Sewa Alat Jaya (Rental)
        Store::firstOrCreate(
            ["code" => "STORE004"],
            [
                "name" => "Sewa Alat Jaya",
                "store_type_id" => $typeId("rental"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
                "currency" => "IDR",
                "decimal_places" => 0,
                "timezone" => "Asia/Jakarta",
                "tax_inclusive" => false,
                "default_tax_rate" => 0,
                "phone" => "083198765432",
                "email" => "info@sewaalatjaya.com",
                "address" => "Jl. Magelang No. 45, Sleman",
                "receipt_header" => "Sewa Alat Jaya",
                "receipt_footer" => "Sewa alat murah, lengkap, terpercaya! 🔑",
                "is_active" => true,
            ],
        );

        // 5 — Bioskop Nusantara (Ticket)
        Store::firstOrCreate(
            ["code" => "STORE005"],
            [
                "name" => "Bioskop Nusantara",
                "store_type_id" => $typeId("ticket"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
                "currency" => "IDR",
                "decimal_places" => 0,
                "timezone" => "Asia/Jakarta",
                "tax_inclusive" => false,
                "default_tax_rate" => 0,
                "phone" => "081299887766",
                "email" => "info@bioskopnusantara.com",
                "address" => "Jl. Pahlawan No. 5, Yogyakarta",
                "receipt_header" => "Bioskop Nusantara",
                "receipt_footer" => "Selamat menonton! 🎬",
                "is_active" => true,
            ],
        );

        // 6 — Villa Sunrise (Hospitality)
        Store::firstOrCreate(
            ["code" => "STORE006"],
            [
                "name" => "Villa Sunrise",
                "store_type_id" => $typeId("hospitality"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
                "currency" => "IDR",
                "decimal_places" => 0,
                "timezone" => "Asia/Jakarta",
                "tax_inclusive" => false,
                "default_tax_rate" => 0,
                "phone" => "085600112233",
                "email" => "info@villasunrise.com",
                "address" => "Jl. Kaliurang Km 20, Sleman",
                "receipt_header" => "Villa Sunrise",
                "receipt_footer" => "Selamat berlibur! 🏨",
                "is_active" => true,
            ],
        );

        // 7 — Parkir Jayabaya (Parking)
        Store::firstOrCreate(
            ["code" => "STORE007"],
            [
                "name" => "Parkir Jayabaya",
                "store_type_id" => $typeId("parking"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
                "currency" => "IDR",
                "decimal_places" => 0,
                "timezone" => "Asia/Jakarta",
                "tax_inclusive" => false,
                "default_tax_rate" => 0,
                "phone" => "081355667788",
                "email" => "info@parkirjayabaya.com",
                "address" => "Jl. Taman Siswa No. 10, Yogyakarta",
                "receipt_header" => "Parkir Jayabaya",
                "receipt_footer" => "Parkir aman, nyaman! 🅿️",
                "is_active" => true,
            ],
        );

        // 8 — GamerZone (Session)
        Store::firstOrCreate(
            ["code" => "STORE008"],
            [
                "name" => "GamerZone",
                "store_type_id" => $typeId("session"),
                "plan_id" => $planId("basic"),
                "max_users" => 5,
                "max_branches" => 3,
                "currency" => "IDR",
                "decimal_places" => 0,
                "timezone" => "Asia/Jakarta",
                "tax_inclusive" => false,
                "default_tax_rate" => 0,
                "phone" => "081377889900",
                "email" => "info@gamerzone.id",
                "address" => "Jl. Gejayan No. 99, Sleman",
                "receipt_header" => "GamerZone",
                "receipt_footer" => "Game on! 🎮",
                "is_active" => true,
            ],
        );
    }
}
