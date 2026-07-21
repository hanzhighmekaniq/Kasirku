<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Category;
use App\Models\Store;
use Illuminate\Database\Seeder;

class FnbCategorySeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        $categories = [
            ['name' => 'Minuman Kopi',      'sort_order' => 1],
            ['name' => 'Minuman Non-Kopi',  'sort_order' => 2],
            ['name' => 'Makanan',           'sort_order' => 3],
            ['name' => 'Snack & Dessert',   'sort_order' => 4],
            ['name' => 'Bahan Baku',        'sort_order' => 5],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['store_id' => $store->id, 'name' => $cat['name']],
                ['sort_order' => $cat['sort_order'], 'is_active' => true],
            );
        }
    }
}
