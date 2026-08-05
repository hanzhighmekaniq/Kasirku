<?php

/*
|--------------------------------------------------------------------------
| UserManagement Owner Guard (F-6 Fix)
|--------------------------------------------------------------------------
|
| UserManagementController::revoke() sebelumnya tidak mencegah
| owner mencabut akses diri sendiri atau owner terakhir.
|
*/

use App\Models\Branch;
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
 * @return array{0: Store, 1: User (owner), 2: User (kasir)}
 */
function setupOwnerGuardContext(): array
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
        'code' => 'OWNGRD'.uniqid(),
        'name' => 'Owner Guard Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR1',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);

    // Owner user
    $owner = User::factory()->create();
    $store->users()->attach($owner->id);
    $ownerRole = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $ownerRole->givePermissionTo(
        Permission::firstOrCreate(['name' => 'employee.view'], ['guard_id' => 1]),
    );
    $owner->assignRole($ownerRole);

    // Kasir user
    $kasir = User::factory()->create();
    $store->users()->attach($kasir->id);
    $kasirRole = Role::create(['name' => 'kasir-'.uniqid(), 'guard_id' => 1]);
    $kasirRole->givePermissionTo(
        Permission::firstOrCreate(['name' => 'sale.create'], ['guard_id' => 1]),
    );
    $kasir->assignRole($kasirRole);

    return [$store, $owner, $kasir];
}

test('owner tidak bisa mencabut akses diri sendiri', function () {
    [$store, $owner, $kasir] = setupOwnerGuardContext();

    $this->actingAs($owner);
    session(['current_store_id' => $store->id]);

    $this->delete(route('admin.store-users.revoke', $owner->id))
        ->assertRedirect()
        ->assertSessionHas('error', 'Anda tidak bisa mencabut akses diri sendiri.');
});

test('owner bisa mencabut akses kasir', function () {
    [$store, $owner, $kasir] = setupOwnerGuardContext();

    $this->actingAs($owner);
    session(['current_store_id' => $store->id]);

    $this->delete(route('admin.store-users.revoke', $kasir->id))
        ->assertRedirect();

    expect($store->users()->where('users.id', $kasir->id)->count())->toBe(0);
});

test('kasir tidak bisa mencabut akses owner', function () {
    [$store, $owner, $kasir] = setupOwnerGuardContext();

    // Kasir perlu permission untuk akses revoke
    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $kasir->givePermissionTo(
        Permission::firstOrCreate(['name' => 'employee.view'], ['guard_id' => 1]),
    );

    $this->actingAs($kasir);
    session(['current_store_id' => $store->id]);

    $this->delete(route('admin.store-users.revoke', $owner->id))
        ->assertForbidden();
});

test('owner tidak bisa cabut owner terakhir', function () {
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
        'code' => 'LASTOW'.uniqid(),
        'name' => 'Last Owner Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(
        Permission::firstOrCreate(['name' => 'employee.view'], ['guard_id' => 1]),
    );
    $user->assignRole($role);

    // Buat user kedua yang bukan owner
    $kasir = User::factory()->create();
    $store->users()->attach($kasir->id);
    $kasirRole = Role::create(['name' => 'kasir-'.uniqid(), 'guard_id' => 1]);
    $kasirRole->givePermissionTo(
        Permission::firstOrCreate(['name' => 'sale.create'], ['guard_id' => 1]),
    );
    $kasir->assignRole($kasirRole);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    // Coba cabut akses kasir — ini harus ditolak karena owner hanya 1
    $this->delete(route('admin.store-users.revoke', $kasir->id))
        ->assertRedirect()
        ->assertSessionHas('error', 'Tidak bisa mencabut akses owner terakhir di toko ini.');
});
