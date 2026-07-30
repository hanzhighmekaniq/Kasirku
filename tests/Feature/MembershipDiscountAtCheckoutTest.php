<?php

use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\Feature;
use App\Models\Membership;
use App\Models\Plan;
use App\Models\Promotion;
use App\Models\Store;
use App\Models\StoreType;
use App\Services\PromotionService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function setupMembershipDiscountStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $features = ['promo', 'customer', 'membership'];
    foreach ($features as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'MBRDSC001', 'name' => 'Membership Discount Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    return [$store];
}

test('membership discount applied when customer has active membership with discount_percent', function () {
    [$store] = setupMembershipDiscountStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'SILVER01',
        'name' => 'Silver',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'discount_percent' => 10,
        'point_multiplier' => 1,
        'maps_to_tier' => 'silver',
        'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST001', 'name' => 'Pelanggan', 'tier' => 'silver',
    ]);

    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->startOfDay(),
        'expired_date' => now()->addMonth(),
        'status' => 'active',
        'source' => 'manual',
    ]);

    $service = new PromotionService;
    $candidate = $service->membershipDiscountCandidate($customer, 200000);

    expect($candidate)->not->toBeNull();
    expect($candidate['discount'])->toBe(20000.0);
    expect($candidate['source'])->toBe('membership');
});

test('membership discount wins over smaller cart promo', function () {
    [$store] = setupMembershipDiscountStore();

    // Promo cart 5%
    Promotion::create([
        'store_id' => $store->id,
        'code' => 'CART5',
        'name' => 'Cart 5%',
        'type' => 'percentage',
        'scope' => 'cart',
        'discount_value' => 5,
        'is_active' => true,
        'max_usage' => 0,
    ]);

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'GOLD01',
        'name' => 'Gold',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'discount_percent' => 15, // lebih besar dari 5%
        'point_multiplier' => 1,
        'maps_to_tier' => 'gold',
        'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST002', 'name' => 'Pelanggan Gold', 'tier' => 'gold',
    ]);

    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->startOfDay(),
        'expired_date' => now()->addMonth(),
        'status' => 'active',
        'source' => 'manual',
    ]);

    $service = new PromotionService;
    $cartPromo = $service->findBestCartPromo(100000, null);
    $membershipCandidate = $service->membershipDiscountCandidate($customer, 100000);

    // Membership 15% > promo 5% — membership harus menang
    expect($membershipCandidate['discount'])->toBeGreaterThan($cartPromo['discount']);
    expect($membershipCandidate['discount'])->toBe(15000.0);
    expect($cartPromo['discount'])->toBe(5000.0);
});

test('larger cart promo wins over smaller membership discount', function () {
    [$store] = setupMembershipDiscountStore();

    // Promo cart 20%
    Promotion::create([
        'store_id' => $store->id,
        'code' => 'CART20',
        'name' => 'Cart 20%',
        'type' => 'percentage',
        'scope' => 'cart',
        'discount_value' => 20,
        'is_active' => true,
        'max_usage' => 0,
    ]);

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'BRONZ01',
        'name' => 'Bronze',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'discount_percent' => 5, // lebih kecil dari 20%
        'point_multiplier' => 1,
        'maps_to_tier' => 'bronze',
        'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST003', 'name' => 'Pelanggan Bronze', 'tier' => 'bronze',
    ]);

    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->startOfDay(),
        'expired_date' => now()->addMonth(),
        'status' => 'active',
        'source' => 'manual',
    ]);

    $service = new PromotionService;
    $cartPromo = $service->findBestCartPromo(100000, null);
    $membershipCandidate = $service->membershipDiscountCandidate($customer, 100000);

    // Cart promo 20% > membership 5% — cart promo harus menang
    expect($cartPromo['discount'])->toBeGreaterThan($membershipCandidate['discount']);
    expect($cartPromo['discount'])->toBe(20000.0);
    expect($membershipCandidate['discount'])->toBe(5000.0);
});

test('no membership discount when customer has no active membership', function () {
    [$store] = setupMembershipDiscountStore();

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST004', 'name' => 'Tanpa Membership', 'tier' => 'bronze',
    ]);

    $service = new PromotionService;
    $candidate = $service->membershipDiscountCandidate($customer, 100000);

    expect($candidate)->toBeNull();
});
