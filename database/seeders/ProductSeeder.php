<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $store1 = Store::where("code", "STORE001")->firstOrFail();
        $store2 = Store::where("code", "STORE002")->firstOrFail();
        $store3 = Store::where("code", "STORE003")->firstOrFail();
        $store4 = Store::where("code", "STORE004")->firstOrFail();
        $store5 = Store::where("code", "STORE005")->firstOrFail();
        $store6 = Store::where("code", "STORE006")->firstOrFail();

        // Helpers
        $cat = fn(string $slug, int $storeId) => Category::where("slug", $slug)
            ->where("store_id", $storeId)
            ->value("id");
        $sup = fn(string $code, int $storeId) => Supplier::where("code", $code)
            ->where("store_id", $storeId)
            ->value("id");

        // ══════════════════════════════════════════════════════════════
        // STORE 1 — Kopi Senja (FnB)
        // ══════════════════════════════════════════════════════════════

        // --- Bahan baku ---
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("biji-kopi", $store1->id),
            "supplier_id" => $sup("SUP0001", $store1->id),
            "sku" => "S1-RM-001",
            "name" => "Biji Kopi Arabika Gayo",
            "type" => "raw_material",
            "unit" => "kg",
            "base_unit" => "gram",
            "cost_price" => 120000,
            "sell_price" => 0,
            "stock_minimum" => 5,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("biji-kopi", $store1->id),
            "supplier_id" => $sup("SUP0001", $store1->id),
            "sku" => "S1-RM-002",
            "name" => "Biji Kopi Robusta Lampung",
            "type" => "raw_material",
            "unit" => "kg",
            "base_unit" => "gram",
            "cost_price" => 85000,
            "sell_price" => 0,
            "stock_minimum" => 5,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("susu-cream", $store1->id),
            "supplier_id" => $sup("SUP0002", $store1->id),
            "sku" => "S1-RM-003",
            "name" => "Susu Fresh Milk",
            "type" => "raw_material",
            "unit" => "liter",
            "base_unit" => "ml",
            "cost_price" => 18000,
            "sell_price" => 0,
            "stock_minimum" => 10,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("susu-cream", $store1->id),
            "supplier_id" => $sup("SUP0002", $store1->id),
            "sku" => "S1-RM-004",
            "name" => "Susu Evaporated",
            "type" => "raw_material",
            "unit" => "liter",
            "base_unit" => "ml",
            "cost_price" => 22000,
            "sell_price" => 0,
            "stock_minimum" => 5,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("gula-sirup", $store1->id),
            "sku" => "S1-RM-005",
            "name" => "Gula Pasir",
            "type" => "raw_material",
            "unit" => "kg",
            "base_unit" => "gram",
            "cost_price" => 14000,
            "sell_price" => 0,
            "stock_minimum" => 10,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("gula-sirup", $store1->id),
            "sku" => "S1-RM-006",
            "name" => "Gula Aren Cair",
            "type" => "raw_material",
            "unit" => "liter",
            "base_unit" => "ml",
            "cost_price" => 25000,
            "sell_price" => 0,
            "stock_minimum" => 5,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("gula-sirup", $store1->id),
            "sku" => "S1-RM-007",
            "name" => "Sirup Vanilla",
            "type" => "raw_material",
            "unit" => "liter",
            "base_unit" => "ml",
            "cost_price" => 35000,
            "sell_price" => 0,
            "stock_minimum" => 3,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("tepung", $store1->id),
            "sku" => "S1-RM-008",
            "name" => "Tepung Terigu",
            "type" => "raw_material",
            "unit" => "kg",
            "base_unit" => "gram",
            "cost_price" => 12000,
            "sell_price" => 0,
            "stock_minimum" => 10,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("sayuran", $store1->id),
            "sku" => "S1-RM-009",
            "name" => "Telur Ayam",
            "type" => "raw_material",
            "unit" => "kg",
            "base_unit" => "pcs",
            "cost_price" => 2200,
            "sell_price" => 0,
            "stock_minimum" => 20,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("es-batu", $store1->id),
            "sku" => "S1-RM-010",
            "name" => "Es Batu Kristal",
            "type" => "raw_material",
            "unit" => "kg",
            "base_unit" => "gram",
            "cost_price" => 3000,
            "sell_price" => 0,
            "stock_minimum" => 50,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("sayuran", $store1->id),
            "sku" => "S1-RM-011",
            "name" => "Nasi Putih",
            "type" => "raw_material",
            "unit" => "kg",
            "base_unit" => "gram",
            "cost_price" => 8000,
            "sell_price" => 0,
            "stock_minimum" => 20,
            "track_stock" => true,
            "is_sellable" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("sayuran", $store1->id),
            "sku" => "S1-RM-012",
            "name" => "Mie Instan",
            "type" => "raw_material",
            "unit" => "pcs",
            "base_unit" => "pcs",
            "cost_price" => 3500,
            "sell_price" => 0,
            "stock_minimum" => 30,
            "track_stock" => true,
            "is_sellable" => false,
        ]);

        // --- Produk jadi FnB ---
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("kopi", $store1->id),
            "sku" => "S1-FG-001",
            "barcode" => "8991001000001",
            "name" => "Kopi Hitam",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 5,
            "unit" => "pcs",
            "cost_price" => 3000,
            "sell_price" => 18000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("kopi", $store1->id),
            "sku" => "S1-FG-002",
            "barcode" => "8991001000002",
            "name" => "Kopi Susu",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 5,
            "unit" => "pcs",
            "cost_price" => 5500,
            "sell_price" => 28000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("kopi", $store1->id),
            "sku" => "S1-FG-003",
            "barcode" => "8991001000003",
            "name" => "Espresso",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 3,
            "unit" => "pcs",
            "cost_price" => 2500,
            "sell_price" => 22000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("kopi", $store1->id),
            "sku" => "S1-FG-004",
            "barcode" => "8991001000004",
            "name" => "Cappuccino",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 5,
            "unit" => "pcs",
            "cost_price" => 6000,
            "sell_price" => 30000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("kopi", $store1->id),
            "sku" => "S1-FG-005",
            "barcode" => "8991001000005",
            "name" => "Vanilla Latte",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 5,
            "unit" => "pcs",
            "cost_price" => 7000,
            "sell_price" => 32000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("non-kopi", $store1->id),
            "sku" => "S1-FG-006",
            "barcode" => "8991001000006",
            "name" => "Matcha Latte",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 5,
            "unit" => "pcs",
            "cost_price" => 6500,
            "sell_price" => 30000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("non-kopi", $store1->id),
            "sku" => "S1-FG-007",
            "barcode" => "8991001000007",
            "name" => "Teh Tarik",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 4,
            "unit" => "pcs",
            "cost_price" => 3000,
            "sell_price" => 20000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("non-kopi", $store1->id),
            "sku" => "S1-FG-008",
            "barcode" => "8991001000008",
            "name" => "Jus Jeruk",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 3,
            "unit" => "pcs",
            "cost_price" => 4000,
            "sell_price" => 22000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("nasi-mie", $store1->id),
            "sku" => "S1-FG-009",
            "barcode" => "8991001000009",
            "name" => "Nasi Goreng Spesial",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 15,
            "unit" => "pcs",
            "cost_price" => 8000,
            "sell_price" => 28000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("nasi-mie", $store1->id),
            "sku" => "S1-FG-010",
            "barcode" => "8991001000010",
            "name" => "Mie Goreng Kampung",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 10,
            "unit" => "pcs",
            "cost_price" => 5000,
            "sell_price" => 22000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("snack", $store1->id),
            "sku" => "S1-FG-011",
            "barcode" => "8991001000011",
            "name" => "Roti Bakar Cokelat",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 10,
            "unit" => "pcs",
            "cost_price" => 4000,
            "sell_price" => 18000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("snack", $store1->id),
            "sku" => "S1-FG-012",
            "barcode" => "8991001000012",
            "name" => "Pisang Goreng",
            "type" => "finished_goods",
            "is_composable" => true,
            "preparation_time" => 8,
            "unit" => "pcs",
            "cost_price" => 3000,
            "sell_price" => 15000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store1->id,
            "category_id" => $cat("kopi", $store1->id),
            "sku" => "S1-FG-013",
            "barcode" => "8991001000013",
            "name" => "Combo Kopi Susu + Roti Bakar",
            "type" => "combo",
            "is_composable" => true,
            "preparation_time" => 15,
            "unit" => "pcs",
            "cost_price" => 9500,
            "sell_price" => 38000,
            "track_stock" => false,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 2 — Minimarket Sejahtera (Retail)
        // ══════════════════════════════════════════════════════════════
        Product::create([
            "store_id" => $store2->id,
            "category_id" => $cat("snack-kemasan", $store2->id),
            "supplier_id" => $sup("SUP0002", $store2->id),
            "sku" => "S2-MM-001",
            "barcode" => "8997002000001",
            "name" => "Indomie Goreng",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 2500,
            "sell_price" => 3500,
            "stock_minimum" => 20,
            "track_stock" => true,
        ]);
        Product::create([
            "store_id" => $store2->id,
            "category_id" => $cat("minuman-kemasan", $store2->id),
            "supplier_id" => $sup("SUP0002", $store2->id),
            "sku" => "S2-MM-002",
            "barcode" => "8997002000002",
            "name" => "Teh Botol Sosro 450ml",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 3500,
            "sell_price" => 5000,
            "stock_minimum" => 24,
            "track_stock" => true,
        ]);
        Product::create([
            "store_id" => $store2->id,
            "category_id" => $cat("minuman-kemasan", $store2->id),
            "supplier_id" => $sup("SUP0002", $store2->id),
            "sku" => "S2-MM-003",
            "barcode" => "8997002000003",
            "name" => "Aqua 600ml",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 3000,
            "sell_price" => 4000,
            "stock_minimum" => 24,
            "track_stock" => true,
        ]);
        Product::create([
            "store_id" => $store2->id,
            "category_id" => $cat("beras", $store2->id),
            "supplier_id" => $sup("SUP0001", $store2->id),
            "sku" => "S2-MM-004",
            "barcode" => "8997002000004",
            "name" => "Beras Premium 5kg",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 55000,
            "sell_price" => 65000,
            "stock_minimum" => 10,
            "track_stock" => true,
        ]);
        Product::create([
            "store_id" => $store2->id,
            "category_id" => $cat("minyak-bumbu", $store2->id),
            "supplier_id" => $sup("SUP0001", $store2->id),
            "sku" => "S2-MM-005",
            "barcode" => "8997002000005",
            "name" => "Minyak Goreng 1 Liter",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 14000,
            "sell_price" => 18000,
            "stock_minimum" => 15,
            "track_stock" => true,
        ]);
        Product::create([
            "store_id" => $store2->id,
            "category_id" => $cat("minyak-bumbu", $store2->id),
            "supplier_id" => $sup("SUP0001", $store2->id),
            "sku" => "S2-MM-006",
            "barcode" => "8997002000006",
            "name" => "Gula Pasir 1kg",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 12000,
            "sell_price" => 15000,
            "stock_minimum" => 20,
            "track_stock" => true,
        ]);
        Product::create([
            "store_id" => $store2->id,
            "category_id" => $cat("produk-susu", $store2->id),
            "supplier_id" => $sup("SUP0002", $store2->id),
            "sku" => "S2-MM-007",
            "barcode" => "8997002000007",
            "name" => "Susu Kental Manis 400g",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 8000,
            "sell_price" => 11000,
            "stock_minimum" => 12,
            "track_stock" => true,
        ]);
        Product::create([
            "store_id" => $store2->id,
            "category_id" => $cat("minuman-kemasan", $store2->id),
            "supplier_id" => $sup("SUP0002", $store2->id),
            "sku" => "S2-MM-008",
            "barcode" => "8997002000008",
            "name" => "Kopi Torabika 3in1",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 2000,
            "sell_price" => 3000,
            "stock_minimum" => 30,
            "track_stock" => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 3 — Barbershop Rapi (Service)
        // ══════════════════════════════════════════════════════════════
        Product::create([
            "store_id" => $store3->id,
            "category_id" => $cat("layanan-potong", $store3->id),
            "sku" => "S3-SV-001",
            "name" => "Potong Rambut Biasa",
            "type" => "service",
            "unit" => "sesi",
            "cost_price" => 5000,
            "sell_price" => 20000,
            "track_stock" => false,
            "preparation_time" => 15,
        ]);
        Product::create([
            "store_id" => $store3->id,
            "category_id" => $cat("layanan-potong", $store3->id),
            "sku" => "S3-SV-002",
            "name" => "Potong + Cuci Rambut",
            "type" => "service",
            "unit" => "sesi",
            "cost_price" => 8000,
            "sell_price" => 35000,
            "track_stock" => false,
            "preparation_time" => 25,
        ]);
        Product::create([
            "store_id" => $store3->id,
            "category_id" => $cat("layanan-potong", $store3->id),
            "sku" => "S3-SV-003",
            "name" => "Undercut / Fade",
            "type" => "service",
            "unit" => "sesi",
            "cost_price" => 10000,
            "sell_price" => 45000,
            "track_stock" => false,
            "preparation_time" => 30,
        ]);
        Product::create([
            "store_id" => $store3->id,
            "category_id" => $cat("layanan-extra", $store3->id),
            "sku" => "S3-SV-004",
            "name" => "Cukur Jenggot",
            "type" => "service",
            "unit" => "sesi",
            "cost_price" => 3000,
            "sell_price" => 15000,
            "track_stock" => false,
            "preparation_time" => 10,
        ]);
        Product::create([
            "store_id" => $store3->id,
            "category_id" => $cat("layanan-extra", $store3->id),
            "sku" => "S3-SV-005",
            "name" => "Creambath",
            "type" => "service",
            "unit" => "sesi",
            "cost_price" => 15000,
            "sell_price" => 60000,
            "track_stock" => false,
            "preparation_time" => 45,
        ]);
        Product::create([
            "store_id" => $store3->id,
            "category_id" => $cat("produk-barber", $store3->id),
            "sku" => "S3-PD-001",
            "barcode" => "8997003000001",
            "name" => "Pomade Rambut",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 25000,
            "sell_price" => 45000,
            "stock_minimum" => 5,
            "track_stock" => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 4 — Sewa Alat Jaya (Rental)
        // ══════════════════════════════════════════════════════════════
        Product::create([
            "store_id" => $store4->id,
            "category_id" => $cat("alat-berat", $store4->id),
            "sku" => "S4-RT-001",
            "name" => "Sewa Molen Beton (per hari)",
            "type" => "service",
            "unit" => "hari",
            "cost_price" => 40000,
            "sell_price" => 80000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store4->id,
            "category_id" => $cat("alat-berat", $store4->id),
            "sku" => "S4-RT-002",
            "name" => "Sewa Scaffolding (per set/hari)",
            "type" => "service",
            "unit" => "hari",
            "cost_price" => 25000,
            "sell_price" => 50000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store4->id,
            "category_id" => $cat("kamera-audio", $store4->id),
            "sku" => "S4-RT-003",
            "name" => "Sewa Kamera DSLR (per hari)",
            "type" => "service",
            "unit" => "hari",
            "cost_price" => 50000,
            "sell_price" => 100000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store4->id,
            "category_id" => $cat("kamera-audio", $store4->id),
            "sku" => "S4-RT-004",
            "name" => "Sewa Sound System (per set/hari)",
            "type" => "service",
            "unit" => "hari",
            "cost_price" => 75000,
            "sell_price" => 150000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store4->id,
            "category_id" => $cat("event-pesta", $store4->id),
            "sku" => "S4-RT-005",
            "name" => "Sewa Tenda Roder (per set/hari)",
            "type" => "service",
            "unit" => "hari",
            "cost_price" => 100000,
            "sell_price" => 200000,
            "track_stock" => false,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 5 — Futsal Merdeka (Ticket / Booking)
        // ══════════════════════════════════════════════════════════════
        Product::create([
            "store_id" => $store5->id,
            "category_id" => $cat("futsal", $store5->id),
            "sku" => "S5-TK-001",
            "name" => "Lapangan Futsal (per jam)",
            "type" => "service",
            "unit" => "jam",
            "cost_price" => 30000,
            "sell_price" => 120000,
            "track_stock" => false,
            "preparation_time" => 60,
        ]);
        Product::create([
            "store_id" => $store5->id,
            "category_id" => $cat("futsal", $store5->id),
            "sku" => "S5-TK-002",
            "name" => "Sewa Rompi (per pcs)",
            "type" => "service",
            "unit" => "pcs",
            "cost_price" => 2000,
            "sell_price" => 10000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store5->id,
            "category_id" => $cat("futsal", $store5->id),
            "sku" => "S5-TK-003",
            "name" => "Sewa Bola",
            "type" => "service",
            "unit" => "pcs",
            "cost_price" => 3000,
            "sell_price" => 15000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store5->id,
            "category_id" => $cat("minuman-ticket", $store5->id),
            "sku" => "S5-TK-004",
            "name" => "Air Mineral 600ml",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 3000,
            "sell_price" => 5000,
            "stock_minimum" => 20,
            "track_stock" => true,
        ]);
        Product::create([
            "store_id" => $store5->id,
            "category_id" => $cat("minuman-ticket", $store5->id),
            "sku" => "S5-TK-005",
            "name" => "Minuman Isotonik",
            "type" => "finished_goods",
            "unit" => "pcs",
            "cost_price" => 5000,
            "sell_price" => 8000,
            "stock_minimum" => 10,
            "track_stock" => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 6 — Villa Sunrise (Hospitality)
        // ══════════════════════════════════════════════════════════════
        Product::create([
            "store_id" => $store6->id,
            "category_id" => $cat("kamar", $store6->id),
            "sku" => "S6-HT-001",
            "name" => "Kamar Standard (per malam)",
            "type" => "service",
            "unit" => "malam",
            "cost_price" => 100000,
            "sell_price" => 350000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store6->id,
            "category_id" => $cat("kamar", $store6->id),
            "sku" => "S6-HT-002",
            "name" => "Kamar Deluxe (per malam)",
            "type" => "service",
            "unit" => "malam",
            "cost_price" => 200000,
            "sell_price" => 550000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store6->id,
            "category_id" => $cat("kamar", $store6->id),
            "sku" => "S6-HT-003",
            "name" => "Kamar Suite (per malam)",
            "type" => "service",
            "unit" => "malam",
            "cost_price" => 350000,
            "sell_price" => 850000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store6->id,
            "category_id" => $cat("layanan-hotel", $store6->id),
            "sku" => "S6-HT-004",
            "name" => "Extra Bed",
            "type" => "service",
            "unit" => "pcs",
            "cost_price" => 30000,
            "sell_price" => 100000,
            "track_stock" => false,
        ]);
        Product::create([
            "store_id" => $store6->id,
            "category_id" => $cat("layanan-hotel", $store6->id),
            "sku" => "S6-HT-005",
            "name" => "Breakfast Buffet",
            "type" => "service",
            "unit" => "pax",
            "cost_price" => 30000,
            "sell_price" => 75000,
            "track_stock" => false,
        ]);
    }
}
