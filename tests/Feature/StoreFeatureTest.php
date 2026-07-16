<?php

use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreFeature;
use App\Models\StoreType;
use Illuminate\Database\QueryException;

test('can create store feature with settings array stored and retrieved correctly', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $settings = ['max_discount' => 50, 'auto_apply' => true];

    $storeFeature = StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => true,
        'settings' => $settings,
        'managed_by' => 'owner',
        'enabled_by' => null,
        'enabled_at' => now(),
    ]);

    expect($storeFeature->is_enabled)->toBeTrue();
    expect($storeFeature->settings)->toBeArray();
    expect($storeFeature->settings)->toBe($settings);
    expect($storeFeature->managed_by)->toBe('owner');

    $retrieved = StoreFeature::find($storeFeature->id);
    expect($retrieved->settings)->toBeArray();
    expect($retrieved->settings['max_discount'])->toBe(50);
    expect($retrieved->settings['auto_apply'])->toBeTrue();
});

test('unique constraint prevents duplicate store and feature combination', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => true,
    ]);

    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => false,
    ]);
})->throws(QueryException::class);

test('store feature belongs to store and feature correctly', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeFeature = StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => false,
    ]);

    expect($storeFeature->store->id)->toBe($store->id);
    expect($storeFeature->feature->id)->toBe($feature->id);
    expect($storeFeature->feature->code)->toBe('promo');
});

test('store has store features relationship', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => true,
    ]);

    expect($store->storeFeatures)->toHaveCount(1);
    expect($store->storeFeatures->first()->feature->code)->toBe('promo');
});

test('is_enabled defaults to false when not specified', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeFeature = StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
    ]);

    expect($storeFeature->is_enabled)->toBeFalse();
});

// --- hasFeature() gate ke-3 tests ---

test('hasFeature returns true when no store_features row exists and type+plan allow', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeType->features()->attach($feature->id);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach($feature->id);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $store->load(['storeType.features', 'planModel.features']);

    expect($store->hasFeature('promo'))->toBeTrue();
});

test('hasFeature returns false when store_features has is_enabled=false even if type+plan allow', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeType->features()->attach($feature->id);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach($feature->id);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => false,
    ]);

    $store->load(['storeType.features', 'planModel.features']);

    expect($store->hasFeature('promo'))->toBeFalse();
});

test('hasFeature returns true when store_features has is_enabled=true and type+plan allow', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeType->features()->attach($feature->id);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach($feature->id);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => true,
    ]);

    $store->load(['storeType.features', 'planModel.features']);

    expect($store->hasFeature('promo'))->toBeTrue();
});
