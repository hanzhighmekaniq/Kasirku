<?php

/*
|--------------------------------------------------------------------------
| Product Cross-Tenant Test (D-3 Fix)
|--------------------------------------------------------------------------
|
| ProductController sebelumnya tidak melakukan store scoping pada
| show(), edit(), update(), destroy(). User Store A bisa akses
| produk Store B lewat URL manipulation.
|
*/

use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * @return array{0: Store, 1: Product (store A), 2: User}
 */
function setupCrossTenantProductContext(): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'product'],
        ['label' => 'Produk', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    Plan::firstOrCreate(
        ['code' => 'free'],
        ['label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );

    $storeA = Store::create([
        'user_id' => null,
        'code' => 'XPROD'.uniqid(),
        'name' => 'Product Store A',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $productA = Product::create([
        'store_id' => $storeA->id,
        'name' => 'Produk A',
        'sku' => 'PA-'.uniqid(),
        'sell_price' => 10000,
        'cost_price' => 5000,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $user = User::factory()->create();
    $storeA->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($storeA->id);
    $role = Role::create(['name' => 'owner-'.uniqid()]);
    $role->givePermissionTo(
        Permission::firstOrCreate(['name' => 'product.edit']),
        Permission::firstOrCreate(['name' => 'product.view']),
        Permission::firstOrCreate(['name' => 'product.delete']),
        Permission::firstOrCreate(['name' => 'sale.void']),
    );
    $user->assignRole($role);

    return [$storeA, $productA, $user];
}

test('show produk dari toko lain ditolak', function () {
    [$storeA, $productA, $user] = setupCrossTenantProductContext();

    $storeB = Store::create([
        'user_id' => null,
        'code' => 'XPRODB'.uniqid(),
        'name' => 'Product Store B',
        'store_type_id' => $storeA->store_type_id,
    ]);

    $productB = Product::create([
        'store_id' => $storeB->id,
        'name' => 'Produk B',
        'sku' => 'PB-'.uniqid(),
        'sell_price' => 20000,
        'cost_price' => 10000,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $response = $this->get(route('admin.products.show', $productB->id));

    $response->assertStatus(302);
    expect(Product::where('store_id', $storeB->id)->count())->toBe(1);
});

test('edit produk dari toko lain ditolak', function () {
    [$storeA, $productA, $user] = setupCrossTenantProductContext();

    $storeB = Store::create([
        'user_id' => null,
        'code' => 'XPRODC'.uniqid(),
        'name' => 'Product Store C',
        'store_type_id' => $storeA->store_type_id,
    ]);

    $productB = Product::create([
        'store_id' => $storeB->id,
        'name' => 'Produk C',
        'sku' => 'PC-'.uniqid(),
        'sell_price' => 30000,
        'cost_price' => 15000,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $response = $this->get(route('admin.products.edit', $productB->id));

    $response->assertStatus(302);
});

test('update produk dari toko lain ditolak', function () {
    [$storeA, $productA, $user] = setupCrossTenantProductContext();

    $storeB = Store::create([
        'user_id' => null,
        'code' => 'XPRODD'.uniqid(),
        'name' => 'Product Store D',
        'store_type_id' => $storeA->store_type_id,
    ]);

    $productB = Product::create([
        'store_id' => $storeB->id,
        'name' => 'Produk D',
        'sku' => 'PD-'.uniqid(),
        'sell_price' => 40000,
        'cost_price' => 20000,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $this->patchJson(route('admin.products.update', $productB->id), [
        'name' => 'Hacked Product',
        'sku' => 'PD-'.uniqid(),
        'sell_price' => 1,
        'cost_price' => 1,
        'category_id' => null,
    ]);

    expect($productB->fresh()->name)->toBe('Produk D');
});

test('destroy produk dari toko lain ditolak', function () {
    [$storeA, $productA, $user] = setupCrossTenantProductContext();

    $storeB = Store::create([
        'user_id' => null,
        'code' => 'XPRODE'.uniqid(),
        'name' => 'Product Store E',
        'store_type_id' => $storeA->store_type_id,
    ]);

    $productB = Product::create([
        'store_id' => $storeB->id,
        'name' => 'Produk E',
        'sku' => 'PE-'.uniqid(),
        'sell_price' => 50000,
        'cost_price' => 25000,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $this->deleteJson(route('admin.products.destroy', $productB->id));

    expect(Product::where('store_id', $storeB->id)->count())->toBe(1);
});

test('akses produk sendiri berhasil', function () {
    [$storeA, $productA, $user] = setupCrossTenantProductContext();

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id, 'current_branch_id' => 0, 'branch_id' => 0]);

    $this->get(route('admin.products.show', $productA->id))
        ->assertSuccessful();
});
