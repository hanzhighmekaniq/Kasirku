<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\TrialEndingSoon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Kirim reminder ke user yang trial/plan-nya akan berakhir H-3 dan H-1.
 * Plan sekarang menempel ke User, bukan Store.
 */
class NotifyTrialEnding extends Command
{
    private const REMINDER_DAYS = [3, 1];

    protected $signature = 'plan:notify-trial-ending';

    protected $description = 'Kirim reminder H-3 dan H-1 ke user yang trial/plan-nya akan segera berakhir';

    public function handle(): int
    {
        $count = 0;

        foreach (self::REMINDER_DAYS as $days) {
            $targetDate = now()->addDays($days)->toDateString();

            $users = User::whereNotNull('plan_expires_at')
                ->whereDate('plan_expires_at', $targetDate)
                ->get();

            foreach ($users as $user) {
                // Buat objek Store dummy untuk notifikasi — kirim toko pertama
                // milik user sebagai konteks, atau null kalau belum punya.
                $store = $user->stores()->first();
                if (! $store) {
                    continue;
                }

                // Isi store->plan_expires_at dari user supaya TrialEndingSoon
                // bisa menampilkan tanggal kadaluarsa dengan benar.
                $store->plan_expires_at = $user->plan_expires_at;

                $user->notify(new TrialEndingSoon($store, $days));
                $count++;
            }
        }

        $this->info("Done: {$count} reminder trial dikirim.");
        Log::channel('daily')->info("[plan:notify-trial-ending] Reminder terkirim={$count}");

        return self::SUCCESS;
    }
}
