<?php

namespace App\Console\Commands;

use App\Models\CafeTable;
use App\Models\Sale;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckExpiredSplitBills extends Command
{
    protected $signature = 'split:check-expired';

    protected $description = 'Auto-cancel expired split bills & pending sales that have been inactive for over 2 hours';

    public function handle(): int
    {
        $cutoff = now()->subHours(2);

        // 1. Split bills with NO payers paid → hard delete
        $noPayerSales = Sale::where('split_status', 'in_progress')
            ->where('created_at', '<=', $cutoff)
            ->whereDoesntHave('splitPayers', fn ($q) => $q->where('status', 'paid'))
            ->get();

        $deleted = 0;
        foreach ($noPayerSales as $sale) {
            DB::transaction(function () use ($sale) {
                if ($sale->table_id) {
                    CafeTable::where('id', $sale->table_id)
                        ->where('store_id', $sale->store_id)
                        ->update(['status' => 'available']);
                }
                $sale->delete();
            });
            $deleted++;
        }

        // 2. Split bills WITH some payers paid → mark stale
        $staleCount = Sale::where('split_status', 'in_progress')
            ->where('is_split_stale', false)
            ->where('created_at', '<=', $cutoff)
            ->whereHas('splitPayers', fn ($q) => $q->where('status', 'paid'))
            ->update(['is_split_stale' => true]);

        // 3. Non-split pending sales (stale, no payment) → hard delete
        $pendingSales = Sale::where('status', 'pending')
            ->where('split_status', 'none')
            ->where('created_at', '<=', $cutoff)
            ->get();

        $pendingDeleted = 0;
        foreach ($pendingSales as $sale) {
            DB::transaction(function () use ($sale) {
                if ($sale->table_id) {
                    CafeTable::where('id', $sale->table_id)
                        ->where('store_id', $sale->store_id)
                        ->update(['status' => 'available']);
                }
                $sale->delete();
            });
            $pendingDeleted++;
        }

        if ($deleted > 0 || $staleCount > 0 || $pendingDeleted > 0) {
            $this->info("Done: {$deleted} expired split bills deleted, {$staleCount} marked stale, {$pendingDeleted} pending sales deleted.");
            Log::channel('daily')->info("[split:check-expired] SplitDeleted={$deleted}, MarkedStale={$staleCount}, PendingDeleted={$pendingDeleted}");
        } else {
            $this->info('No expired items found.');
        }

        return self::SUCCESS;
    }
}
