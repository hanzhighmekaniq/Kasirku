<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $s1 = Store::where('code', 'STORE001')->firstOrFail();
        $s2 = Store::where('code', 'STORE002')->firstOrFail();
        $s3 = Store::where('code', 'STORE003')->firstOrFail();
        $s4 = Store::where('code', 'STORE004')->firstOrFail();
        $s5 = Store::where('code', 'STORE005')->firstOrFail();
        $s6 = Store::where('code', 'STORE006')->firstOrFail();
        $s7 = Store::where('code', 'STORE007')->firstOrFail();
        $s8 = Store::where('code', 'STORE008')->firstOrFail();

        // Category lookups for STORE001
        $catSembako = Category::where('store_id', $s1->id)->where('name', 'Sembako')->value('id');
        $catMinuman = Category::where('store_id', $s1->id)->where('name', 'Minuman')->value('id');
        $catSnack = Category::where('store_id', $s1->id)->where('name', 'Makanan Ringan')->value('id');
        $catKebersihan = Category::where('store_id', $s1->id)->where('name', 'Kebersihan & Perawatan')->value('id');
        $catRokok = Category::where('store_id', $s1->id)->where('name', 'Rokok & Lainnya')->value('id');

        // Category lookups for STORE002
        $catKopi = Category::where('store_id', $s2->id)->where('name', 'Kopi')->value('id');
        $catNonKopi = Category::where('store_id', $s2->id)->where('name', 'Non-Kopi')->value('id');
        $catMakanan = Category::where('store_id', $s2->id)->where('name', 'Makanan Berat')->value('id');
        $catPastry = Category::where('store_id', $s2->id)->where('name', 'Pastry & Roti')->value('id');

        // ══════════════════════════════════════════════════════════════
        // STORE 1 — Minimarket Sejahtera (retail)
        // ══════════════════════════════════════════════════════════════

        // Sembako
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-001'], [
            'category_id' => $catSembako, 'barcode' => '8991101000011',
            'name' => 'Indomie Goreng', 'description' => 'Mie instan goreng rasa ayam bawang, 85gr.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 2800, 'sell_price' => 4000,
            'stock_minimum' => 20, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-002'], [
            'category_id' => $catSembako, 'barcode' => '8991102000051',
            'name' => 'Beras Rojolele 5kg', 'description' => 'Beras putih premium varietas Rojolele, kemasan 5kg.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 60000, 'sell_price' => 72000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-003'], [
            'category_id' => $catSembako, 'barcode' => '8991103000061',
            'name' => 'Minyak Goreng Tropical 1L', 'description' => 'Minyak goreng sawit murni kemasan 1 liter.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 15000, 'sell_price' => 21000,
            'stock_minimum' => 12, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-004'], [
            'category_id' => $catSembako, 'barcode' => '8991104000071',
            'name' => 'Gula Pasir 1kg', 'description' => 'Gula pasir kristal putih kemasan 1kg.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 12000, 'sell_price' => 16000,
            'stock_minimum' => 15, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-005'], [
            'category_id' => $catSembako, 'barcode' => '8991105000081',
            'name' => 'Tepung Terigu 1kg', 'description' => 'Tepung terigu protein sedang kemasan 1kg.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 9000, 'sell_price' => 13000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // Minuman
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-006'], [
            'category_id' => $catMinuman, 'barcode' => '8997225000020',
            'name' => 'Aqua 600ml', 'description' => 'Air mineral dalam kemasan botol 600ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 2500, 'sell_price' => 4000,
            'stock_minimum' => 24, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-007'], [
            'category_id' => $catMinuman, 'barcode' => '8999999000031',
            'name' => 'Susu Ultra 200ml', 'description' => 'Susu UHT rasa full cream, kemasan 200ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 3800, 'sell_price' => 5500,
            'stock_minimum' => 12, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-008'], [
            'category_id' => $catMinuman, 'barcode' => '8991106000091',
            'name' => 'Teh Botol Sosro 450ml', 'description' => 'Teh kemasan rasa manis, botol 450ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 3500, 'sell_price' => 5000,
            'stock_minimum' => 20, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-009'], [
            'category_id' => $catMinuman, 'barcode' => '8991107000101',
            'name' => 'Coca Cola 390ml', 'description' => 'Minuman berkarbonasi rasa cola, botol 390ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 4000, 'sell_price' => 6500,
            'stock_minimum' => 12, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // Makanan Ringan
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-010'], [
            'category_id' => $catSnack, 'barcode' => '8991108000111',
            'name' => 'Chitato Sapi Panggang 68g', 'description' => 'Keripik kentang rasa sapi panggang.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 8500, 'sell_price' => 12000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-011'], [
            'category_id' => $catSnack, 'barcode' => '8991109000121',
            'name' => 'Oreo Vanilla 137g', 'description' => 'Biskuit coklat dengan krim vanilla.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 7000, 'sell_price' => 10500,
            'stock_minimum' => 8, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-012'], [
            'category_id' => $catSnack, 'barcode' => '8991110000131',
            'name' => 'Taro Net 36g', 'description' => 'Snack jagung jaring rasa rumput laut.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 2000, 'sell_price' => 3500,
            'stock_minimum' => 15, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // Kebersihan & Perawatan
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-013'], [
            'category_id' => $catKebersihan, 'barcode' => '8887290000041',
            'name' => 'Sabun Lifebuoy 100gr', 'description' => 'Sabun mandi batang antibakteri 100gr.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 5500, 'sell_price' => 8500,
            'stock_minimum' => 6, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-014'], [
            'category_id' => $catKebersihan, 'barcode' => '8991111000141',
            'name' => 'Shampoo Sunsilk 160ml', 'description' => 'Shampoo rambut hitam lurus 160ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 15000, 'sell_price' => 22000,
            'stock_minimum' => 6, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-015'], [
            'category_id' => $catKebersihan, 'barcode' => '8991112000151',
            'name' => 'Pasta Gigi Pepsodent 190g', 'description' => 'Pasta gigi untuk perlindungan gigi dan gusi.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 12000, 'sell_price' => 18000,
            'stock_minimum' => 6, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-016'], [
            'category_id' => $catKebersihan, 'barcode' => '8991113000161',
            'name' => 'Deterjen Rinso 770g', 'description' => 'Deterjen bubuk untuk cucian harian.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 14000, 'sell_price' => 20000,
            'stock_minimum' => 6, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // Rokok & Lainnya
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-017'], [
            'category_id' => $catRokok, 'barcode' => '8991114000171',
            'name' => 'Gudang Garam Surya 12', 'description' => 'Rokok kretek filter isi 12 batang.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 18000, 'sell_price' => 22000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-018'], [
            'category_id' => $catRokok, 'barcode' => '8991115000181',
            'name' => 'Sampoerna Mild 16', 'description' => 'Rokok mild filter isi 16 batang.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 24000, 'sell_price' => 28000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-019'], [
            'category_id' => $catRokok, 'barcode' => '8991116000191',
            'name' => 'Kopi Torabika 3in1 25g', 'description' => 'Kopi instan 3in1 sachet.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 2000, 'sell_price' => 3500,
            'stock_minimum' => 30, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s1->id, 'sku' => 'S1-020'], [
            'category_id' => $catRokok, 'barcode' => '8991117000201',
            'name' => 'Susu Kental Manis Frisian Flag 370g', 'description' => 'Susu kental manis kaleng.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 8000, 'sell_price' => 12000,
            'stock_minimum' => 12, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 2 — Warung Kopi Senja (fnb)
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(['store_id' => $s2->id, 'sku' => 'S2-001'], [
            'category_id' => $catKopi, 'name' => 'Kopi Susu Gula Aren',
            'description' => 'Espresso shot dengan susu fresh dan gula aren asli.',
            'type' => 'finished_goods', 'preparation_time' => 5, 'unit' => 'pcs',
            'cost_price' => 8000, 'sell_price' => 22000, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s2->id, 'sku' => 'S2-002'], [
            'category_id' => $catKopi, 'name' => 'Americano',
            'description' => 'Espresso double shot dengan air panas.',
            'type' => 'finished_goods', 'preparation_time' => 3, 'unit' => 'pcs',
            'cost_price' => 5000, 'sell_price' => 18000, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s2->id, 'sku' => 'S2-003'], [
            'category_id' => $catKopi, 'name' => 'Cappuccino',
            'description' => 'Espresso dengan steamed milk dan foam tebal.',
            'type' => 'finished_goods', 'preparation_time' => 4, 'unit' => 'pcs',
            'cost_price' => 7000, 'sell_price' => 22000, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s2->id, 'sku' => 'S2-004'], [
            'category_id' => $catNonKopi, 'name' => 'Matcha Latte',
            'description' => 'Matcha premium Jepang dengan susu segar.',
            'type' => 'finished_goods', 'preparation_time' => 5, 'unit' => 'pcs',
            'cost_price' => 9000, 'sell_price' => 25000, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s2->id, 'sku' => 'S2-005'], [
            'category_id' => $catMakanan, 'name' => 'Nasi Goreng Spesial',
            'description' => 'Nasi goreng dengan telur, ayam suwir, kerupuk, dan acar.',
            'type' => 'finished_goods', 'preparation_time' => 10, 'unit' => 'pcs',
            'cost_price' => 10000, 'sell_price' => 28000, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s2->id, 'sku' => 'S2-006'], [
            'category_id' => $catPastry, 'name' => 'Croissant Butter',
            'description' => 'Croissant lembut berlapis mentega, dipanggang fresh.',
            'type' => 'finished_goods', 'preparation_time' => 2, 'unit' => 'pcs',
            'cost_price' => 8000, 'sell_price' => 20000, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 3 — Barbershop Rapi (service)
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(['store_id' => $s3->id, 'sku' => 'S3-001'], [
            'name' => 'Potong Rambut Regular', 'description' => 'Potong rambut + blow dry + sisir.',
            'type' => 'service', 'unit' => 'kunjungan', 'cost_price' => 10000, 'sell_price' => 35000,
            'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s3->id, 'sku' => 'S3-002'], [
            'name' => 'Potong + Keramas', 'description' => 'Potong rambut, keramas, kondisioner, dan blow dry.',
            'type' => 'service', 'unit' => 'kunjungan', 'cost_price' => 18000, 'sell_price' => 55000,
            'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s3->id, 'sku' => 'S3-003'], [
            'name' => 'Cukur Jenggot', 'description' => 'Pencukuran jenggot rapi dengan pisau cukur.',
            'type' => 'service', 'unit' => 'kunjungan', 'cost_price' => 8000, 'sell_price' => 25000,
            'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s3->id, 'sku' => 'S3-004'], [
            'name' => 'Cat Rambut', 'description' => 'Cat rambut pilihan warna.',
            'type' => 'service', 'unit' => 'kunjungan', 'cost_price' => 60000, 'sell_price' => 150000,
            'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s3->id, 'sku' => 'S3-005'], [
            'name' => 'Hair Mask Treatment', 'description' => 'Perawatan rambut intensif dengan masker protein.',
            'type' => 'service', 'unit' => 'kunjungan', 'cost_price' => 30000, 'sell_price' => 75000,
            'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 4 — Sewa Alat Jaya (rental)
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(['store_id' => $s4->id, 'sku' => 'S4-001'], [
            'name' => 'Tenda Dome 4 Orang', 'description' => 'Tenda camping waterproof kapasitas 4 orang.',
            'type' => 'rental_item', 'unit' => 'unit', 'cost_price' => 30000, 'sell_price' => 75000,
            'deposit_amount' => 200000, 'stock_minimum' => 1, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s4->id, 'sku' => 'S4-002'], [
            'name' => 'Matras Camping', 'description' => 'Matras tidur lipat untuk camping.',
            'type' => 'rental_item', 'unit' => 'unit', 'cost_price' => 8000, 'sell_price' => 25000,
            'deposit_amount' => 50000, 'stock_minimum' => 2, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s4->id, 'sku' => 'S4-003'], [
            'name' => 'Kompor Gas Portable', 'description' => 'Kompor gas portable single burner.',
            'type' => 'rental_item', 'unit' => 'unit', 'cost_price' => 10000, 'sell_price' => 30000,
            'deposit_amount' => 100000, 'stock_minimum' => 1, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s4->id, 'sku' => 'S4-004'], [
            'name' => 'Kamera DSLR Canon', 'description' => 'Kamera DSLR Canon EOS 2000D dengan lensa kit.',
            'type' => 'rental_item', 'unit' => 'unit', 'cost_price' => 50000, 'sell_price' => 150000,
            'deposit_amount' => 500000, 'stock_minimum' => 1, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s4->id, 'sku' => 'S4-005'], [
            'name' => 'Sepeda Gunung', 'description' => 'Sepeda gunung 21-speed.',
            'type' => 'rental_item', 'unit' => 'unit', 'cost_price' => 20000, 'sell_price' => 50000,
            'deposit_amount' => 300000, 'stock_minimum' => 1, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 5 — Bioskop Nusantara (ticket)
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(['store_id' => $s5->id, 'sku' => 'S5-001'], [
            'name' => 'Tiket Reguler', 'description' => 'Tiket bioskop reguler.',
            'type' => 'time_based', 'unit' => 'tiket', 'cost_price' => 15000, 'sell_price' => 50000,
            'capacity' => 100, 'valid_duration_minutes' => 150, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s5->id, 'sku' => 'S5-002'], [
            'name' => 'Tiket VIP', 'description' => 'Kursi VIP recliner dengan snack gratis.',
            'type' => 'time_based', 'unit' => 'tiket', 'cost_price' => 30000, 'sell_price' => 85000,
            'capacity' => 30, 'valid_duration_minutes' => 150, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s5->id, 'sku' => 'S5-003'], [
            'name' => 'Tiket Couple', 'description' => 'Sofa couple 2 kursi berdampingan.',
            'type' => 'time_based', 'unit' => 'pasang', 'cost_price' => 50000, 'sell_price' => 150000,
            'capacity' => 15, 'valid_duration_minutes' => 150, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s5->id, 'sku' => 'S5-004'], [
            'name' => 'Tiket Anak-Anak', 'description' => 'Tiket khusus anak usia di bawah 12 tahun.',
            'type' => 'time_based', 'unit' => 'tiket', 'cost_price' => 10000, 'sell_price' => 35000,
            'capacity' => 50, 'valid_duration_minutes' => 90, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 6 — Villa Sunrise (hospitality)
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(['store_id' => $s6->id, 'sku' => 'S6-001'], [
            'name' => 'Kamar Standard', 'description' => 'Kamar AC, 1 kasur double, kamar mandi dalam.',
            'type' => 'time_based', 'unit' => 'malam', 'cost_price' => 120000, 'sell_price' => 350000,
            'max_guests' => 2, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s6->id, 'sku' => 'S6-002'], [
            'name' => 'Kamar Deluxe', 'description' => 'Kamar luas, kasur king, balkon view taman.',
            'type' => 'time_based', 'unit' => 'malam', 'cost_price' => 200000, 'sell_price' => 500000,
            'max_guests' => 2, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s6->id, 'sku' => 'S6-003'], [
            'name' => 'Villa Family', 'description' => 'Villa 3 kamar, dapur, kolam renang pribadi.',
            'type' => 'time_based', 'unit' => 'malam', 'cost_price' => 450000, 'sell_price' => 1200000,
            'max_guests' => 6, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s6->id, 'sku' => 'S6-004'], [
            'name' => 'Suite Room', 'description' => 'Suite premium dengan bathtub dan view pegunungan.',
            'type' => 'time_based', 'unit' => 'malam', 'cost_price' => 300000, 'sell_price' => 800000,
            'max_guests' => 2, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 7 — Parkir Jayabaya (parking)
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(['store_id' => $s7->id, 'sku' => 'S7-001'], [
            'name' => 'Parkir Motor', 'description' => 'Tarif parkir sepeda motor.',
            'type' => 'time_based', 'unit' => 'kendaraan', 'cost_price' => 0, 'sell_price' => 3000,
            'price_per_hour' => 2000, 'session_duration_minutes' => 0, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s7->id, 'sku' => 'S7-002'], [
            'name' => 'Parkir Mobil', 'description' => 'Tarif parkir mobil.',
            'type' => 'time_based', 'unit' => 'kendaraan', 'cost_price' => 0, 'sell_price' => 5000,
            'price_per_hour' => 3000, 'session_duration_minutes' => 0, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s7->id, 'sku' => 'S7-003'], [
            'name' => 'Parkir Truk/Bus', 'description' => 'Tarif parkir kendaraan besar.',
            'type' => 'time_based', 'unit' => 'kendaraan', 'cost_price' => 0, 'sell_price' => 10000,
            'price_per_hour' => 5000, 'session_duration_minutes' => 0, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // STORE 8 — GamerZone (session)
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(['store_id' => $s8->id, 'sku' => 'S8-001'], [
            'name' => 'Paket 1 Jam', 'description' => 'Akses 1 jam ke semua fasilitas.',
            'type' => 'time_based', 'unit' => 'sesi', 'cost_price' => 2000, 'sell_price' => 8000,
            'price_per_hour' => 8000, 'session_duration_minutes' => 60, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s8->id, 'sku' => 'S8-002'], [
            'name' => 'Paket 2 Jam', 'description' => 'Akses 2 jam, hemat dibanding beli per jam.',
            'type' => 'time_based', 'unit' => 'sesi', 'cost_price' => 4000, 'sell_price' => 15000,
            'price_per_hour' => 7500, 'session_duration_minutes' => 120, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s8->id, 'sku' => 'S8-003'], [
            'name' => 'Paket 5 Jam', 'description' => 'Akses 5 jam non-stop.',
            'type' => 'time_based', 'unit' => 'sesi', 'cost_price' => 10000, 'sell_price' => 35000,
            'price_per_hour' => 7000, 'session_duration_minutes' => 300, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s8->id, 'sku' => 'S8-004'], [
            'name' => 'Paket Malam', 'description' => 'Paket overnight 8 jam mulai 22:00.',
            'type' => 'time_based', 'unit' => 'sesi', 'cost_price' => 8000, 'sell_price' => 25000,
            'price_per_hour' => 3125, 'session_duration_minutes' => 480, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $s8->id, 'sku' => 'S8-005'], [
            'name' => 'Member Harian', 'description' => 'Akses unlimited 1 hari penuh.',
            'type' => 'time_based', 'unit' => 'hari', 'cost_price' => 20000, 'sell_price' => 50000,
            'price_per_hour' => 0, 'session_duration_minutes' => 0, 'track_stock' => false, 'is_sellable' => true, 'is_active' => true,
        ]);
    }
}
