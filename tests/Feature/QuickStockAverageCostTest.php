<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * @return array{store: Store, branch: Branch, product: Product, user: User}
 */
function quickStockEnv(float $productCostPrice = 8000): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['product', 'stock'] as $code) {
        $feature = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($feature->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'TESTQS', 'name' => 'Test Store Quick Stock',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main Branch', 'is_active' => true,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Beras', 'sku' => 'BRS-001',
        'cost_price' => $productCostPrice, 'sell_price' => 12000,
        'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $role->givePermissionTo(Permission::create(['name' => 'stock.adjustment', 'guard_id' => 1]));
    $user->assignRole($role);

    test()->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    return compact('store', 'branch', 'product', 'user');
}

test('stok masuk tanpa input modal manual tetap mengisi average_cost dari cost_price produk', function () {
    ['store' => $store, 'branch' => $branch, 'product' => $product] = quickStockEnv(8000);

    $this->post(route('admin.stock-adjustments.quick'), [
        'product_id' => $product->id,
        'type' => 'in',
        'quantity' => 10,
        'reason' => 'received',
    ]);

    $stock = ProductStock::where('product_id', $product->id)
        ->where('store_id', $store->id)
        ->first();

    expect((float) $stock->quantity)->toBe(10.0)
        // Sebelum fix: average_cost tetap 0 karena cost_price tidak dikirim.
        ->and((float) $stock->average_cost)->toBe(8000.0);
});

test('stok masuk dengan modal manual menghitung weighted average terhadap stok lama', function () {
    ['store' => $store, 'branch' => $branch, 'product' => $product] = quickStockEnv(8000);

    // Stok awal: 10 unit @ 8.000
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => null, 'packaging_unit_id' => null,
        'store_id' => $store->id, 'branch_id' => $branch->id,
        'quantity' => 10, 'reserved_quantity' => 0, 'average_cost' => 8000,
    ]);

    // Masuk 10 unit @ 10.000 -> (8000*10 + 10000*10) / 20 = 9.000
    $this->post(route('admin.stock-adjustments.quick'), [
        'product_id' => $product->id,
        'type' => 'in',
        'quantity' => 10,
        'cost_price' => 10000,
        'reason' => 'received',
    ]);

    $stock = ProductStock::where('product_id', $product->id)
        ->where('store_id', $store->id)
        ->first();

    expect((float) $stock->quantity)->toBe(20.0)
        ->and((float) $stock->average_cost)->toBe(9000.0);
});

test('stok keluar tidak mengubah average_cost', function () {
    ['store' => $store, 'branch' => $branch, 'product' => $product] = quickStockEnv(8000);

    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => null, 'packaging_unit_id' => null,
        'store_id' => $store->id, 'branch_id' => $branch->id,
        'quantity' => 10, 'reserved_quantity' => 0, 'average_cost' => 8000,
    ]);

    $this->post(route('admin.stock-adjustments.quick'), [
        'product_id' => $product->id,
        'type' => 'out',
        'quantity' => 4,
        'reason' => 'damaged',
    ]);

    $stock = ProductStock::where('product_id', $product->id)
        ->where('store_id', $store->id)
        ->first();

    expect((float) $stock->quantity)->toBe(6.0)
        ->and((float) $stock->average_cost)->toBe(8000.0);
});
