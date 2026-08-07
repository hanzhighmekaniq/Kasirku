<?php

use App\Models\Branch;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function setupPurchaseMultiPaymentContext(): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0]
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'purchase'],
        ['label' => 'purchase', 'is_active' => true, 'sort_order' => 0]
    );
    $storeType->features()->attach($feature->id);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]
    );
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TST'.uniqid(),
        'name' => 'Test Store',
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

    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach (['purchase.view', 'purchase.create', 'purchase.edit'] as $permName) {
        $perm = Permission::create(['name' => $permName, 'guard_id' => 1]);
        $role->givePermissionTo($perm);
    }
    $user->assignRole($role);

    Supplier::create(['store_id' => $store->id, 'code' => 'SUP1', 'name' => 'Supplier Test']);
    PaymentMethod::create(['store_id' => $store->id, 'code' => 'CASH', 'name' => 'Cash', 'type' => 'cash']);
    Product::create([
        'store_id' => $store->id,
        'name' => 'Product Test',
        'sku' => 'P001',
        'sell_price' => 10000,
        'cost_price' => 8000,
        'is_active' => true,
        'is_sellable' => true,
        'track_stock' => true,
    ]);

    return [$store, $branch, $user];
}

test('storePayment creates a new payment record', function () {
    [$store, $branch, $user] = setupPurchaseMultiPaymentContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => Supplier::where('store_id', $store->id)->first()->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-001',
        'purchase_date' => now(),
        'subtotal' => 100000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 100000,
        'paid_amount' => 0,
        'status' => 'completed',
        'payment_status' => 'unpaid',
    ]);

    $paymentMethod = PaymentMethod::where('store_id', $store->id)->first();

    $response = $this->post(route('admin.purchases.storePayment', $purchase), [
        'payment_method_id' => $paymentMethod->id,
        'amount' => 50000,
        'paid_at' => now()->toDateTimeString(),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas(PurchasePayment::class, [
        'purchase_id' => $purchase->id,
        'amount' => 50000,
    ]);

    $purchase->refresh();
    expect((float) $purchase->paid_amount)->toBe(50000.0);
    expect($purchase->payment_status)->toBe('partial');
});

test('storePayment marks as paid when full amount paid', function () {
    [$store, $branch, $user] = setupPurchaseMultiPaymentContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => Supplier::where('store_id', $store->id)->first()->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-002',
        'purchase_date' => now(),
        'subtotal' => 100000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 100000,
        'paid_amount' => 0,
        'status' => 'completed',
        'payment_status' => 'unpaid',
    ]);

    $paymentMethod = PaymentMethod::where('store_id', $store->id)->first();

    $response = $this->post(route('admin.purchases.storePayment', $purchase), [
        'payment_method_id' => $paymentMethod->id,
        'amount' => 100000,
        'paid_at' => now()->toDateTimeString(),
    ]);

    $response->assertRedirect();

    $purchase->refresh();
    expect((float) $purchase->paid_amount)->toBe(100000.0);
    expect($purchase->payment_status)->toBe('paid');
});

test('storePayment rejects amount exceeding remaining balance', function () {
    [$store, $branch, $user] = setupPurchaseMultiPaymentContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => Supplier::where('store_id', $store->id)->first()->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-003',
        'purchase_date' => now(),
        'subtotal' => 100000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 100000,
        'paid_amount' => 0,
        'status' => 'completed',
        'payment_status' => 'unpaid',
    ]);

    $paymentMethod = PaymentMethod::where('store_id', $store->id)->first();

    $response = $this->post(route('admin.purchases.storePayment', $purchase), [
        'payment_method_id' => $paymentMethod->id,
        'amount' => 150000,
        'paid_at' => now()->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors('error');
});

test('destroyPayment removes payment and recalculates status', function () {
    [$store, $branch, $user] = setupPurchaseMultiPaymentContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => Supplier::where('store_id', $store->id)->first()->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-004',
        'purchase_date' => now(),
        'subtotal' => 100000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 100000,
        'paid_amount' => 50000,
        'status' => 'completed',
        'payment_status' => 'partial',
    ]);

    $paymentMethod = PaymentMethod::where('store_id', $store->id)->first();
    $payment = PurchasePayment::create([
        'purchase_id' => $purchase->id,
        'payment_method_id' => $paymentMethod->id,
        'paid_at' => now(),
        'amount' => 50000,
    ]);

    $response = $this->delete(route('admin.purchases.destroyPayment', $payment));

    $response->assertRedirect();

    $this->assertDatabaseMissing(PurchasePayment::class, [
        'id' => $payment->id,
    ]);

    $purchase->refresh();
    expect((float) $purchase->paid_amount)->toBe(0.0);
    expect($purchase->payment_status)->toBe('unpaid');
});

test('storePayment on draft purchase is rejected', function () {
    [$store, $branch, $user] = setupPurchaseMultiPaymentContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => Supplier::where('store_id', $store->id)->first()->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-005',
        'purchase_date' => now(),
        'subtotal' => 100000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 100000,
        'paid_amount' => 0,
        'status' => 'draft',
        'payment_status' => 'unpaid',
    ]);

    $paymentMethod = PaymentMethod::where('store_id', $store->id)->first();

    $response = $this->post(route('admin.purchases.storePayment', $purchase), [
        'payment_method_id' => $paymentMethod->id,
        'amount' => 50000,
        'paid_at' => now()->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors('error');
});
