<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\Membership;

class AutoTierService
{
    public function evaluate(Customer $customer): void
    {
        $plans = Membership::where('store_id', $customer->store_id)
            ->whereNotNull('auto_tier_min_spend')
            ->where('is_active', true)
            ->get()
            ->sortByDesc(fn ($m) => $m->tierRank());

        $qualifiedPlan = null;

        foreach ($plans as $plan) {
            $windowStart = match ($plan->auto_tier_window_type) {
                'day' => now()->subDays($plan->auto_tier_window_value),
                'month' => now()->subMonths($plan->auto_tier_window_value),
                'year' => now()->subYears($plan->auto_tier_window_value),
                default => null,
            };

            if (! $windowStart) {
                continue;
            }

            $totalSpend = $customer->sales()
                ->where('status', 'completed')
                ->where('sale_date', '>=', $windowStart)
                ->sum('grand_total');

            if ($totalSpend >= $plan->auto_tier_min_spend) {
                $qualifiedPlan = $plan;
                break; // sudah diurutkan rank tertinggi dulu
            }
        }

        $currentAutoTier = $customer->memberships()->active()->autoTier()->first();

        if (! $qualifiedPlan) {
            $currentAutoTier?->update(['status' => 'cancelled']);
            $customer->syncTierFromMembership();

            return;
        }

        if ($currentAutoTier?->membership_id === $qualifiedPlan->id) {
            return; // tidak berubah
        }

        $currentAutoTier?->update(['status' => 'cancelled']);

        CustomerMembership::create([
            'customer_id' => $customer->id,
            'membership_id' => $qualifiedPlan->id,
            'start_date' => now(),
            'expired_date' => $qualifiedPlan->calculateExpiry(now()),
            'status' => 'active',
            'source' => 'auto_tier',
        ]);

        $customer->syncTierFromMembership();
    }
}
