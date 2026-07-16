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

test('promo route is accessible when type+plan allow and no store_features row exists', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo & Diskon',
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

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    // Create role with permission
    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'promotion.view', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->get('/app/promotions');
    $response->assertSuccessful();
    $response->assertDontSeeText('dimatikan oleh pengaturan toko');
});

test('promo route is blocked when store_features has is_enabled=false', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo & Diskon',
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

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->get('/app/promotions');
    $response->assertRedirect();
    $response->assertSessionHas('error', 'Fitur "Promo & Diskon" dimatikan oleh pengaturan toko Anda.');
});

test('promo route is accessible when store_features has is_enabled=true', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $feature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo & Diskon',
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

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $feature->id,
        'is_enabled' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    // Create role with permission
    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'promotion.view', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->get('/app/promotions');
    $response->assertSuccessful();
    $response->assertDontSeeText('dimatikan oleh pengaturan toko');
});
