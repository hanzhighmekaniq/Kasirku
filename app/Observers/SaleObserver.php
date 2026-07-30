<?php

namespace App\Observers;

use App\Models\CustomerMembership;
use App\Models\Sale;
use App\Services\AutoTierService;
use Illuminate\Support\Carbon;

class SaleObserver
{
    public function created(Sale $sale): void
    {
        $this->awardLoyaltyIfCompleted($sale);
        $this->grantPurchasedMemberships($sale);
    }

    public function updated(Sale $sale): void
    {
        if ($sale->wasChanged('status')) {
            $this->awardLoyaltyIfCompleted($sale);
            $this->grantPurchasedMemberships($sale);
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
        // Kelipatan poin dibaca dari benefit, bukan kolom lama. pointMultiplier()
        // sudah memfallback ke kolom itu untuk membership yang belum dimigrasi.
        $pointMultiplier = $activeMembership?->membership?->pointMultiplier() ?? 1;
        $earnedPoints = $pointsPerAmount > 0
            ? (int) floor($grandTotal / $pointsPerAmount) * (int) $pointMultiplier
            : 0;

        $customer->forceFill([
            'total_spent' => (float) $customer->total_spent + $grandTotal,
            'last_visit_at' => now(),
            'points' => (int) $customer->points + $earnedPoints,
        ])->save();

        app(AutoTierService::class)->evaluate($customer);

        $sale->forceFill([
            'extra_data' => [
                ...$extraData,
                'loyalty_awarded_at' => Carbon::now()->toISOString(),
                'loyalty_points_awarded' => $earnedPoints,
            ],
        ])->saveQuietly();
    }

    private function grantPurchasedMemberships(Sale $sale): void
    {
        if ($sale->status !== 'completed' || ! $sale->customer_id) {
            return;
        }

        $extraData = $sale->extra_data ?? [];
        if (! empty($extraData['membership_granted_at'])) {
            return;
        }

        $sale->loadMissing('items.product.membership');
        $membershipItems = $sale->items->filter(fn ($item) => $item->product?->membership_id);

        if ($membershipItems->isEmpty()) {
            return;
        }

        foreach ($membershipItems as $item) {
            $membership = $item->product->membership;
            $startDate = now()->startOfDay();

            $existingActive = CustomerMembership::where('customer_id', $sale->customer_id)
                ->where('membership_id', $membership->id)
                ->active()
                ->first();

            if ($existingActive) {
                // Extend dari expired_date lama, bukan reset
                $base = $existingActive->expired_date ?? $startDate;
                $existingActive->update([
                    'expired_date' => $membership->calculateExpiry($base),
                ]);
            } else {
                CustomerMembership::create([
                    'customer_id' => $sale->customer_id,
                    'membership_id' => $membership->id,
                    'sale_id' => $sale->id,
                    'start_date' => $startDate,
                    'expired_date' => $membership->calculateExpiry($startDate),
                    'remaining_visits' => $membership->duration_type === 'visit'
                        ? $membership->duration_value
                        : null,
                    'status' => 'active',
                    'source' => 'purchase',
                ]);
            }
        }

        $sale->customer?->syncTierFromMembership();

        $sale->forceFill([
            'extra_data' => [...$extraData, 'membership_granted_at' => now()->toISOString()],
        ])->saveQuietly();
    }
}
