<?php

/*
|--------------------------------------------------------------------------
| Customer Deposit Audit Test (E-4, E-5 Fix)
|--------------------------------------------------------------------------
|
| CustomerController::store() dan update() sebelumnya memungkinkan
| deposit_balance di-set langsung tanpa melalui CustomerDepositLog.
|
*/

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerDepositLog;
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

/**
 * @return array{0: Store, 1: User}
 */
function setupDepositAuditContext(): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'customer'],
        ['label' => 'Pelanggan', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic',
            'is_active' => true,
            'sort_order' => 0,
            'price' => 0,
        ],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'DEPAUD'.uniqid(),
        'name' => 'Deposit Audit Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    Branch::create([
        'store_id' => $store->id,
        'code' => 'BR1',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(
        Permission::firstOrCreate(['name' => 'customer.create'], ['guard_id' => 1]),
    );
    $user->assignRole($role);

    return [$store, $user];
}

test('create customer dengan deposit_balance diabaikan (dipaksa 0)', function () {
    [$store, $user] = setupDepositAuditContext();

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $this->postJson(route('admin.customers.store'), [
        'name' => 'Customer Deposit',
        'code' => 'CDEP-'.uniqid(),
        'deposit_balance' => 50000,
        'credit_limit' => 100000,
    ])->assertSuccessful();

    $customer = Customer::where('store_id', $store->id)->first();
    expect((float) $customer->deposit_balance)->toBe(0.0,
        'deposit_balance harus 0 saat pembuatan, bukan 50000');
});

test('update customer deposit_balance diabaikan (tidak berubah)', function () {
    [$store, $user] = setupDepositAuditContext();

    $customer = Customer::create([
        'store_id' => $store->id,
        'code' => 'CUPD-'.uniqid(),
        'name' => 'Customer Update',
        'deposit_balance' => 10000,
        'credit_limit' => 100000,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $this->putJson(route('admin.customers.update', $customer->id), [
        'name' => 'Customer Updated',
        'deposit_balance' => 99999,
        'credit_limit' => 200000,
    ])->assertSuccessful();

    expect((float) $customer->fresh()->deposit_balance)->toBe(10000.0,
        'deposit_balance tidak boleh berubah lewat update');
});

test('create customer tanpa deposit_balance default ke 0', function () {
    [$store, $user] = setupDepositAuditContext();

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $this->postJson(route('admin.customers.store'), [
        'name' => 'Customer No Deposit',
        'code' => 'CNOD-'.uniqid(),
        'credit_limit' => 100000,
    ])->assertSuccessful();

    $customer = Customer::where('store_id', $store->id)->first();
    expect((float) $customer->deposit_balance)->toBe(0.0);
});
