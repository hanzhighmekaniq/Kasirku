<?php

namespace App\Console\Commands;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckExpenseBudgets extends Command
{
    protected $signature = 'app:check-expense-budgets';

    protected $description = 'Cek apakah ada kategori expense yang melebihi budget bulanan';

    public function handle(): int
    {
        $currentMonth = now()->startOfMonth();
        $categories = ExpenseCategory::whereNotNull('monthly_budget')
            ->where('monthly_budget', '>', 0)
            ->with('store:id,name')
            ->get();

        if ($categories->isEmpty()) {
            $this->info('Tidak ada kategori dengan budget yang ditetapkan.');

            return self::SUCCESS;
        }

        $alerts = 0;

        foreach ($categories as $category) {
            $totalExpense = Expense::where('expense_category_id', $category->id)
                ->where('status', 'posted')
                ->where('expense_date', '>=', $currentMonth)
                ->sum('amount');

            $budget = (float) $category->monthly_budget;
            $usagePercent = $budget > 0 ? ($totalExpense / $budget) * 100 : 0;

            if ($usagePercent >= 80) {
                $store = $category->store;
                if (! $store) {
                    continue;
                }

                // Kirim notifikasi ke admin toko
                $admins = $store->users()->get();

                $message = $usagePercent >= 100
                    ? "Budget kategori \"{$category->name}\" sudah melebihi batas! "
                        .'Pengeluaran: Rp '.number_format($totalExpense, 0, ',', '.')
                        .', Budget: Rp '.number_format($budget, 0, ',', '.')
                    : "Budget kategori \"{$category->name}\" sudah terpakai "
                        .number_format($usagePercent, 0).'% '
                        .'(Rp '.number_format($totalExpense, 0, ',', '.')
                        .' dari Rp '.number_format($budget, 0, ',', '.').')';

                foreach ($admins as $admin) {
                    DB::table('notifications')->insert([
                        'id' => Str::uuid(),
                        'type' => 'App\\Notifications\\ExpenseBudgetAlertNotification',
                        'notifiable_type' => 'App\\Models\\User',
                        'notifiable_id' => $admin->id,
                        'data' => json_encode([
                            'title' => $usagePercent >= 100 ? 'Budget Expense Terlampaui!' : 'Warning: Budget Expense Hampir Habis',
                            'message' => $message,
                            'category_id' => $category->id,
                            'category_name' => $category->name,
                            'total_expense' => $totalExpense,
                            'budget' => $budget,
                            'usage_percent' => $usagePercent,
                            'store_id' => $store->id,
                        ]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $alerts++;
                $this->warn($message);
            }
        }

        if ($alerts === 0) {
            $this->info('Semua kategori expense masih dalam batas budget.');
        } else {
            $this->info("Ditemukan {$alerts} alert budget expense.");
        }

        return self::SUCCESS;
    }
}
