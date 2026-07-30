<?php

use App\Models\Feature;
use App\Models\Membership;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function setupMembershipSyncStore(): Store
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);
    $f = Feature::create(['code' => 'membership', 'label' => 'Membership', 'is_active' => true, 'sort_order' => 0]);
    $storeType->features()->attach($f->id);
    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach($f->id);

    return Store::create([
        'user_id' => null, 'code' => 'SYNC001', 'name' => 'Sync Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);
}

test('enabling is_sellable_at_pos creates a hidden product for the membership', function () {
    $store = setupMembershipSyncStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'GOLD01',
        'name' => 'Gold Member',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 150000,
        'is_sellable_at_pos' => true,
        'is_active' => true,
        'discount_percent' => 0,
        'point_multiplier' => 1,
    ]);

    $product = Product::where('membership_id', $membership->id)->first();

    expect($product)->not->toBeNull();
    expect($product->type)->toBe('membership');
    expect($product->is_sellable)->toBeFalse();
    expect((float) $product->sell_price)->toBe(150000.0);
    expect($product->sku)->toBe('MBR-GOLD01');
});

test('disabling is_sellable_at_pos deactivates the linked product', function () {
    $store = setupMembershipSyncStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'SILV01',
        'name' => 'Silver Member',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 75000,
        'is_sellable_at_pos' => true,
        'is_active' => true,
        'discount_percent' => 0,
        'point_multiplier' => 1,
    ]);

    $product = Product::where('membership_id', $membership->id)->first();
    expect($product->is_active)->toBeTrue();

    $membership->update(['is_sellable_at_pos' => false]);

    $product->refresh();
    expect($product->is_active)->toBeFalse();
});

test('updating membership price syncs to the linked product', function () {
    $store = setupMembershipSyncStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'PLAT01',
        'name' => 'Platinum Member',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 200000,
        'is_sellable_at_pos' => true,
        'is_active' => true,
        'discount_percent' => 0,
        'point_multiplier' => 1,
    ]);

    $membership->update(['price' => 250000]);

    $product = Product::where('membership_id', $membership->id)->first();
    expect((float) $product->sell_price)->toBe(250000.0);
});
