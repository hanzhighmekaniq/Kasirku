<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\CashierShift;
use App\Models\User;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CashierShiftSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::first();
        if (!$store) {
            return;
        }

        $kasirUsers = User::whereIn("id", function ($q) {
            $q->select("model_id")
                ->from("model_has_roles")
                ->whereIn("role_id", function ($sq) {
                    $sq->select("id")->from("roles")->where("name", "kasir");
                });
        })->get();
        if ($kasirUsers->isEmpty()) {
            return;
        }

        // Track sequence number per date to avoid duplicate shift_no
        $seqPerDate = [];

        foreach ($kasirUsers as $user) {
            $branchId = $user->branch_id;
            $branch = $store->branches()->where("is_active", true)->first();
            if (!$branchId && $branch) {
                $branchId = $branch->id;
            }

            // Create 3 closed shifts in the last 3 days
            for ($i = 3; $i >= 1; $i--) {
                $date = now()->subDays($i);
                $dateKey = $date->format("Ymd");

                // Increment per-date counter
                if (!isset($seqPerDate[$dateKey])) {
                    $seqPerDate[$dateKey] = 0;
                }
                $seqPerDate[$dateKey]++;
                $seq = $seqPerDate[$dateKey];

                $openedAt = $date->copy()->setHour(8)->setMinute(0);
                $closedAt = $date
                    ->copy()
                    ->setHour(16 + rand(0, 4))
                    ->setMinute(rand(0, 59));
                $openingCash = (rand(50000, 200000) / 100) * 100;
                $totalSales = (rand(100000, 2000000) / 100) * 100;
                $expectedCash = $openingCash + $totalSales;
                $actualCash = $expectedCash + (rand(-50000, 50000) / 100) * 100;

                CashierShift::create([
                    "store_id" => $store->id,
                    "branch_id" => $branchId,
                    "user_id" => $user->id,
                    "shift_no" =>
                        "SHF-" .
                        $dateKey .
                        "-" .
                        str_pad((string) $seq, 3, "0", STR_PAD_LEFT),
                    "opened_at" => $openedAt,
                    "closed_at" => $closedAt,
                    "opening_cash" => $openingCash,
                    "expected_cash" => $expectedCash,
                    "actual_cash" => $actualCash,
                    "cash_difference" => $actualCash - $expectedCash,
                    "total_sales" => $totalSales,
                    "total_refunds" => 0,
                    "status" => "closed",
                    "opening_note" => "Shift demo " . $seq,
                    "closing_note" =>
                        "Demo: selisih " .
                        ($actualCash - $expectedCash >= 0 ? "+" : "") .
                        number_format($actualCash - $expectedCash, 0, ",", "."),
                ]);
            }
        }
    }
}
