<?php

use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Models\PaymentGatewayTransaction;
use App\Models\Plan;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\StoreWallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeStoreForWalletTest(): Store
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $plan = Plan::create([
        'code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0,
    ]);

    return Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);
}

test('store wallet credit increments balance and records a transaction', function () {
    $store = makeStoreForWalletTest();

    $wallet = StoreWallet::create([
        'store_id' => $store->id, 'balance' => 0, 'pending_balance' => 0, 'withdrawn' => 0,
    ]);

    $wallet->credit(50000, 'sale_credit', null, 'Test credit');

    $wallet->refresh();
    expect((float) $wallet->balance)->toBe(50000.0);

    $trx = WalletTransaction::where('wallet_id', $wallet->id)->first();
    expect($trx)->not->toBeNull();
    expect($trx->type)->toBe('sale_credit');
    expect((float) $trx->amount)->toBe(50000.0);
    expect((float) $trx->balance_after)->toBe(50000.0);
});

test('store wallet debit decrements balance and records a negative transaction', function () {
    $store = makeStoreForWalletTest();

    $wallet = StoreWallet::create([
        'store_id' => $store->id, 'balance' => 100000, 'pending_balance' => 0, 'withdrawn' => 0,
    ]);

    $wallet->debit(30000, 'withdrawal_debit', null, 'Test withdrawal');

    $wallet->refresh();
    expect((float) $wallet->balance)->toBe(70000.0);

    $trx = WalletTransaction::where('wallet_id', $wallet->id)->first();
    expect((float) $trx->amount)->toBe(-30000.0);
    expect((float) $trx->balance_after)->toBe(70000.0);
});

test('finalizing a PG sale credits the store wallet with the paid amount', function () {
    $store = makeStoreForWalletTest();

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => null,
        'sale_no' => 'SL-TEST-001',
        'sale_date' => now(),
        'pos_mode' => 'retail',
        'order_type' => 'dine_in',
        'subtotal' => 75000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'rounding_adjustment' => 0,
        'grand_total' => 75000,
        'paid_amount' => 0,
        'change_amount' => 0,
        'status' => 'pending',
        'payment_status' => 'unpaid',
    ]);

    $pgTrx = PaymentGatewayTransaction::create([
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'external_id' => 'SL-'.$sale->id.'-12345',
        'payment_type' => 'qris',
        'status' => 'paid',
        'amount' => 75000,
        'raw_response' => [],
    ]);

    $controller = new PaymentGatewayController;
    $controller->finalizeSale($sale, $pgTrx);

    $sale->refresh();
    expect($sale->status)->toBe('completed');
    expect($sale->payment_status)->toBe('paid');
    expect((float) $sale->paid_amount)->toBe(75000.0);

    $salePayment = SalePayment::where('sale_id', $sale->id)->first();
    expect($salePayment)->not->toBeNull();
    expect((float) $salePayment->amount)->toBe(75000.0);

    $wallet = StoreWallet::where('store_id', $store->id)->first();
    expect($wallet)->not->toBeNull();
    expect((float) $wallet->balance)->toBe(75000.0);

    $walletTrx = WalletTransaction::where('store_id', $store->id)->first();
    expect($walletTrx)->not->toBeNull();
    expect($walletTrx->type)->toBe('sale_credit');
    expect($walletTrx->referenceable_type)->toBe(Sale::class);
    expect($walletTrx->referenceable_id)->toBe($sale->id);
});

test('finalizing an already completed sale does not double-credit the wallet', function () {
    $store = makeStoreForWalletTest();

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => null,
        'sale_no' => 'SL-TEST-002',
        'sale_date' => now(),
        'pos_mode' => 'retail',
        'order_type' => 'dine_in',
        'subtotal' => 50000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'rounding_adjustment' => 0,
        'grand_total' => 50000,
        'paid_amount' => 50000,
        'change_amount' => 0,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    $pgTrx = PaymentGatewayTransaction::create([
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'external_id' => 'SL-'.$sale->id.'-99999',
        'payment_type' => 'qris',
        'status' => 'paid',
        'amount' => 50000,
        'raw_response' => [],
    ]);

    $controller = new PaymentGatewayController;
    $controller->finalizeSale($sale, $pgTrx);

    $wallet = StoreWallet::where('store_id', $store->id)->first();
    expect($wallet)->toBeNull();
});
