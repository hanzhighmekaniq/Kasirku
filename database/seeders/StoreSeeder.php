<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        // 1 — Minimarket Sejahtera (Retail)
        Store::firstOrCreate(
            ["code" => "STORE001"],
            [
                "name" => "Minimarket Sejahtera",
                "store_type" => "retail",
                "modules" => [
                    "pos_modes" => ["retail"],
                    "features" => [
                        "stock",
                        "purchase",
                        "batch",
                        "expiry",
                        "promo",
                        "sale_return",
                        "report",
                        "payment_gateway",
                        "stock_opname",
                    ],
                ],
                "plan" => "basic",
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
                "store_type" => "fnb",
                "modules" => [
                    "pos_modes" => ["fnb"],
                    "features" => [
                        "stock",
                        "purchase",
                        "recipe",
                        "modifier",
                        "table",
                        "kitchen",
                        "waste",
                        "promo",
                        "delivery",
                        "booking",
                        "sale_return",
                        "report",
                        "payment_gateway",
                        "stock_opname",
                    ],
                ],
                "plan" => "basic",
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
                "store_type" => "service",
                "modules" => [
                    "pos_modes" => ["service"],
                    "features" => [
                        "queue",
                        "booking",
                        "commission",
                        "membership",
                        "deposit",
                        "promo",
                        "report",
                        "payment_gateway",
                    ],
                ],
                "plan" => "basic",
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
                "store_type" => "rental",
                "modules" => [
                    "pos_modes" => ["rental"],
                    "features" => [
                        "deposit",
                        "booking",
                        "report",
                        "payment_gateway",
                    ],
                ],
                "plan" => "basic",
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
                "store_type" => "ticket",
                "modules" => [
                    "pos_modes" => ["ticket"],
                    "features" => [
                        "booking",
                        "promo",
                        "report",
                        "payment_gateway",
                    ],
                ],
                "plan" => "basic",
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
                "store_type" => "hospitality",
                "modules" => [
                    "pos_modes" => ["hospitality"],
                    "features" => [
                        "booking",
                        "membership",
                        "deposit",
                        "report",
                        "payment_gateway",
                    ],
                ],
                "plan" => "basic",
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
                "store_type" => "parking",
                "modules" => [
                    "pos_modes" => ["parking"],
                    "features" => ["report", "payment_gateway"],
                ],
                "plan" => "basic",
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
                "store_type" => "session",
                "modules" => [
                    "pos_modes" => ["session"],
                    "features" => ["booking", "report", "payment_gateway"],
                ],
                "plan" => "basic",
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
