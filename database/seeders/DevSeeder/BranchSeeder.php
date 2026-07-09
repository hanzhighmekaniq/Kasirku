<?php

namespace Database\Seeders\DevSeeder;

use App\Models\Branch;
use App\Models\Store;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    private array $branchData = [
        'STORE001' => [
            ['code' => 'BR1A', 'name' => 'Minimarket Sejahtera — Pusat'],
            ['code' => 'BR1B', 'name' => 'Minimarket Sejahtera — Babarsari'],
        ],
        'STORE002' => [
            ['code' => 'BR2A', 'name' => 'Kopi Senja — Malioboro'],
            ['code' => 'BR2B', 'name' => 'Kopi Senja — Cabang UGM'],
        ],
        'STORE003' => [
            ['code' => 'BR3A', 'name' => 'Barbershop Rapi — Sudirman'],
            ['code' => 'BR3B', 'name' => 'Barbershop Rapi — Cabang Sleman'],
        ],
        'STORE004' => [
            ['code' => 'BR4A', 'name' => 'Sewa Alat Jaya — Pusat'],
            ['code' => 'BR4B', 'name' => 'Sewa Alat Jaya — Cabang Bantul'],
        ],
        'STORE005' => [
            ['code' => 'BR5A', 'name' => 'Bioskop Nusantara — Pusat'],
            ['code' => 'BR5B', 'name' => 'Bioskop Nusantara — Cabang Sleman'],
        ],
        'STORE006' => [
            ['code' => 'BR6A', 'name' => 'Villa Sunrise — Kaliurang'],
            ['code' => 'BR6B', 'name' => 'Villa Sunrise — Prambanan'],
        ],
        'STORE007' => [
            ['code' => 'BR7A', 'name' => 'Parkir Jayabaya — Malioboro'],
            ['code' => 'BR7B', 'name' => 'Parkir Jayabaya — Cabang Selatan'],
        ],
        'STORE008' => [
            ['code' => 'BR8A', 'name' => 'GamerZone — Gejayan'],
            ['code' => 'BR8B', 'name' => 'GamerZone — Cabang Monjali'],
        ],
    ];

    public function run(): void
    {
        foreach ($this->branchData as $storeCode => $branches) {
            $store = Store::where('code', $storeCode)->firstOrFail();
            foreach ($branches as $b) {
                Branch::firstOrCreate(
                    ['store_id' => $store->id, 'code' => $b['code']],
                    [
                        'name'      => $b['name'],
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
