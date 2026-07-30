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

/**
 * Shift dari hari sebelumnya hanya bisa dibuka ulang oleh owner.
 * Kasir/supervisor yang punya shift.manage tetap dibatasi ke hari yang sama.
 */
function setupShiftReopenStore(array $permissions): array
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
        'code' => 'SROP'.uniqid(),
        'name' => 'Toko Shift Reopen',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach ($permissions as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('owner bisa membuka ulang shift dari hari sebelumnya', function () {
    [$store, $branch, $user] = setupShiftReopenStore(['shift.manage']);

    // Pastikan role 'owner' ada, lalu assign ke user.
    $ownerRole = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $user->assignRole($ownerRole);

    $shift = CashierShift::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'shift_no' => 'SHIFT-OLD-001',
        'opening_cash' => 100000,
        'status' => 'closed',
        'opened_at' => now()->subDay(),
        'closed_at' => now()->subDay()->addHours(8),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $response = $this->post(route('admin.cashier-shifts.reopen', $shift->id));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect($shift->fresh()->status)->toBe('open');
});

test('non-owner tidak bisa membuka ulang shift dari hari sebelumnya', function () {
    [$store, $branch, $user] = setupShiftReopenStore(['shift.manage']);

    // Tidak assign role owner — hanya punya shift.manage.

    $shift = CashierShift::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'shift_no' => 'SHIFT-OLD-002',
        'opening_cash' => 50000,
        'status' => 'closed',
        'opened_at' => now()->subDay(),
        'closed_at' => now()->subDay()->addHours(6),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $response = $this->post(route('admin.cashier-shifts.reopen', $shift->id));

    $response->assertForbidden();
    expect($shift->fresh()->status)->toBe('closed');
});

test('non-owner masih bisa membuka ulang shift hari ini', function () {
    [$store, $branch, $user] = setupShiftReopenStore(['shift.manage']);

    $shift = CashierShift::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'shift_no' => 'SHIFT-TODAY-001',
        'opening_cash' => 75000,
        'status' => 'closed',
        'opened_at' => now()->subHours(2),
        'closed_at' => now()->subHour(),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $response = $this->post(route('admin.cashier-shifts.reopen', $shift->id));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect($shift->fresh()->status)->toBe('open');
});
