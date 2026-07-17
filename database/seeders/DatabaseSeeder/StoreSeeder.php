<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        $retailTypeId = StoreType::where('code', 'retail')->value('id');
        $unlimitedPlanId = Plan::where('code', 'unlimited')->value('id');

        Store::firstOrCreate(
            ['code' => 'STORE001'],
            [
                'name' => 'Minimarket Sejahtera',
                'store_type_id' => $retailTypeId,
                'plan_id' => $unlimitedPlanId,
                'max_users' => 999,
                'max_branches' => 999,
                'currency' => 'IDR',
                'decimal_places' => 0,
                'timezone' => 'Asia/Jakarta',
                'tax_inclusive' => false,
                'default_tax_rate' => 0,
                'is_active' => true,
            ],
        );
    }
}
