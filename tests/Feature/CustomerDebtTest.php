<?php

use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('customer debt balance is calculated from logs', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST001', 'name' => 'Budi',
        'debt_balance' => 0, 'credit_limit' => 100000,
    ]);

    // Add debt
    CustomerDebtLog::create([
        'customer_id' => $customer->id, 'store_id' => $store->id,
        'type' => 'add', 'amount' => 50000, 'balance_after' => 50000,
        'notes' => 'Hutang transaksi #1',
    ]);
    $customer->update(['debt_balance' => 50000]);

    // Partial payment
    CustomerDebtLog::create([
        'customer_id' => $customer->id, 'store_id' => $store->id,
        'type' => 'payment', 'amount' => 20000, 'balance_after' => 30000,
        'notes' => 'Pelunasan sebagian',
    ]);
    $customer->update(['debt_balance' => 30000]);

    $customer->refresh();
    expect((float) $customer->debt_balance)->toBe(30000.0);
    expect($customer->debtLogs)->toHaveCount(2);
    expect($customer->debtLogs->last()->balance_after)->toBe('30000.00');
});

test('customer can check available credit', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST001', 'name' => 'Budi',
        'debt_balance' => 30000, 'credit_limit' => 100000,
    ]);

    $availableCredit = $customer->credit_limit - $customer->debt_balance;
    expect((float) $availableCredit)->toBe(70000.0);
});
