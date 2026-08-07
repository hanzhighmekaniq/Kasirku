<?php

namespace App\Console\Commands;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CreateRecurringExpenses extends Command
{
    protected $signature = 'expenses:create-recurring {--dry-run : Tampilkan tanpa membuat data}';

    protected $description = 'Buat pengeluaran berulang yang sudah jatuh tempo';

    public function handle(): int
    {
        $today = Carbon::today();

        $recurringExpenses = Expense::where('is_recurring', true)
            ->where('next_due_date', '<=', $today)
            ->where('status', '!=', 'cancelled')
            ->with('expenseCategory')
            ->get();

        $created = 0;
        $skipped = 0;

        foreach ($recurringExpenses as $expense) {
            $nextDate = $this->calculateNextDate($expense->next_due_date, $expense->recurrence_type);

            if ($this->option('dry-run')) {
                $this->info("DRY RUN: Akan buat expense untuk {$expense->expense_no} ({$expense->expenseCategory?->name}) sebesar {$expense->amount} pada {$nextDate->format('Y-m-d')}");
                $created++;

                continue;
            }

            // Generate nomor expense baru
            $dateStr = $today->format('Ymd');
            $lastExpense = Expense::where('expense_no', 'like', "EXP-{$dateStr}-%")->count();
            $expenseNo = 'EXP-'.$dateStr.'-'.str_pad($lastExpense + 1, 3, '0', STR_PAD_LEFT);

            // Buat expense baru
            Expense::create([
                'expense_category_id' => $expense->expense_category_id,
                'store_id' => $expense->store_id,
                'branch_id' => $expense->branch_id,
                'user_id' => $expense->user_id,
                'expense_no' => $expenseNo,
                'expense_date' => $today,
                'amount' => $expense->amount,
                'notes' => "[Otomatis] {$expense->notes}",
                'status' => 'draft',
                'is_recurring' => true,
                'recurrence_type' => $expense->recurrence_type,
                'next_due_date' => $nextDate,
                'parent_expense_id' => $expense->parent_expense_id ?? $expense->id,
            ]);

            // Update next_due_date expense induk
            $expense->update(['next_due_date' => $nextDate]);

            $created++;
        }

        $this->info("Selesai: {$created} pengeluaran berulang dibuat.");

        return Command::SUCCESS;
    }

    private function calculateNextDate($currentDate, string $recurrenceType): Carbon
    {
        $date = $currentDate instanceof Carbon ? $currentDate : Carbon::parse($currentDate);

        return match ($recurrenceType) {
            'weekly' => $date->addWeek(),
            'monthly' => $date->addMonth(),
            'yearly' => $date->addYear(),
            default => $date->addMonth(),
        };
    }
}
