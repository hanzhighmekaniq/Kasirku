<?php

/*
|--------------------------------------------------------------------------
| Modal "Set Komisi" di halaman index karyawan
|--------------------------------------------------------------------------
|
| Setting komisi sebelumnya hanya bisa diubah lewat form edit karyawan yang
| lengkap. Sekarang ada endpoint terpisah PATCH /employees/{employee}/commission
| yang dipakai modal ringan di index, tanpa membuka field lain (akun, role,
| cabang, dst).
|
*/

use App\Http\Middleware\CheckFeatureAccess;
use App\Http\Middleware\PermissionMiddleware;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Setup toko + user, mandiri dari helper di EmployeePageTest.php. Setiap file
 * test dimuat terpisah saat dijalankan sendiri, jadi fungsi lintas file tidak
 * bisa diandalkan — tapi nama fungsi tetap dibuat unik agar tidak bentrok
 * ("cannot redeclare") saat suite penuh dijalankan bersamaan.
 *
 * @return array{0: Store, 1: Branch, 2: User}
 */
function setupCommissionModalContext(array $permissions = ['employee.view']): array
{
    $storeType = StoreType::create([
        'code' => 'retail-'.uniqid(),
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $feature = Feature::firstOrCreate(
        ['code' => 'employee'],
        ['label' => 'Karyawan', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->attach($feature->id);

    $plan = Plan::create([
        'code' => 'basic-'.uniqid(),
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach($feature->id);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TESTCOM'.uniqid(),
        'name' => 'Test Store Commission',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_name' => 'web']);
    foreach ($permissions as $permName) {
        $perm = Permission::findOrCreate($permName, 'web');
        $role->givePermissionTo($perm);
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

function attachCommissionFeature(Store $store): void
{
    // Store punya accessor getStoreTypeAttribute() yang menangkap akses
    // $store->storeType sebagai string kode, jadi relasi harus diambil lewat
    // getRelation() setelah eager load, bukan akses properti langsung.
    $store->loadMissing('storeType', 'planModel');

    $feature = Feature::firstOrCreate(
        ['code' => 'commission'],
        ['label' => 'Komisi', 'is_active' => true, 'sort_order' => 0],
    );
    $store->getRelation('storeType')->features()->syncWithoutDetaching([$feature->id]);
    $store->getRelation('planModel')?->features()->syncWithoutDetaching([$feature->id]);
}

function makeCommissionEmployee(Store $store, Branch $branch, array $overrides = []): Employee
{
    return Employee::create(array_merge([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'employee_code' => 'EMP-'.uniqid(),
        'name' => 'Dedi Terapis',
        'position' => 'Terapis',
        'status' => 'active',
        'commission_type' => 'none',
        'commission_value' => 0,
    ], $overrides));
}

test('halaman index mengirim storeTypeFeatures berisi commission saat fitur aktif', function () {
    // withoutMiddleware() tanpa argumen ikut mematikan HandleInertiaRequests,
    // padahal itu sumber prop storeTypeFeatures yang mau diverifikasi.
    $this->withoutMiddleware([CheckFeatureAccess::class, PermissionMiddleware::class]);

    [$store, $branch, $user] = setupCommissionModalContext(['employee.view']);
    attachCommissionFeature($store);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $response = $this->get(route('admin.employees.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('storeTypeFeatures', fn ($features) => collect($features)->contains('commission'))
    );
});

test('set komisi persen tersimpan lewat endpoint terpisah', function () {
    [$store, $branch, $user] = setupCommissionModalContext(['employee.view', 'employee.edit']);
    attachCommissionFeature($store);

    $employee = makeCommissionEmployee($store, $branch);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $response = $this->patchJson(route('admin.employees.update-commission', $employee->id), [
        'commission_type' => 'percent',
        'commission_value' => 15,
    ]);

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('employee.commission_type', 'percent');

    $employee->refresh();
    expect($employee->commission_type)->toBe('percent');
    expect((float) $employee->commission_value)->toBe(15.0);
});

test('set komisi flat tersimpan sebagai nominal', function () {
    [$store, $branch, $user] = setupCommissionModalContext(['employee.view', 'employee.edit']);
    attachCommissionFeature($store);

    $employee = makeCommissionEmployee($store, $branch);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $this->patchJson(route('admin.employees.update-commission', $employee->id), [
        'commission_type' => 'flat',
        'commission_value' => 50000,
    ])->assertSuccessful();

    $employee->refresh();
    expect($employee->commission_type)->toBe('flat');
    expect((float) $employee->commission_value)->toBe(50000.0);
});

test('set tipe none menolkan nilai komisi meski dikirim', function () {
    [$store, $branch, $user] = setupCommissionModalContext(['employee.view', 'employee.edit']);
    attachCommissionFeature($store);

    $employee = makeCommissionEmployee($store, $branch, [
        'commission_type' => 'percent',
        'commission_value' => 20,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $this->patchJson(route('admin.employees.update-commission', $employee->id), [
        'commission_type' => 'none',
        'commission_value' => 999,
    ])->assertSuccessful();

    $employee->refresh();
    expect($employee->commission_type)->toBe('none');
    expect((float) $employee->commission_value)->toBe(0.0);
});

test('komisi persen tanpa nilai ditolak validasi', function () {
    [$store, $branch, $user] = setupCommissionModalContext(['employee.view', 'employee.edit']);
    attachCommissionFeature($store);

    $employee = makeCommissionEmployee($store, $branch);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $this->patch(route('admin.employees.update-commission', $employee->id), [
        'commission_type' => 'percent',
    ])->assertSessionHasErrors('commission_value');

    expect($employee->fresh()->commission_type)->toBe('none');
});

test('komisi persen di atas 100 ditolak validasi', function () {
    [$store, $branch, $user] = setupCommissionModalContext(['employee.view', 'employee.edit']);
    attachCommissionFeature($store);

    $employee = makeCommissionEmployee($store, $branch);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $this->patch(route('admin.employees.update-commission', $employee->id), [
        'commission_type' => 'percent',
        'commission_value' => 150,
    ])->assertSessionHasErrors('commission_value');
});

test('karyawan milik toko lain tidak bisa diubah komisinya', function () {
    [$storeA, $branchA, $userA] = setupCommissionModalContext(['employee.view', 'employee.edit']);
    [$storeB, $branchB, $userB] = setupCommissionModalContext(['employee.view', 'employee.edit']);
    attachCommissionFeature($storeA);
    attachCommissionFeature($storeB);

    $employeeB = makeCommissionEmployee($storeB, $branchB);

    $this->actingAs($userA);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => $branchA->id]);

    // 404 dari ensureSameStore() ditangkap exception handler global app ini
    // dan dikonversi ke redirect dashboard + flash "Halaman tidak ditemukan",
    // jadi bukan respons 404 mentah.
    $this->patch(route('admin.employees.update-commission', $employeeB->id), [
        'commission_type' => 'percent',
        'commission_value' => 10,
    ])
        ->assertRedirect(route('admin.dashboard'))
        ->assertSessionHas('error', 'Halaman tidak ditemukan.');

    expect($employeeB->fresh()->commission_type)->toBe('none');
});

test('user tanpa permission employee.edit tidak bisa mengubah komisi', function () {
    [$store, $branch, $user] = setupCommissionModalContext(['employee.view']);
    attachCommissionFeature($store);

    $employee = makeCommissionEmployee($store, $branch);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $this->patch(route('admin.employees.update-commission', $employee->id), [
        'commission_type' => 'percent',
        'commission_value' => 10,
    ])->assertForbidden();

    expect($employee->fresh()->commission_type)->toBe('none');
});
