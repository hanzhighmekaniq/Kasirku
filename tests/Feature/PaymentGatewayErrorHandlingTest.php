<?php

use App\Models\Branch;
use App\Models\Feature;
use App\Models\PaymentAttempt;
use App\Models\PaymentGatewayTransaction;
use App\Models\Plan;
use App\Models\PlatformPaymentGateway;
use App\Models\Sale;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\StoreWallet;
use App\Models\User;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);
});

function makeStoreForPgErrorTest(): Store
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $features = collect(['payment_gateway', 'basic_pos'])->map(
        fn ($code) => Feature::create([
            'code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0,
        ])
    );
    $storeType->features()->attach($features->pluck('id'));

    $plan = Plan::create([
        'code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 0, 'price' => 0,
    ]);
    $plan->features()->attach($features->pluck('id'));

    return Store::create([
        'user_id' => null, 'code' => 'PGERR001', 'name' => 'PG Error Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);
}

function makePendingSaleForPgErrorTest(Store $store): Sale
{
    return Sale::create([
        'store_id' => $store->id,
        'branch_id' => null,
        'sale_no' => 'SL-PGERR-'.uniqid(),
        'sale_date' => now(),
        'pos_mode' => 'retail',
        'order_type' => 'dine_in',
        'subtotal' => 50000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'rounding_adjustment' => 0,
        'grand_total' => 50000,
        'paid_amount' => 0,
        'change_amount' => 0,
        'status' => 'pending',
        'payment_status' => 'unpaid',
    ]);
}

function activateMidtransPlatformGateway(): void
{
    PlatformPaymentGateway::create([
        'provider' => 'midtrans',
        'is_active' => true,
        'environment' => 'sandbox',
        'server_key' => 'SB-Mid-server-test-key',
        'client_key' => 'SB-Mid-client-test-key',
        'merchant_id' => 'G000000000',
        'enabled_methods' => ['qris'],
    ]);
    PaymentGatewayFactory::flushCache('midtrans');
}

function actingAsStoreUser(Store $store): User
{
    $user = User::factory()->create();
    $store->users()->attach($user->id);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true,
    ]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $voidPerm = Permission::create(['name' => 'sale.void', 'guard_id' => 1]);
    $role->givePermissionTo([$perm, $voidPerm]);
    $user->assignRole($role);

    session(['current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    return $user;
}

test('midtrans 500 response is treated as ambiguous and reconciled, not immediately failed', function () {
    $store = makeStoreForPgErrorTest();
    activateMidtransPlatformGateway();
    $sale = makePendingSaleForPgErrorTest($store);
    $user = actingAsStoreUser($store);

    Http::fake([
        '*/v2/charge' => Http::response([
            'status_code' => '500',
            'status_message' => 'Sorry. Our system is recovering from unexpected issues. Please retry.',
            'id' => 'test-error-id',
        ], 500),
        '*/v2/*/status' => Http::response([
            'status_code' => '404',
            'status_message' => 'Transaction not found',
        ], 404),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $response = $this->postJson('/app/payment-gateway/create', [
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'payment_type' => 'qris',
    ]);

    // Not found at the provider after reconciliation → genuinely failed, safe to retry.
    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
        'status' => 'failed',
        'can_retry' => true,
    ]);

    $pgTrx = PaymentGatewayTransaction::where('sale_id', $sale->id)->first();
    expect($pgTrx)->not->toBeNull();
    expect($pgTrx->status)->toBe('failed');
    expect($pgTrx->attempt_no)->toBe(1);

    // A server_error attempt should have been recorded for observability.
    $attempt = PaymentAttempt::where('pg_transaction_id', $pgTrx->id)->first();
    expect($attempt)->not->toBeNull();
    expect($attempt->result)->toBe('server_error');
    expect($attempt->http_status)->toBe(500);
});

test('midtrans 500 followed by a found transaction at the provider finalizes the sale as paid', function () {
    $store = makeStoreForPgErrorTest();
    activateMidtransPlatformGateway();
    $sale = makePendingSaleForPgErrorTest($store);
    $user = actingAsStoreUser($store);

    Http::fake([
        '*/v2/charge' => Http::response([
            'status_code' => '500',
            'status_message' => 'Sorry. Our system is recovering from unexpected issues. Please retry.',
        ], 500),
        '*/v2/*/status' => Http::response([
            'transaction_status' => 'settlement',
            'order_id' => 'whatever',
            'gross_amount' => '50000.00',
            'payment_type' => 'qris',
        ], 200),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $response = $this->postJson('/app/payment-gateway/create', [
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'payment_type' => 'qris',
    ]);

    $response->assertSuccessful();
    $response->assertJson(['success' => true, 'status' => 'paid']);

    $sale->refresh();
    expect($sale->status)->toBe('completed');
    expect($sale->payment_status)->toBe('paid');

    $wallet = StoreWallet::where('store_id', $store->id)->first();
    expect($wallet)->not->toBeNull();
    expect((float) $wallet->balance)->toBe(50000.0);
});

test('midtrans 400 client error is a definitive failure that cannot be retried', function () {
    $store = makeStoreForPgErrorTest();
    activateMidtransPlatformGateway();
    $sale = makePendingSaleForPgErrorTest($store);
    $user = actingAsStoreUser($store);

    Http::fake([
        '*/v2/charge' => Http::response([
            'status_code' => '400',
            'status_message' => 'One or more parameters in your request is invalid',
            'error_messages' => ['transaction_details.gross_amount is not equal to the sum of item_details'],
        ], 400),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $response = $this->postJson('/app/payment-gateway/create', [
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'payment_type' => 'qris',
    ]);

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
        'status' => 'failed',
        'can_retry' => false,
    ]);

    $pgTrx = PaymentGatewayTransaction::where('sale_id', $sale->id)->first();
    expect($pgTrx->status)->toBe('failed');

    $attempt = PaymentAttempt::where('pg_transaction_id', $pgTrx->id)->first();
    expect($attempt->result)->toBe('client_error');
    expect($attempt->http_status)->toBe(400);
});

test('successful midtrans charge returns pending status with QR data', function () {
    $store = makeStoreForPgErrorTest();
    activateMidtransPlatformGateway();
    $sale = makePendingSaleForPgErrorTest($store);
    $user = actingAsStoreUser($store);

    Http::fake([
        '*/v2/charge' => Http::response([
            'status_code' => '201',
            'status_message' => 'QRIS transaction is created',
            'transaction_id' => 'test-trx-id',
            'order_id' => 'SL-test',
            'gross_amount' => '50000.00',
            'transaction_status' => 'pending',
            'qr_string' => 'test-qr-payload',
            'actions' => [
                ['name' => 'generate-qr-code', 'method' => 'GET', 'url' => 'https://api.sandbox.midtrans.com/qris/test/qr-code'],
            ],
        ], 201),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $response = $this->postJson('/app/payment-gateway/create', [
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'payment_type' => 'qris',
    ]);

    $response->assertSuccessful();
    $response->assertJson(['success' => true, 'status' => 'pending']);
    $response->assertJsonPath('qr_code', 'test-qr-payload');

    $pgTrx = PaymentGatewayTransaction::where('sale_id', $sale->id)->first();
    expect($pgTrx->status)->toBe('pending');
    expect($pgTrx->idempotency_key)->not->toBeNull();
    expect($pgTrx->attempt_no)->toBe(1);
});

test('retrying a failed retryable PG transaction bumps attempt_no and issues a new idempotency key', function () {
    $store = makeStoreForPgErrorTest();
    activateMidtransPlatformGateway();
    $sale = makePendingSaleForPgErrorTest($store);
    $user = actingAsStoreUser($store);

    $pgTrx = PaymentGatewayTransaction::create([
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'external_id' => 'SL-'.$sale->id.'-firstattempt',
        'idempotency_key' => 'old-key',
        'attempt_no' => 1,
        'payment_type' => 'qris',
        'status' => 'failed',
        'amount' => 50000,
    ]);

    Http::fake([
        '*/v2/charge' => Http::response([
            'status_code' => '201',
            'transaction_status' => 'pending',
            'order_id' => $pgTrx->external_id,
            'gross_amount' => '50000.00',
            'qr_string' => 'retry-qr-payload',
            'actions' => [],
        ], 201),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $response = $this->postJson('/app/payment-gateway/retry', [
        'pg_trx_id' => $pgTrx->id,
    ]);

    $response->assertSuccessful();
    $response->assertJson(['success' => true, 'status' => 'pending']);

    $pgTrx->refresh();
    expect($pgTrx->attempt_no)->toBe(2);
    expect($pgTrx->idempotency_key)->not->toBe('old-key');
    expect($pgTrx->status)->toBe('pending');
});

test('retrying a transaction that exceeded max attempts is rejected', function () {
    $store = makeStoreForPgErrorTest();
    activateMidtransPlatformGateway();
    $sale = makePendingSaleForPgErrorTest($store);
    $user = actingAsStoreUser($store);

    $pgTrx = PaymentGatewayTransaction::create([
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'external_id' => 'SL-'.$sale->id.'-maxed',
        'idempotency_key' => 'some-key',
        'attempt_no' => PaymentGatewayTransaction::MAX_ATTEMPTS,
        'payment_type' => 'qris',
        'status' => 'failed',
        'amount' => 50000,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $response = $this->postJson('/app/payment-gateway/retry', [
        'pg_trx_id' => $pgTrx->id,
    ]);

    $response->assertStatus(422);
});

test('creating a new PG transaction while one is already pending reuses it instead of double charging', function () {
    $store = makeStoreForPgErrorTest();
    activateMidtransPlatformGateway();
    $sale = makePendingSaleForPgErrorTest($store);
    $user = actingAsStoreUser($store);

    PaymentGatewayTransaction::create([
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'external_id' => 'SL-'.$sale->id.'-existing',
        'idempotency_key' => 'existing-key',
        'attempt_no' => 1,
        'payment_type' => 'qris',
        'status' => 'pending',
        'amount' => 50000,
        'raw_response' => ['qr_string' => 'existing-qr'],
    ]);

    Http::fake([
        '*/v2/charge' => Http::response([], 200),
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $response = $this->postJson('/app/payment-gateway/create', [
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'payment_type' => 'qris',
    ]);

    $response->assertSuccessful();
    $response->assertJson(['success' => true, 'status' => 'pending']);

    // Should NOT have called /v2/charge again — only one transaction should exist for this sale.
    Http::assertNotSent(fn ($request) => str_contains($request->url(), '/v2/charge'));
    expect(PaymentGatewayTransaction::where('sale_id', $sale->id)->count())->toBe(1);
});
