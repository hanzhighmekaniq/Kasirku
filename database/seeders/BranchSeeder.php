<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Store;
use Illuminate\Database\Seeder;

/**
 * Setiap store punya tepat 2 branch:
 *   BR{store_num}A — Pusat
 *   BR{store_num}B — Cabang 2
 */
class BranchSeeder extends Seeder
{
    private array $branchData = [
        'STORE001' => [
            ['code' => 'BR1A', 'name' => 'Minimarket Sejahtera — Pusat',      'phone' => '085678901234', 'address' => 'Jl. Solo No. 15, Sleman'],
            ['code' => 'BR1B', 'name' => 'Minimarket Sejahtera — Babarsari',  'phone' => '085678901235', 'address' => 'Jl. Babarsari No. 10, Depok, Sleman'],
        ],
        'STORE002' => [
            ['code' => 'BR2A', 'name' => 'Kopi Senja — Malioboro',            'phone' => '081234567890', 'address' => 'Jl. Malioboro No. 88, Yogyakarta'],
            ['code' => 'BR2B', 'name' => 'Kopi Senja — Cabang UGM',           'phone' => '081234567891', 'address' => 'Jl. Kaliurang Km 5, Sleman'],
        ],
        'STORE003' => [
            ['code' => 'BR3A', 'name' => 'Barbershop Rapi — Sudirman',        'phone' => '082112345678', 'address' => 'Jl. Sudirman No. 12, Yogyakarta'],
            ['code' => 'BR3B', 'name' => 'Barbershop Rapi — Cabang Sleman',   'phone' => '082112345679', 'address' => 'Jl. Seturan Raya No. 7, Sleman'],
        ],
        'STORE004' => [
            ['code' => 'BR4A', 'name' => 'Sewa Alat Jaya — Pusat',            'phone' => '083198765432', 'address' => 'Jl. Magelang No. 45, Sleman'],
            ['code' => 'BR4B', 'name' => 'Sewa Alat Jaya — Cabang Bantul',    'phone' => '083198765433', 'address' => 'Jl. Parangtritis Km 3, Bantul'],
        ],
        'STORE005' => [
            ['code' => 'BR5A', 'name' => 'Bioskop Nusantara — Pusat',         'phone' => '081299887766', 'address' => 'Jl. Pahlawan No. 5, Yogyakarta'],
            ['code' => 'BR5B', 'name' => 'Bioskop Nusantara — Cabang Sleman', 'phone' => '081299887767', 'address' => 'Jl. Ring Road Utara No. 22, Sleman'],
        ],
        'STORE006' => [
            ['code' => 'BR6A', 'name' => 'Villa Sunrise — Kaliurang',         'phone' => '085600112233', 'address' => 'Jl. Kaliurang Km 20, Sleman'],
            ['code' => 'BR6B', 'name' => 'Villa Sunrise — Prambanan',         'phone' => '085600112234', 'address' => 'Jl. Prambanan-Piyungan Km 2, Sleman'],
        ],
        'STORE007' => [
            ['code' => 'BR7A', 'name' => 'Parkir Jayabaya — Malioboro',       'phone' => '081355667788', 'address' => 'Jl. Taman Siswa No. 10, Yogyakarta'],
            ['code' => 'BR7B', 'name' => 'Parkir Jayabaya — Cabang Selatan',  'phone' => '081355667789', 'address' => 'Jl. Parangtritis No. 5, Yogyakarta'],
        ],
        'STORE008' => [
            ['code' => 'BR8A', 'name' => 'GamerZone — Gejayan',               'phone' => '081377889900', 'address' => 'Jl. Gejayan No. 99, Sleman'],
            ['code' => 'BR8B', 'name' => 'GamerZone — Cabang Monjali',        'phone' => '081377889901', 'address' => 'Jl. Monjali No. 55, Sleman'],
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
                        'phone'     => $b['phone'],
                        'address'   => $b['address'],
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
