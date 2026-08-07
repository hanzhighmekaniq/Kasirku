<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

function setupBirthdayStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);

    $store = Store::create([
        'user_id' => null, 'code' => 'BDG001', 'name' => 'Birthday Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->syncWithoutDetaching([$user->id]);

    return [$store, $branch, $user];
}

// ── SendBirthdayGreetings ──────────────────────────────────────────────────

test('sends notification to admin when customer has birthday today', function () {
    [$store, $branch, $admin] = setupBirthdayStore();

    Customer::create([
        'store_id' => $store->id, 'code' => 'CST001', 'name' => 'Birthday Boy',
        'birth_date' => now()->toDateString(), 'is_active' => true,
    ]);

    Artisan::call('app:send-birthday-greetings');

    $this->assertDatabaseHas('notifications', [
        'notifiable_type' => User::class,
        'notifiable_id' => $admin->id,
        'type' => 'App\\Notifications\\BirthdayGreetingNotification',
    ]);
});

test('no notification when no customer has birthday today', function () {
    [$store] = setupBirthdayStore();

    Customer::create([
        'store_id' => $store->id, 'code' => 'CST002', 'name' => 'Future Birthday',
        'birth_date' => now()->addDay()->toDateString(), 'is_active' => true,
    ]);

    Artisan::call('app:send-birthday-greetings');

    $this->assertDatabaseCount('notifications', 0);
});

// ── CheckExpenseBudgets ────────────────────────────────────────────────────

test('creates alert when expense exceeds 80% of budget', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);

    $store = Store::create([
        'user_id' => null, 'code' => 'EXP001', 'name' => 'Expense Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $user = User::factory()->create();
    $store->users()->syncWithoutDetaching([$user->id]);

    $category = ExpenseCategory::create([
        'store_id' => $store->id, 'code' => 'CAT001', 'name' => 'Office Supplies',
        'monthly_budget' => 1000000,
    ]);

    Expense::create([
        'store_id' => $store->id,
        'expense_category_id' => $category->id,
        'expense_no' => 'EXP-001',
        'expense_date' => now()->startOfMonth(),
        'amount' => 900000,
        'status' => 'posted',
    ]);

    Artisan::call('app:check-expense-budgets');

    $this->assertDatabaseHas('notifications', [
        'notifiable_type' => User::class,
        'notifiable_id' => $user->id,
        'type' => 'App\\Notifications\\ExpenseBudgetAlertNotification',
    ]);
});

test('no alert when expense is under budget', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);

    $store = Store::create([
        'user_id' => null, 'code' => 'EXP002', 'name' => 'Expense Store 2',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $user = User::factory()->create();
    $store->users()->syncWithoutDetaching([$user->id]);

    $category = ExpenseCategory::create([
        'store_id' => $store->id, 'code' => 'CAT002', 'name' => 'Utilities',
        'monthly_budget' => 1000000,
    ]);

    Expense::create([
        'store_id' => $store->id,
        'expense_category_id' => $category->id,
        'expense_no' => 'EXP-002',
        'expense_date' => now()->startOfMonth(),
        'amount' => 500000,
        'status' => 'posted',
    ]);

    Artisan::call('app:check-expense-budgets');

    $this->assertDatabaseCount('notifications', 0);
});

// ── CreateRecurringExpenses ────────────────────────────────────────────────

test('creates new expense when next_due_date is today', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);

    $store = Store::create([
        'user_id' => null, 'code' => 'REC001', 'name' => 'Recurring Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $category = ExpenseCategory::create([
        'store_id' => $store->id, 'code' => 'CAT003', 'name' => 'Rent',
    ]);

    $expense = Expense::create([
        'store_id' => $store->id,
        'expense_category_id' => $category->id,
        'expense_no' => 'EXP-REC-001',
        'expense_date' => now()->subMonth(),
        'amount' => 500000,
        'status' => 'posted',
        'is_recurring' => true,
        'recurrence_type' => 'monthly',
        'next_due_date' => now()->toDateString(),
    ]);

    Artisan::call('expenses:create-recurring');

    $this->assertDatabaseCount('expenses', 2);

    $newExpense = Expense::where('parent_expense_id', $expense->id)->first();
    expect($newExpense)->not->toBeNull();
    expect($newExpense->next_due_date)->toBe(now()->addMonth()->toDateString());
});

test('does not create expense when next_due_date is future', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);

    $store = Store::create([
        'user_id' => null, 'code' => 'REC002', 'name' => 'Recurring Store 2',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $category = ExpenseCategory::create([
        'store_id' => $store->id, 'code' => 'CAT004', 'name' => 'Insurance',
    ]);

    Expense::create([
        'store_id' => $store->id,
        'expense_category_id' => $category->id,
        'expense_no' => 'EXP-REC-002',
        'expense_date' => now()->subMonth(),
        'amount' => 300000,
        'status' => 'posted',
        'is_recurring' => true,
        'recurrence_type' => 'monthly',
        'next_due_date' => now()->addDay()->toDateString(),
    ]);

    Artisan::call('expenses:create-recurring');

    $this->assertDatabaseCount('expenses', 1);
});
