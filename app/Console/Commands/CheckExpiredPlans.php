<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Models\PlanSubscription;
use App\Models\Store;
use App\Notifications\PlanExpiredDowngraded;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Downgrade otomatis toko yang plan-nya sudah expired ke plan "free".
 *
 * Sebelum command ini, `Store::isPlanExpired()`/`effectivePlanCode()` hanya
 * menghitung status expired secara computed (on-the-fly) — kolom `plan_id`
 * di database tidak pernah benar-benar berubah. Command ini membuat
 * downgrade itu nyata (persisted) dan mencatat riwayatnya ke
 * `plan_subscriptions`.
 */
class CheckExpiredPlans extends Command
{
    protected $signature = 'plan:check-expired';

    protected $description = 'Downgrade toko yang plan-nya sudah expired ke plan free, dan catat riwayatnya';

    public function handle(): int
    {
        $freePlan = Plan::where('code', 'free')->first();

        if (! $freePlan) {
            $this->error('Plan "free" tidak ditemukan — tidak bisa downgrade.');
            Log::channel('daily')->error('[plan:check-expired] Plan free tidak ditemukan.');

            return self::FAILURE;
        }

        $expiredStores = Store::whereNotNull('plan_expires_at')
            ->where('plan_expires_at', '<', now())
            ->where('plan_id', '!=', $freePlan->id)
            ->with('planModel', 'owner')
            ->get();

        $count = 0;

        foreach ($expiredStores as $store) {
            $oldPlanId = $store->plan_id;
            $previousPlanLabel = $store->planModel?->label ?? 'sebelumnya';
            $owner = $store->owner;

            $store->update([
                'plan_id' => $freePlan->id,
                'plan_expires_at' => null,
            ]);

            PlanSubscription::where('store_id', $store->id)
                ->whereNull('ended_at')
                ->update(['ended_at' => now()]);

            PlanSubscription::create([
                'store_id' => $store->id,
                'plan_id' => $freePlan->id,
                'started_at' => now(),
                'reason' => 'trial_expired',
                'created_by' => null,
            ]);

            if ($owner) {
                $owner->notify(new PlanExpiredDowngraded($store, $previousPlanLabel));
            }

            $count++;

            Log::channel('daily')->info("[plan:check-expired] Store #{$store->id} downgrade dari plan #{$oldPlanId} ke free.");
        }

        $this->info("Done: {$count} toko di-downgrade ke plan free.");

        return self::SUCCESS;
    }
}
