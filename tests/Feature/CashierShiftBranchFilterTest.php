<?php

/*
|--------------------------------------------------------------------------
| Filter cabang di halaman Shift Kasir
|--------------------------------------------------------------------------
|
| Sebelumnya halaman shift menampilkan seluruh cabang tanpa cara menyaring.
| Sekarang owner/admin (punya shift.manage) bisa memilih cabang lewat
| checkbox, defaultnya semua cabang. Kasir biasa tidak dapat filter ini dan
| tetap hanya melihat shift miliknya sendiri.
|
*/

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
 * @return array{0: Store, 1: Branch, 2: Branch, 3: User}
 */
function setupShiftBranchStore(array $permissions = ['shift.view', 'shift.manage']): array
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
        'code' => 'SBF'.uniqid(),
        'name' => 'Toko Shift Cabang',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branchA = Branch::create([
        'store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang Utara', 'is_active' => true,
    ]);
    $branchB = Branch::create([
        'store_id' => $store->id, 'code' => 'BR2', 'name' => 'Cabang Selatan', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach ($permissions as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branchA, $branchB, $user];
}

function makeShift(Store $store, Branch $branch, User $user, string $shiftNo): CashierShift
{
    return CashierShift::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'shift_no' => $shiftNo,
        'opened_at' => now()->subHour(),
        'opening_cash' => 100000,
        'status' => 'open',
    ]);
}

function visitShiftIndex($test, User $user, Store $store, Branch $branch, array $query = [])
{
    $test->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'branch_id' => $branch->id,
        'current_branch_id' => $branch->id,
    ]);

    return $test->get(route('admin.cashier-shifts.index', $query));
}

test('default menampilkan shift dari semua cabang', function () {
    [$store, $branchA, $branchB, $user] = setupShiftBranchStore();

    makeShift($store, $branchA, $user, 'SH-A1');
    makeShift($store, $branchB, $user, 'SH-B1');

    $response = visitShiftIndex($this, $user, $store, $branchA);
    $response->assertSuccessful();

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];
        $shiftNos = collect($props['shifts']['data'])->pluck('shift_no');

        expect($shiftNos)->toContain('SH-A1');
        expect($shiftNos)->toContain('SH-B1');
        expect($props['filters']['branch_ids'])->toBe([]);
    });
});

test('daftar cabang dikirim ke halaman untuk yang boleh mengelola shift', function () {
    [$store, $branchA, $branchB, $user] = setupShiftBranchStore();

    $response = visitShiftIndex($this, $user, $store, $branchA);

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];

        expect($props['canManage'])->toBeTrue();
        expect(collect($props['branches'])->pluck('name')->all())
            ->toBe(['Cabang Selatan', 'Cabang Utara']);
    });
});

test('memilih satu cabang hanya menampilkan shift cabang itu', function () {
    [$store, $branchA, $branchB, $user] = setupShiftBranchStore();

    makeShift($store, $branchA, $user, 'SH-A1');
    makeShift($store, $branchB, $user, 'SH-B1');

    $response = visitShiftIndex($this, $user, $store, $branchA, [
        'branch_ids' => [$branchB->id],
    ]);

    $response->assertInertia(function ($page) use ($branchB) {
        $props = $page->toArray()['props'];
        $shiftNos = collect($props['shifts']['data'])->pluck('shift_no');

        expect($shiftNos)->toContain('SH-B1');
        expect($shiftNos)->not->toContain('SH-A1');
        expect($props['filters']['branch_ids'])->toBe([$branchB->id]);
    });
});

test('memilih beberapa cabang menampilkan gabungan shift keduanya', function () {
    [$store, $branchA, $branchB, $user] = setupShiftBranchStore();

    makeShift($store, $branchA, $user, 'SH-A1');
    makeShift($store, $branchB, $user, 'SH-B1');

    $response = visitShiftIndex($this, $user, $store, $branchA, [
        'branch_ids' => [$branchA->id, $branchB->id],
    ]);

    $response->assertInertia(function ($page) {
        $shiftNos = collect($page->toArray()['props']['shifts']['data'])->pluck('shift_no');

        expect($shiftNos)->toContain('SH-A1');
        expect($shiftNos)->toContain('SH-B1');
    });
});

test('cabang milik toko lain diabaikan agar data tidak bocor', function () {
    [$store, $branchA, $branchB, $user] = setupShiftBranchStore();

    makeShift($store, $branchA, $user, 'SH-A1');
    makeShift($store, $branchB, $user, 'SH-B1');

    // Id cabang yang tidak ada di toko ini harus diabaikan, bukan dipakai
    // memfilter, sehingga hasilnya kembali ke seluruh cabang toko sendiri.
    $response = visitShiftIndex($this, $user, $store, $branchA, [
        'branch_ids' => [99999],
    ]);

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];
        $shiftNos = collect($props['shifts']['data'])->pluck('shift_no');

        expect($props['filters']['branch_ids'])->toBe([]);
        expect($shiftNos)->toContain('SH-A1');
        expect($shiftNos)->toContain('SH-B1');
    });
});

test('kasir tanpa shift.manage tidak mendapat filter cabang', function () {
    [$store, $branchA, $branchB, $user] = setupShiftBranchStore(['shift.view']);

    $otherUser = User::factory()->create();
    $store->users()->attach($otherUser->id);

    makeShift($store, $branchA, $user, 'SH-MINE');
    makeShift($store, $branchB, $otherUser, 'SH-OTHER');

    $response = visitShiftIndex($this, $user, $store, $branchA);
    $response->assertSuccessful();

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];
        $shiftNos = collect($props['shifts']['data'])->pluck('shift_no');

        expect($props['canManage'])->toBeFalse();
        expect($props['branches'])->toBe([]);
        expect($shiftNos)->toContain('SH-MINE');
        expect($shiftNos)->not->toContain('SH-OTHER');
    });
});

test('kasir tidak bisa memakai filter cabang untuk melihat shift orang lain', function () {
    [$store, $branchA, $branchB, $user] = setupShiftBranchStore(['shift.view']);

    $otherUser = User::factory()->create();
    $store->users()->attach($otherUser->id);

    makeShift($store, $branchB, $otherUser, 'SH-OTHER');

    $response = visitShiftIndex($this, $user, $store, $branchA, [
        'branch_ids' => [$branchB->id],
    ]);

    $response->assertInertia(function ($page) {
        $shiftNos = collect($page->toArray()['props']['shifts']['data'])->pluck('shift_no');

        expect($shiftNos)->not->toContain('SH-OTHER');
    });
});

test('filter cabang tetap berlaku bersama filter status', function () {
    [$store, $branchA, $branchB, $user] = setupShiftBranchStore();

    $closed = makeShift($store, $branchA, $user, 'SH-A-CLOSED');
    $closed->update(['status' => 'closed', 'closed_at' => now()]);

    makeShift($store, $branchA, $user, 'SH-A-OPEN');
    makeShift($store, $branchB, $user, 'SH-B-OPEN');

    $response = visitShiftIndex($this, $user, $store, $branchA, [
        'branch_ids' => [$branchA->id],
        'status' => 'open',
    ]);

    $response->assertInertia(function ($page) {
        $shiftNos = collect($page->toArray()['props']['shifts']['data'])->pluck('shift_no');

        expect($shiftNos)->toContain('SH-A-OPEN');
        expect($shiftNos)->not->toContain('SH-A-CLOSED');
        expect($shiftNos)->not->toContain('SH-B-OPEN');
    });
});
