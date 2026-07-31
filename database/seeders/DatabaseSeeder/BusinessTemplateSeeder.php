<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\BusinessTemplate;
use App\Models\BusinessTemplateCategory;
use App\Models\BusinessTemplateProduct;
use App\Models\StoreType;
use Illuminate\Database\Seeder;

/**
 * Katalog template bisnis yang ditawarkan saat registrasi — 2 tingkat
 * dengan StoreType (jenis usaha teknis) supaya user bisa memilih bisnis
 * spesifik yang cocok (mis. di bawah F&B ada Cafe, Restoran, Warteg).
 *
 * `is_ready` BUKAN kolom yang diisi manual di sini — itu derived state
 * (lihat BusinessTemplate::syncIsReady()) yang otomatis true begitu sebuah
 * template punya minimal 1 kategori. Isi kategori & produk contoh sendiri
 * sepenuhnya data-driven, dikelola developer lewat panel
 * /developer/business-templates — seeder ini hanya menyediakan 2 template
 * awal (Minimarket, Cafe) sebagai contoh referensi, sisanya sengaja
 * dibiarkan kosong supaya developer yang mengisi lewat UI.
 */
class BusinessTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'retail' => [
                ['code' => 'retail_minimarket', 'label' => 'Minimarket / Toko Kelontong', 'icon' => '🏪'],
                ['code' => 'retail_grocery', 'label' => 'Sembako & Grosir', 'icon' => '🧺'],
                ['code' => 'retail_pharmacy', 'label' => 'Apotek / Toko Obat', 'icon' => '💊'],
                ['code' => 'retail_clothing', 'label' => 'Toko Pakaian', 'icon' => '👕'],
                ['code' => 'retail_hardware', 'label' => 'Toko Bangunan & Material', 'icon' => '🔧'],
                ['code' => 'retail_gadget', 'label' => 'Toko HP & Aksesoris', 'icon' => '📱'],
            ],
            'fnb' => [
                ['code' => 'fnb_cafe', 'label' => 'Cafe / Coffee Shop', 'icon' => '☕'],
                ['code' => 'fnb_restaurant', 'label' => 'Restoran', 'icon' => '🍽️'],
                ['code' => 'fnb_warteg', 'label' => 'Warteg / Rumah Makan', 'icon' => '🍚'],
                ['code' => 'fnb_bakery', 'label' => 'Bakery / Toko Roti', 'icon' => '🥐'],
                ['code' => 'fnb_kopi_tradisional', 'label' => 'Warung Kopi Tradisional', 'icon' => '🫖'],
                ['code' => 'fnb_catering', 'label' => 'Catering / Frozen Food', 'icon' => '🍱'],
            ],
            'service' => [
                ['code' => 'service_salon', 'label' => 'Salon & Barbershop', 'icon' => '💇'],
                ['code' => 'service_laundry', 'label' => 'Laundry', 'icon' => '🧺'],
                ['code' => 'service_bengkel', 'label' => 'Bengkel Motor & Mobil', 'icon' => '🔧'],
                ['code' => 'service_spa', 'label' => 'Spa & Pijat', 'icon' => '💆'],
                ['code' => 'service_klinik_kecantikan', 'label' => 'Klinik Kecantikan', 'icon' => '✨'],
            ],
            'rental' => [
                ['code' => 'rental_kendaraan', 'label' => 'Rental Motor & Mobil', 'icon' => '🚗'],
                ['code' => 'rental_kamera', 'label' => 'Rental Kamera & Elektronik', 'icon' => '📷'],
                ['code' => 'rental_kostum', 'label' => 'Rental Kostum', 'icon' => '🎭'],
                ['code' => 'rental_pesta', 'label' => 'Rental Alat Pesta & Tenda', 'icon' => '🎪'],
            ],
            'ticket' => [
                ['code' => 'ticket_bioskop', 'label' => 'Bioskop / Studio', 'icon' => '🎬'],
                ['code' => 'ticket_futsal', 'label' => 'Lapangan Futsal & Olahraga', 'icon' => '⚽'],
                ['code' => 'ticket_event', 'label' => 'Event & Konser', 'icon' => '🎫'],
                ['code' => 'ticket_wahana', 'label' => 'Wahana / Playground Anak', 'icon' => '🎠'],
            ],
            'hospitality' => [
                ['code' => 'hospitality_hotel', 'label' => 'Hotel', 'icon' => '🏨'],
                ['code' => 'hospitality_villa', 'label' => 'Villa & Guest House', 'icon' => '🏡'],
                ['code' => 'hospitality_kost', 'label' => 'Kost', 'icon' => '🛏️'],
                ['code' => 'hospitality_homestay', 'label' => 'Homestay', 'icon' => '🏠'],
            ],
            'parking' => [
                ['code' => 'parking_mall', 'label' => 'Parkir Mall / Gedung', 'icon' => '🅿️'],
                ['code' => 'parking_motor', 'label' => 'Parkir Khusus Motor', 'icon' => '🏍️'],
                ['code' => 'parking_valet', 'label' => 'Valet', 'icon' => '🚘'],
            ],
            'session' => [
                ['code' => 'session_warnet', 'label' => 'Warnet', 'icon' => '💻'],
                ['code' => 'session_ps', 'label' => 'Rental PS / Game Console', 'icon' => '🎮'],
                ['code' => 'session_karaoke', 'label' => 'Karaoke', 'icon' => '🎤'],
                ['code' => 'session_billiard', 'label' => 'Billiard', 'icon' => '🎱'],
            ],
        ];

        $templatesByCode = [];

        foreach ($catalog as $storeTypeCode => $templates) {
            $storeType = StoreType::where('code', $storeTypeCode)->first();

            if (! $storeType) {
                continue;
            }

            foreach ($templates as $sortOrder => $template) {
                $model = BusinessTemplate::updateOrCreate(
                    ['code' => $template['code']],
                    [
                        'store_type_id' => $storeType->id,
                        'label' => $template['label'],
                        'icon' => $template['icon'],
                        'description' => $template['description'] ?? null,
                        'is_active' => true,
                        'sort_order' => $sortOrder + 1,
                    ],
                );

                $templatesByCode[$template['code']] = $model;
            }
        }

        $this->seedRetailMinimarket($templatesByCode['retail_minimarket'] ?? null);
        $this->seedFnbCafe($templatesByCode['fnb_cafe'] ?? null);
    }

    /** Kategori & produk contoh referensi untuk template Minimarket. */
    private function seedRetailMinimarket(?BusinessTemplate $template): void
    {
        if (! $template) {
            return;
        }

        $categories = [
            'Sembako' => [
                ['sku' => 'RM-001', 'name' => 'Beras Rojolele 5kg', 'unit' => 'pcs', 'cost_price' => 60000, 'sell_price' => 72000, 'stock_minimum' => 10, 'track_stock' => true],
                ['sku' => 'RM-002', 'name' => 'Minyak Goreng 1L', 'unit' => 'pcs', 'cost_price' => 15000, 'sell_price' => 21000, 'stock_minimum' => 12, 'track_stock' => true],
                ['sku' => 'RM-003', 'name' => 'Gula Pasir 1kg', 'unit' => 'pcs', 'cost_price' => 12000, 'sell_price' => 16000, 'stock_minimum' => 15, 'track_stock' => true],
                ['sku' => 'RM-004', 'name' => 'Tepung Terigu 1kg', 'unit' => 'pcs', 'cost_price' => 9000, 'sell_price' => 13000, 'stock_minimum' => 10, 'track_stock' => true],
                ['sku' => 'RM-005', 'name' => 'Indomie Goreng', 'unit' => 'pcs', 'cost_price' => 2800, 'sell_price' => 4000, 'stock_minimum' => 20, 'track_stock' => true],
            ],
            'Minuman' => [
                ['sku' => 'RM-010', 'name' => 'Aqua 600ml', 'unit' => 'pcs', 'cost_price' => 2500, 'sell_price' => 4000, 'stock_minimum' => 24, 'track_stock' => true],
                ['sku' => 'RM-011', 'name' => 'Teh Botol Sosro 450ml', 'unit' => 'pcs', 'cost_price' => 3500, 'sell_price' => 5000, 'stock_minimum' => 20, 'track_stock' => true],
                ['sku' => 'RM-012', 'name' => 'Coca Cola 390ml', 'unit' => 'pcs', 'cost_price' => 4000, 'sell_price' => 6500, 'stock_minimum' => 12, 'track_stock' => true],
                ['sku' => 'RM-013', 'name' => 'Susu Ultra 200ml', 'unit' => 'pcs', 'cost_price' => 3800, 'sell_price' => 5500, 'stock_minimum' => 12, 'track_stock' => true],
            ],
            'Makanan Ringan' => [
                ['sku' => 'RM-020', 'name' => 'Chitato Sapi Panggang 68g', 'unit' => 'pcs', 'cost_price' => 8500, 'sell_price' => 12000, 'stock_minimum' => 10, 'track_stock' => true],
                ['sku' => 'RM-021', 'name' => 'Oreo Vanilla 137g', 'unit' => 'pcs', 'cost_price' => 7000, 'sell_price' => 10500, 'stock_minimum' => 8, 'track_stock' => true],
                ['sku' => 'RM-022', 'name' => 'Taro Net 36g', 'unit' => 'pcs', 'cost_price' => 2000, 'sell_price' => 3500, 'stock_minimum' => 15, 'track_stock' => true],
            ],
            'Kebersihan & Perawatan' => [
                ['sku' => 'RM-030', 'name' => 'Sabun Lifebuoy 100gr', 'unit' => 'pcs', 'cost_price' => 5500, 'sell_price' => 8500, 'stock_minimum' => 6, 'track_stock' => true],
                ['sku' => 'RM-031', 'name' => 'Shampoo Sunsilk 160ml', 'unit' => 'pcs', 'cost_price' => 15000, 'sell_price' => 22000, 'stock_minimum' => 6, 'track_stock' => true],
                ['sku' => 'RM-032', 'name' => 'Pasta Gigi Pepsodent 190g', 'unit' => 'pcs', 'cost_price' => 12000, 'sell_price' => 18000, 'stock_minimum' => 6, 'track_stock' => true],
                ['sku' => 'RM-033', 'name' => 'Deterjen Rinso 770g', 'unit' => 'pcs', 'cost_price' => 14000, 'sell_price' => 20000, 'stock_minimum' => 6, 'track_stock' => true],
            ],
            'Rokok & Lainnya' => [
                ['sku' => 'RM-040', 'name' => 'Gudang Garam Surya 12', 'unit' => 'pcs', 'cost_price' => 18000, 'sell_price' => 22000, 'stock_minimum' => 10, 'track_stock' => true],
                ['sku' => 'RM-041', 'name' => 'Kopi Torabika 3in1 25g', 'unit' => 'pcs', 'cost_price' => 2000, 'sell_price' => 3500, 'stock_minimum' => 30, 'track_stock' => true],
                ['sku' => 'RM-042', 'name' => 'Susu Kental Manis 370g', 'unit' => 'pcs', 'cost_price' => 8000, 'sell_price' => 12000, 'stock_minimum' => 12, 'track_stock' => true],
            ],
        ];

        $this->seedCategoriesWithProducts($template, $categories);
    }

    /** Kategori & produk contoh referensi untuk template Cafe / Coffee Shop. */
    private function seedFnbCafe(?BusinessTemplate $template): void
    {
        if (! $template) {
            return;
        }

        $categories = [
            'Minuman Kopi' => [
                ['sku' => 'FC-001', 'name' => 'Espresso', 'unit' => 'cup', 'cost_price' => 5000, 'sell_price' => 18000, 'preparation_time' => 3, 'is_composable' => true],
                ['sku' => 'FC-002', 'name' => 'Americano', 'unit' => 'cup', 'cost_price' => 5500, 'sell_price' => 20000, 'preparation_time' => 4, 'is_composable' => true],
                ['sku' => 'FC-003', 'name' => 'Cappuccino', 'unit' => 'cup', 'cost_price' => 7000, 'sell_price' => 25000, 'preparation_time' => 5, 'is_composable' => true],
                ['sku' => 'FC-004', 'name' => 'Cafe Latte', 'unit' => 'cup', 'cost_price' => 8000, 'sell_price' => 27000, 'preparation_time' => 5, 'is_composable' => true],
                ['sku' => 'FC-005', 'name' => 'Kopi Susu Gula Aren', 'unit' => 'cup', 'cost_price' => 9000, 'sell_price' => 28000, 'preparation_time' => 5, 'is_composable' => true],
            ],
            'Minuman Non-Kopi' => [
                ['sku' => 'FC-010', 'name' => 'Teh Tarik', 'unit' => 'cup', 'cost_price' => 4000, 'sell_price' => 18000, 'preparation_time' => 4, 'is_composable' => true],
                ['sku' => 'FC-011', 'name' => 'Matcha Latte', 'unit' => 'cup', 'cost_price' => 9000, 'sell_price' => 28000, 'preparation_time' => 5, 'is_composable' => true],
                ['sku' => 'FC-012', 'name' => 'Coklat Panas', 'unit' => 'cup', 'cost_price' => 7000, 'sell_price' => 22000, 'preparation_time' => 4, 'is_composable' => true],
                ['sku' => 'FC-013', 'name' => 'Lemon Tea', 'unit' => 'cup', 'cost_price' => 3500, 'sell_price' => 16000, 'preparation_time' => 3, 'is_composable' => true],
            ],
            'Makanan' => [
                ['sku' => 'FC-020', 'name' => 'Roti Bakar Keju', 'unit' => 'porsi', 'cost_price' => 8000, 'sell_price' => 22000, 'preparation_time' => 8, 'is_composable' => true],
                ['sku' => 'FC-021', 'name' => 'Sandwich Ayam', 'unit' => 'porsi', 'cost_price' => 15000, 'sell_price' => 35000, 'preparation_time' => 10, 'is_composable' => true],
                ['sku' => 'FC-022', 'name' => 'Nasi Goreng Kampung', 'unit' => 'porsi', 'cost_price' => 12000, 'sell_price' => 32000, 'preparation_time' => 12, 'is_composable' => true],
            ],
            'Snack & Dessert' => [
                ['sku' => 'FC-030', 'name' => 'Croissant', 'unit' => 'pcs', 'cost_price' => 8000, 'sell_price' => 22000, 'preparation_time' => 3],
                ['sku' => 'FC-031', 'name' => 'Cheesecake Slice', 'unit' => 'pcs', 'cost_price' => 12000, 'sell_price' => 30000, 'preparation_time' => 2],
                ['sku' => 'FC-032', 'name' => 'Brownies', 'unit' => 'pcs', 'cost_price' => 7000, 'sell_price' => 18000, 'preparation_time' => 2],
            ],
        ];

        $this->seedCategoriesWithProducts($template, $categories);
    }

    /**
     * @param  array<string, array<int, array<string, mixed>>>  $categories  nama kategori => daftar produk
     */
    private function seedCategoriesWithProducts(BusinessTemplate $template, array $categories): void
    {
        $sortOrder = 1;

        foreach ($categories as $categoryName => $products) {
            $category = BusinessTemplateCategory::firstOrCreate(
                ['business_template_id' => $template->id, 'name' => $categoryName],
                ['sort_order' => $sortOrder],
            );
            $sortOrder++;

            $productSortOrder = 1;

            foreach ($products as $product) {
                BusinessTemplateProduct::firstOrCreate(
                    ['business_template_category_id' => $category->id, 'sku' => $product['sku']],
                    array_merge($product, ['sort_order' => $productSortOrder]),
                );
                $productSortOrder++;
            }
        }

        $template->syncIsReady();
    }
}
