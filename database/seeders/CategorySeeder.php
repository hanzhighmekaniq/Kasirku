<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $store1 = Store::where("code", "STORE001")->firstOrFail();
        $store2 = Store::where("code", "STORE002")->firstOrFail();
        $store3 = Store::where("code", "STORE003")->firstOrFail();
        $store4 = Store::where("code", "STORE004")->firstOrFail();
        $store5 = Store::where("code", "STORE005")->firstOrFail();
        $store6 = Store::where("code", "STORE006")->firstOrFail();

        // ── Store 1: Minimarket Sejahtera — Retail ──────────────────
        $minuman = Category::create([
            "store_id" => $store1->id,
            "name" => "Minuman",
            "slug" => "minuman",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $minuman->id,
            "name" => "Kopi",
            "slug" => "kopi",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $minuman->id,
            "name" => "Non-Kopi",
            "slug" => "non-kopi",
            "sort_order" => 2,
        ]);

        $makanan = Category::create([
            "store_id" => $store1->id,
            "name" => "Makanan",
            "slug" => "makanan",
            "sort_order" => 2,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $makanan->id,
            "name" => "Snack",
            "slug" => "snack",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $makanan->id,
            "name" => "Nasi & Mie",
            "slug" => "nasi-mie",
            "sort_order" => 2,
        ]);

        // Bahan baku cafe
        $bahanBaku = Category::create([
            "store_id" => $store1->id,
            "name" => "Bahan Baku",
            "slug" => "bahan-baku",
            "sort_order" => 9,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $bahanBaku->id,
            "name" => "Biji Kopi",
            "slug" => "biji-kopi",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $bahanBaku->id,
            "name" => "Susu & Cream",
            "slug" => "susu-cream",
            "sort_order" => 2,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $bahanBaku->id,
            "name" => "Gula & Sirup",
            "slug" => "gula-sirup",
            "sort_order" => 3,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $bahanBaku->id,
            "name" => "Tepung & Bahan Kue",
            "slug" => "tepung",
            "sort_order" => 4,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $bahanBaku->id,
            "name" => "Sayuran & Bahan Masak",
            "slug" => "sayuran",
            "sort_order" => 5,
        ]);
        Category::create([
            "store_id" => $store1->id,
            "parent_id" => $bahanBaku->id,
            "name" => "Es Batu",
            "slug" => "es-batu",
            "sort_order" => 6,
        ]);

        // ── Store 2: Kopi Senja — FnB ────────────────────────────────
        $sembako = Category::create([
            "store_id" => $store2->id,
            "name" => "Sembako",
            "slug" => "sembako",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store2->id,
            "parent_id" => $sembako->id,
            "name" => "Beras",
            "slug" => "beras",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store2->id,
            "parent_id" => $sembako->id,
            "name" => "Minyak & Bumbu",
            "slug" => "minyak-bumbu",
            "sort_order" => 2,
        ]);

        $snackKemasan = Category::create([
            "store_id" => $store2->id,
            "name" => "Snack Kemasan",
            "slug" => "snack-kemasan",
            "sort_order" => 2,
        ]);
        $minumanKemasan = Category::create([
            "store_id" => $store2->id,
            "name" => "Minuman Kemasan",
            "slug" => "minuman-kemasan",
            "sort_order" => 3,
        ]);
        $produkSusu = Category::create([
            "store_id" => $store2->id,
            "name" => "Produk Susu",
            "slug" => "produk-susu",
            "sort_order" => 4,
        ]);

        // ── Store 3: Barbershop ───────────────────────────────────────
        $layananBarber = Category::create([
            "store_id" => $store3->id,
            "name" => "Layanan Potong",
            "slug" => "layanan-potong",
            "sort_order" => 1,
        ]);
        $layananExtra = Category::create([
            "store_id" => $store3->id,
            "name" => "Layanan Tambahan",
            "slug" => "layanan-extra",
            "sort_order" => 2,
        ]);
        $produkBarber = Category::create([
            "store_id" => $store3->id,
            "name" => "Produk Perawatan",
            "slug" => "produk-barber",
            "sort_order" => 3,
        ]);

        // ── Store 4: Sewa Alat — Rental ────────────────────────────
        $peralatan = Category::create([
            "store_id" => $store4->id,
            "name" => "Peralatan Sewa",
            "slug" => "peralatan-sewa",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store4->id,
            "parent_id" => $peralatan->id,
            "name" => "Alat Berat",
            "slug" => "alat-berat",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store4->id,
            "parent_id" => $peralatan->id,
            "name" => "Kamera & Audio",
            "slug" => "kamera-audio",
            "sort_order" => 2,
        ]);
        Category::create([
            "store_id" => $store4->id,
            "parent_id" => $peralatan->id,
            "name" => "Event & Pesta",
            "slug" => "event-pesta",
            "sort_order" => 3,
        ]);

        // ── Store 5: Futsal Merdeka — Ticket ─────────────────────────
        $lapangan = Category::create([
            "store_id" => $store5->id,
            "name" => "Lapangan",
            "slug" => "lapangan",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store5->id,
            "parent_id" => $lapangan->id,
            "name" => "Futsal",
            "slug" => "futsal",
            "sort_order" => 1,
        ]);
        Category::create([
            "store_id" => $store5->id,
            "parent_id" => $lapangan->id,
            "name" => "Minuman",
            "slug" => "minuman-ticket",
            "sort_order" => 2,
        ]);

        // ── Store 6: Villa Sunrise — Hospitality ─────────────────────
        $kamar = Category::create([
            "store_id" => $store6->id,
            "name" => "Kamar",
            "slug" => "kamar",
            "sort_order" => 1,
        ]);
        $layananHotel = Category::create([
            "store_id" => $store6->id,
            "name" => "Layanan Tambahan",
            "slug" => "layanan-hotel",
            "sort_order" => 2,
        ]);
    }
}
