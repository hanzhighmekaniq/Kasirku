<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlanSubscription;
use App\Models\User;
use App\Notifications\PlanUpgradeSuccess;
use Illuminate\Support\Facades\DB;

/**
 * Service terpusat untuk finalisasi plan order — dipanggil dari:
 *   - PlanController (PG payment success via polling)
 *   - WebhookController (PG payment success via webhook)
 *   - Developer/PlanOrderController (manual approve)
 *   - CheckPendingPgPayments command (cron check)
 */
class PlanOrderService
{
    /**
     * Finalize plan order: update status, upgrade plan user,
     * tutup subscription lama, catat riwayat, kirim notifikasi.
     *
     * @param  ?string  $pgExternalId  External ID dari PG transaction (null jika manual approve)
     * @param  ?int  $processedBy  User ID developer yang approve (null jika otomatis via PG)
     */
    public function finalize(PlanOrder $order, ?string $pgExternalId = null, ?int $processedBy = null): void
    {
        if ($order->status === PlanOrder::STATUS_PAID) {
            return;
        }

        DB::transaction(function () use ($order, $pgExternalId, $processedBy) {
            $order->update([
                'status' => PlanOrder::STATUS_PAID,
                'paid_at' => now(),
                'pg_transaction_id' => $pgExternalId,
                'processed_by' => $processedBy,
            ]);

            $user = $order->user;
            if (! $user) {
                return;
            }

            // Tutup subscription aktif user sebelumnya
            PlanSubscription::where('user_id', $user->id)
                ->whereNull('ended_at')
                ->update(['ended_at' => now()]);

            // Tentukan reason (upgraded/downgraded)
            $oldPlanId = $user->plan_id;
            $newPlanId = $order->plan_id;
            $oldPlan = $oldPlanId ? Plan::find($oldPlanId) : null;
            $newPlan = Plan::find($newPlanId);
            $reason = ($oldPlan && $newPlan && $oldPlan->sort_order > $newPlan->sort_order)
                ? 'downgraded'
                : 'upgraded';

            // Update plan user
            $user->update([
                'plan_id' => $newPlanId,
                'plan_expires_at' => $order->plan_active_until,
            ]);

            // Catat riwayat subscription
            PlanSubscription::create([
                'user_id' => $user->id,
                'plan_id' => $newPlanId,
                'started_at' => now(),
                'reason' => $reason,
                'created_by' => $processedBy,
            ]);

            // Kirim notifikasi ke user
            $this->notifyUser($user, $order);
        });
    }

    /**
     * Kirim notifikasi email ke user bahwa plan-nya sudah aktif.
     */
    private function notifyUser(User $user, PlanOrder $order): void
    {
        $store = $user->stores()->first();
        $plan = $order->plan;

        if ($store && $plan) {
            $user->notify(new PlanUpgradeSuccess($store, $plan, $order));
        }
    }
}
