<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        // Store 1 — Minimarket Sejahtera (Retail)
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
                "receipt_footer" =>
                    "Belanja hemat, hidup sejahtera! 🛒 Sejahtera © 2026",
                "is_active" => true,
            ],
        );

        // Store 2 — Warung Kopi Senja (FnB)
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
                "receipt_footer" =>
                    "Terima kasih telah berkunjung! ☕ Kopi Senja © 2026",
                "is_active" => true,
            ],
        );

        // Store 3 — Barbershop Rapi (Service)
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

        // Store 4 — Sewa Alat Jaya (Rental)
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

        // Store 5 — Futsal Merdeka (Ticket / Booking slot)
        Store::firstOrCreate(
            ["code" => "STORE005"],
            [
                "name" => "Futsal Merdeka",
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
                "email" => "info@futsalmerdeka.com",
                "address" => "Jl. Pahlawan No. 5, Yogyakarta",
                "receipt_header" => "Futsal Merdeka",
                "receipt_footer" => "Selamat bermain! ⚽",
                "is_active" => true,
            ],
        );

        // Store 6 — Villa Sunrise (Hospitality)
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
                "receipt_footer" => "Terima kasih telah menginap! 🏨",
                "is_active" => true,
            ],
        );
    }
}
