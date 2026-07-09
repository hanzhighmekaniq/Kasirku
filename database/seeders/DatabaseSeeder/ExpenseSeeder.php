<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Expense;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        // STORE001 = Minimarket Sejahtera (branch BR1A & BR1B)
        $owner2 = User::where("email", "owner2@gmail.com")->value("id");
        $storeId = Store::where("code", "STORE001")->value("id");
        $branchPusat = Branch::where("code", "BR1A")->value("id");
        $branchBabarsari = Branch::where("code", "BR1B")->value("id");
        $expenses = [
            [
                "expense_no" => "EXP-20260621-001",
                "expense_category_id" => 1, // Listrik & Air
                "store_id" => $storeId,
                "branch_id" => $branchPusat,
                "user_id" => $owner2,
                "expense_date" => "2026-06-21 08:00:00",
                "amount" => 1250000,
                "notes" => "Tagihan listrik bulan Juni - Pusat",
            ],
            [
                "expense_no" => "EXP-20260619-002",
                "expense_category_id" => 3, // Gaji Karyawan
                "store_id" => $storeId,
                "branch_id" => $branchPusat,
                "user_id" => $owner2,
                "expense_date" => "2026-06-19 10:00:00",
                "amount" => 3500000,
                "notes" => "Gaji karyawan Rina Wati",
            ],
            [
                "expense_no" => "EXP-20260618-003",
                "expense_category_id" => 4, // Perawatan
                "store_id" => $storeId,
                "branch_id" => $branchPusat,
                "user_id" => $owner2,
                "expense_date" => "2026-06-18 14:00:00",
                "amount" => 350000,
                "notes" => "Servis AC unit toko",
            ],
            [
                "expense_no" => "EXP-20260615-004",
                "expense_category_id" => 6, // Marketing
                "store_id" => $storeId,
                "branch_id" => $branchPusat,
                "user_id" => $owner2,
                "expense_date" => "2026-06-15 09:00:00",
                "amount" => 200000,
                "notes" => "Cetak banner promosi bulanan",
            ],
            [
                "expense_no" => "EXP-20260612-005",
                "expense_category_id" => 2, // Sewa
                "store_id" => $storeId,
                "branch_id" => $branchBabarsari,
                "user_id" => $owner2,
                "expense_date" => "2026-06-12 08:00:00",
                "amount" => 8000000,
                "notes" => "Sewa tempat bulan Juni - Cabang Babarsari",
            ],
            [
                "expense_no" => "EXP-20260610-006",
                "expense_category_id" => 5, // Perlengkapan
                "store_id" => $storeId,
                "branch_id" => $branchPusat,
                "user_id" => $owner2,
                "expense_date" => "2026-06-10 11:00:00",
                "amount" => 150000,
                "notes" => "Pembelian tinta printer struk",
            ],
            [
                "expense_no" => "EXP-20260608-007",
                "expense_category_id" => 3,
                "store_id" => $storeId,
                "branch_id" => $branchBabarsari,
                "user_id" => $owner2,
                "expense_date" => "2026-06-08 10:00:00",
                "amount" => 3200000,
                "notes" => "Gaji karyawan Agus Setiawan",
            ],
        ];

        foreach ($expenses as $e) {
            Expense::create($e);
        }
    }
}
