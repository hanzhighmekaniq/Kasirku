<?php

/*
|--------------------------------------------------------------------------
| Developer Branch Show Test (F-7 Fix)
|--------------------------------------------------------------------------
|
| Developer\BranchController::show() sebelumnya merender
| Employee.is_active yang tidak ada di model (model pakai status).
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

uses(RefreshDatabase::class);

/**
 * @return array{0: Store, 1: Branch, 2: User}
 */
function setupDevBranchContext(): array
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
        ['label' => 'Basic',
            'is_active' => true,
            'sort_order' => 0,
            'price' => 0,
        ],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'DEVBR'.uniqid(),
        'name' => 'Dev Branch Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR1',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $user = User::factory()->create(['is_developer' => true]);

    return [$store, $branch, $user];
}

test('developer branch show mengembalikan status bukan is_active pada employee', function () {
    [$store, $branch, $user] = setupDevBranchContext();

    $employee = Employee::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'employee_code' => 'EMP-'.uniqid(),
        'name' => 'Karyawan Aktif',
        'position' => 'Kasir',
        'status' => 'active',
        'commission_type' => 'none',
        'commission_value' => 0,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('developer.branches.show', $branch->id));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('employees.0.status', 'active')
    );
});

test('developer branch show employee inactive memiliki status inactive', function () {
    [$store, $branch, $user] = setupDevBranchContext();

    $employee = Employee::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'employee_code' => 'EMP-'.uniqid(),
        'name' => 'Karyawan Inactive',
        'position' => 'Kasir',
        'status' => 'inactive',
        'commission_type' => 'none',
        'commission_value' => 0,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('developer.branches.show', $branch->id));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('employees.0.status', 'inactive')
    );
});
