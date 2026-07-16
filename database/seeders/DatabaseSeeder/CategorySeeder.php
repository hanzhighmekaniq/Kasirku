<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Category;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // STORE001 — Minimarket Sejahtera (retail)
        $s1 = Store::where('code', 'STORE001')->value('id');
        if ($s1) {
            $categories = [
                ['name' => 'Sembako', 'sort_order' => 1],
                ['name' => 'Minuman', 'sort_order' => 2],
                ['name' => 'Makanan Ringan', 'sort_order' => 3],
                ['name' => 'Kebersihan & Perawatan', 'sort_order' => 4],
                ['name' => 'Rokok & Lainnya', 'sort_order' => 5],
            ];
            foreach ($categories as $cat) {
                Category::firstOrCreate(
                    ['store_id' => $s1, 'name' => $cat['name']],
                    ['sort_order' => $cat['sort_order'], 'is_active' => true],
                );
            }
        }

        // STORE002 — Warung Kopi Senja (fnb)
        $s2 = Store::where('code', 'STORE002')->value('id');
        if ($s2) {
            $categories = [
                ['name' => 'Kopi', 'sort_order' => 1],
                ['name' => 'Non-Kopi', 'sort_order' => 2],
                ['name' => 'Makanan Berat', 'sort_order' => 3],
                ['name' => 'Pastry & Roti', 'sort_order' => 4],
            ];
            foreach ($categories as $cat) {
                Category::firstOrCreate(
                    ['store_id' => $s2, 'name' => $cat['name']],
                    ['sort_order' => $cat['sort_order'], 'is_active' => true],
                );
            }
        }
    }
}
