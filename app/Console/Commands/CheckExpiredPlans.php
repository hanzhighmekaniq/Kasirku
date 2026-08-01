<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Models\PlanSubscription;
use App\Models\User;
use App\Notifications\PlanExpiredDowngraded;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Downgrade otomatis user yang plan-nya sudah expired ke plan "free".
 *
 * Plan sekarang menempel ke User (bukan Store). Command ini meng-query
 * users.plan_expires_at dan mengupdate users.plan_id ke free.
 */
class CheckExpiredPlans extends Command
{
    protected $signature = 'plan:check-expired';

    protected $description = 'Downgrade user yang plan-nya sudah expired ke plan free, dan catat riwayatnya';

    public function handle(): int
    {
        $freePlan = Plan::where('code', 'free')->first();

        if (! $freePlan) {
            $this->error('Plan "free" tidak ditemukan — tidak bisa downgrade.');
            Log::channel('daily')->error('[plan:check-expired] Plan free tidak ditemukan.');

            return self::FAILURE;
        }

        $expiredUsers = User::whereNotNull('plan_expires_at')
            ->where('plan_expires_at', '<', now())
            ->where('plan_id', '!=', $freePlan->id)
            ->with('planModel')
            ->get();

        $count = 0;

        foreach ($expiredUsers as $user) {
            $oldPlanId = $user->plan_id;
            $previousPlanLabel = $user->planModel?->label ?? 'sebelumnya';

            $user->update([
                'plan_id' => $freePlan->id,
                'plan_expires_at' => null,
            ]);

            PlanSubscription::where('user_id', $user->id)
                ->whereNull('ended_at')
                ->update(['ended_at' => now()]);

            PlanSubscription::create([
                'user_id' => $user->id,
                'plan_id' => $freePlan->id,
                'started_at' => now(),
                'reason' => 'trial_expired',
                'created_by' => null,
            ]);

            $user->notify(new PlanExpiredDowngraded($previousPlanLabel));

            $count++;

            Log::channel('daily')->info("[plan:check-expired] User #{$user->id} downgrade dari plan #{$oldPlanId} ke free.");
        }

        $this->info("Done: {$count} user di-downgrade ke plan free.");

        return self::SUCCESS;
    }
}
