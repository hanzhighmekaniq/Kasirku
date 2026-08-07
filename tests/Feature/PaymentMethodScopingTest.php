<?php

/*
|--------------------------------------------------------------------------
| PaymentMethod Store Scoping (F-1 IDOR Fix)
|--------------------------------------------------------------------------
|
| PaymentMethodController sebelumnya tidak melakukan store scoping pada
| method edit(), update(), destroy(), toggleActive(), updateSort().
| User Store A bisa manipulasi PaymentMethod Store B lewat URL.
|
*/

use App\Models\Feature;
use App\Models\PaymentMethod;
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
 * @return array{0: Store, 1: PaymentMethod, 2: Store, 3: PaymentMethod, 4: User}
 */
function setupTwoStorePMContext(): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'payment_method'],
        ['label' => 'Metode Pembayaran', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    Plan::firstOrCreate(
        ['code' => 'free'],
        ['label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );

    $storeA = Store::create([
        'user_id' => null,
        'code' => 'SCOPA'.uniqid(),
        'name' => 'Store A',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $pmA = PaymentMethod::create([
        'store_id' => $storeA->id,
        'code' => 'cash-a',
        'name' => 'Tunai A',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $storeB = Store::create([
        'user_id' => null,
        'code' => 'SCOPB'.uniqid(),
        'name' => 'Store B',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $pmB = PaymentMethod::create([
        'store_id' => $storeB->id,
        'code' => 'cash-b',
        'name' => 'Tunai B',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $storeA->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($storeA->id);
    $role = Role::create(['name' => 'owner-'.uniqid()]);
    $role->givePermissionTo(
        Permission::firstOrCreate(['name' => 'setting.edit']),
        Permission::firstOrCreate(['name' => 'sale.void']),
    );
    $user->assignRole($role);

    return [$storeA, $pmA, $storeB, $pmB, $user];
}

test('edit payment method milik toko lain ditolak', function () {
    [$storeA, $pmA, $storeB, $pmB, $user] = setupTwoStorePMContext();

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $response = $this->get(route('admin.payment-methods.edit', $pmB->id));

    $response->assertStatus(302);
    expect($pmB->fresh()->name)->toBe('Tunai B');
});

test('update payment method milik toko lain ditolak', function () {
    [$storeA, $pmA, $storeB, $pmB, $user] = setupTwoStorePMContext();

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $this->patchJson(route('admin.payment-methods.update', $pmB->id), [
        'name' => 'Hacked Name',
        'type' => 'digital',
    ]);

    expect($pmB->fresh()->name)->toBe('Tunai B');
});

test('destroy payment method milik toko lain ditolak', function () {
    [$storeA, $pmA, $storeB, $pmB, $user] = setupTwoStorePMContext();

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $this->delete(route('admin.payment-methods.destroy', $pmB->id));

    expect(PaymentMethod::where('store_id', $storeB->id)->count())->toBe(1);
});

test('toggle payment method milik toko lain ditolak', function () {
    [$storeA, $pmA, $storeB, $pmB, $user] = setupTwoStorePMContext();

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $this->patch(route('admin.payment-methods.toggle', $pmB->id));

    expect($pmB->fresh()->is_active)->toBeTrue();
});

test('sort payment method milik toko lain ditolak', function () {
    [$storeA, $pmA, $storeB, $pmB, $user] = setupTwoStorePMContext();

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $this->patchJson(route('admin.payment-methods.sort', $pmB->id), [
        'sort_order' => 99,
    ]);

    expect($pmB->fresh()->sort_order)->not->toBe(99);
});

test('toggle payment method milik sendiri berhasil', function () {
    [$storeA, $pmA, $storeB, $pmB, $user] = setupTwoStorePMContext();

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $this->patch(route('admin.payment-methods.toggle', $pmA->id))
        ->assertRedirect();

    expect($pmA->fresh()->is_active)->toBeFalse();
});

test('payment method tidak ditemukan ditolak', function () {
    [$storeA, $pmA, $storeB, $pmB, $user] = setupTwoStorePMContext();

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $response = $this->get(route('admin.payment-methods.edit', 99999));

    $response->assertStatus(302);
});
