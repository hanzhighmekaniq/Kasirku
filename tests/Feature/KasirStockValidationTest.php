<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('checkout fails when stock is insufficient for tracked product', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $features = ['basic_pos', 'product', 'category', 'payment_method', 'customer'];
    foreach ($features as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

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

    $category = Category::create([
        'store_id' => $store->id,
        'name' => 'Umum',
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Test Product',
        'code' => 'PRD001',
        'sku' => 'SKU001',
        'sell_price' => 10000,
        'cost_price' => 5000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'quantity' => 5,
        'reserved_quantity' => 0,
    ]);

    $paymentMethod = PaymentMethod::create([
        'store_id' => $store->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'price' => 10000,
            ],
        ],
        'payments' => [
            [
                'method_id' => $paymentMethod->id,
                'amount' => 100000,
            ],
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment(['message' => 'Stok "Test Product" tidak cukup. Dibutuhkan 10, tersedia 5.0000.']);

    $stock = ProductStock::where('product_id', $product->id)
        ->where('store_id', $store->id)
        ->first();
    expect((float) $stock->quantity)->toBe(5.0);
});

test('checkout succeeds when stock is sufficient', function () {
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $features = ['basic_pos', 'product', 'category', 'payment_method', 'customer'];
    foreach ($features as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

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

    $category = Category::create([
        'store_id' => $store->id,
        'name' => 'Umum',
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Test Product',
        'code' => 'PRD001',
        'sku' => 'SKU001',
        'sell_price' => 10000,
        'cost_price' => 5000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'quantity' => 20,
        'reserved_quantity' => 0,
    ]);

    $paymentMethod = PaymentMethod::create([
        'store_id' => $store->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 5,
                'price' => 10000,
            ],
        ],
        'payments' => [
            [
                'method_id' => $paymentMethod->id,
                'amount' => 50000,
            ],
        ],
    ]);

    $response->assertSuccessful();

    $stock = ProductStock::where('product_id', $product->id)
        ->where('store_id', $store->id)
        ->first();
    expect((float) $stock->quantity)->toBe(15.0);
});
