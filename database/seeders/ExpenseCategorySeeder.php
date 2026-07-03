<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        ExpenseCategory::create([
            'code' => 'EXCAT001',
            'name' => 'Listrik & Air',
            'description' => 'Biaya listrik dan air bulanan',
        ]);

        ExpenseCategory::create([
            'code' => 'EXCAT002',
            'name' => 'Sewa Tempat',
            'description' => 'Biaya sewa lokasi usaha',
        ]);

        ExpenseCategory::create([
            'code' => 'EXCAT003',
            'name' => 'Gaji Karyawan',
            'description' => 'Gaji dan bonus karyawan',
        ]);

        ExpenseCategory::create([
            'code' => 'EXCAT004',
            'name' => 'Perawatan & Servis',
            'description' => 'Biaya peralatan dan pemeliharaan',
        ]);

        ExpenseCategory::create([
            'code' => 'EXCAT005',
            'name' => 'Perlengkapan Kantor',
            'description' => 'ATK dan kebutuhan kantor',
        ]);

        ExpenseCategory::create([
            'code' => 'EXCAT006',
            'name' => 'Marketing & Promosi',
            'description' => 'Biaya promosi dan iklan',
        ]);

        ExpenseCategory::create([
            'code' => 'EXCAT007',
            'name' => 'Operasional Lainnya',
            'description' => 'Biaya operasional lainnya',
        ]);
    }
}
