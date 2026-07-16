<?php

use App\Models\Branch;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Promotion;
use App\Models\Store;
use App\Models\StoreFeature;
use App\Models\StoreType;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

test('kasir index returns promotions when promo feature is enabled', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $promoFeature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);
    $posFeature = Feature::create([
        'code' => 'basic_pos',
        'label' => 'POS',
        'is_active' => true,
        'sort_order' => 0,
    ]);
    $productFeature = Feature::create([
        'code' => 'product',
        'label' => 'Produk',
        'is_active' => true,
        'sort_order' => 0,
    ]);
    $categoryFeature = Feature::create([
        'code' => 'category',
        'label' => 'Kategori',
        'is_active' => true,
        'sort_order' => 0,
    ]);
    $paymentFeature = Feature::create([
        'code' => 'payment_method',
        'label' => 'Metode Bayar',
        'is_active' => true,
        'sort_order' => 0,
    ]);
    $customerFeature = Feature::create([
        'code' => 'customer',
        'label' => 'Pelanggan',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeType->features()->attach([
        $promoFeature->id,
        $posFeature->id,
        $productFeature->id,
        $categoryFeature->id,
        $paymentFeature->id,
        $customerFeature->id,
    ]);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach([
        $promoFeature->id,
        $posFeature->id,
        $productFeature->id,
        $categoryFeature->id,
        $paymentFeature->id,
        $customerFeature->id,
    ]);

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

    // Create role with permissions
    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perms = ['sale.create', 'sale.view'];
    foreach ($perms as $p) {
        $perm = Permission::create(['name' => $p, 'guard_id' => 1]);
        $role->givePermissionTo($perm);
    }
    $user->assignRole($role);

    // Create a promotion
    Promotion::create([
        'store_id' => $store->id,
        'code' => 'PROMO1',
        'name' => 'Test Promo',
        'type' => 'percentage',
        'scope' => 'item',
        'discount_value' => 10,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->get('/app/kasir');
    $response->assertSuccessful();
});

test('kasir index returns empty promotions when promo feature is disabled via store_features', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $promoFeature = Feature::create([
        'code' => 'promo',
        'label' => 'Promo',
        'is_active' => true,
        'sort_order' => 0,
    ]);
    $posFeature = Feature::create([
        'code' => 'basic_pos',
        'label' => 'POS',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $storeType->features()->attach([$promoFeature->id, $posFeature->id]);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach([$promoFeature->id, $posFeature->id]);

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

    // Disable promo via store_features
    StoreFeature::create([
        'store_id' => $store->id,
        'feature_id' => $promoFeature->id,
        'is_enabled' => false,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    Promotion::create([
        'store_id' => $store->id,
        'code' => 'PROMO1',
        'name' => 'Test Promo',
        'type' => 'percentage',
        'scope' => 'item',
        'discount_value' => 10,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->get('/app/kasir');
    $response->assertSuccessful();
});
