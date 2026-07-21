<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class FnbExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();
        $owner = User::where('email', 'owner1@gmail.com')->value('id');
        $br2a = Branch::where('store_id', $store->id)->where('code', 'BR2A')->value('id');
        $br2b = Branch::where('store_id', $store->id)->where('code', 'BR2B')->value('id');

        $cat = fn ($code) => ExpenseCategory::where('store_id', $store->id)->where('code', $code)->value('id');

        $expenses = [
            [
                'expense_no' => 'EXP-FNB-20260710-001',
                'expense_category_id' => $cat('FNB-RENT'),
                'branch_id' => $br2a,
                'expense_date' => '2026-07-10 08:00:00',
                'amount' => 12000000,
                'notes' => 'Sewa tempat Malioboro - Juli 2026',
            ],
            [
                'expense_no' => 'EXP-FNB-20260710-002',
                'expense_category_id' => $cat('FNB-RENT'),
                'branch_id' => $br2b,
                'expense_date' => '2026-07-10 09:00:00',
                'amount' => 8000000,
                'notes' => 'Sewa tempat UGM - Juli 2026',
            ],
            [
                'expense_no' => 'EXP-FNB-20260712-003',
                'expense_category_id' => $cat('FNB-OPERATIONAL'),
                'branch_id' => $br2a,
                'expense_date' => '2026-07-12 10:00:00',
                'amount' => 1800000,
                'notes' => 'Tagihan listrik + air Malioboro Juli',
            ],
            [
                'expense_no' => 'EXP-FNB-20260712-004',
                'expense_category_id' => $cat('FNB-OPERATIONAL'),
                'branch_id' => $br2b,
                'expense_date' => '2026-07-12 10:30:00',
                'amount' => 1200000,
                'notes' => 'Tagihan listrik + air UGM Juli',
            ],
            [
                'expense_no' => 'EXP-FNB-20260715-005',
                'expense_category_id' => $cat('FNB-SALARY'),
                'branch_id' => $br2a,
                'expense_date' => '2026-07-15 10:00:00',
                'amount' => 4500000,
                'notes' => 'Gaji Siti Rahayu + Doni Setiawan + Lina - Juli',
            ],
            [
                'expense_no' => 'EXP-FNB-20260715-006',
                'expense_category_id' => $cat('FNB-SALARY'),
                'branch_id' => $br2b,
                'expense_date' => '2026-07-15 10:30:00',
                'amount' => 3500000,
                'notes' => 'Gaji Agus Purnomo + Mega Putri - Juli',
            ],
            [
                'expense_no' => 'EXP-FNB-20260714-007',
                'expense_category_id' => $cat('FNB-MAINTENANCE'),
                'branch_id' => $br2a,
                'expense_date' => '2026-07-14 13:00:00',
                'amount' => 750000,
                'notes' => 'Servis mesin espresso La Marzocco',
            ],
            [
                'expense_no' => 'EXP-FNB-20260713-008',
                'expense_category_id' => $cat('FNB-SUPPLIES'),
                'branch_id' => $br2a,
                'expense_date' => '2026-07-13 09:00:00',
                'amount' => 350000,
                'notes' => 'Pembelian cup, sedotan, tisu meja',
            ],
            [
                'expense_no' => 'EXP-FNB-20260716-009',
                'expense_category_id' => $cat('FNB-MARKETING'),
                'branch_id' => $br2a,
                'expense_date' => '2026-07-16 11:00:00',
                'amount' => 500000,
                'notes' => 'Boost Instagram ads promo weekend',
            ],
            [
                'expense_no' => 'EXP-FNB-20260716-010',
                'expense_category_id' => $cat('FNB-RAWMAT'),
                'branch_id' => $br2b,
                'expense_date' => '2026-07-16 14:00:00',
                'amount' => 180000,
                'notes' => 'Pembelian gula aren + rempah darurat',
            ],
        ];

        foreach ($expenses as $e) {
            if ($e['expense_category_id']) {
                Expense::create(array_merge($e, [
                    'store_id' => $store->id,
                    'user_id' => $owner,
                ]));
            }
        }
    }
}
