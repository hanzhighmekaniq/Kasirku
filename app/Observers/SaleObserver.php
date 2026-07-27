<?php

namespace App\Observers;

use App\Models\Sale;
use Illuminate\Support\Carbon;

class SaleObserver
{
    public function created(Sale $sale): void
    {
        $this->awardLoyaltyIfCompleted($sale);
    }

    public function updated(Sale $sale): void
    {
        if ($sale->wasChanged('status')) {
            $this->awardLoyaltyIfCompleted($sale);
        }
    }

    private function awardLoyaltyIfCompleted(Sale $sale): void
    {
        if ($sale->status !== 'completed' || ! $sale->customer_id) {
            return;
        }

        $extraData = $sale->extra_data ?? [];
        if (! empty($extraData['loyalty_awarded_at'])) {
            return;
        }

        $sale->loadMissing(['customer', 'store']);

        $customer = $sale->customer;
        if (! $customer) {
            return;
        }

        $grandTotal = (float) $sale->grand_total;
        $pointsPerAmount = (float) ($sale->store?->points_per_amount ?? 0);
        $activeMembership = $customer->activeMembership();
        $pointMultiplier = $activeMembership?->membership?->point_multiplier ?? 1;
        $earnedPoints = $pointsPerAmount > 0
            ? (int) floor($grandTotal / $pointsPerAmount) * (int) $pointMultiplier
            : 0;

        $customer->forceFill([
            'total_spent' => (float) $customer->total_spent + $grandTotal,
            'last_visit_at' => now(),
            'points' => (int) $customer->points + $earnedPoints,
        ])->save();

        $sale->forceFill([
            'extra_data' => [
                ...$extraData,
                'loyalty_awarded_at' => Carbon::now()->toISOString(),
                'loyalty_points_awarded' => $earnedPoints,
            ],
        ])->saveQuietly();
    }
}
