<?php

namespace Database\Seeders;

use App\Models\ProductModifierGroup;
use App\Models\ProductModifier;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductModifierSeeder extends Seeder
{
    public function run(): void
    {
        // === Level Gula ===
        $gula = ProductModifierGroup::create([
            'name' => 'Level Gula',
            'description' => 'Pilih tingkat kemanisan',
            'is_required' => true,
            'selection_type' => 'single',
            'max_selection' => 1,
            'sort_order' => 1,
        ]);

        ProductModifier::create(['modifier_group_id' => $gula->id, 'name' => 'Normal', 'price_addition' => 0, 'sort_order' => 1]);
        ProductModifier::create(['modifier_group_id' => $gula->id, 'name' => 'Less Sugar', 'price_addition' => 0, 'sort_order' => 2]);
        ProductModifier::create(['modifier_group_id' => $gula->id, 'name' => 'Extra Sugar', 'price_addition' => 2000, 'sort_order' => 3]);
        ProductModifier::create(['modifier_group_id' => $gula->id, 'name' => 'No Sugar', 'price_addition' => 0, 'sort_order' => 4]);

        // === Topping ===
        $topping = ProductModifierGroup::create([
            'name' => 'Topping',
            'description' => 'Tambahkan topping favoritmu',
            'is_required' => false,
            'selection_type' => 'multiple',
            'max_selection' => 3,
            'sort_order' => 2,
        ]);

        ProductModifier::create(['modifier_group_id' => $topping->id, 'name' => 'Whipped Cream', 'price_addition' => 5000, 'sort_order' => 1]);
        ProductModifier::create(['modifier_group_id' => $topping->id, 'name' => 'Boba', 'price_addition' => 8000, 'sort_order' => 2]);
        ProductModifier::create(['modifier_group_id' => $topping->id, 'name' => 'Pudding', 'price_addition' => 6000, 'sort_order' => 3]);
        ProductModifier::create(['modifier_group_id' => $topping->id, 'name' => 'Cheese Foam', 'price_addition' => 10000, 'sort_order' => 4]);
        ProductModifier::create(['modifier_group_id' => $topping->id, 'name' => 'Oreo Crumble', 'price_addition' => 5000, 'sort_order' => 5]);

        // === Ukuran ===
        $ukuran = ProductModifierGroup::create([
            'name' => 'Ukuran',
            'description' => 'Pilih ukuran minuman',
            'is_required' => true,
            'selection_type' => 'single',
            'max_selection' => 1,
            'sort_order' => 3,
        ]);

        ProductModifier::create(['modifier_group_id' => $ukuran->id, 'name' => 'Regular', 'price_addition' => 0, 'sort_order' => 1]);
        ProductModifier::create(['modifier_group_id' => $ukuran->id, 'name' => 'Large', 'price_addition' => 5000, 'sort_order' => 2]);
        ProductModifier::create(['modifier_group_id' => $ukuran->id, 'name' => 'Extra Large', 'price_addition' => 8000, 'sort_order' => 3]);

        // === Ice Level ===
        $ice = ProductModifierGroup::create([
            'name' => 'Level Es',
            'description' => 'Pilih banyak es',
            'is_required' => false,
            'selection_type' => 'single',
            'max_selection' => 1,
            'sort_order' => 4,
        ]);

        ProductModifier::create(['modifier_group_id' => $ice->id, 'name' => 'Full Ice', 'price_addition' => 0, 'sort_order' => 1]);
        ProductModifier::create(['modifier_group_id' => $ice->id, 'name' => 'Less Ice', 'price_addition' => 0, 'sort_order' => 2]);
        ProductModifier::create(['modifier_group_id' => $ice->id, 'name' => 'No Ice', 'price_addition' => 0, 'sort_order' => 3]);

        // === Hubungkan modifier group ke produk ===
        // Semua produk kopi dan non-kopi mendapat modifier group
        $kopiNonKopiProducts = Product::where('is_sellable', true)
            ->where(function ($q) {
                $q->where('type', 'finished_goods')
                  ->orWhere('type', 'combo');
            })
            ->get();

        // Group 1: Level Gula + Ice Level untuk semua minuman
        // Group 2: Topping + Ukuran untuk kopi saja
        // Kita akan setelah product seeder berjalan, jadi hubungkan di akhir
    }
}
