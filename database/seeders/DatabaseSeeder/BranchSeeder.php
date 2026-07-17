<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Store;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();

        $branches = [
            ['code' => 'BR1A', 'name' => 'Minimarket Sejahtera — Pusat'],
            ['code' => 'BR1B', 'name' => 'Minimarket Sejahtera — Babarsari'],
        ];

        foreach ($branches as $b) {
            Branch::firstOrCreate(
                ['store_id' => $store->id, 'code' => $b['code']],
                ['name' => $b['name'], 'is_active' => true],
            );
        }
    }
}
