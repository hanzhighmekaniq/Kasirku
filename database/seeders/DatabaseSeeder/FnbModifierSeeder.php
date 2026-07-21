<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Product;
use App\Models\ProductModifier;
use App\Models\ProductModifierGroup;
use App\Models\Store;
use Illuminate\Database\Seeder;

class FnbModifierSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->value('id');

        // ── Modifier Groups ───────────────────────────────────────────

        $groups = [
            [
                'name' => 'Tingkat Gula',
                'description' => 'Pilih tingkat kemanisan minuman',
                'is_required' => false,
                'selection_type' => 'single',
                'max_selection' => 1,
                'sort_order' => 1,
                'modifiers' => [
                    ['name' => 'Tanpa Gula',  'price_addition' => 0,    'sort_order' => 1],
                    ['name' => '25%',         'price_addition' => 0,    'sort_order' => 2],
                    ['name' => '50%',         'price_addition' => 0,    'sort_order' => 3],
                    ['name' => '75%',         'price_addition' => 0,    'sort_order' => 4],
                    ['name' => 'Normal',      'price_addition' => 0,    'sort_order' => 5],
                    ['name' => 'Extra Manis', 'price_addition' => 2000, 'sort_order' => 6],
                ],
                'products' => ['F2-001', 'F2-002', 'F2-003', 'F2-004', 'F2-005', 'F2-006', 'F2-007', 'F2-008', 'F2-010', 'F2-011', 'F2-012', 'F2-013'],
            ],
            [
                'name' => 'Tingkat Es',
                'description' => 'Pilih jumlah es dalam minuman',
                'is_required' => false,
                'selection_type' => 'single',
                'max_selection' => 1,
                'sort_order' => 2,
                'modifiers' => [
                    ['name' => 'Panas',       'price_addition' => 0,    'sort_order' => 1],
                    ['name' => 'Tanpa Es',    'price_addition' => 0,    'sort_order' => 2],
                    ['name' => 'Es Sedikit',  'price_addition' => 0,    'sort_order' => 3],
                    ['name' => 'Es Normal',   'price_addition' => 0,    'sort_order' => 4],
                    ['name' => 'Extra Es',    'price_addition' => 0,    'sort_order' => 5],
                ],
                'products' => ['F2-001', 'F2-002', 'F2-003', 'F2-004', 'F2-005', 'F2-006', 'F2-007', 'F2-008', 'F2-010', 'F2-011', 'F2-012', 'F2-013'],
            ],
            [
                'name' => 'Ukuran',
                'description' => 'Pilih ukuran minuman',
                'is_required' => false,
                'selection_type' => 'single',
                'max_selection' => 1,
                'sort_order' => 3,
                'modifiers' => [
                    ['name' => 'Regular (250ml)', 'price_addition' => 0,    'sort_order' => 1],
                    ['name' => 'Large (350ml)',   'price_addition' => 5000, 'sort_order' => 2],
                    ['name' => 'Extra Large (500ml)', 'price_addition' => 10000, 'sort_order' => 3],
                ],
                'products' => ['F2-003', 'F2-004', 'F2-005', 'F2-007', 'F2-010', 'F2-011', 'F2-012'],
            ],
            [
                'name' => 'Topping',
                'description' => 'Tambah topping favoritmu',
                'is_required' => false,
                'selection_type' => 'multiple',
                'max_selection' => 3,
                'sort_order' => 4,
                'modifiers' => [
                    ['name' => 'Boba Pearl',       'price_addition' => 5000, 'sort_order' => 1],
                    ['name' => 'Jelly Cincau',      'price_addition' => 4000, 'sort_order' => 2],
                    ['name' => 'Whipped Cream',     'price_addition' => 4000, 'sort_order' => 3],
                    ['name' => 'Extra Shot Espresso', 'price_addition' => 6000, 'sort_order' => 4],
                    ['name' => 'Susu Oat',          'price_addition' => 5000, 'sort_order' => 5],
                ],
                'products' => ['F2-001', 'F2-002', 'F2-003', 'F2-004', 'F2-005', 'F2-006', 'F2-007', 'F2-008', 'F2-009', 'F2-010', 'F2-011', 'F2-012'],
            ],
            [
                'name' => 'Pilihan Roti',
                'description' => 'Pilih jenis roti',
                'is_required' => false,
                'selection_type' => 'single',
                'max_selection' => 1,
                'sort_order' => 5,
                'modifiers' => [
                    ['name' => 'Roti Putih',  'price_addition' => 0,    'sort_order' => 1],
                    ['name' => 'Roti Gandum',  'price_addition' => 3000, 'sort_order' => 2],
                ],
                'products' => ['F2-020', 'F2-021', 'F2-022'],
            ],
        ];

        foreach ($groups as $groupData) {
            $modifiersList = $groupData['modifiers'];
            $productSkus = $groupData['products'];
            unset($groupData['modifiers'], $groupData['products']);

            $group = ProductModifierGroup::firstOrCreate(
                ['store_id' => $store->id, 'name' => $groupData['name']],
                array_merge($groupData, ['store_id' => $store->id, 'is_active' => true]),
            );

            foreach ($modifiersList as $mod) {
                ProductModifier::firstOrCreate(
                    ['modifier_group_id' => $group->id, 'name' => $mod['name']],
                    [
                        'price_addition' => $mod['price_addition'],
                        'sort_order' => $mod['sort_order'],
                        'is_active' => true,
                    ],
                );
            }

            // Attach ke produk
            $productIds = array_filter(array_map(fn ($sku) => $pid($sku), $productSkus));
            $group->products()->syncWithoutDetaching($productIds);
        }
    }
}
