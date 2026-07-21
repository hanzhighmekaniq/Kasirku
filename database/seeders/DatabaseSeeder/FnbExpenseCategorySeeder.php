<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\ExpenseCategory;
use App\Models\Store;
use Illuminate\Database\Seeder;

class FnbExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        $categories = [
            ['code' => 'FNB-OPERATIONAL', 'name' => 'Operasional Kafe',   'description' => 'Listrik, air, internet, gas'],
            ['code' => 'FNB-SUPPLIES',    'name' => 'Perlengkapan Kafe',   'description' => 'Kemasan, peralatan dapur'],
            ['code' => 'FNB-MAINTENANCE', 'name' => 'Perawatan Peralatan', 'description' => 'Servis mesin kopi, AC, dll'],
            ['code' => 'FNB-SALARY',      'name' => 'Gaji Karyawan',       'description' => 'Gaji dan tunjangan barista'],
            ['code' => 'FNB-MARKETING',   'name' => 'Marketing',           'description' => 'Promosi, iklan, diskon event'],
            ['code' => 'FNB-RENT',        'name' => 'Sewa Tempat',         'description' => 'Sewa lokasi kafe per bulan'],
            ['code' => 'FNB-RAWMAT',      'name' => 'Bahan Baku Lainnya',  'description' => 'Pembelian bahan baku non-PO'],
        ];

        foreach ($categories as $cat) {
            ExpenseCategory::firstOrCreate(
                ['store_id' => $store->id, 'code' => $cat['code']],
                ['name' => $cat['name'], 'description' => $cat['description']],
            );
        }
    }
}
