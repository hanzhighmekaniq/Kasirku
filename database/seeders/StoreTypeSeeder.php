<?php

namespace Database\Seeders;

use App\Models\StoreType;
use Illuminate\Database\Seeder;

class StoreTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                "code" => "retail",
                "label" => "Retail",
                "icon" => "🏪",
                "description" =>
                    "Toko, minimarket, grosir, apotek — jual beli barang fisik",
                "order_types" => json_encode([
                    ["v" => "takeaway", "l" => "Ambil"],
                    ["v" => "delivery", "l" => "Antar"],
                    ["v" => "wholesale", "l" => "Grosir"],
                ]),
                "pos_behavior" => "retail",
                "sort_order" => 1,
            ],
            [
                "code" => "fnb",
                "label" => "F&B",
                "icon" => "☕",
                "description" =>
                    "Restoran, cafe, bakery, warteg — makanan & minuman",
                "order_types" => json_encode([
                    ["v" => "dine_in", "l" => "Dine-in"],
                    ["v" => "takeaway", "l" => "Takeaway"],
                    ["v" => "delivery", "l" => "Delivery"],
                ]),
                "pos_behavior" => "fnb",
                "sort_order" => 2,
            ],
            [
                "code" => "service",
                "label" => "Service",
                "icon" => "✂️",
                "description" =>
                    "Salon, barbershop, bengkel, laundry, spa — bisnis jasa",
                "order_types" => json_encode([
                    ["v" => "walk_in", "l" => "Langsung"],
                    ["v" => "booking", "l" => "Booking"],
                    ["v" => "pickup_delivery", "l" => "Jemput & Antar"],
                ]),
                "pos_behavior" => "service",
                "sort_order" => 3,
            ],
            [
                "code" => "rental",
                "label" => "Rental",
                "icon" => "🔑",
                "description" =>
                    "Sewa alat, kendaraan, kamera, kostum — penyewaan berbasis durasi",
                "order_types" => json_encode([
                    ["v" => "per_hour", "l" => "Per Jam"],
                    ["v" => "per_day", "l" => "Per Hari"],
                    ["v" => "per_week", "l" => "Per Minggu"],
                ]),
                "pos_behavior" => "rental",
                "sort_order" => 4,
            ],
            [
                "code" => "ticket",
                "label" => "Ticket",
                "icon" => "🎟️",
                "description" =>
                    "Bioskop, futsal, event, konser — booking slot & tiket",
                "order_types" => json_encode([
                    ["v" => "online", "l" => "Booking Online"],
                    ["v" => "walk_in", "l" => "Walk-in"],
                    ["v" => "group", "l" => "Group"],
                ]),
                "pos_behavior" => "ticket",
                "sort_order" => 5,
            ],
            [
                "code" => "hospitality",
                "label" => "Hospitality",
                "icon" => "🏨",
                "description" =>
                    "Hotel, villa, kost, guest house — penginapan & akomodasi",
                "order_types" => json_encode([
                    ["v" => "check_in", "l" => "Check-in"],
                    ["v" => "reservation", "l" => "Reservasi"],
                    ["v" => "short_stay", "l" => "Short Stay"],
                ]),
                "pos_behavior" => "hospitality",
                "sort_order" => 6,
            ],
            [
                "code" => "parking",
                "label" => "Parking",
                "icon" => "🅿️",
                "description" =>
                    "Parkir kendaraan — masuk, keluar, durasi, tarif",
                "order_types" => json_encode([
                    ["v" => "entry", "l" => "Masuk"],
                    ["v" => "exit", "l" => "Keluar"],
                    ["v" => "lost_ticket", "l" => "Tiket Hilang"],
                ]),
                "pos_behavior" => "parking",
                "sort_order" => 7,
            ],
            [
                "code" => "session",
                "label" => "Session",
                "icon" => "🎮",
                "description" =>
                    "Warnet, rental PS, karaoke, billiard — billing berbasis timer",
                "order_types" => json_encode([
                    ["v" => "postpaid", "l" => "Postpaid"],
                    ["v" => "prepaid", "l" => "Prepaid"],
                    ["v" => "booking", "l" => "Booking"],
                ]),
                "pos_behavior" => "session",
                "sort_order" => 8,
            ],
        ];

        foreach ($types as $type) {
            StoreType::updateOrCreate(
                ["code" => $type["code"]],
                $type + ["is_active" => true],
            );
        }
    }
}
