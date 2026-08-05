<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\User;

class ProrationService
{
    /**
     * Hitung harga upgrade dengan prorasi.
     *
     * @return array{amount: float, original_amount: float, proration_type: string|null, remaining_months: float, is_upgrade: bool, is_blocked: bool, block_reason: string|null}
     */
    public function calculateUpgradePrice(
        User $user,
        Plan $newPlan,
        string $requestedBillingPeriod,
    ): array {
        $oldPlan = $user->planModel;
        $oldBillingPeriod = $user->currentBillingPeriod();

        // Belum punya plan berbayar — full price
        if (! $oldPlan || $oldBillingPeriod === null) {
            return $this->fullPriceResult($newPlan, $requestedBillingPeriod);
        }

        // Yearly → Monthly: diblokir (downgrade)
        if ($oldBillingPeriod === PlanOrder::PERIOD_YEARLY
            && $requestedBillingPeriod === PlanOrder::PERIOD_MONTHLY
        ) {
            return [
                'amount' => 0,
                'original_amount' => 0,
                'proration_type' => null,
                'remaining_months' => 0,
                'is_upgrade' => false,
                'is_blocked' => true,
                'block_reason' => 'Downgrade dari tahunan ke bulanan belum tersedia.',
            ];
        }

        // Plan yang sama — diblokir
        if ($oldPlan->id === $newPlan->id && ! $user->isPlanExpired()) {
            return [
                'amount' => 0,
                'original_amount' => 0,
                'proration_type' => null,
                'remaining_months' => 0,
                'is_upgrade' => false,
                'is_blocked' => true,
                'block_reason' => 'Akun sudah menggunakan paket ini.',
            ];
        }

        $remainingMonths = $this->calculateRemainingMonths($user);

        // Monthly → Yearly: bayar full harga tahunan, plan bulanan hangus
        if ($oldBillingPeriod === PlanOrder::PERIOD_MONTHLY
            && $requestedBillingPeriod === PlanOrder::PERIOD_YEARLY
        ) {
            return [
                'amount' => (float) $newPlan->price_yearly,
                'original_amount' => (float) $newPlan->price_yearly,
                'proration_type' => PlanOrder::PRORATION_CROSS_PERIOD,
                'remaining_months' => $remainingMonths,
                'is_upgrade' => true,
                'is_blocked' => false,
                'block_reason' => null,
            ];
        }

        // Monthly → Monthly: prorated
        if ($oldBillingPeriod === PlanOrder::PERIOD_MONTHLY
            && $requestedBillingPeriod === PlanOrder::PERIOD_MONTHLY
        ) {
            $oldPrice = (float) $oldPlan->price;
            $newPrice = (float) $newPlan->price;
            $prorated = ($newPrice - $oldPrice) * $remainingMonths;
            $amount = max(0, round($prorated, 2));

            return [
                'amount' => $amount,
                'original_amount' => $newPrice,
                'proration_type' => PlanOrder::PRORATION_SAME_PERIOD,
                'remaining_months' => $remainingMonths,
                'is_upgrade' => true,
                'is_blocked' => false,
                'block_reason' => null,
            ];
        }

        // Yearly → Yearly: prorated
        if ($oldBillingPeriod === PlanOrder::PERIOD_YEARLY
            && $requestedBillingPeriod === PlanOrder::PERIOD_YEARLY
        ) {
            $oldYearlyPrice = (float) $oldPlan->price_yearly;
            $newYearlyPrice = (float) $newPlan->price_yearly;
            $prorated = ($newYearlyPrice - $oldYearlyPrice) * ($remainingMonths / 12);
            $amount = max(0, round($prorated, 2));

            return [
                'amount' => $amount,
                'original_amount' => $newYearlyPrice,
                'proration_type' => PlanOrder::PRORATION_SAME_PERIOD,
                'remaining_months' => $remainingMonths,
                'is_upgrade' => true,
                'is_blocked' => false,
                'block_reason' => null,
            ];
        }

        // Fallback: full price
        return $this->fullPriceResult($newPlan, $requestedBillingPeriod);
    }

    /**
     * Hitung sisa bulan sampai plan_expires_at.
     */
    public function calculateRemainingMonths(User $user): float
    {
        $expiresAt = $user->plan_expires_at;

        if (! $expiresAt || $expiresAt->isPast()) {
            return 0;
        }

        $remainingDays = now()->floatDiffInDays($expiresAt);

        return round($remainingDays / 30, 4);
    }

    private function fullPriceResult(Plan $plan, string $billingPeriod): array
    {
        $price = $billingPeriod === PlanOrder::PERIOD_YEARLY
            ? (float) $plan->price_yearly
            : (float) $plan->price;

        return [
            'amount' => $price,
            'original_amount' => $price,
            'proration_type' => PlanOrder::PRORATION_FULL,
            'remaining_months' => 0,
            'is_upgrade' => false,
            'is_blocked' => false,
            'block_reason' => null,
        ];
    }
}
