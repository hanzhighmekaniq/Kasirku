<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductPriceTier;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();

        $catSembako = Category::where('store_id', $store->id)->where('name', 'Sembako')->value('id');
        $catMinuman = Category::where('store_id', $store->id)->where('name', 'Minuman')->value('id');
        $catSnack = Category::where('store_id', $store->id)->where('name', 'Makanan Ringan')->value('id');
        $catKebersihan = Category::where('store_id', $store->id)->where('name', 'Kebersihan & Perawatan')->value('id');
        $catRokok = Category::where('store_id', $store->id)->where('name', 'Rokok & Lainnya')->value('id');

        // ══════════════════════════════════════════════════════════════
        // PRODUK DENGAN VARIANT (is_variant = true)
        // ══════════════════════════════════════════════════════════════

        // 1. Indomie Goreng — 3 variant rasa
        $p1 = Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-001'], [
            'category_id' => $catSembako, 'barcode' => '8991101000011',
            'name' => 'Indomie Goreng', 'description' => 'Mie instan goreng, 85gr.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 2800, 'sell_price' => 4000,
            'stock_minimum' => 20, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
            'is_variant' => true,
        ]);
        $v1a = ProductVariant::firstOrCreate(['product_id' => $p1->id, 'name' => 'Original'], [
            'sku' => 'S1-001-ORI', 'barcode' => '8991101000011-ORI',
            'price' => 4000, 'cost_price' => 2800, 'is_active' => true,
        ]);
        $v1b = ProductVariant::firstOrCreate(['product_id' => $p1->id, 'name' => 'Rendang'], [
            'sku' => 'S1-001-REN', 'barcode' => '8991101000011-REN',
            'price' => 4500, 'cost_price' => 3200, 'is_active' => true,
        ]);
        $v1c = ProductVariant::firstOrCreate(['product_id' => $p1->id, 'name' => 'Soto'], [
            'sku' => 'S1-001-SOT', 'barcode' => '8991101000011-SOT',
            'price' => 4200, 'cost_price' => 3000, 'is_active' => true,
        ]);

        // Grosir per variant
        foreach ([$v1a, $v1b, $v1c] as $v) {
            ProductPriceTier::firstOrCreate(['product_id' => $p1->id, 'variant_id' => $v->id, 'min_qty' => 10], ['price' => $v->cost_price + 500]);
            ProductPriceTier::firstOrCreate(['product_id' => $p1->id, 'variant_id' => $v->id, 'min_qty' => 50], ['price' => $v->cost_price + 300]);
            ProductPriceTier::firstOrCreate(['product_id' => $p1->id, 'variant_id' => $v->id, 'min_qty' => 100], ['price' => $v->cost_price + 100]);
        }

        // Multi-satuan per variant (Dus)
        foreach ([$v1a, $v1b, $v1c] as $v) {
            ProductPackagingUnit::firstOrCreate(['product_id' => $p1->id, 'variant_id' => $v->id, 'name' => 'Dus'], [
                'conversion_qty' => 40, 'sell_price' => $v->price * 40 * 0.92,
            ]);
        }

        // 2. Susu Ultra 200ml — 3 variant rasa
        $p2 = Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-007'], [
            'category_id' => $catMinuman, 'barcode' => '8999999000031',
            'name' => 'Susu Ultra 200ml', 'description' => 'Susu UHT kemasan 200ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 3800, 'sell_price' => 5500,
            'stock_minimum' => 12, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
            'is_variant' => true,
        ]);
        ProductVariant::firstOrCreate(['product_id' => $p2->id, 'name' => 'Full Cream'], [
            'sku' => 'S1-007-FC', 'barcode' => '8999999000031-FC',
            'price' => 5500, 'cost_price' => 3800, 'is_active' => true,
        ]);
        ProductVariant::firstOrCreate(['product_id' => $p2->id, 'name' => 'Coklat'], [
            'sku' => 'S1-007-CK', 'barcode' => '8999999000031-CK',
            'price' => 5500, 'cost_price' => 3800, 'is_active' => true,
        ]);
        ProductVariant::firstOrCreate(['product_id' => $p2->id, 'name' => 'Strawberry'], [
            'sku' => 'S1-007-SB', 'barcode' => '8999999000031-SB',
            'price' => 5500, 'cost_price' => 3800, 'is_active' => true,
        ]);

        // 3. Teh Botol Sosro 450ml — 2 variant
        $p3 = Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-008'], [
            'category_id' => $catMinuman, 'barcode' => '8991106000091',
            'name' => 'Teh Botol Sosro 450ml', 'description' => 'Teh kemasan rasa manis, botol 450ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 3500, 'sell_price' => 5000,
            'stock_minimum' => 20, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
            'is_variant' => true,
        ]);
        ProductVariant::firstOrCreate(['product_id' => $p3->id, 'name' => 'Original'], [
            'sku' => 'S1-008-ORI', 'barcode' => '8991106000091-ORI',
            'price' => 5000, 'cost_price' => 3500, 'is_active' => true,
        ]);
        ProductVariant::firstOrCreate(['product_id' => $p3->id, 'name' => 'Less Sugar'], [
            'sku' => 'S1-008-LS', 'barcode' => '8991106000091-LS',
            'price' => 5500, 'cost_price' => 3800, 'is_active' => true,
        ]);

        // ══════════════════════════════════════════════════════════════
        // PRODUK DENGAN MULTI-SATUAN (tanpa variant)
        // ══════════════════════════════════════════════════════════════

        // 4. Aqua 600ml — multi-satuan + grosir
        $p4 = Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-006'], [
            'category_id' => $catMinuman, 'barcode' => '8997225000020',
            'name' => 'Aqua 600ml', 'description' => 'Air mineral dalam kemasan botol 600ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 2500, 'sell_price' => 4000,
            'stock_minimum' => 24, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        ProductPackagingUnit::firstOrCreate(['product_id' => $p4->id, 'variant_id' => null, 'name' => 'Dus'], [
            'conversion_qty' => 24, 'sell_price' => 85000,
        ]);
        // Grosir
        ProductPriceTier::firstOrCreate(['product_id' => $p4->id, 'variant_id' => null, 'min_qty' => 24], ['price' => 3500]);
        ProductPriceTier::firstOrCreate(['product_id' => $p4->id, 'variant_id' => null, 'min_qty' => 100], ['price' => 3200]);

        // 5. Beras Rojolele 5kg — multi-satuan
        $p5 = Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-002'], [
            'category_id' => $catSembako, 'barcode' => '8991102000051',
            'name' => 'Beras Rojolele 5kg', 'description' => 'Beras putih premium varietas Rojolele, kemasan 5kg.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 60000, 'sell_price' => 72000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        ProductPackagingUnit::firstOrCreate(['product_id' => $p5->id, 'variant_id' => null, 'name' => 'Sak'], [
            'conversion_qty' => 10, 'sell_price' => 680000,
        ]);

        // 6. Minyak Goreng 1L — multi-satuan
        $p6 = Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-003'], [
            'category_id' => $catSembako, 'barcode' => '8991103000061',
            'name' => 'Minyak Goreng Tropical 1L', 'description' => 'Minyak goreng sawit murni kemasan 1 liter.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 15000, 'sell_price' => 21000,
            'stock_minimum' => 12, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        ProductPackagingUnit::firstOrCreate(['product_id' => $p6->id, 'variant_id' => null, 'name' => 'Dus'], [
            'conversion_qty' => 12, 'sell_price' => 230000,
        ]);

        // ══════════════════════════════════════════════════════════════
        // PRODUK BIASA (tanpa variant, tanpa multi-satuan)
        // ══════════════════════════════════════════════════════════════

        // Sembako
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-004'], [
            'category_id' => $catSembako, 'barcode' => '8991104000071',
            'name' => 'Gula Pasir 1kg', 'description' => 'Gula pasir kristal putih kemasan 1kg.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 12000, 'sell_price' => 16000,
            'stock_minimum' => 15, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-005'], [
            'category_id' => $catSembako, 'barcode' => '8991105000081',
            'name' => 'Tepung Terigu 1kg', 'description' => 'Tepung terigu protein sedang kemasan 1kg.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 9000, 'sell_price' => 13000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // Minuman
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-009'], [
            'category_id' => $catMinuman, 'barcode' => '8991107000101',
            'name' => 'Coca Cola 390ml', 'description' => 'Minuman berkarbonasi rasa cola, botol 390ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 4000, 'sell_price' => 6500,
            'stock_minimum' => 12, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // Makanan Ringan
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-010'], [
            'category_id' => $catSnack, 'barcode' => '8991108000111',
            'name' => 'Chitato Sapi Panggang 68g', 'description' => 'Keripik kentang rasa sapi panggang.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 8500, 'sell_price' => 12000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-011'], [
            'category_id' => $catSnack, 'barcode' => '8991109000121',
            'name' => 'Oreo Vanilla 137g', 'description' => 'Biskuit coklat dengan krim vanilla.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 7000, 'sell_price' => 10500,
            'stock_minimum' => 8, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-012'], [
            'category_id' => $catSnack, 'barcode' => '8991110000131',
            'name' => 'Taro Net 36g', 'description' => 'Snack jagung jaring rasa rumput laut.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 2000, 'sell_price' => 3500,
            'stock_minimum' => 15, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // Kebersihan
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-013'], [
            'category_id' => $catKebersihan, 'barcode' => '8887290000041',
            'name' => 'Sabun Lifebuoy 100gr', 'description' => 'Sabun mandi batang antibakteri 100gr.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 5500, 'sell_price' => 8500,
            'stock_minimum' => 6, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-014'], [
            'category_id' => $catKebersihan, 'barcode' => '8991111000141',
            'name' => 'Shampoo Sunsilk 160ml', 'description' => 'Shampoo rambut hitam lurus 160ml.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 15000, 'sell_price' => 22000,
            'stock_minimum' => 6, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-015'], [
            'category_id' => $catKebersihan, 'barcode' => '8991112000151',
            'name' => 'Pasta Gigi Pepsodent 190g', 'description' => 'Pasta gigi untuk perlindungan gigi dan gusi.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 12000, 'sell_price' => 18000,
            'stock_minimum' => 6, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-016'], [
            'category_id' => $catKebersihan, 'barcode' => '8991113000161',
            'name' => 'Deterjen Rinso 770g', 'description' => 'Deterjen bubuk untuk cucian harian.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 14000, 'sell_price' => 20000,
            'stock_minimum' => 6, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);

        // Rokok & Lainnya
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-017'], [
            'category_id' => $catRokok, 'barcode' => '8991114000171',
            'name' => 'Gudang Garam Surya 12', 'description' => 'Rokok kretek filter isi 12 batang.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 18000, 'sell_price' => 22000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-018'], [
            'category_id' => $catRokok, 'barcode' => '8991115000181',
            'name' => 'Sampoerna Mild 16', 'description' => 'Rokok mild filter isi 16 batang.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 24000, 'sell_price' => 28000,
            'stock_minimum' => 10, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-019'], [
            'category_id' => $catRokok, 'barcode' => '8991116000191',
            'name' => 'Kopi Torabika 3in1 25g', 'description' => 'Kopi instan 3in1 sachet.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 2000, 'sell_price' => 3500,
            'stock_minimum' => 30, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
        Product::firstOrCreate(['store_id' => $store->id, 'sku' => 'S1-020'], [
            'category_id' => $catRokok, 'barcode' => '8991117000201',
            'name' => 'Susu Kental Manis Frisian Flag 370g', 'description' => 'Susu kental manis kaleng.',
            'type' => 'finished_goods', 'unit' => 'pcs', 'cost_price' => 8000, 'sell_price' => 12000,
            'stock_minimum' => 12, 'track_stock' => true, 'is_sellable' => true, 'is_active' => true,
        ]);
    }
}
