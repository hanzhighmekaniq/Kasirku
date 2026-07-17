<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Category;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();

        $categories = [
            ['name' => 'Sembako', 'sort_order' => 1],
            ['name' => 'Minuman', 'sort_order' => 2],
            ['name' => 'Makanan Ringan', 'sort_order' => 3],
            ['name' => 'Kebersihan & Perawatan', 'sort_order' => 4],
            ['name' => 'Rokok & Lainnya', 'sort_order' => 5],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['store_id' => $store->id, 'name' => $cat['name']],
                ['sort_order' => $cat['sort_order'], 'is_active' => true],
            );
        }
    }
}
