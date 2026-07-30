<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\CustomerTier;
use App\Models\Feature;
use App\Models\Membership;
use App\Models\Plan;
use App\Models\Sale;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function setupCommandTestStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['customer', 'membership'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'CMD001', 'name' => 'Command Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    CustomerTier::seedDefaultsForStore($store->id);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true,
    ]);

    return [$store, $branch];
}

test('check-expired command marks past expired_date memberships as expired', function () {
    [$store] = setupCommandTestStore();

    $membership = Membership::create([
        'store_id' => $store->id, 'code' => 'GOLD01', 'name' => 'Gold',
        'duration_type' => 'month', 'duration_value' => 1, 'price' => 0,
        'discount_percent' => 0, 'point_multiplier' => 1, 'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST001', 'name' => 'Pelanggan', 'tier' => 'bronze',
    ]);

    // One expired, one still active
    $expiredCm = CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->subMonths(2),
        'expired_date' => now()->subDays(1), // sudah lewat
        'status' => 'active',
        'source' => 'manual',
    ]);

    $activeCm = CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->subDays(5),
        'expired_date' => now()->addDays(25), // belum lewat
        'status' => 'active',
        'source' => 'purchase',
    ]);

    $this->artisan('membership:check-expired')->assertExitCode(0);

    $expiredCm->refresh();
    $activeCm->refresh();

    expect($expiredCm->status)->toBe('expired');
    expect($activeCm->status)->toBe('active');
});

test('check-expired does not affect memberships without expired_date', function () {
    [$store] = setupCommandTestStore();

    $membership = Membership::create([
        'store_id' => $store->id, 'code' => 'VISIT01', 'name' => 'Visit',
        'duration_type' => 'visit', 'duration_value' => 10, 'price' => 0,
        'discount_percent' => 0, 'point_multiplier' => 1, 'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST002', 'name' => 'Pelanggan Visit', 'tier' => 'bronze',
    ]);

    $cm = CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->subMonths(2),
        'expired_date' => null, // berbasis kunjungan, tidak punya expiry
        'remaining_visits' => 3,
        'status' => 'active',
        'source' => 'manual',
    ]);

    $this->artisan('membership:check-expired')->assertExitCode(0);

    $cm->refresh();
    expect($cm->status)->toBe('active');
});

test('sweep-auto-tier command re-evaluates customers', function () {
    [$store, $branch] = setupCommandTestStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'SILVER01',
        'name' => 'Silver',
        'duration_type' => 'month',
        'duration_value' => 3,
        'price' => 0,
        'discount_percent' => 0,
        'point_multiplier' => 1,
        'maps_to_tier' => 'silver',
        'maps_to_tier_id' => CustomerTier::forStore($store->id)->where('name', 'Silver')->value('id'),
        'benefits' => [
            ['type' => 'maps_to_tier', 'label' => 'Setara Silver', 'tier' => 'silver',
                'tier_id' => CustomerTier::forStore($store->id)->where('name', 'Silver')->value('id')],
        ],
        'is_active' => true,
        'auto_tier_min_spend' => 300000,
        'auto_tier_window_type' => 'month',
        'auto_tier_window_value' => 1,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST003', 'name' => 'Auto Pelanggan', 'tier' => 'bronze',
    ]);

    Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'customer_id' => $customer->id,
        'sale_no' => 'SL-SWEEP-001',
        'sale_date' => now()->subDays(3),
        'grand_total' => 400000,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    $this->artisan('membership:sweep-auto-tier')->assertExitCode(0);

    $cm = CustomerMembership::where('customer_id', $customer->id)
        ->where('source', 'auto_tier')
        ->where('status', 'active')
        ->first();

    expect($cm)->not->toBeNull();
    expect($cm->membership_id)->toBe($membership->id);

    $customer->refresh();
    expect($customer->tier)->toBe('silver');
});
