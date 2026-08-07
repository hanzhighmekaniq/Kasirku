<?php

use App\Models\Branch;
use App\Models\Expense;
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

function setupExpenseContext(): array
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
        'name' => 'Toko Approval',
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
    foreach (['expense.view', 'expense.create', 'expense.approve'] as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('approve expense changes status from pending_approval to posted', function () {
    [$store, $branch, $user] = setupExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $expense = Expense::create([
        'expense_category_id' => $category->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'expense_no' => 'EXP-TEST-001',
        'expense_date' => now(),
        'amount' => 50000,
        'notes' => 'Test expense',
        'status' => 'pending_approval',
    ]);

    $response = $this->post(route('admin.expenses.approve', $expense));

    $response->assertRedirect();

    $expense->refresh();
    expect($expense->status)->toBe('posted');
    expect($expense->approved_by)->toBe($user->id);
    expect($expense->approved_at)->not->toBeNull();
});

test('reject expense changes status back to draft with reason', function () {
    [$store, $branch, $user] = setupExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $expense = Expense::create([
        'expense_category_id' => $category->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'expense_no' => 'EXP-TEST-002',
        'expense_date' => now(),
        'amount' => 50000,
        'notes' => 'Test expense',
        'status' => 'pending_approval',
    ]);

    $response = $this->post(route('admin.expenses.reject', $expense), [
        'rejection_reason' => 'Budget exceeded',
    ]);

    $response->assertRedirect();

    $expense->refresh();
    expect($expense->status)->toBe('draft');
    expect($expense->rejection_reason)->toBe('Budget exceeded');
});

test('approve non-pending expense is rejected', function () {
    [$store, $branch, $user] = setupExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $expense = Expense::create([
        'expense_category_id' => $category->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'expense_no' => 'EXP-TEST-003',
        'expense_date' => now(),
        'amount' => 50000,
        'notes' => 'Test expense',
        'status' => 'draft',
    ]);

    $response = $this->post(route('admin.expenses.approve', $expense));

    $response->assertRedirect();
    $response->assertSessionHasErrors();
});

test('reject without reason is rejected', function () {
    [$store, $branch, $user] = setupExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $expense = Expense::create([
        'expense_category_id' => $category->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'expense_no' => 'EXP-TEST-004',
        'expense_date' => now(),
        'amount' => 50000,
        'notes' => 'Test expense',
        'status' => 'pending_approval',
    ]);

    $response = $this->post(route('admin.expenses.reject', $expense));

    $response->assertRedirect();
    $response->assertSessionHasErrors('rejection_reason');
});

test('expense cannot be deleted if not draft', function () {
    [$store, $branch, $user] = setupExpenseContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $category = ExpenseCategory::create(['store_id' => $store->id, 'code' => 'CAT1', 'name' => 'Operational']);

    $expense = Expense::create([
        'expense_category_id' => $category->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'expense_no' => 'EXP-TEST-005',
        'expense_date' => now(),
        'amount' => 50000,
        'notes' => 'Test expense',
        'status' => 'posted',
    ]);

    $response = $this->delete(route('admin.expenses.destroy', $expense));

    $response->assertRedirect();
    $response->assertSessionHasErrors();
});
