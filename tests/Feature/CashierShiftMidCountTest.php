<?php

use App\Models\Branch;
use App\Models\CashierShift;
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

function setupMidCountContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'shift'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TST'.uniqid(),
        'name' => 'Toko MidCount',
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
    foreach (['shift.view', 'shift.create', 'shift.close'] as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('midCount records cash count on open shift', function () {
    [$store, $branch, $user] = setupMidCountContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $shift = CashierShift::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'shift_no' => 'SH-001',
        'opening_cash' => 100000,
        'status' => 'open',
        'opened_at' => now(),
    ]);

    $response = $this->post(route('admin.cashier-shifts.midCount', $shift), [
        'mid_count_cash' => 150000,
        'mid_count_note' => 'Cek tengah hari',
    ]);

    $response->assertRedirect();

    $shift->refresh();
    expect($shift->mid_count_cash)->toBe('150000.00');
    expect($shift->mid_count_at)->not->toBeNull();
    expect($shift->mid_count_note)->toBe('Cek tengah hari');
});

test('midCount on closed shift is rejected', function () {
    [$store, $branch, $user] = setupMidCountContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $shift = CashierShift::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'shift_no' => 'SH-002',
        'opening_cash' => 100000,
        'status' => 'closed',
        'opened_at' => now()->subHours(8),
        'closed_at' => now(),
    ]);

    $response = $this->post(route('admin.cashier-shifts.midCount', $shift), [
        'mid_count_cash' => 150000,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');
});

test('midCount on another users shift is rejected without shift.manage', function () {
    [$store, $branch, $user] = setupMidCountContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $otherUser = User::factory()->create();
    $store->users()->attach($otherUser->id);

    $shift = CashierShift::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $otherUser->id,
        'shift_no' => 'SH-003',
        'opening_cash' => 100000,
        'status' => 'open',
        'opened_at' => now(),
    ]);

    $response = $this->post(route('admin.cashier-shifts.midCount', $shift), [
        'mid_count_cash' => 150000,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');
});

test('midCount with invalid data is rejected', function () {
    [$store, $branch, $user] = setupMidCountContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $shift = CashierShift::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'shift_no' => 'SH-004',
        'opening_cash' => 100000,
        'status' => 'open',
        'opened_at' => now(),
    ]);

    $response = $this->post(route('admin.cashier-shifts.midCount', $shift), []);

    $response->assertRedirect();
    $response->assertSessionHasErrors('mid_count_cash');
});
