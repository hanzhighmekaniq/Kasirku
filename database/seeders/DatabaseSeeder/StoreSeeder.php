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
        $typeId = fn ($code) => StoreType::where('code', $code)->value('id');
        $unlimitedPlanId = Plan::where('code', 'unlimited')->value('id');

        $stores = [
            [
                'code' => 'STORE001',
                'name' => 'Minimarket Sejahtera',
                'store_type_id' => $typeId('retail'),
            ],
            [
                'code' => 'STORE002',
                'name' => 'Warung Kopi Senja',
                'store_type_id' => $typeId('fnb'),
            ],
            [
                'code' => 'STORE003',
                'name' => 'Barbershop Rapi',
                'store_type_id' => $typeId('service'),
            ],
            [
                'code' => 'STORE004',
                'name' => 'Sewa Alat Jaya',
                'store_type_id' => $typeId('rental'),
            ],
            [
                'code' => 'STORE005',
                'name' => 'Bioskop Nusantara',
                'store_type_id' => $typeId('ticket'),
            ],
            [
                'code' => 'STORE006',
                'name' => 'Villa Sunrise',
                'store_type_id' => $typeId('hospitality'),
            ],
            [
                'code' => 'STORE007',
                'name' => 'Parkir Jayabaya',
                'store_type_id' => $typeId('parking'),
            ],
            [
                'code' => 'STORE008',
                'name' => 'GamerZone',
                'store_type_id' => $typeId('session'),
            ],
        ];

        foreach ($stores as $data) {
            Store::firstOrCreate(
                ['code' => $data['code']],
                array_merge($data, [
                    'plan_id' => $unlimitedPlanId,
                    'max_users' => 999,
                    'max_branches' => 999,
                    'currency' => 'IDR',
                    'decimal_places' => 0,
                    'timezone' => 'Asia/Jakarta',
                    'tax_inclusive' => false,
                    'default_tax_rate' => 0,
                    'is_active' => true,
                ]),
            );
        }
    }
}
