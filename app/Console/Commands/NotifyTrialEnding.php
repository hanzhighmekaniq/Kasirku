<?php

namespace App\Console\Commands;

use App\Models\Store;
use App\Notifications\TrialEndingSoon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Kirim reminder ke owner toko yang trial/plan-nya akan berakhir H-3 dan
 * H-1. Dijalankan harian — cocok dijalankan setelah `plan:check-expired`
 * supaya toko yang sudah expired hari ini tidak ikut di-reminder lagi.
 */
class NotifyTrialEnding extends Command
{
    /** Ambang hari sebelum expired untuk dikirim reminder. */
    private const REMINDER_DAYS = [3, 1];

    protected $signature = 'plan:notify-trial-ending';

    protected $description = 'Kirim reminder H-3 dan H-1 ke owner toko yang trial/plan-nya akan segera berakhir';

    public function handle(): int
    {
        $count = 0;

        foreach (self::REMINDER_DAYS as $days) {
            $targetDate = now()->addDays($days)->toDateString();

            $stores = Store::whereNotNull('plan_expires_at')
                ->whereDate('plan_expires_at', $targetDate)
                ->with('owner')
                ->get();

            foreach ($stores as $store) {
                if (! $store->owner) {
                    continue;
                }

                $store->owner->notify(new TrialEndingSoon($store, $days));
                $count++;
            }
        }

        $this->info("Done: {$count} reminder trial dikirim.");
        Log::channel('daily')->info("[plan:notify-trial-ending] Reminder terkirim={$count}");

        return self::SUCCESS;
    }
}
