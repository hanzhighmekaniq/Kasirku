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
use App\Services\AutoTierService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function setupAutoTierStore(): array
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
        'user_id' => null, 'code' => 'AUTOTIER001', 'name' => 'AutoTier Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    CustomerTier::seedDefaultsForStore($store->id);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true,
    ]);

    return [$store, $branch];
}

test('customer qualifies for auto-tier when spend exceeds threshold', function () {
    [$store, $branch] = setupAutoTierStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'GOLD01',
        'name' => 'Gold',
        'duration_type' => 'month',
        'duration_value' => 3,
        'price' => 0,
        'discount_percent' => 0,
        'point_multiplier' => 1,
        'maps_to_tier' => 'gold',
        'maps_to_tier_id' => CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id'),
        'benefits' => [
            ['type' => 'maps_to_tier', 'label' => 'Setara Gold', 'tier' => 'gold',
                'tier_id' => CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id')],
        ],
        'is_active' => true,
        'auto_tier_min_spend' => 500000,
        'auto_tier_window_type' => 'month',
        'auto_tier_window_value' => 3,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST001', 'name' => 'Pelanggan', 'tier' => 'bronze',
    ]);

    Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'customer_id' => $customer->id,
        'sale_no' => 'SL-001',
        'sale_date' => now()->subDays(5),
        'grand_total' => 600000,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    app(AutoTierService::class)->evaluate($customer);

    $cm = CustomerMembership::where('customer_id', $customer->id)
        ->where('source', 'auto_tier')
        ->where('status', 'active')
        ->first();

    expect($cm)->not->toBeNull();
    expect($cm->membership_id)->toBe($membership->id);

    $customer->refresh();
    expect($customer->tier)->toBe('gold');
});

test('auto-tier is cancelled when spend drops below threshold', function () {
    [$store, $branch] = setupAutoTierStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'GOLD01',
        'name' => 'Gold',
        'duration_type' => 'month',
        'duration_value' => 3,
        'price' => 0,
        'discount_percent' => 0,
        'point_multiplier' => 1,
        'maps_to_tier' => 'gold',
        'maps_to_tier_id' => CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id'),
        'benefits' => [
            ['type' => 'maps_to_tier', 'label' => 'Setara Gold', 'tier' => 'gold',
                'tier_id' => CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id')],
        ],
        'is_active' => true,
        'auto_tier_min_spend' => 500000,
        'auto_tier_window_type' => 'month',
        'auto_tier_window_value' => 1,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST002', 'name' => 'Pelanggan', 'tier' => 'gold',
    ]);

    // Existing auto_tier membership
    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->subDays(10),
        'expired_date' => now()->addDays(20),
        'status' => 'active',
        'source' => 'auto_tier',
    ]);

    // No sales this month → spend = 0 → no longer qualifies
    app(AutoTierService::class)->evaluate($customer);

    $cm = CustomerMembership::where('customer_id', $customer->id)
        ->where('source', 'auto_tier')
        ->where('status', 'active')
        ->first();

    expect($cm)->toBeNull();

    $customer->refresh();
    expect($customer->tier)->toBe('bronze');
});

test('auto-tier downgrade does not cancel manual or purchase memberships', function () {
    [$store, $branch] = setupAutoTierStore();

    $goldMembership = Membership::create([
        'store_id' => $store->id,
        'code' => 'GOLD01',
        'name' => 'Gold',
        'duration_type' => 'month',
        'duration_value' => 3,
        'price' => 0,
        'discount_percent' => 0,
        'point_multiplier' => 1,
        'maps_to_tier' => 'gold',
        'maps_to_tier_id' => CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id'),
        'benefits' => [
            ['type' => 'maps_to_tier', 'label' => 'Setara Gold', 'tier' => 'gold',
                'tier_id' => CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id')],
        ],
        'is_active' => true,
        'auto_tier_min_spend' => 500000,
        'auto_tier_window_type' => 'month',
        'auto_tier_window_value' => 1,
    ]);

    $platinumMembership = Membership::create([
        'store_id' => $store->id,
        'code' => 'PLAT01',
        'name' => 'Platinum',
        'duration_type' => 'month',
        'duration_value' => 12,
        'price' => 0,
        'discount_percent' => 0,
        'point_multiplier' => 1,
        'maps_to_tier' => 'platinum',
        'maps_to_tier_id' => CustomerTier::forStore($store->id)->where('name', 'Platinum')->value('id'),
        'benefits' => [
            ['type' => 'maps_to_tier', 'label' => 'Setara Platinum', 'tier' => 'platinum',
                'tier_id' => CustomerTier::forStore($store->id)->where('name', 'Platinum')->value('id')],
        ],
        'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST003', 'name' => 'Pelanggan', 'tier' => 'platinum',
    ]);

    // Manual membership at platinum tier
    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $platinumMembership->id,
        'start_date' => now()->subDays(5),
        'expired_date' => now()->addMonths(11),
        'status' => 'active',
        'source' => 'manual',
    ]);

    // Auto-tier gold that drops (spend below threshold)
    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $goldMembership->id,
        'start_date' => now()->subDays(10),
        'expired_date' => now()->addDays(20),
        'status' => 'active',
        'source' => 'auto_tier',
    ]);

    // No sales → auto_tier gold should be cancelled
    app(AutoTierService::class)->evaluate($customer);

    // Manual platinum still active
    $manualCm = CustomerMembership::where('customer_id', $customer->id)
        ->where('source', 'manual')
        ->where('status', 'active')
        ->first();
    expect($manualCm)->not->toBeNull();

    // Auto-tier gold cancelled
    $autoTierCm = CustomerMembership::where('customer_id', $customer->id)
        ->where('source', 'auto_tier')
        ->where('status', 'active')
        ->first();
    expect($autoTierCm)->toBeNull();

    // Tier final = platinum (dari manual membership yang masih aktif)
    $customer->refresh();
    expect($customer->tier)->toBe('platinum');
});
