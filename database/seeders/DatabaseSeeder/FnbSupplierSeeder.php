<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Store;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class FnbSupplierSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        $suppliers = [
            [
                'code' => 'SUP-F2-01',
                'name' => 'UD Kopi Nusantara',
                'contact_person' => 'Hendra Wijaya',
                'phone' => '081300100001',
                'email' => 'kopinusantara@gmail.com',
                'address' => 'Jl. Kaliurang Km 5, Sleman',
            ],
            [
                'code' => 'SUP-F2-02',
                'name' => 'CV Bahan Kafe Sejahtera',
                'contact_person' => 'Ratna Sari',
                'phone' => '081300100002',
                'email' => 'bahankafe@gmail.com',
                'address' => 'Jl. Magelang No. 45, Yogyakarta',
            ],
            [
                'code' => 'SUP-F2-03',
                'name' => 'PT Susu Segar Indonesia',
                'contact_person' => 'Bambang Susilo',
                'phone' => '081300100003',
                'email' => 'sususegar@yahoo.com',
                'address' => 'Jl. Parangtritis Km 3, Bantul',
            ],
        ];

        foreach ($suppliers as $s) {
            Supplier::firstOrCreate(
                ['store_id' => $store->id, 'code' => $s['code']],
                [
                    'name' => $s['name'],
                    'contact_person' => $s['contact_person'],
                    'phone' => $s['phone'],
                    'email' => $s['email'],
                    'address' => $s['address'],
                ],
            );
        }
    }
}
