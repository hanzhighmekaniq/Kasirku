<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();
        $owner = User::where('email', 'owner1@gmail.com')->value('id');
        $branchPusat = Branch::where('store_id', $store->id)->where('code', 'BR1A')->value('id');
        $branchBabarsari = Branch::where('store_id', $store->id)->where('code', 'BR1B')->value('id');

        $cat = fn ($code) => ExpenseCategory::where('store_id', $store->id)->where('code', $code)->value('id');

        $expenses = [
            [
                'expense_no' => 'EXP-20260717-001',
                'expense_category_id' => $cat('OPERATIONAL'),
                'store_id' => $store->id,
                'branch_id' => $branchPusat,
                'user_id' => $owner,
                'expense_date' => '2026-07-17 08:00:00',
                'amount' => 1250000,
                'notes' => 'Tagihan listrik bulan Juli - Pusat',
            ],
            [
                'expense_no' => 'EXP-20260715-002',
                'expense_category_id' => $cat('SALARY'),
                'store_id' => $store->id,
                'branch_id' => $branchPusat,
                'user_id' => $owner,
                'expense_date' => '2026-07-15 10:00:00',
                'amount' => 3500000,
                'notes' => 'Gaji karyawan Rina Wati - Juli',
            ],
            [
                'expense_no' => 'EXP-20260714-003',
                'expense_category_id' => $cat('MAINTENANCE'),
                'store_id' => $store->id,
                'branch_id' => $branchPusat,
                'user_id' => $owner,
                'expense_date' => '2026-07-14 14:00:00',
                'amount' => 350000,
                'notes' => 'Servis AC unit toko',
            ],
            [
                'expense_no' => 'EXP-20260712-004',
                'expense_category_id' => $cat('MARKETING'),
                'store_id' => $store->id,
                'branch_id' => $branchPusat,
                'user_id' => $owner,
                'expense_date' => '2026-07-12 09:00:00',
                'amount' => 200000,
                'notes' => 'Cetak banner promosi bulanan',
            ],
            [
                'expense_no' => 'EXP-20260710-005',
                'expense_category_id' => $cat('RENT'),
                'store_id' => $store->id,
                'branch_id' => $branchBabarsari,
                'user_id' => $owner,
                'expense_date' => '2026-07-10 08:00:00',
                'amount' => 8000000,
                'notes' => 'Sewa tempat bulan Juli - Cabang Babarsari',
            ],
            [
                'expense_no' => 'EXP-20260708-006',
                'expense_category_id' => $cat('SUPPLIES'),
                'store_id' => $store->id,
                'branch_id' => $branchPusat,
                'user_id' => $owner,
                'expense_date' => '2026-07-08 11:00:00',
                'amount' => 150000,
                'notes' => 'Pembelian tinta printer struk',
            ],
            [
                'expense_no' => 'EXP-20260705-007',
                'expense_category_id' => $cat('SALARY'),
                'store_id' => $store->id,
                'branch_id' => $branchBabarsari,
                'user_id' => $owner,
                'expense_date' => '2026-07-05 10:00:00',
                'amount' => 3200000,
                'notes' => 'Gaji karyawan Dewi Lestari - Juli',
            ],
        ];

        foreach ($expenses as $e) {
            if ($e['expense_category_id']) {
                Expense::create($e);
            }
        }
    }
}
