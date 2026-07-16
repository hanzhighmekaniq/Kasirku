<?php

use App\Models\Branch;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreFeature;
use App\Models\StoreType;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

test('post to settings features endpoint creates store feature toggle', function () {
    $this->withoutMiddleware();

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

    $settingsFeature = Feature::create([
        'code' => 'settings',
        'label' => 'Settings',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeType->features()->attach([$feature->id, $settingsFeature->id]);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach([$feature->id, $settingsFeature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'setting.edit', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->post('/app/settings/features', [
        'feature_id' => $feature->id,
        'is_enabled' => false,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Pengaturan fitur berhasil disimpan.');

    $storeFeature = StoreFeature::where('store_id', $store->id)
        ->where('feature_id', $feature->id)
        ->first();

    expect($storeFeature)->not->toBeNull();
    expect($storeFeature->is_enabled)->toBeFalse();
    expect($storeFeature->enabled_by)->toBe($user->id);
    expect($storeFeature->enabled_at)->not->toBeNull();
    expect($storeFeature->managed_by)->toBe('owner');
});

test('post to settings features endpoint updates existing store feature toggle', function () {
    $this->withoutMiddleware();

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

    $settingsFeature = Feature::create([
        'code' => 'settings',
        'label' => 'Settings',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeType->features()->attach([$feature->id, $settingsFeature->id]);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach([$feature->id, $settingsFeature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    // Create initial store feature
    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => false,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'setting.edit', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->post('/app/settings/features', [
        'feature_id' => $feature->id,
        'is_enabled' => true,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $storeFeature = StoreFeature::where('store_id', $store->id)
        ->where('feature_id', $feature->id)
        ->first();

    expect($storeFeature->is_enabled)->toBeTrue();
    expect($storeFeature->enabled_by)->toBe($user->id);
});

test('settings index returns storeFeatures data', function () {
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

    $settingsFeature = Feature::create([
        'code' => 'settings',
        'label' => 'Settings',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeType->features()->attach([$feature->id, $settingsFeature->id]);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach([$feature->id, $settingsFeature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
        'name' => 'Test Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => false,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'setting.edit', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->get('/app/settings');
    $response->assertSuccessful();
});
