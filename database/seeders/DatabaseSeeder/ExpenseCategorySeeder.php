<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\ExpenseCategory;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();

        $categories = [
            ['code' => 'OPERATIONAL', 'name' => 'Operasional', 'description' => 'Listrik, air, internet'],
            ['code' => 'SUPPLIES', 'name' => 'Perlengkapan', 'description' => 'ATK, kebersihan'],
            ['code' => 'MAINTENANCE', 'name' => 'Perawatan', 'description' => 'Servis alat, renovasi'],
            ['code' => 'SALARY', 'name' => 'Gaji Karyawan', 'description' => 'Gaji dan tunjangan'],
            ['code' => 'MARKETING', 'name' => 'Marketing', 'description' => 'Promosi dan iklan'],
            ['code' => 'RENT', 'name' => 'Sewa', 'description' => 'Sewa tempat dan fasilitas'],
        ];

        foreach ($categories as $cat) {
            ExpenseCategory::firstOrCreate(
                ['store_id' => $store->id, 'code' => $cat['code']],
                ['name' => $cat['name'], 'description' => $cat['description']],
            );
        }
    }
}
