<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware();
});

function setupCustomerSegmentReportContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['report'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TST'.uniqid(),
        'name' => 'Toko Report',
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
    foreach (['report.view'] as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('customer segments page loads with correct segments', function () {
    [$store, $branch, $user] = setupCustomerSegmentReportContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    Customer::create([
        'store_id' => $store->id, 'code' => 'P01', 'name' => 'Platinum Customer',
        'phone' => '08111111111', 'is_active' => true, 'total_spent' => 15000000,
    ]);
    Customer::create([
        'store_id' => $store->id, 'code' => 'G01', 'name' => 'Gold Customer',
        'phone' => '08222222222', 'is_active' => true, 'total_spent' => 7000000,
    ]);
    Customer::create([
        'store_id' => $store->id, 'code' => 'B01', 'name' => 'Bronze Customer',
        'phone' => '08333333333', 'is_active' => true, 'total_spent' => 500000,
    ]);

    $response = $this->get(route('admin.reports.customer-segments'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Reports/CustomerSegments', false)
        ->has('segmentSummary')
        ->has('topSpenders')
        ->has('inactiveCount')
        ->where('totalCustomers', 3)
    );
});

test('inactive customers are counted', function () {
    [$store, $branch, $user] = setupCustomerSegmentReportContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    Customer::create([
        'store_id' => $store->id, 'code' => 'I01', 'name' => 'Inactive 60d',
        'phone' => '08444444444', 'is_active' => true,
        'total_spent' => 1000000, 'last_visit_at' => Carbon::now()->subDays(60),
    ]);
    Customer::create([
        'store_id' => $store->id, 'code' => 'I02', 'name' => 'Never Visited',
        'phone' => '08555555555', 'is_active' => true,
        'total_spent' => 500000, 'last_visit_at' => null,
    ]);
    Customer::create([
        'store_id' => $store->id, 'code' => 'A01', 'name' => 'Active Customer',
        'phone' => '08666666666', 'is_active' => true,
        'total_spent' => 2000000, 'last_visit_at' => Carbon::now()->subDays(5),
    ]);

    $response = $this->get(route('admin.reports.customer-segments'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Reports/CustomerSegments', false)
        ->where('inactiveCount', 2)
    );
});

test('top spenders are ordered correctly', function () {
    [$store, $branch, $user] = setupCustomerSegmentReportContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    Customer::create([
        'store_id' => $store->id, 'code' => 'S01', 'name' => 'Low Spender',
        'phone' => '08777777777', 'is_active' => true, 'total_spent' => 500000,
    ]);
    Customer::create([
        'store_id' => $store->id, 'code' => 'S02', 'name' => 'Mid Spender',
        'phone' => '08888888888', 'is_active' => true, 'total_spent' => 5000000,
    ]);
    Customer::create([
        'store_id' => $store->id, 'code' => 'S03', 'name' => 'Top Spender',
        'phone' => '08999999999', 'is_active' => true, 'total_spent' => 20000000,
    ]);

    $response = $this->get(route('admin.reports.customer-segments'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Reports/CustomerSegments', false)
        ->where('topSpenders.0.name', 'Top Spender')
        ->where('topSpenders.0.total_spent', '20000000.00')
        ->where('topSpenders.1.name', 'Mid Spender')
        ->where('topSpenders.2.name', 'Low Spender')
    );
});
