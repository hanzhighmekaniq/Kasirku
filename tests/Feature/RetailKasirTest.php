<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductPriceTier;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * Setup dasar: store retail + branch + payment method + user dengan
 * permission sale.create. Dipakai berulang di semua skenario di bawah.
 */
function setupRetailStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $featureCodes = ['basic_pos', 'product', 'category', 'payment_method', 'customer', 'promo'];
    $features = [];
    foreach ($featureCodes as $code) {
        $features[$code] = Feature::create([
            'code' => $code,
            'label' => $code,
            'is_active' => true,
            'sort_order' => 0,
        ]);
    }
    $storeType->features()->attach(collect($features)->pluck('id'));

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach(collect($features)->pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TEST001',
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

    $paymentMethod = PaymentMethod::create([
        'store_id' => $store->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    foreach (['sale.create', 'sale.view'] as $permName) {
        $perm = Permission::create(['name' => $permName, 'guard_id' => 1]);
        $role->givePermissionTo($perm);
    }
    $user->assignRole($role);

    return [$store, $branch, $paymentMethod, $user];
}

function actingAsRetailUser($test, User $user, Store $store, Branch $branch): void
{
    $test->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);
}

test('normal retail transaction succeeds and deducts stock', function () {
    [$store, $branch, $paymentMethod, $user] = setupRetailStore();

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Indomie Goreng',
        'sku' => 'IDM001',
        'sell_price' => 3000,
        'cost_price' => 2000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id, 'branch_id' => $branch->id, 'quantity' => 50,
        'reserved_quantity' => 0,
    ]);

    actingAsRetailUser($this, $user, $store, $branch);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'takeaway',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 3, 'price' => 3000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 9000],
        ],
    ]);

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);

    $stock = ProductStock::where('product_id', $product->id)->first();
    expect((float) $stock->quantity)->toBe(47.0);

    $sale = Sale::where('store_id', $store->id)->first();
    expect((float) $sale->grand_total)->toBe(9000.0);
});

test('transaction with tier price stores the tier price, not the base price', function () {
    [$store, $branch, $paymentMethod, $user] = setupRetailStore();

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Air Mineral 600ml',
        'sku' => 'AQ600',
        'sell_price' => 5000, // harga satuan normal
        'cost_price' => 3000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    // Beli 12+ botol → harga tier Rp 4.000/botol
    ProductPriceTier::create([
        'product_id' => $product->id,
        'variant_id' => null,
        'min_qty' => 12,
        'price' => 4000,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id, 'branch_id' => $branch->id, 'quantity' => 100,
        'reserved_quantity' => 0,
    ]);

    actingAsRetailUser($this, $user, $store, $branch);

    // Kasir kirim harga tier (4000) — bukan harga base (5000) — karena
    // frontend sudah menghitung tier price sebelum submit (lihat T1 fix:
    // price payload pakai c.price yang sudah termasuk tier).
    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'takeaway',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 12, 'price' => 4000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 48000],
        ],
    ]);

    $response->assertSuccessful();

    $sale = Sale::where('store_id', $store->id)->with('items')->first();
    expect((float) $sale->items->first()->price)->toBe(4000.0);
    expect((float) $sale->grand_total)->toBe(48000.0);
});

test('item price that does not match any valid product price is rejected', function () {
    [$store, $branch, $paymentMethod, $user] = setupRetailStore();

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Kopi Sachet',
        'sku' => 'KPS001',
        'sell_price' => 100000,
        'cost_price' => 50000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id, 'branch_id' => $branch->id, 'quantity' => 10,
        'reserved_quantity' => 0,
    ]);

    actingAsRetailUser($this, $user, $store, $branch);

    // Kasir (atau request langsung ke endpoint) kirim harga Rp 1 untuk
    // produk seharga Rp 100.000 — harus ditolak oleh assertItemPricesValid().
    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'takeaway',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 1],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 1],
        ],
    ]);

    $response->assertStatus(422);

    // Stok tidak boleh berkurang karena transaksi ditolak.
    $stock = ProductStock::where('product_id', $product->id)->first();
    expect((float) $stock->quantity)->toBe(10.0);
});

test('wholesale order type without a customer is rejected', function () {
    [$store, $branch, $paymentMethod, $user] = setupRetailStore();

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Beras 5kg',
        'sku' => 'BRS5KG',
        'sell_price' => 60000,
        'cost_price' => 50000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id, 'branch_id' => $branch->id, 'quantity' => 20,
        'reserved_quantity' => 0,
    ]);

    actingAsRetailUser($this, $user, $store, $branch);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'wholesale',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5, 'price' => 60000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 300000],
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment(['message' => 'Transaksi grosir wajib memilih pelanggan.']);
});

test('wholesale order type with a customer succeeds', function () {
    [$store, $branch, $paymentMethod, $user] = setupRetailStore();

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Beras 5kg',
        'sku' => 'BRS5KG',
        'sell_price' => 60000,
        'cost_price' => 50000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id, 'branch_id' => $branch->id, 'quantity' => 20,
        'reserved_quantity' => 0,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id,
        'code' => 'CUST001',
        'name' => 'Toko Sembako Jaya',
        'is_active' => true,
    ]);

    actingAsRetailUser($this, $user, $store, $branch);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'wholesale',
        'customer_id' => $customer->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5, 'price' => 60000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 300000],
        ],
    ]);

    $response->assertSuccessful();

    $sale = Sale::where('store_id', $store->id)->first();
    expect($sale->customer_id)->toBe($customer->id);
    expect($sale->order_type)->toBe('wholesale');
});

test('discount exceeding subtotal is rejected', function () {
    [$store, $branch, $paymentMethod, $user] = setupRetailStore();

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Sabun Mandi',
        'sku' => 'SBN001',
        'sell_price' => 10000,
        'cost_price' => 6000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id, 'branch_id' => $branch->id, 'quantity' => 30,
        'reserved_quantity' => 0,
    ]);

    actingAsRetailUser($this, $user, $store, $branch);

    // Subtotal = 10.000, diskon dikirim 999.999.999 — jauh melebihi subtotal.
    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'takeaway',
        'discount_amount' => 999999999,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 10000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 10000],
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment(['success' => false]);

    // Stok tidak boleh berkurang karena transaksi ditolak.
    $stock = ProductStock::where('product_id', $product->id)->first();
    expect((float) $stock->quantity)->toBe(30.0);
});

test('duplicate idempotency key returns the existing sale instead of creating a new one', function () {
    [$store, $branch, $paymentMethod, $user] = setupRetailStore();

    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Teh Botol',
        'sku' => 'TB001',
        'sell_price' => 5000,
        'cost_price' => 3000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id, 'branch_id' => $branch->id, 'quantity' => 40,
        'reserved_quantity' => 0,
    ]);

    actingAsRetailUser($this, $user, $store, $branch);

    $payload = [
        'order_type' => 'takeaway',
        'idempotency_key' => 'test-idem-key-001',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2, 'price' => 5000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 10000],
        ],
    ];

    $first = $this->postJson('/app/kasir/store', $payload);
    $first->assertSuccessful();
    $firstSaleId = $first->json('sale_id');

    // Kirim ulang payload yang sama dengan idempotency_key identik.
    $second = $this->postJson('/app/kasir/store', $payload);
    $second->assertSuccessful();
    $second->assertJsonPath('sale_id', $firstSaleId);
    $second->assertJsonPath('idempotent', true);

    // Hanya ada 1 sale yang benar-benar tercatat, stok cuma terpotong sekali.
    expect(Sale::where('store_id', $store->id)->count())->toBe(1);
    $stock = ProductStock::where('product_id', $product->id)->first();
    expect((float) $stock->quantity)->toBe(38.0);
});
