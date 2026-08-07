<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerDeposit;
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

function setupDepositContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['customer'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TST'.uniqid(),
        'name' => 'Toko Deposit',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang Utama', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach (['customer.view', 'customer.edit'] as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('store creates a deposit with correct balance', function () {
    [$store, $branch, $user] = setupDepositContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'C001', 'name' => 'Test Customer',
        'phone' => '08123456789', 'is_active' => true,
    ]);

    $response = $this->post(route('admin.customer-deposits.store'), [
        'customer_id' => $customer->id,
        'amount' => 500000,
        'payment_method' => 'cash',
        'deposit_at' => now()->toDateTimeString(),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('customer_deposits', [
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'amount' => 500000,
        'remaining_balance' => 500000,
        'type' => 'deposit',
    ]);
});

test('usage deducts from deposit balance', function () {
    [$store, $branch, $user] = setupDepositContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'C001', 'name' => 'Test Customer',
        'phone' => '08123456789', 'is_active' => true,
    ]);

    $deposit = CustomerDeposit::create([
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'user_id' => $user->id,
        'deposit_no' => 'DEP-TEST-001',
        'type' => 'deposit',
        'amount' => 500000,
        'remaining_balance' => 500000,
        'total_used' => 0,
        'payment_method' => 'cash',
        'deposit_at' => now(),
    ]);

    $response = $this->post(route('admin.customer-deposits.usage'), [
        'customer_id' => $customer->id,
        'deposit_id' => $deposit->id,
        'amount' => 200000,
    ]);

    $response->assertRedirect();

    expect($deposit->fresh()->remaining_balance)->toBe('300000.00');
});

test('usage exceeding balance is rejected', function () {
    [$store, $branch, $user] = setupDepositContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'C001', 'name' => 'Test Customer',
        'phone' => '08123456789', 'is_active' => true,
    ]);

    $deposit = CustomerDeposit::create([
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'user_id' => $user->id,
        'deposit_no' => 'DEP-TEST-002',
        'type' => 'deposit',
        'amount' => 100000,
        'remaining_balance' => 100000,
        'total_used' => 0,
        'payment_method' => 'cash',
        'deposit_at' => now(),
    ]);

    $response = $this->post(route('admin.customer-deposits.usage'), [
        'customer_id' => $customer->id,
        'deposit_id' => $deposit->id,
        'amount' => 200000,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors();
});

test('balance endpoint returns correct total', function () {
    [$store, $branch, $user] = setupDepositContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'C001', 'name' => 'Test Customer',
        'phone' => '08123456789', 'is_active' => true,
    ]);

    CustomerDeposit::create([
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'user_id' => $user->id,
        'deposit_no' => 'DEP-TEST-003',
        'type' => 'deposit',
        'amount' => 500000,
        'remaining_balance' => 500000,
        'total_used' => 0,
        'deposit_at' => now(),
    ]);

    CustomerDeposit::create([
        'store_id' => $store->id,
        'customer_id' => $customer->id,
        'user_id' => $user->id,
        'deposit_no' => 'DEP-TEST-004',
        'type' => 'deposit',
        'amount' => 300000,
        'remaining_balance' => 300000,
        'total_used' => 0,
        'deposit_at' => now(),
    ]);

    $response = $this->get(route('admin.customer-deposits.balance', ['customer_id' => $customer->id]));

    $response->assertOk();
    $response->assertJson([
        'customer_id' => $customer->id,
        'balance' => 800000,
    ]);
});
