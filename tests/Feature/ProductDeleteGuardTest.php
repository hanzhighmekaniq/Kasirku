<?php

use App\Models\Branch;
use App\Models\Feature;
use App\Models\Membership;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function setUpProductDeleteTestStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $customerFeature = Feature::create(['code' => 'customer', 'label' => 'Customer', 'is_active' => true, 'sort_order' => 0]);
    $productFeature = Feature::create(['code' => 'product', 'label' => 'Product', 'is_active' => true, 'sort_order' => 1]);
    $storeType->features()->attach([$customerFeature->id, $productFeature->id]);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach([$customerFeature->id, $productFeature->id]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $role->givePermissionTo([
        Permission::create(['name' => 'product.delete', 'guard_id' => 1]),
        Permission::create(['name' => 'product.view', 'guard_id' => 1]),
        Permission::create(['name' => 'dashboard.view', 'guard_id' => 1]),
        Permission::create(['name' => 'sale.void', 'guard_id' => 1]),
    ]);
    $user->assignRole($role);

    return [$store, $user];
}

test('membership product cannot be deleted directly', function () {
    [$store, $user] = setUpProductDeleteTestStore();
    $this->actingAs($user)->withSession(['current_store_id' => $store->id]);

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'GOLD01',
        'name' => 'Gold Member',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 100000,
        'is_sellable_at_pos' => true,
        'is_active' => true,
    ]);

    $product = Product::where('membership_id', $membership->id)->firstOrFail();

    $response = $this->delete(route('admin.products.destroy', $product->id));

    $response->assertRedirect();
    $response->assertSessionHas('error');
    $this->assertDatabaseHas('products', ['id' => $product->id]);
});

test('product with sale items cannot be deleted', function () {
    [$store, $user] = setUpProductDeleteTestStore();
    $this->actingAs($user)->withSession(['current_store_id' => $store->id]);

    $branch = Branch::create(['store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main']);
    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Item A',
        'sku' => 'ITM-001',
        'type' => 'finished_goods',
        'sell_price' => 10000,
    ]);

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'sale_no' => 'SL-001',
        'sale_date' => now(),
        'pos_mode' => 'retail',
        'order_type' => 'dine_in',
        'subtotal' => 10000,
        'grand_total' => 10000,
        'paid_amount' => 10000,
        'change_amount' => 0,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'price' => 10000,
        'subtotal' => 10000,
    ]);

    $response = $this->delete(route('admin.products.destroy', $product->id));

    $response->assertRedirect();
    $response->assertSessionHas('error');
    $this->assertDatabaseHas('products', ['id' => $product->id]);
});

test('unused regular product can be deleted', function () {
    [$store, $user] = setUpProductDeleteTestStore();
    $this->actingAs($user)->withSession(['current_store_id' => $store->id]);

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Item B',
        'sku' => 'ITM-002',
        'type' => 'finished_goods',
        'sell_price' => 10000,
    ]);

    $response = $this->from(route('admin.products.index'))
        ->delete(route('admin.products.destroy', $product->id));

    $response->assertRedirect(route('admin.products.index'));
    $response->assertSessionHas('success');
    $this->assertDatabaseMissing('products', ['id' => $product->id]);
});
