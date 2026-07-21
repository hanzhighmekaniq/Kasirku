<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class FnbProductSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        $catKopi = Category::where('store_id', $store->id)->where('name', 'Minuman Kopi')->value('id');
        $catNonKopi = Category::where('store_id', $store->id)->where('name', 'Minuman Non-Kopi')->value('id');
        $catMakanan = Category::where('store_id', $store->id)->where('name', 'Makanan')->value('id');
        $catSnack = Category::where('store_id', $store->id)->where('name', 'Snack & Dessert')->value('id');
        $catBahan = Category::where('store_id', $store->id)->where('name', 'Bahan Baku')->value('id');

        $sup1 = Supplier::where('store_id', $store->id)->where('code', 'SUP-F2-01')->value('id');
        $sup2 = Supplier::where('store_id', $store->id)->where('code', 'SUP-F2-02')->value('id');
        $sup3 = Supplier::where('store_id', $store->id)->where('code', 'SUP-F2-03')->value('id');

        // ══════════════════════════════════════════════════════════════
        // BAHAN BAKU (raw_material) — track_stock = true, is_sellable = false
        // ══════════════════════════════════════════════════════════════

        $rawMaterials = [
            // Kopi
            ['sku' => 'F2-RM-001', 'name' => 'Biji Kopi Arabika',      'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.35,  'stock_minimum' => 500,  'category_id' => $catBahan, 'supplier_id' => $sup1],
            ['sku' => 'F2-RM-002', 'name' => 'Biji Kopi Robusta',       'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.20,  'stock_minimum' => 500,  'category_id' => $catBahan, 'supplier_id' => $sup1],
            ['sku' => 'F2-RM-003', 'name' => 'Espresso Shot',           'unit' => 'ml',    'base_unit' => 'ml',   'cost_price' => 0.50,  'stock_minimum' => 200,  'category_id' => $catBahan, 'supplier_id' => $sup1],
            // Susu & krim
            ['sku' => 'F2-RM-004', 'name' => 'Susu Segar Full Cream',   'unit' => 'ml',    'base_unit' => 'ml',   'cost_price' => 0.015, 'stock_minimum' => 2000, 'category_id' => $catBahan, 'supplier_id' => $sup3],
            ['sku' => 'F2-RM-005', 'name' => 'Susu Oat',                'unit' => 'ml',    'base_unit' => 'ml',   'cost_price' => 0.025, 'stock_minimum' => 1000, 'category_id' => $catBahan, 'supplier_id' => $sup3],
            ['sku' => 'F2-RM-006', 'name' => 'Krim Kental (Whipped)',   'unit' => 'ml',    'base_unit' => 'ml',   'cost_price' => 0.030, 'stock_minimum' => 500,  'category_id' => $catBahan, 'supplier_id' => $sup3],
            // Sirup & perasa
            ['sku' => 'F2-RM-007', 'name' => 'Sirup Vanila',            'unit' => 'ml',    'base_unit' => 'ml',   'cost_price' => 0.040, 'stock_minimum' => 300,  'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-008', 'name' => 'Sirup Caramel',           'unit' => 'ml',    'base_unit' => 'ml',   'cost_price' => 0.040, 'stock_minimum' => 300,  'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-009', 'name' => 'Bubuk Coklat (Matcha)',   'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.12,  'stock_minimum' => 200,  'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-010', 'name' => 'Bubuk Matcha',            'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.18,  'stock_minimum' => 200,  'category_id' => $catBahan, 'supplier_id' => $sup2],
            // Es & air
            ['sku' => 'F2-RM-011', 'name' => 'Es Batu',                 'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.002, 'stock_minimum' => 2000, 'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-012', 'name' => 'Air Mineral',             'unit' => 'ml',    'base_unit' => 'ml',   'cost_price' => 0.001, 'stock_minimum' => 5000, 'category_id' => $catBahan, 'supplier_id' => $sup2],
            // Makanan
            ['sku' => 'F2-RM-013', 'name' => 'Roti Tawar',              'unit' => 'lembar', 'base_unit' => 'pcs',  'cost_price' => 1500,  'stock_minimum' => 20,   'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-014', 'name' => 'Telur Ayam',              'unit' => 'butir', 'base_unit' => 'pcs',  'cost_price' => 2000,  'stock_minimum' => 30,   'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-015', 'name' => 'Keju Cheddar Slice',      'unit' => 'lembar', 'base_unit' => 'pcs',  'cost_price' => 3500,  'stock_minimum' => 20,   'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-016', 'name' => 'Daging Ayam Fillet',      'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.035, 'stock_minimum' => 500,  'category_id' => $catBahan, 'supplier_id' => $sup2],
            // Topping
            ['sku' => 'F2-RM-017', 'name' => 'Boba Pearl',              'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.05,  'stock_minimum' => 500,  'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-018', 'name' => 'Jelly Cincau',            'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.03,  'stock_minimum' => 300,  'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-019', 'name' => 'Gula Pasir',              'unit' => 'gram',  'base_unit' => 'gram', 'cost_price' => 0.014, 'stock_minimum' => 1000, 'category_id' => $catBahan, 'supplier_id' => $sup2],
            ['sku' => 'F2-RM-020', 'name' => 'Cup & Sedotan',           'unit' => 'pcs',   'base_unit' => 'pcs',  'cost_price' => 800,   'stock_minimum' => 100,  'category_id' => $catBahan, 'supplier_id' => $sup2],
        ];

        foreach ($rawMaterials as $rm) {
            Product::firstOrCreate(
                ['store_id' => $store->id, 'sku' => $rm['sku']],
                [
                    'category_id' => $rm['category_id'],
                    'supplier_id' => $rm['supplier_id'],
                    'name' => $rm['name'],
                    'type' => 'raw_material',
                    'unit' => $rm['unit'],
                    'base_unit' => $rm['base_unit'],
                    'cost_price' => $rm['cost_price'],
                    'sell_price' => 0,
                    'stock_minimum' => $rm['stock_minimum'],
                    'track_stock' => true,
                    'is_sellable' => false,
                    'is_composable' => false,
                    'is_active' => true,
                    'is_variant' => false,
                ],
            );
        }

        // ══════════════════════════════════════════════════════════════
        // PRODUK JADI (finished_goods) — Minuman Kopi
        // ══════════════════════════════════════════════════════════════

        $coffeeProducts = [
            ['sku' => 'F2-001', 'name' => 'Espresso',          'cost_price' => 5000,  'sell_price' => 18000, 'prep' => 3,  'cat' => $catKopi],
            ['sku' => 'F2-002', 'name' => 'Americano',         'cost_price' => 5500,  'sell_price' => 20000, 'prep' => 4,  'cat' => $catKopi],
            ['sku' => 'F2-003', 'name' => 'Cappuccino',        'cost_price' => 7000,  'sell_price' => 25000, 'prep' => 5,  'cat' => $catKopi],
            ['sku' => 'F2-004', 'name' => 'Cafe Latte',        'cost_price' => 8000,  'sell_price' => 27000, 'prep' => 5,  'cat' => $catKopi],
            ['sku' => 'F2-005', 'name' => 'Caramel Macchiato', 'cost_price' => 10000, 'sell_price' => 32000, 'prep' => 6,  'cat' => $catKopi],
            ['sku' => 'F2-006', 'name' => 'Cold Brew',         'cost_price' => 8000,  'sell_price' => 28000, 'prep' => 5,  'cat' => $catKopi],
            ['sku' => 'F2-007', 'name' => 'Kopi Susu Gula Aren', 'cost_price' => 9000,  'sell_price' => 28000, 'prep' => 5,  'cat' => $catKopi],
            ['sku' => 'F2-008', 'name' => 'Matcha Latte',      'cost_price' => 9000,  'sell_price' => 28000, 'prep' => 5,  'cat' => $catKopi],
            ['sku' => 'F2-009', 'name' => 'Affogato',          'cost_price' => 11000, 'sell_price' => 35000, 'prep' => 5,  'cat' => $catKopi],
        ];

        foreach ($coffeeProducts as $p) {
            Product::firstOrCreate(
                ['store_id' => $store->id, 'sku' => $p['sku']],
                [
                    'category_id' => $p['cat'],
                    'name' => $p['name'],
                    'type' => 'finished_goods',
                    'unit' => 'cup',
                    'cost_price' => $p['cost_price'],
                    'sell_price' => $p['sell_price'],
                    'preparation_time' => $p['prep'],
                    'is_composable' => true,
                    'track_stock' => false,
                    'is_sellable' => true,
                    'is_active' => true,
                    'is_variant' => false,
                ],
            );
        }

        // ── Minuman Non-Kopi ──────────────────────────────────────────

        $nonCoffeeProducts = [
            ['sku' => 'F2-010', 'name' => 'Teh Tarik',         'cost_price' => 4000,  'sell_price' => 18000, 'prep' => 4],
            ['sku' => 'F2-011', 'name' => 'Matcha Boba',       'cost_price' => 10000, 'sell_price' => 30000, 'prep' => 6],
            ['sku' => 'F2-012', 'name' => 'Coklat Panas',      'cost_price' => 7000,  'sell_price' => 22000, 'prep' => 4],
            ['sku' => 'F2-013', 'name' => 'Lemon Tea',         'cost_price' => 3500,  'sell_price' => 16000, 'prep' => 3],
            ['sku' => 'F2-014', 'name' => 'Air Mineral',       'cost_price' => 2000,  'sell_price' => 8000,  'prep' => 1],
        ];

        foreach ($nonCoffeeProducts as $p) {
            Product::firstOrCreate(
                ['store_id' => $store->id, 'sku' => $p['sku']],
                [
                    'category_id' => $catNonKopi,
                    'name' => $p['name'],
                    'type' => 'finished_goods',
                    'unit' => 'cup',
                    'cost_price' => $p['cost_price'],
                    'sell_price' => $p['sell_price'],
                    'preparation_time' => $p['prep'],
                    'is_composable' => true,
                    'track_stock' => false,
                    'is_sellable' => true,
                    'is_active' => true,
                    'is_variant' => false,
                ],
            );
        }

        // ── Makanan ───────────────────────────────────────────────────

        $foodProducts = [
            ['sku' => 'F2-020', 'name' => 'Roti Bakar Keju',         'cost_price' => 8000,  'sell_price' => 22000, 'prep' => 8],
            ['sku' => 'F2-021', 'name' => 'Roti Bakar Coklat',       'cost_price' => 7000,  'sell_price' => 20000, 'prep' => 8],
            ['sku' => 'F2-022', 'name' => 'Sandwich Ayam',           'cost_price' => 15000, 'sell_price' => 35000, 'prep' => 10],
            ['sku' => 'F2-023', 'name' => 'Telur Dadar Gulung',      'cost_price' => 8000,  'sell_price' => 20000, 'prep' => 8],
            ['sku' => 'F2-024', 'name' => 'Nasi Goreng Kampung',     'cost_price' => 12000, 'sell_price' => 32000, 'prep' => 12],
        ];

        foreach ($foodProducts as $p) {
            Product::firstOrCreate(
                ['store_id' => $store->id, 'sku' => $p['sku']],
                [
                    'category_id' => $catMakanan,
                    'name' => $p['name'],
                    'type' => 'finished_goods',
                    'unit' => 'porsi',
                    'cost_price' => $p['cost_price'],
                    'sell_price' => $p['sell_price'],
                    'preparation_time' => $p['prep'],
                    'is_composable' => true,
                    'track_stock' => false,
                    'is_sellable' => true,
                    'is_active' => true,
                    'is_variant' => false,
                ],
            );
        }

        // ── Snack & Dessert ───────────────────────────────────────────

        $snackProducts = [
            ['sku' => 'F2-030', 'name' => 'Croissant',               'cost_price' => 8000,  'sell_price' => 22000, 'prep' => 3],
            ['sku' => 'F2-031', 'name' => 'Cheesecake Slice',        'cost_price' => 12000, 'sell_price' => 30000, 'prep' => 2],
            ['sku' => 'F2-032', 'name' => 'Brownies',                'cost_price' => 7000,  'sell_price' => 18000, 'prep' => 2],
        ];

        foreach ($snackProducts as $p) {
            Product::firstOrCreate(
                ['store_id' => $store->id, 'sku' => $p['sku']],
                [
                    'category_id' => $catSnack,
                    'name' => $p['name'],
                    'type' => 'finished_goods',
                    'unit' => 'pcs',
                    'cost_price' => $p['cost_price'],
                    'sell_price' => $p['sell_price'],
                    'preparation_time' => $p['prep'],
                    'is_composable' => false,
                    'track_stock' => false,
                    'is_sellable' => true,
                    'is_active' => true,
                    'is_variant' => false,
                ],
            );
        }

        // ══════════════════════════════════════════════════════════════
        // COMBO
        // ══════════════════════════════════════════════════════════════

        Product::firstOrCreate(
            ['store_id' => $store->id, 'sku' => 'F2-C001'],
            [
                'category_id' => $catKopi,
                'name' => 'Paket Kopi + Roti Bakar',
                'type' => 'combo',
                'unit' => 'set',
                'cost_price' => 15000,
                'sell_price' => 40000,
                'preparation_time' => 10,
                'is_composable' => false,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active' => true,
                'is_variant' => false,
                'description' => 'Cafe Latte + Roti Bakar Keju, hemat Rp 7.000',
            ],
        );

        Product::firstOrCreate(
            ['store_id' => $store->id, 'sku' => 'F2-C002'],
            [
                'category_id' => $catMakanan,
                'name' => 'Paket Sarapan',
                'type' => 'combo',
                'unit' => 'set',
                'cost_price' => 18000,
                'sell_price' => 45000,
                'preparation_time' => 12,
                'is_composable' => false,
                'track_stock' => false,
                'is_sellable' => true,
                'is_active' => true,
                'is_variant' => false,
                'description' => 'Sandwich Ayam + Americano + Croissant, hemat Rp 7.000',
            ],
        );
    }
}
