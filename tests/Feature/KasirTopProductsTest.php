<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Feature;
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

function setupKasirTopProductsContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'sale', 'shift'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TST'.uniqid(),
        'name' => 'Toko TopProducts',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang Utama', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach (['sale.create', 'sale.view', 'shift.view', 'shift.create'] as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('topProducts returns most sold products', function () {
    [$store, $branch, $user] = setupKasirTopProductsContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $productA = Product::create([
        'store_id' => $store->id, 'name' => 'Product A', 'sku' => 'PA01',
        'sell_price' => 10000, 'cost_price' => 8000,
        'is_active' => true, 'is_sellable' => true,
    ]);

    $productB = Product::create([
        'store_id' => $store->id, 'name' => 'Product B', 'sku' => 'PB01',
        'sell_price' => 20000, 'cost_price' => 15000,
        'is_active' => true, 'is_sellable' => true,
    ]);

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'sale_no' => 'SL-'.uniqid(),
        'subtotal' => 160000,
        'total' => 160000,
        'status' => 'final',
        'sale_date' => now()->toDateString(),
    ]);

    SaleItem::create([
        'sale_id' => $sale->id, 'product_id' => $productA->id,
        'quantity' => 10, 'price' => 10000, 'subtotal' => 100000,
    ]);

    SaleItem::create([
        'sale_id' => $sale->id, 'product_id' => $productB->id,
        'quantity' => 3, 'price' => 20000, 'subtotal' => 60000,
    ]);

    $response = $this->getJson(route('admin.kasir.top-products'));

    $response->assertOk();
    $response->assertJsonStructure(['products']);
    $products = $response->json('products');
    expect($products[0]['id'])->toBe($productA->id);
    expect($products[1]['id'])->toBe($productB->id);
});

test('topProducts respects limit parameter', function () {
    [$store, $branch, $user] = setupKasirTopProductsContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $products = [];
    for ($i = 1; $i <= 5; $i++) {
        $products[] = Product::create([
            'store_id' => $store->id, 'name' => "Product {$i}", 'sku' => "P{$i}01",
            'sell_price' => 10000 * $i, 'cost_price' => 8000 * $i,
            'is_active' => true, 'is_sellable' => true,
        ]);
    }

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'sale_no' => 'SL-'.uniqid(),
        'subtotal' => 0,
        'total' => 0,
        'status' => 'final',
        'sale_date' => now()->toDateString(),
    ]);

    foreach ($products as $i => $product) {
        SaleItem::create([
            'sale_id' => $sale->id, 'product_id' => $product->id,
            'quantity' => 5 - $i, 'price' => $product->sell_price, 'subtotal' => (5 - $i) * $product->sell_price,
        ]);
    }

    $response = $this->getJson(route('admin.kasir.top-products', ['limit' => 2]));

    $response->assertOk();
    $products = $response->json('products');
    expect(count($products))->toBe(2);
});

test('searchCustomer finds by name', function () {
    [$store, $branch, $user] = setupKasirTopProductsContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    Customer::create([
        'store_id' => $store->id, 'code' => 'C001', 'name' => 'Budi Santoso',
        'phone' => '08123456789', 'is_active' => true,
    ]);

    $response = $this->getJson(route('admin.kasir.search-customer', ['q' => 'Budi']));

    $response->assertOk();
    $customers = $response->json('customers');
    expect($customers)->not->toBeEmpty();
    expect($customers[0]['name'])->toBe('Budi Santoso');
});

test('searchCustomer finds by phone', function () {
    [$store, $branch, $user] = setupKasirTopProductsContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    Customer::create([
        'store_id' => $store->id, 'code' => 'C002', 'name' => 'Andi',
        'phone' => '08123456789', 'is_active' => true,
    ]);

    $response = $this->getJson(route('admin.kasir.search-customer', ['q' => '0812']));

    $response->assertOk();
    $customers = $response->json('customers');
    expect($customers)->not->toBeEmpty();
    expect($customers[0]['phone'])->toBe('08123456789');
});

test('searchCustomer returns empty for short query', function () {
    [$store, $branch, $user] = setupKasirTopProductsContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    Customer::create([
        'store_id' => $store->id, 'code' => 'C003', 'name' => 'Charlie',
        'phone' => '08999999999', 'is_active' => true,
    ]);

    $response = $this->getJson(route('admin.kasir.search-customer', ['q' => 'ab']));

    $response->assertOk();
    $response->assertJson(['customers' => []]);
});
