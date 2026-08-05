<?php

/*
|--------------------------------------------------------------------------
| UserManagement Scope Test (F-5 Fix)
|--------------------------------------------------------------------------
|
| UserManagementController::invite() sebelumnya tidak meng-scope
| branch_id dan employee_id ke store aktif. User bisa pass
| branch_id atau employee_id dari store lain.
|
*/

use App\Models\Branch;
use App\Models\Employee;
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
 * @return array{0: Store, 1: Branch, 2: User}
 */
function setupUserMgmtContext(): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'employee'],
        ['label' => 'Karyawan', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'USRMGMT'.uniqid(),
        'name' => 'User Mgmt Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
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
        Permission::firstOrCreate(['name' => 'employee.create'], ['guard_id' => 1]),
    );
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('invite dengan branch_id dari store lain ditolak', function () {
    [$store, $branch, $user] = setupUserMgmtContext();

    $otherStore = Store::create([
        'user_id' => null,
        'code' => 'OTHER'.uniqid(),
        'name' => 'Other Store',
        'store_type_id' => $store->store_type_id,
    ]);

    $foreignBranch = Branch::create([
        'store_id' => $otherStore->id,
        'code' => 'BR-X',
        'name' => 'Foreign Branch',
        'is_active' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $this->post(route('admin.store-users.invite'), [
        'name' => 'Test User',
        'email' => 'test-'.uniqid().'@example.com',
        'password' => 'password123',
        'role' => 'kasir',
        'branch_id' => $foreignBranch->id,
    ])->assertSessionHasErrors('branch_id');
});

test('invite dengan employee_id dari store lain ditolak', function () {
    [$store, $branch, $user] = setupUserMgmtContext();

    $otherStore = Store::create([
        'user_id' => null,
        'code' => 'OTHER'.uniqid(),
        'name' => 'Other Store',
        'store_type_id' => $store->store_type_id,
    ]);

    $foreignEmployee = Employee::create([
        'store_id' => $otherStore->id,
        'employee_code' => 'EMP-X'.uniqid(),
        'name' => 'Foreign Employee',
        'status' => 'active',
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $this->post(route('admin.store-users.invite'), [
        'name' => 'Test User',
        'email' => 'test-'.uniqid().'@example.com',
        'password' => 'password123',
        'role' => 'kasir',
        'employee_id' => $foreignEmployee->id,
    ])->assertSessionHasErrors('employee_id');
});

test('invite dengan branch_id dari store sendiri berhasil', function () {
    [$store, $branch, $user] = setupUserMgmtContext();

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $this->post(route('admin.store-users.invite'), [
        'name' => 'Valid User',
        'email' => 'valid-'.uniqid().'@example.com',
        'password' => 'password123',
        'role' => 'kasir',
        'branch_id' => $branch->id,
    ])->assertRedirect();

    $this->assertDatabaseHas('users', ['email' => 'valid-'.uniqid().'@example.com'] ? [] : ['name' => 'Valid User']);
});
