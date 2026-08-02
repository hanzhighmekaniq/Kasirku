<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware();
    Permission::firstOrCreate(['name' => 'debt.view', 'guard_name' => 'web']);
});

test('kasir or admin can view debt aging report', function () {
    $type = StoreType::first() ?? StoreType::create(['name' => 'Retail', 'label' => 'Retail', 'code' => 'retail', 'pos_behavior' => 'retail']);
    $store = Store::create(['store_type_id' => $type->id, 'name' => 'Test Store', 'code' => 'TEST']);
    $user = User::factory()->create();
    $user->stores()->attach($store->id);
    session(['current_store_id' => $store->id]);

    $this->actingAs($user);
    $response = $this->get(route('admin.debts.aging'));
    $response->assertStatus(200);
});

test('debt aging report calculates correct buckets', function () {
    $type = StoreType::first() ?? StoreType::create(['name' => 'Retail', 'label' => 'Retail', 'code' => 'retail', 'pos_behavior' => 'retail']);
    $store = Store::create(['store_type_id' => $type->id, 'name' => 'Test Store 2', 'code' => 'TEST2']);
    $user = User::factory()->create();
    $user->stores()->attach($store->id);
    session(['current_store_id' => $store->id]);

    // Customer 1: 0-30 days
    $customer1 = Customer::create(['store_id' => $store->id, 'name' => 'Cust 1', 'code' => 'C01', 'debt_balance' => 100]);
    CustomerDebtLog::create([
        'store_id' => $store->id,
        'customer_id' => $customer1->id,
        'type' => 'add',
        'amount' => 100,
        'balance_after' => 100,
        'due_date' => Carbon::today(),
    ]);

    // Customer 2: 31-60 days
    $customer2 = Customer::create(['store_id' => $store->id, 'name' => 'Cust 2', 'code' => 'C02', 'debt_balance' => 200]);
    CustomerDebtLog::create([
        'store_id' => $store->id,
        'customer_id' => $customer2->id,
        'type' => 'add',
        'amount' => 200,
        'balance_after' => 200,
        'due_date' => Carbon::today()->subDays(40),
    ]);

    $this->actingAs($user);
    $response = $this->get(route('admin.debts.aging'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Debts/Aging')
        ->has('summary')
        ->where('summary.total_piutang', 300)
        ->where('summary.jumlah_pelanggan', 2)
        ->has('agingBuckets')
    );
});
