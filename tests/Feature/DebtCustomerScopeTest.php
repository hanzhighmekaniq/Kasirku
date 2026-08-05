<?php

/*
|--------------------------------------------------------------------------
| Debt Customer Scope Test (E-2, E-3 Fix)
|--------------------------------------------------------------------------
|
| KasirController::store() dan finalize() sebelumnya tidak melakukan
| store scoping pada customer lookup saat pencatatan hutang.
| User Store A bisa pass customer_id dari Store B.
|
*/

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Feature;
use App\Models\PaymentMethod;
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
 * @return array{0: Store, 1: Branch, 2: User, 3: Customer, 4: PaymentMethod}
 */
function setupDebtScopeContext(): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    foreach (['basic_pos', 'product', 'customer', 'payment_method'] as $code) {
        $f = Feature::firstOrCreate(
            ['code' => $code],
            ['label' => $code, 'is_active' => true, 'sort_order' => 0],
        );
        $storeType->features()->syncWithoutDetaching([$f->id]);
    }

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic',
            'is_active' => true,
            'sort_order' => 0,
            'price' => 0,
        ],
    );
    $plan->features()->syncWithoutDetaching(Feature::pluck('id')->all());

    $store = Store::create([
        'user_id' => null,
        'code' => 'DBTSCR'.uniqid(),
        'name' => 'Debt Scope Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR1',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id,
        'code' => 'CUST-'.uniqid(),
        'name' => 'Pelanggan A',
        'debt_balance' => 0,
        'credit_limit' => 500000,
    ]);

    $pm = PaymentMethod::create([
        'store_id' => $store->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach (['sale.create', 'customer.view'] as $perm) {
        $role->givePermissionTo(
            Permission::firstOrCreate(['name' => $perm], ['guard_id' => 1]),
        );
    }
    $user->assignRole($role);

    return [$store, $branch, $user, $customer, $pm];
}

test('customer dari store lain tidak bisa dipilih di POS store', function () {
    [$storeA, $branchA, $userA, $customerA, $pmA] = setupDebtScopeContext();

    $storeB = Store::create([
        'user_id' => null,
        'code' => 'DBTSCR'.uniqid(),
        'name' => 'Debt Scope Store B',
        'store_type_id' => $storeA->store_type_id,
    ]);

    $customerB = Customer::create([
        'store_id' => $storeB->id,
        'code' => 'CUST-B'.uniqid(),
        'name' => 'Pelanggan B',
        'debt_balance' => 100000,
        'credit_limit' => 500000,
    ]);

    $this->actingAs($userA);
    session(['current_store_id' => $storeA->id, 'branch_id' => $branchA->id]);

    // Coba buat sale dengan customer dari store lain
    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'takeaway',
        'items' => [
            ['product_id' => 99999, 'quantity' => 1, 'price' => 10000],
        ],
        'payments' => [
            ['method_id' => $pmA->id, 'amount' => 10000],
        ],
        'customer_id' => $customerB->id,
    ]);

    // Harus ditolak karena customer tidak ada di store ini
    $response->assertStatus(422);
});

test('customer dari store sendiri bisa dipilih di POS', function () {
    [$storeA, $branchA, $userA, $customerA, $pmA] = setupDebtScopeContext();

    // Buat produk untuk dijual
    $product = Product::create([
        'store_id' => $storeA->id,
        'name' => 'Produk Test',
        'sku' => 'TST-'.uniqid(),
        'sell_price' => 10000,
        'cost_price' => 5000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $storeA->id,
        'branch_id' => $branchA->id,
        'quantity' => 50,
        'reserved_quantity' => 0,
        'average_cost' => 5000,
    ]);

    $this->actingAs($userA);
    session(['current_store_id' => $storeA->id, 'branch_id' => $branchA->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'takeaway',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 10000],
        ],
        'payments' => [
            ['method_id' => $pmA->id, 'amount' => 10000],
        ],
        'customer_id' => $customerA->id,
    ]);

    $response->assertSuccessful();
});
