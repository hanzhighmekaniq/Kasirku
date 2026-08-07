<?php

use App\Models\Branch;
use App\Models\ExpenseCategory;
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

function setupRecurringExpenseContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['expense'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TST'.uniqid(),
        'name' => 'Toko Recurring',
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
    foreach (['expense.view', 'expense.create'] as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('store creates recurring expense with next_due_date', function () {
    [$store, $branch, $user] = setupRecurringExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $response = $this->post(route('admin.expenses.store'), [
        'expense_category_id' => $category->id,
        'expense_date' => '2026-01-15',
        'amount' => 100000,
        'notes' => 'Sewa',
        'is_recurring' => true,
        'recurrence_type' => 'monthly',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('expenses', [
        'store_id' => $store->id,
        'is_recurring' => true,
        'recurrence_type' => 'monthly',
        'next_due_date' => '2026-02-15',
    ]);
});

test('store creates weekly recurring expense', function () {
    [$store, $branch, $user] = setupRecurringExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $response = $this->post(route('admin.expenses.store'), [
        'expense_category_id' => $category->id,
        'expense_date' => '2026-01-05',
        'amount' => 100000,
        'notes' => 'Sewa',
        'is_recurring' => true,
        'recurrence_type' => 'weekly',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('expenses', [
        'store_id' => $store->id,
        'is_recurring' => true,
        'recurrence_type' => 'weekly',
        'next_due_date' => '2026-01-12',
    ]);
});

test('store creates yearly recurring expense', function () {
    [$store, $branch, $user] = setupRecurringExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $response = $this->post(route('admin.expenses.store'), [
        'expense_category_id' => $category->id,
        'expense_date' => '2026-03-01',
        'amount' => 100000,
        'notes' => 'Sewa',
        'is_recurring' => true,
        'recurrence_type' => 'yearly',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('expenses', [
        'store_id' => $store->id,
        'is_recurring' => true,
        'recurrence_type' => 'yearly',
        'next_due_date' => '2027-03-01',
    ]);
});

test('store creates non-recurring expense without next_due_date', function () {
    [$store, $branch, $user] = setupRecurringExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $response = $this->post(route('admin.expenses.store'), [
        'expense_category_id' => $category->id,
        'expense_date' => '2026-01-15',
        'amount' => 100000,
        'notes' => 'Sewa',
        'is_recurring' => false,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('expenses', [
        'store_id' => $store->id,
        'is_recurring' => false,
        'next_due_date' => null,
    ]);
});
