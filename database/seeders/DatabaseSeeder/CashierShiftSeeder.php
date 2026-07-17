<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class CashierShiftSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();
        $branchPusat = Branch::where('store_id', $store->id)->where('code', 'BR1A')->firstOrFail();

        $kasirUsers = User::whereIn('id', function ($q) {
            $q->select('model_id')
                ->from('model_has_roles')
                ->whereIn('role_id', function ($sq) {
                    $sq->select('id')->from('roles')->where('name', 'kasir');
                });
        })->get();

        if ($kasirUsers->isEmpty()) {
            return;
        }

        $seqPerDate = [];

        foreach ($kasirUsers as $user) {
            // Buat 3 shift tertutup di 3 hari terakhir
            for ($i = 3; $i >= 1; $i--) {
                $date = now()->subDays($i);
                $dateKey = $date->format('Ymd');

                if (! isset($seqPerDate[$dateKey])) {
                    $seqPerDate[$dateKey] = 0;
                }
                $seqPerDate[$dateKey]++;
                $seq = $seqPerDate[$dateKey];

                $openedAt = $date->copy()->setHour(8)->setMinute(0);
                $closedAt = $date->copy()->setHour(16 + rand(0, 4))->setMinute(rand(0, 59));
                $openingCash = (rand(50000, 200000) / 100) * 100;
                $totalSales = (rand(500000, 3000000) / 100) * 100;
                $expectedCash = $openingCash + $totalSales;
                $actualCash = $expectedCash + (rand(-20000, 20000) / 100) * 100;

                CashierShift::create([
                    'store_id' => $store->id,
                    'branch_id' => $branchPusat->id,
                    'user_id' => $user->id,
                    'shift_no' => 'SHF-'.$dateKey.'-'.str_pad((string) $seq, 3, '0', STR_PAD_LEFT),
                    'opened_at' => $openedAt,
                    'closed_at' => $closedAt,
                    'opening_cash' => $openingCash,
                    'expected_cash' => $expectedCash,
                    'actual_cash' => $actualCash,
                    'cash_difference' => $actualCash - $expectedCash,
                    'total_sales' => $totalSales,
                    'total_refunds' => 0,
                    'status' => 'closed',
                    'opening_note' => 'Shift demo '.$seq,
                    'closing_note' => 'Demo: selisih '.($actualCash - $expectedCash >= 0 ? '+' : '').number_format($actualCash - $expectedCash, 0, ',', '.'),
                ]);
            }
        }
    }
}
