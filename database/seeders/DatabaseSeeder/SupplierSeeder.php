<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Store;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();

        $suppliers = [
            [
                'code' => 'SUP0001',
                'name' => 'UD Sembako Jaya',
                'contact_person' => 'Hendra Kurniawan',
                'phone' => '081200000001',
                'email' => 'sembakojaya@gmail.com',
                'address' => 'Jl. Magelang Km 8, Sleman',
            ],
            [
                'code' => 'SUP0002',
                'name' => 'PT Minuman Nusantara',
                'contact_person' => 'Sari Dewi',
                'phone' => '081200000002',
                'email' => 'order@minumannusantara.com',
                'address' => 'Jl. Industri No. 12, Tangerang',
            ],
            [
                'code' => 'SUP0003',
                'name' => 'CV Snack Makmur',
                'contact_person' => 'Budi Hartono',
                'phone' => '081200000003',
                'email' => 'snackmakmur@yahoo.com',
                'address' => 'Jl. Solo Km 10, Sleman',
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
