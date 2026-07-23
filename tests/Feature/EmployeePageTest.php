<?php

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

function setupEmployeePageContext(array $permissions = ['employee.view']): array
{
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $feature = Feature::create([
        'code' => 'employee',
        'label' => 'Karyawan',
        'is_active' => true,
        'sort_order' => 0,
    ]);
    $storeType->features()->attach($feature->id);

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach($feature->id);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TESTEMP'.uniqid(),
        'name' => 'Test Store Employee',
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

test('employee index page renders with employee list', function () {
    $this->withoutMiddleware();

    [$store, $branch, $user] = setupEmployeePageContext(['employee.view']);

    Employee::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'employee_code' => 'EMP0001',
        'name' => 'Siti Aminah',
        'phone' => '08123456789',
        'email' => 'siti@example.com',
        'position' => 'Kasir',
        'status' => 'active',
    ]);

    $this->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'current_branch_id' => $branch->id,
    ]);

    $response = $this->get(route('admin.employees.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Employees/Index')
        ->has('employees', 1)
        ->where('employees.0.name', 'Siti Aminah')
        ->where('storeType', 'retail')
    );
});

test('employee create page renders', function () {
    $this->withoutMiddleware();

    [$store, $branch, $user] = setupEmployeePageContext(['employee.create', 'employee.view']);

    $this->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'current_branch_id' => $branch->id,
    ]);

    $response = $this->get(route('admin.employees.create'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Employees/Create')
        ->has('branches')
        ->has('suggestedCode')
        ->where('storeType', 'retail')
    );
});

test('employee edit page includes user roles when account exists', function () {
    $this->withoutMiddleware();

    [$store, $branch, $user] = setupEmployeePageContext(['employee.edit', 'employee.view']);

    $employeeUser = User::factory()->create([
        'name' => 'Budi Kasir',
        'email' => 'budi@example.com',
    ]);
    $store->users()->attach($employeeUser->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $kasirRole = Role::findOrCreate('kasir', 'web');
    $employeeUser->assignRole($kasirRole);

    $employee = Employee::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $employeeUser->id,
        'employee_code' => 'EMP0002',
        'name' => 'Budi Kasir',
        'email' => 'budi@example.com',
        'position' => 'Kasir',
        'status' => 'active',
    ]);

    $this->actingAs($user);
    // Simulasikan session string (seperti HTTP session nyata)
    session([
        'current_store_id' => (string) $store->id,
        'current_branch_id' => (string) $branch->id,
    ]);

    $response = $this->get(route('admin.employees.edit', $employee));

    if ($response->status() !== 200) {
        dump([
            'status' => $response->status(),
            'location' => $response->headers->get('Location'),
            'session_error' => session('error'),
            'employee_store' => $employee->store_id,
            'session_store' => session('current_store_id'),
            'types' => [
                gettype($employee->store_id),
                gettype(session('current_store_id')),
            ],
        ]);
    }

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Employees/Edit')
        ->where('employee.name', 'Budi Kasir')
        ->where('employee.user_roles.0', 'kasir')
        ->where('storeType', 'retail')
    );
});
