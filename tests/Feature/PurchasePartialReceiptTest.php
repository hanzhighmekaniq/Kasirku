<?php

use App\Models\Branch;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function setupPartialReceiptContext(): array
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
    Product::create([
        'store_id' => $store->id,
        'name' => 'Product A',
        'sku' => 'PA01',
        'sell_price' => 10000,
        'cost_price' => 8000,
        'is_active' => true,
        'is_sellable' => true,
        'track_stock' => true,
    ]);

    return [$store, $branch, $user];
}

test('receivePartial updates received_quantity on purchase items', function () {
    [$store, $branch, $user] = setupPartialReceiptContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $supplier = Supplier::where('store_id', $store->id)->first();
    $product = Product::where('store_id', $store->id)->first();

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => $supplier->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-001',
        'purchase_date' => now(),
        'subtotal' => 80000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 80000,
        'paid_amount' => 0,
        'status' => 'draft',
        'payment_status' => 'unpaid',
    ]);

    $item = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'received_quantity' => 0,
        'cost_price' => 8000,
        'subtotal' => 80000,
    ]);

    $response = $this->post(route('admin.purchases.receivePartial', $purchase), [
        'items' => [
            ['id' => $item->id, 'quantity' => 5],
        ],
    ]);

    $response->assertRedirect();

    $item->refresh();
    expect((float) $item->fresh()->received_quantity)->toBe(5.0);
});

test('receivePartial auto-completes PO when all items fully received', function () {
    [$store, $branch, $user] = setupPartialReceiptContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $supplier = Supplier::where('store_id', $store->id)->first();
    $product = Product::where('store_id', $store->id)->first();

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => $supplier->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-002',
        'purchase_date' => now(),
        'subtotal' => 80000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 80000,
        'paid_amount' => 0,
        'status' => 'draft',
        'payment_status' => 'unpaid',
    ]);

    $item = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'received_quantity' => 8,
        'cost_price' => 8000,
        'subtotal' => 80000,
    ]);

    $response = $this->post(route('admin.purchases.receivePartial', $purchase), [
        'items' => [
            ['id' => $item->id, 'quantity' => 2],
        ],
    ]);

    $response->assertRedirect();

    $item->refresh();
    expect((float) $item->fresh()->received_quantity)->toBe(10.0);

    $purchase->refresh();
    expect($purchase->status)->toBe('completed');
});

test('receivePartial rejects quantity exceeding ordered quantity', function () {
    [$store, $branch, $user] = setupPartialReceiptContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $supplier = Supplier::where('store_id', $store->id)->first();
    $product = Product::where('store_id', $store->id)->first();

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => $supplier->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-003',
        'purchase_date' => now(),
        'subtotal' => 80000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 80000,
        'paid_amount' => 0,
        'status' => 'draft',
        'payment_status' => 'unpaid',
    ]);

    $item = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'received_quantity' => 0,
        'cost_price' => 8000,
        'subtotal' => 80000,
    ]);

    $response = $this->post(route('admin.purchases.receivePartial', $purchase), [
        'items' => [
            ['id' => $item->id, 'quantity' => 15],
        ],
    ]);

    $response->assertSessionHasErrors('error');
});

test('receivePartial on completed purchase is rejected', function () {
    [$store, $branch, $user] = setupPartialReceiptContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $supplier = Supplier::where('store_id', $store->id)->first();
    $product = Product::where('store_id', $store->id)->first();

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => $supplier->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-'.now()->format('Ymd').'-004',
        'purchase_date' => now(),
        'subtotal' => 80000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'shipping_amount' => 0,
        'grand_total' => 80000,
        'paid_amount' => 80000,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    $item = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'received_quantity' => 0,
        'cost_price' => 8000,
        'subtotal' => 80000,
    ]);

    $response = $this->post(route('admin.purchases.receivePartial', $purchase), [
        'items' => [
            ['id' => $item->id, 'quantity' => 5],
        ],
    ]);

    $response->assertSessionHasErrors('error');
});
