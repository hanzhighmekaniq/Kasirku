<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Customer;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();

        $customers = [
            [
                'code' => 'CST001',
                'name' => 'Fajar Nugroho',
                'phone' => '081300000001',
                'email' => 'fajar@outlook.com',
                'address' => 'Jl. Kaliurang No. 100, Sleman',
                'birth_date' => '1988-11-05',
                'gender' => 'male',
                'points' => 300,
                'tier' => 'silver',
                'total_spent' => 180000,
                'debt_balance' => 0,
                'last_visit_at' => '2026-07-15 16:45:00',
            ],
            [
                'code' => 'CST002',
                'name' => 'Ayu Lestari',
                'phone' => '081300000002',
                'email' => null,
                'address' => 'Jl. Gejayan No. 25, Yogyakarta',
                'birth_date' => '1995-03-15',
                'gender' => 'female',
                'points' => 150,
                'tier' => 'bronze',
                'total_spent' => 75000,
                'debt_balance' => 0,
                'last_visit_at' => '2026-07-16 11:20:00',
            ],
            [
                'code' => 'CST003',
                'name' => 'Rina Marlina',
                'phone' => '081300000003',
                'email' => 'rina@gmail.com',
                'address' => 'Jl. Setiabudi No. 10, Yogyakarta',
                'birth_date' => '1990-07-20',
                'gender' => 'female',
                'points' => 800,
                'tier' => 'gold',
                'total_spent' => 520000,
                'debt_balance' => 50000,
                'last_visit_at' => '2026-07-17 09:00:00',
            ],
            [
                'code' => 'CST004',
                'name' => 'Dedi Kurniawan',
                'phone' => '081300000004',
                'email' => null,
                'address' => null,
                'birth_date' => null,
                'gender' => 'male',
                'points' => 50,
                'tier' => 'bronze',
                'total_spent' => 25000,
                'debt_balance' => 0,
                'last_visit_at' => '2026-07-10 14:00:00',
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
