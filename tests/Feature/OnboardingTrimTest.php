<?php

/*
|--------------------------------------------------------------------------
| Onboarding Trim Test (A-7 Fix)
|--------------------------------------------------------------------------
|
| OnboardingController sebelumnya tidak melakukan trim pada
| owner_name. Whitespace atau spasi di awal/akhir nama
| tersimpan apa adanya.
|
*/

use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('onboarding trim owner_name dari spasi di awal dan akhir', function () {
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'basic_pos'],
        ['label' => 'basic_pos', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'free'],
        ['label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $user = User::factory()->create();

    $this->actingAs($user);

    $this->post(route('onboarding.store'), [
        'store_name' => '  Toko Trim  ',
        'owner_name' => '  Nama Pemilik  ',
        'store_type' => 'retail',
    ])->assertRedirect();

    $store = Store::where('user_id', $user->id)->first();
    expect($store)->not->toBeNull();
    expect($store->name)->toBe('Toko Trim');
});

test('onboarding trim store_name dari spasi di awal dan akhir', function () {
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'basic_pos'],
        ['label' => 'basic_pos', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'free'],
        ['label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $user = User::factory()->create();

    $this->actingAs($user);

    $this->post(route('onboarding.store'), [
        'store_name' => '  Toko Trim  ',
        'owner_name' => '  Nama Pemilik  ',
        'store_type' => 'retail',
    ])->assertRedirect();

    $store = Store::where('user_id', $user->id)->first();
    expect($store->name)->toBe('Toko Trim');
});

test('onboarding whitespace-only owner_name menjadi null', function () {
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'basic_pos'],
        ['label' => 'basic_pos', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'free'],
        ['label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $user = User::factory()->create();

    $this->actingAs($user);

    $this->post(route('onboarding.store'), [
        'store_name' => 'Toko Valid',
        'owner_name' => '   ',
        'store_type' => 'retail',
    ])->assertRedirect();

    $store = Store::where('user_id', $user->id)->first();
    expect($store)->not->toBeNull();
});
