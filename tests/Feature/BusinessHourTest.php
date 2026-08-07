<?php

use App\Models\Branch;
use App\Models\BusinessHour;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function setupBusinessHourContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $feature = Feature::create(['code' => 'settings', 'label' => 'Settings', 'is_active' => true, 'sort_order' => 0]);
    $storeType->features()->attach($feature->id);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TST'.uniqid(),
        'name' => 'Toko BusinessHour',
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
    foreach (['setting.view', 'setting.edit'] as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('index returns business hours', function () {
    [$store, $branch, $user] = setupBusinessHourContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $response = $this->get(route('admin.business-hours.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page->component('Admin/BusinessHours/Index', false));
});

test('update saves business hours', function () {
    [$store, $branch, $user] = setupBusinessHourContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $hours = collect(range(0, 6))->map(fn ($day) => [
        'day_of_week' => $day,
        'open_time' => '08:00',
        'close_time' => '21:00',
        'is_closed' => false,
    ])->toArray();

    $response = $this->putJson(route('admin.business-hours.update'), ['hours' => $hours]);

    $response->assertRedirect();

    $this->assertDatabaseCount('business_hours', 7);
    $this->assertDatabaseHas('business_hours', [
        'store_id' => $store->id,
        'day_of_week' => 0,
        'open_time' => '08:00',
        'close_time' => '21:00',
        'is_closed' => false,
    ]);
});

test('update with is_closed sets null times', function () {
    [$store, $branch, $user] = setupBusinessHourContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $hours = collect(range(0, 6))->map(fn ($day) => [
        'day_of_week' => $day,
        'open_time' => null,
        'close_time' => null,
        'is_closed' => true,
    ])->toArray();

    $response = $this->putJson(route('admin.business-hours.update'), ['hours' => $hours]);

    $response->assertRedirect();

    $this->assertDatabaseHas('business_hours', [
        'store_id' => $store->id,
        'day_of_week' => 0,
        'is_closed' => true,
        'open_time' => null,
        'close_time' => null,
    ]);
});

test('checkOpen returns open when within hours', function () {
    [$store, $branch, $user] = setupBusinessHourContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $dayOfWeek = ((int) Carbon::now()->format('N')) - 1;

    BusinessHour::create([
        'store_id' => $store->id,
        'day_of_week' => $dayOfWeek,
        'open_time' => '08:00:00',
        'close_time' => '21:00:00',
        'is_closed' => false,
    ]);

    Carbon::setTestNow(Carbon::now()->setTime(12, 0, 0));

    $response = $this->get(route('admin.business-hours.check'));

    $response->assertOk();
    $response->assertJson(['is_open' => true]);

    Carbon::setTestNow();
});

test('checkOpen returns closed when outside hours', function () {
    [$store, $branch, $user] = setupBusinessHourContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $dayOfWeek = ((int) Carbon::now()->format('N')) - 1;

    BusinessHour::create([
        'store_id' => $store->id,
        'day_of_week' => $dayOfWeek,
        'open_time' => '08:00:00',
        'close_time' => '10:00:00',
        'is_closed' => false,
    ]);

    Carbon::setTestNow(Carbon::now()->setTime(15, 0, 0));

    $response = $this->get(route('admin.business-hours.check'));

    $response->assertOk();
    $response->assertJson(['is_open' => false]);

    Carbon::setTestNow();
});
