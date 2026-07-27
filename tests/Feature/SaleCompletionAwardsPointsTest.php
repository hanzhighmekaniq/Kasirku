<?php

use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\Membership;
use App\Models\Plan;
use App\Models\Sale;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function setUpSalePointsContext(float $pointsPerAmount = 10000): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
        'points_per_amount' => $pointsPerAmount,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST001', 'name' => 'Budi',
        'points' => 0, 'total_spent' => 0,
    ]);

    return compact('store', 'customer');
}

test('completing a sale awards points based on store rate', function () {
    ['store' => $store, 'customer' => $customer] = setUpSalePointsContext(pointsPerAmount: 10000);

    Sale::create([
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'sale_no' => 'SALE-001',
        'sale_date' => now(),
        'grand_total' => 55000,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    $customer->refresh();

    expect($customer->points)->toBe(5);
    expect((float) $customer->total_spent)->toBe(55000.0);
    expect($customer->last_visit_at)->not->toBeNull();
});

test('points multiply according to active membership multiplier', function () {
    ['store' => $store, 'customer' => $customer] = setUpSalePointsContext(pointsPerAmount: 10000);

    $membership = Membership::create([
        'store_id' => $store->id, 'code' => 'GOLD01', 'name' => 'Gold Member',
        'duration_type' => 'month', 'duration_value' => 1,
        'price' => 100000, 'discount_percent' => 10, 'point_multiplier' => 3,
        'is_active' => true,
    ]);

    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now(),
        'expired_date' => now()->addMonth(),
        'status' => 'active',
    ]);

    Sale::create([
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'sale_no' => 'SALE-002',
        'sale_date' => now(),
        'grand_total' => 20000,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    $customer->refresh();

    // 20000 / 10000 = 2 base points * 3x multiplier = 6
    expect($customer->points)->toBe(6);
});

test('sale status changing to completed via update also awards points once', function () {
    ['store' => $store, 'customer' => $customer] = setUpSalePointsContext(pointsPerAmount: 10000);

    $sale = Sale::create([
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'sale_no' => 'SALE-003',
        'sale_date' => now(),
        'grand_total' => 30000,
        'status' => 'pending',
        'payment_status' => 'unpaid',
    ]);

    $customer->refresh();
    expect($customer->points)->toBe(0);

    $sale->update(['status' => 'completed', 'payment_status' => 'paid']);

    $customer->refresh();
    expect($customer->points)->toBe(3);

    // Updating again without changing status should not double-award.
    $sale->update(['notes' => 'no-op change']);

    $customer->refresh();
    expect($customer->points)->toBe(3);
});

test('no points are awarded when store has no points rate configured', function () {
    ['store' => $store, 'customer' => $customer] = setUpSalePointsContext(pointsPerAmount: 0);

    Sale::create([
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'sale_no' => 'SALE-004',
        'sale_date' => now(),
        'grand_total' => 55000,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    $customer->refresh();

    expect($customer->points)->toBe(0);
    expect((float) $customer->total_spent)->toBe(55000.0);
});
