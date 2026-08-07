<?php

/*
|--------------------------------------------------------------------------
| Sale Authorization Test (C-1, C-2 Fix)
|--------------------------------------------------------------------------
|
| SaleController::destroy() sebelumnya tidak ada authorization check.
| SaleController::show() tidak cek store scope.
|
*/

use App\Models\Branch;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * @return array{0: Store, 1: Branch, 2: User (with sale.void), 3: Sale, 4: PaymentMethod}
 */
function setupSaleAuthContext(): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    foreach (['basic_pos', 'product', 'customer', 'payment_method', 'sale'] as $code) {
        $f = Feature::firstOrCreate(
            ['code' => $code],
            ['label' => $code, 'is_active' => true, 'sort_order' => 0],
        );
        $storeType->features()->syncWithoutDetaching([$f->id]);
    }

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching(Feature::pluck('id')->all());

    Plan::firstOrCreate(
        ['code' => 'free'],
        ['label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );

    $store = Store::create([
        'user_id' => null,
        'code' => 'SLAUTH'.uniqid(),
        'name' => 'Sale Auth Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR1',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $pm = PaymentMethod::create([
        'store_id' => $store->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Produk Auth',
        'sku' => 'AUTH-'.uniqid(),
        'sell_price' => 10000,
        'cost_price' => 5000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 50,
        'reserved_quantity' => 0,
        'average_cost' => 5000,
    ]);

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'sale_no' => 'SL-'.uniqid(),
        'customer_id' => null,
        'subtotal' => 10000,
        'total' => 10000,
        'status' => 'completed',
        'sale_date' => now()->toDateString(),
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'price' => 10000,
        'subtotal' => 10000,
    ]);

    SalePayment::create([
        'sale_id' => $sale->id,
        'payment_method_id' => $pm->id,
        'amount' => 10000,
        'paid_at' => now(),
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid()]);
    $role->givePermissionTo(
        Permission::firstOrCreate(['name' => 'sale.void']),
        Permission::firstOrCreate(['name' => 'sale.view']),
        Permission::firstOrCreate(['name' => 'sale.delete']),
    );
    $user->assignRole($role);

    return [$store, $branch, $user, $sale, $pm];
}

test('show sale dari toko lain ditolak', function () {
    [$storeA, $branchA, $userA, $saleA] = setupSaleAuthContext();

    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail-b'],
        ['label' => 'Retail B', 'is_active' => true, 'sort_order' => 0],
    );

    $storeB = Store::create([
        'user_id' => null,
        'code' => 'SLB'.uniqid(),
        'name' => 'Sale Auth Store B',
        'store_type_id' => $storeType->id,
    ]);

    $branchB = Branch::create([
        'store_id' => $storeB->id,
        'code' => 'BR-B',
        'name' => 'Branch B',
        'is_active' => true,
    ]);

    $saleB = Sale::create([
        'store_id' => $storeB->id,
        'branch_id' => $branchB->id,
        'sale_no' => 'SL-B'.uniqid(),
        'subtotal' => 20000,
        'total' => 20000,
        'status' => 'completed',
        'sale_date' => now()->toDateString(),
    ]);

    $this->actingAs($userA);
    session(['current_store_id' => $storeA->id, 'branch_id' => $branchA->id]);

    $response = $this->get(route('admin.sales.show', $saleB->id));

    $response->assertStatus(302);
});

test('void sale dari toko lain ditolak', function () {
    [$storeA, $branchA, $userA, $saleA] = setupSaleAuthContext();

    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail-c'],
        ['label' => 'Retail C', 'is_active' => true, 'sort_order' => 0],
    );

    $storeC = Store::create([
        'user_id' => null,
        'code' => 'SLC'.uniqid(),
        'name' => 'Sale Auth Store C',
        'store_type_id' => $storeType->id,
    ]);

    $branchC = Branch::create([
        'store_id' => $storeC->id,
        'code' => 'BR-C',
        'name' => 'Branch C',
        'is_active' => true,
    ]);

    $saleC = Sale::create([
        'store_id' => $storeC->id,
        'branch_id' => $branchC->id,
        'sale_no' => 'SL-C'.uniqid(),
        'subtotal' => 30000,
        'total' => 30000,
        'status' => 'completed',
        'sale_date' => now()->toDateString(),
    ]);

    $this->actingAs($userA);
    session(['current_store_id' => $storeA->id, 'branch_id' => $branchA->id]);

    $this->deleteJson(route('admin.sales.destroy', $saleC->id));

    expect($saleC->fresh()->status)->toBe('completed');
});

test('void sale sendiri dengan permission berhasil', function () {
    [$storeA, $branchA, $userA, $saleA] = setupSaleAuthContext();

    $this->actingAs($userA);
    session(['current_store_id' => $storeA->id, 'branch_id' => $branchA->id]);

    $this->deleteJson(route('admin.sales.destroy', $saleA->id))
        ->assertRedirect();

    expect(Sale::find($saleA->id))->toBeNull();
});

test('void sale tanpa permission ditolak', function () {
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail-d'],
        ['label' => 'Retail D', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'basic_pos'],
        ['label' => 'basic_pos', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'SLNOVO'.uniqid(),
        'name' => 'No Void Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR1',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'sale_no' => 'SL-NOVO'.uniqid(),
        'subtotal' => 5000,
        'total' => 5000,
        'status' => 'completed',
        'sale_date' => now()->toDateString(),
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'kasir-'.uniqid()]);
    $role->givePermissionTo(
        Permission::firstOrCreate(['name' => 'sale.create']),
    );
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->deleteJson(route('admin.sales.destroy', $sale->id))
        ->assertForbidden();
});
