<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('customer can pay partial debt', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $feature = Feature::create(['code' => 'customer', 'label' => 'Customer', 'is_active' => true, 'sort_order' => 0]);
    $storeType->features()->attach($feature->id);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach($feature->id);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create(['store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST001', 'name' => 'Budi',
        'debt_balance' => 50000, 'credit_limit' => 100000,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $permView = Permission::create(['name' => 'customer.view', 'guard_id' => 1]);
    $permEdit = Permission::create(['name' => 'customer.edit', 'guard_id' => 1]);
    $role->givePermissionTo([$permView, $permEdit]);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson("/app/customers/{$customer->id}/pay-debt", [
        'amount' => 20000,
        'notes' => 'Pelunasan sebagian',
    ]);

    $response->assertSuccessful();

    $customer->refresh();
    expect((float) $customer->debt_balance)->toBe(30000.0);

    $log = CustomerDebtLog::where('customer_id', $customer->id)->first();
    expect($log->type)->toBe('payment');
    expect((float) $log->amount)->toBe(20000.0);
    expect((float) $log->balance_after)->toBe(30000.0);
});

test('customer cannot pay more than debt balance', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $feature = Feature::create(['code' => 'customer', 'label' => 'Customer', 'is_active' => true, 'sort_order' => 0]);
    $storeType->features()->attach($feature->id);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach($feature->id);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create(['store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST001', 'name' => 'Budi',
        'debt_balance' => 30000, 'credit_limit' => 100000,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $permView = Permission::create(['name' => 'customer.view', 'guard_id' => 1]);
    $permEdit = Permission::create(['name' => 'customer.edit', 'guard_id' => 1]);
    $role->givePermissionTo([$permView, $permEdit]);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson("/app/customers/{$customer->id}/pay-debt", [
        'amount' => 50000,
    ]);

    $response->assertStatus(422);

    $customer->refresh();
    expect((float) $customer->debt_balance)->toBe(30000.0);
});
