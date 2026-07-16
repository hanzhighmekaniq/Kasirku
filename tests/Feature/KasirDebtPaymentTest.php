<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('debt payment increases customer debt balance', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'product', 'category', 'payment_method', 'customer'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create(['store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true]);
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Test Product', 'code' => 'PRD001', 'sku' => 'SKU001',
        'sell_price' => 80000, 'cost_price' => 50000, 'track_stock' => false,
        'is_active' => true, 'is_sellable' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST001', 'name' => 'Budi',
        'debt_balance' => 0, 'credit_limit' => 500000,
    ]);

    $debtMethod = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'debt', 'name' => 'Hutang/Bon',
        'type' => 'debt', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $debtPerm = Permission::create(['name' => 'debt.create', 'guard_id' => 1]);
    $role->givePermissionTo([$perm, $debtPerm]);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'customer_id' => $customer->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 80000]],
        'payments' => [['method_id' => $debtMethod->id, 'amount' => 80000]],
    ]);

    $response->assertSuccessful();

    $customer->refresh();
    expect((float) $customer->debt_balance)->toBe(80000.0);

    $log = CustomerDebtLog::where('customer_id', $customer->id)->first();
    expect($log)->not->toBeNull();
    expect($log->type)->toBe('add');
    expect((float) $log->amount)->toBe(80000.0);
});

test('debt payment rejected when exceeding credit limit', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'product', 'category', 'payment_method', 'customer'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create(['store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true]);
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Test Product', 'code' => 'PRD001', 'sku' => 'SKU001',
        'sell_price' => 200000, 'cost_price' => 100000, 'track_stock' => false,
        'is_active' => true, 'is_sellable' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST001', 'name' => 'Budi',
        'debt_balance' => 400000, 'credit_limit' => 500000,
    ]);

    $debtMethod = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'debt', 'name' => 'Hutang/Bon',
        'type' => 'debt', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $debtPerm = Permission::create(['name' => 'debt.create', 'guard_id' => 1]);
    $role->givePermissionTo([$perm, $debtPerm]);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'customer_id' => $customer->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 200000]],
        'payments' => [['method_id' => $debtMethod->id, 'amount' => 200000]],
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment(['message' => 'Hutang melebihi limit. Limit: Rp500,000, Hutang saat ini: Rp400,000, Ditambah: Rp200,000']);

    $customer->refresh();
    expect((float) $customer->debt_balance)->toBe(400000.0);
});
