<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $s1 = Store::where('code', 'STORE001')->firstOrFail(); // Minimarket Sejahtera (retail)
        $s2 = Store::where('code', 'STORE002')->firstOrFail(); // Warung Kopi Senja (fnb)
        $s3 = Store::where('code', 'STORE003')->firstOrFail(); // Barbershop Rapi (service)
        $s4 = Store::where('code', 'STORE004')->firstOrFail(); // Sewa Alat Jaya (rental)
        $s5 = Store::where('code', 'STORE005')->firstOrFail(); // Bioskop Nusantara (ticket)
        $s6 = Store::where('code', 'STORE006')->firstOrFail(); // Villa Sunrise (hospitality)
        $s7 = Store::where('code', 'STORE007')->firstOrFail(); // Parkir Jayabaya (parking)
        $s8 = Store::where('code', 'STORE008')->firstOrFail(); // GamerZone (session)

        // ══════════════════════════════════════════════════════════════
        // STORE 1 — Minimarket Sejahtera (retail)
        // Produk fisik, track_stock=true, tipe finished_goods
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $s1->id, 'sku' => 'S1-001'],
            [
                'category_id'  => null,
                'supplier_id'  => null,
                'barcode'      => '8991101000011',
                'name'         => 'Indomie Goreng',
                'description'  => 'Mie instan goreng rasa ayam bawang, 85gr per bungkus.',
                'type'         => 'finished_goods',
                'unit'         => 'pcs',
                'cost_price'   => 2800,
                'sell_price'   => 4000,
                'stock_minimum'=> 20,
                'track_stock'  => true,
                'is_sellable'  => true,
                'is_active'    => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s1->id, 'sku' => 'S1-002'],
            [
                'category_id'  => null,
                'supplier_id'  => null,
                'barcode'      => '8997225000020',
                'name'         => 'Aqua 600ml',
                'description'  => 'Air mineral dalam kemasan botol 600ml.',
                'type'         => 'finished_goods',
                'unit'         => 'pcs',
                'cost_price'   => 2500,
                'sell_price'   => 4000,
                'stock_minimum'=> 24,
                'track_stock'  => true,
                'is_sellable'  => true,
                'is_active'    => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s1->id, 'sku' => 'S1-003'],
            [
                'category_id'  => null,
                'supplier_id'  => null,
                'barcode'      => '8999999000031',
                'name'         => 'Susu Ultra 200ml',
                'description'  => 'Susu UHT rasa full cream, kemasan 200ml.',
                'type'         => 'finished_goods',
                'unit'         => 'pcs',
                'cost_price'   => 3800,
                'sell_price'   => 5500,
                'stock_minimum'=> 12,
                'track_stock'  => true,
                'is_sellable'  => true,
                'is_active'    => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s1->id, 'sku' => 'S1-004'],
            [
                'category_id'  => null,
                'supplier_id'  => null,
                'barcode'      => '8887290000041',
                'name'         => 'Sabun Lifebuoy 100gr',
                'description'  => 'Sabun mandi batang antibakteri 100gr.',
                'type'         => 'finished_goods',
                'unit'         => 'pcs',
                'cost_price'   => 5500,
                'sell_price'   => 8500,
                'stock_minimum'=> 6,
                'track_stock'  => true,
                'is_sellable'  => true,
                'is_active'    => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s1->id, 'sku' => 'S1-005'],
            [
                'category_id'  => null,
                'supplier_id'  => null,
                'barcode'      => '8991102000051',
                'name'         => 'Beras Rojolele 5kg',
                'description'  => 'Beras putih premium varietas Rojolele, kemasan 5kg.',
                'type'         => 'finished_goods',
                'unit'         => 'pcs',
                'cost_price'   => 60000,
                'sell_price'   => 72000,
                'stock_minimum'=> 10,
                'track_stock'  => true,
                'is_sellable'  => true,
                'is_active'    => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s1->id, 'sku' => 'S1-006'],
            [
                'category_id'  => null,
                'supplier_id'  => null,
                'barcode'      => '8991103000061',
                'name'         => 'Minyak Goreng Tropical 1L',
                'description'  => 'Minyak goreng sawit murni kemasan 1 liter.',
                'type'         => 'finished_goods',
                'unit'         => 'pcs',
                'cost_price'   => 15000,
                'sell_price'   => 21000,
                'stock_minimum'=> 12,
                'track_stock'  => true,
                'is_sellable'  => true,
                'is_active'    => true,
            ]
        );

        // ══════════════════════════════════════════════════════════════
        // STORE 2 — Warung Kopi Senja (fnb)
        // Menu minuman + makanan, preparation_time, tipe finished_goods
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $s2->id, 'sku' => 'S2-001'],
            [
                'category_id'     => null,
                'supplier_id'     => null,
                'name'            => 'Kopi Susu Gula Aren',
                'description'     => 'Espresso shot dengan susu fresh dan gula aren asli.',
                'type'            => 'finished_goods',
                'preparation_time'=> 5,
                'unit'            => 'pcs',
                'cost_price'      => 8000,
                'sell_price'      => 22000,
                'track_stock'     => false,
                'is_sellable'     => true,
                'is_active'       => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s2->id, 'sku' => 'S2-002'],
            [
                'category_id'     => null,
                'supplier_id'     => null,
                'name'            => 'Americano',
                'description'     => 'Espresso double shot dengan air panas, rasa kopi kuat.',
                'type'            => 'finished_goods',
                'preparation_time'=> 3,
                'unit'            => 'pcs',
                'cost_price'      => 5000,
                'sell_price'      => 18000,
                'track_stock'     => false,
                'is_sellable'     => true,
                'is_active'       => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s2->id, 'sku' => 'S2-003'],
            [
                'category_id'     => null,
                'supplier_id'     => null,
                'name'            => 'Matcha Latte',
                'description'     => 'Matcha premium Jepang dengan susu segar dan sedikit pemanis.',
                'type'            => 'finished_goods',
                'preparation_time'=> 5,
                'unit'            => 'pcs',
                'cost_price'      => 9000,
                'sell_price'      => 25000,
                'track_stock'     => false,
                'is_sellable'     => true,
                'is_active'       => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s2->id, 'sku' => 'S2-004'],
            [
                'category_id'     => null,
                'supplier_id'     => null,
                'name'            => 'Croissant Butter',
                'description'     => 'Croissant lembut berlapis mentega, dipanggang fresh setiap hari.',
                'type'            => 'finished_goods',
                'preparation_time'=> 2,
                'unit'            => 'pcs',
                'cost_price'      => 8000,
                'sell_price'      => 20000,
                'track_stock'     => false,
                'is_sellable'     => true,
                'is_active'       => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s2->id, 'sku' => 'S2-005'],
            [
                'category_id'     => null,
                'supplier_id'     => null,
                'name'            => 'Nasi Goreng Spesial',
                'description'     => 'Nasi goreng dengan telur, ayam suwir, kerupuk, dan acar.',
                'type'            => 'finished_goods',
                'preparation_time'=> 10,
                'unit'            => 'pcs',
                'cost_price'      => 10000,
                'sell_price'      => 28000,
                'track_stock'     => false,
                'is_sellable'     => true,
                'is_active'       => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s2->id, 'sku' => 'S2-006'],
            [
                'category_id'     => null,
                'supplier_id'     => null,
                'name'            => 'Roti Bakar Coklat',
                'description'     => 'Roti tawar panggang dengan selai coklat dan margarin.',
                'type'            => 'finished_goods',
                'preparation_time'=> 5,
                'unit'            => 'pcs',
                'cost_price'      => 5000,
                'sell_price'      => 15000,
                'track_stock'     => false,
                'is_sellable'     => true,
                'is_active'       => true,
            ]
        );

        // ══════════════════════════════════════════════════════════════
        // STORE 3 — Barbershop Rapi (service)
        // Layanan jasa, tipe service, track_stock=false
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $s3->id, 'sku' => 'S3-001'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Potong Rambut Regular',
                'description' => 'Potong rambut + blow dry + sisir. Termasuk konsultasi gaya.',
                'type'        => 'service',
                'unit'        => 'kunjungan',
                'cost_price'  => 10000,
                'sell_price'  => 35000,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s3->id, 'sku' => 'S3-002'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Potong + Keramas',
                'description' => 'Potong rambut, keramas, kondisioner, dan blow dry.',
                'type'        => 'service',
                'unit'        => 'kunjungan',
                'cost_price'  => 18000,
                'sell_price'  => 55000,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s3->id, 'sku' => 'S3-003'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Cukur Jenggot',
                'description' => 'Pencukuran jenggot rapi dengan pisau cukur dan foam.',
                'type'        => 'service',
                'unit'        => 'kunjungan',
                'cost_price'  => 8000,
                'sell_price'  => 25000,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s3->id, 'sku' => 'S3-004'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Cat Rambut',
                'description' => 'Cat rambut pilihan warna, termasuk kondisioner pasca pewarnaan.',
                'type'        => 'service',
                'unit'        => 'kunjungan',
                'cost_price'  => 60000,
                'sell_price'  => 150000,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s3->id, 'sku' => 'S3-005'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Hair Mask Treatment',
                'description' => 'Perawatan rambut intensif dengan masker protein dan steam.',
                'type'        => 'service',
                'unit'        => 'kunjungan',
                'cost_price'  => 30000,
                'sell_price'  => 75000,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        // ══════════════════════════════════════════════════════════════
        // STORE 4 — Sewa Alat Jaya (rental)
        // rental_item, track_stock=true (stok = unit tersedia), deposit
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $s4->id, 'sku' => 'S4-001'],
            [
                'category_id'    => null,
                'supplier_id'    => null,
                'name'           => 'Tenda Dome 4 Orang',
                'description'    => 'Tenda camping waterproof kapasitas 4 orang, lengkap dengan tiang dan pasak.',
                'type'           => 'rental_item',
                'unit'           => 'unit',
                'cost_price'     => 30000,
                'sell_price'     => 75000,
                'deposit_amount' => 200000,
                'stock_minimum'  => 1,
                'track_stock'    => true,
                'is_sellable'    => true,
                'is_active'      => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s4->id, 'sku' => 'S4-002'],
            [
                'category_id'    => null,
                'supplier_id'    => null,
                'name'           => 'Matras Camping',
                'description'    => 'Matras tidur lipat untuk camping, ringan dan tahan lembab.',
                'type'           => 'rental_item',
                'unit'           => 'unit',
                'cost_price'     => 8000,
                'sell_price'     => 25000,
                'deposit_amount' => 50000,
                'stock_minimum'  => 2,
                'track_stock'    => true,
                'is_sellable'    => true,
                'is_active'      => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s4->id, 'sku' => 'S4-003'],
            [
                'category_id'    => null,
                'supplier_id'    => null,
                'name'           => 'Kompor Gas Portable',
                'description'    => 'Kompor gas portable single burner untuk camping dan outdoor.',
                'type'           => 'rental_item',
                'unit'           => 'unit',
                'cost_price'     => 10000,
                'sell_price'     => 30000,
                'deposit_amount' => 100000,
                'stock_minimum'  => 1,
                'track_stock'    => true,
                'is_sellable'    => true,
                'is_active'      => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s4->id, 'sku' => 'S4-004'],
            [
                'category_id'    => null,
                'supplier_id'    => null,
                'name'           => 'Kamera DSLR Canon',
                'description'    => 'Kamera DSLR Canon EOS 2000D dengan lensa kit 18-55mm, tas, dan baterai cadangan.',
                'type'           => 'rental_item',
                'unit'           => 'unit',
                'cost_price'     => 50000,
                'sell_price'     => 150000,
                'deposit_amount' => 500000,
                'stock_minimum'  => 1,
                'track_stock'    => true,
                'is_sellable'    => true,
                'is_active'      => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s4->id, 'sku' => 'S4-005'],
            [
                'category_id'    => null,
                'supplier_id'    => null,
                'name'           => 'Sepeda Gunung',
                'description'    => 'Sepeda gunung 21-speed, cocok untuk trek alam dan perkotaan.',
                'type'           => 'rental_item',
                'unit'           => 'unit',
                'cost_price'     => 20000,
                'sell_price'     => 50000,
                'deposit_amount' => 300000,
                'stock_minimum'  => 1,
                'track_stock'    => true,
                'is_sellable'    => true,
                'is_active'      => true,
            ]
        );

        // ══════════════════════════════════════════════════════════════
        // STORE 5 — Bioskop Nusantara (ticket)
        // time_based, capacity, valid_duration_minutes
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $s5->id, 'sku' => 'S5-001'],
            [
                'category_id'           => null,
                'supplier_id'           => null,
                'name'                  => 'Tiket Reguler',
                'description'           => 'Tiket bioskop reguler, kursi non-VIP dengan kenyamanan standar.',
                'type'                  => 'time_based',
                'unit'                  => 'tiket',
                'cost_price'            => 15000,
                'sell_price'            => 50000,
                'capacity'              => 100,
                'valid_duration_minutes'=> 150,
                'track_stock'           => false,
                'is_sellable'           => true,
                'is_active'             => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s5->id, 'sku' => 'S5-002'],
            [
                'category_id'           => null,
                'supplier_id'           => null,
                'name'                  => 'Tiket VIP',
                'description'           => 'Kursi VIP dengan tempat duduk premium, recliner, dan snack gratis.',
                'type'                  => 'time_based',
                'unit'                  => 'tiket',
                'cost_price'            => 30000,
                'sell_price'            => 85000,
                'capacity'              => 30,
                'valid_duration_minutes'=> 150,
                'track_stock'           => false,
                'is_sellable'           => true,
                'is_active'             => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s5->id, 'sku' => 'S5-003'],
            [
                'category_id'           => null,
                'supplier_id'           => null,
                'name'                  => 'Tiket Couple',
                'description'           => 'Sofa couple 2 kursi berdampingan, cocok untuk pasangan.',
                'type'                  => 'time_based',
                'unit'                  => 'pasang',
                'cost_price'            => 50000,
                'sell_price'            => 150000,
                'capacity'              => 15,
                'valid_duration_minutes'=> 150,
                'track_stock'           => false,
                'is_sellable'           => true,
                'is_active'             => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s5->id, 'sku' => 'S5-004'],
            [
                'category_id'           => null,
                'supplier_id'           => null,
                'name'                  => 'Tiket Anak-Anak',
                'description'           => 'Tiket khusus anak usia di bawah 12 tahun, film rating SU.',
                'type'                  => 'time_based',
                'unit'                  => 'tiket',
                'cost_price'            => 10000,
                'sell_price'            => 35000,
                'capacity'              => 50,
                'valid_duration_minutes'=> 90,
                'track_stock'           => false,
                'is_sellable'           => true,
                'is_active'             => true,
            ]
        );

        // ══════════════════════════════════════════════════════════════
        // STORE 6 — Villa Sunrise (hospitality)
        // time_based, max_guests, sell_price = tarif per malam
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $s6->id, 'sku' => 'S6-001'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Kamar Standard',
                'description' => 'Kamar AC, 1 kasur double, kamar mandi dalam, TV 32 inci, dan sarapan.',
                'type'        => 'time_based',
                'unit'        => 'malam',
                'cost_price'  => 120000,
                'sell_price'  => 350000,
                'max_guests'  => 2,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s6->id, 'sku' => 'S6-002'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Kamar Deluxe',
                'description' => 'Kamar AC luas, 1 kasur king, balkon dengan view taman, dan minibar.',
                'type'        => 'time_based',
                'unit'        => 'malam',
                'cost_price'  => 200000,
                'sell_price'  => 500000,
                'max_guests'  => 2,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s6->id, 'sku' => 'S6-003'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Villa Family',
                'description' => 'Villa 3 kamar tidur, dapur lengkap, ruang keluarga, dan kolam renang pribadi.',
                'type'        => 'time_based',
                'unit'        => 'malam',
                'cost_price'  => 450000,
                'sell_price'  => 1200000,
                'max_guests'  => 6,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s6->id, 'sku' => 'S6-004'],
            [
                'category_id' => null,
                'supplier_id' => null,
                'name'        => 'Suite Room',
                'description' => 'Suite premium dengan bathtub, sofa lounge, minibar, dan view pegunungan.',
                'type'        => 'time_based',
                'unit'        => 'malam',
                'cost_price'  => 300000,
                'sell_price'  => 800000,
                'max_guests'  => 2,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active'   => true,
            ]
        );

        // ══════════════════════════════════════════════════════════════
        // STORE 7 — Parkir Jayabaya (parking)
        // time_based, session_duration_minutes=0 (per transaksi), price_per_hour
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $s7->id, 'sku' => 'S7-001'],
            [
                'category_id'              => null,
                'supplier_id'              => null,
                'name'                     => 'Parkir Motor',
                'description'              => 'Tarif parkir sepeda motor per transaksi masuk-keluar.',
                'type'                     => 'time_based',
                'unit'                     => 'kendaraan',
                'cost_price'               => 0,
                'sell_price'               => 3000,
                'price_per_hour'           => 2000,
                'session_duration_minutes' => 0,
                'track_stock'              => false,
                'is_sellable'              => true,
                'is_active'                => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s7->id, 'sku' => 'S7-002'],
            [
                'category_id'              => null,
                'supplier_id'              => null,
                'name'                     => 'Parkir Mobil',
                'description'              => 'Tarif parkir mobil per transaksi masuk-keluar.',
                'type'                     => 'time_based',
                'unit'                     => 'kendaraan',
                'cost_price'               => 0,
                'sell_price'               => 5000,
                'price_per_hour'           => 3000,
                'session_duration_minutes' => 0,
                'track_stock'              => false,
                'is_sellable'              => true,
                'is_active'                => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s7->id, 'sku' => 'S7-003'],
            [
                'category_id'              => null,
                'supplier_id'              => null,
                'name'                     => 'Parkir Truk/Bus',
                'description'              => 'Tarif parkir kendaraan besar (truk dan bus) per transaksi.',
                'type'                     => 'time_based',
                'unit'                     => 'kendaraan',
                'cost_price'               => 0,
                'sell_price'               => 10000,
                'price_per_hour'           => 5000,
                'session_duration_minutes' => 0,
                'track_stock'              => false,
                'is_sellable'              => true,
                'is_active'                => true,
            ]
        );

        // ══════════════════════════════════════════════════════════════
        // STORE 8 — GamerZone (session)
        // time_based, session_duration_minutes = durasi paket
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $s8->id, 'sku' => 'S8-001'],
            [
                'category_id'              => null,
                'supplier_id'              => null,
                'name'                     => 'Paket 1 Jam',
                'description'              => 'Akses 1 jam ke semua fasilitas warnet dan konsol PS.',
                'type'                     => 'time_based',
                'unit'                     => 'sesi',
                'cost_price'               => 2000,
                'sell_price'               => 8000,
                'price_per_hour'           => 8000,
                'session_duration_minutes' => 60,
                'track_stock'              => false,
                'is_sellable'              => true,
                'is_active'                => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s8->id, 'sku' => 'S8-002'],
            [
                'category_id'              => null,
                'supplier_id'              => null,
                'name'                     => 'Paket 2 Jam',
                'description'              => 'Akses 2 jam ke semua fasilitas, hemat dibanding beli per jam.',
                'type'                     => 'time_based',
                'unit'                     => 'sesi',
                'cost_price'               => 4000,
                'sell_price'               => 15000,
                'price_per_hour'           => 7500,
                'session_duration_minutes' => 120,
                'track_stock'              => false,
                'is_sellable'              => true,
                'is_active'                => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s8->id, 'sku' => 'S8-003'],
            [
                'category_id'              => null,
                'supplier_id'              => null,
                'name'                     => 'Paket 5 Jam',
                'description'              => 'Akses 5 jam non-stop, cocok untuk marathon gaming.',
                'type'                     => 'time_based',
                'unit'                     => 'sesi',
                'cost_price'               => 10000,
                'sell_price'               => 35000,
                'price_per_hour'           => 7000,
                'session_duration_minutes' => 300,
                'track_stock'              => false,
                'is_sellable'              => true,
                'is_active'                => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s8->id, 'sku' => 'S8-004'],
            [
                'category_id'              => null,
                'supplier_id'              => null,
                'name'                     => 'Paket Malam',
                'description'              => 'Paket overnight 8 jam mulai pukul 22:00, harga spesial.',
                'type'                     => 'time_based',
                'unit'                     => 'sesi',
                'cost_price'               => 8000,
                'sell_price'               => 25000,
                'price_per_hour'           => 3125,
                'session_duration_minutes' => 480,
                'track_stock'              => false,
                'is_sellable'              => true,
                'is_active'                => true,
            ]
        );

        Product::firstOrCreate(
            ['store_id' => $s8->id, 'sku' => 'S8-005'],
            [
                'category_id'              => null,
                'supplier_id'              => null,
                'name'                     => 'Member Harian',
                'description'              => 'Akses unlimited 1 hari penuh, bebas keluar masuk.',
                'type'                     => 'time_based',
                'unit'                     => 'hari',
                'cost_price'               => 20000,
                'sell_price'               => 50000,
                'price_per_hour'           => 0,
                'session_duration_minutes' => 0,
                'track_stock'              => false,
                'is_sellable'              => true,
                'is_active'                => true,
            ]
        );
    }
}
