<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Customer;
use App\Models\Store;
use Illuminate\Database\Seeder;

class FnbCustomerSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        $customers = [
            [
                'code' => 'CSTF2-001',
                'name' => 'Bagas Prasetyo',
                'phone' => '081400000001',
                'email' => 'bagas@gmail.com',
                'address' => 'Jl. Malioboro No. 12, Yogyakarta',
                'birth_date' => '1995-04-10',
                'gender' => 'male',
                'points' => 450,
                'tier' => 'silver',
                'total_spent' => 280000,
                'debt_balance' => 0,
                'last_visit_at' => '2026-07-18 14:30:00',
            ],
            [
                'code' => 'CSTF2-002',
                'name' => 'Nadia Kusuma',
                'phone' => '081400000002',
                'email' => 'nadia@gmail.com',
                'address' => 'Jl. Gajah Mada No. 5, Yogyakarta',
                'birth_date' => '1998-08-22',
                'gender' => 'female',
                'points' => 820,
                'tier' => 'gold',
                'total_spent' => 610000,
                'debt_balance' => 0,
                'last_visit_at' => '2026-07-19 10:00:00',
            ],
            [
                'code' => 'CSTF2-003',
                'name' => 'Reza Firmansyah',
                'phone' => '081400000003',
                'email' => null,
                'address' => null,
                'birth_date' => null,
                'gender' => 'male',
                'points' => 120,
                'tier' => 'bronze',
                'total_spent' => 95000,
                'debt_balance' => 0,
                'last_visit_at' => '2026-07-17 16:00:00',
            ],
            [
                'code' => 'CSTF2-004',
                'name' => 'Intan Permata',
                'phone' => '081400000004',
                'email' => 'intan@outlook.com',
                'address' => 'Jl. Solo Km 7, Sleman',
                'birth_date' => '1992-12-01',
                'gender' => 'female',
                'points' => 200,
                'tier' => 'bronze',
                'total_spent' => 130000,
                'debt_balance' => 25000,
                'last_visit_at' => '2026-07-16 11:45:00',
            ],
            [
                'code' => 'CSTF2-005',
                'name' => 'Wahyu Hidayat',
                'phone' => '081400000005',
                'email' => 'wahyu@gmail.com',
                'address' => 'Jl. Seturan No. 20, Sleman',
                'birth_date' => '1990-06-15',
                'gender' => 'male',
                'points' => 1200,
                'tier' => 'gold',
                'total_spent' => 950000,
                'debt_balance' => 0,
                'last_visit_at' => '2026-07-20 09:15:00',
            ],
        ];

        foreach ($customers as $c) {
            Customer::firstOrCreate(
                ['store_id' => $store->id, 'code' => $c['code']],
                $c,
            );
        }
    }
}
