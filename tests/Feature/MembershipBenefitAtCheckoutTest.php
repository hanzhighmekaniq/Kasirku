<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\Feature;
use App\Models\Membership;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
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
 * Store retail lengkap dengan fitur membership aktif, supaya benefit
 * benar-benar dieksekusi lewat endpoint kasir (bukan hanya unit service).
 *
 * @return array{0: Store, 1: Branch, 2: PaymentMethod, 3: User}
 */
function setupBenefitCheckoutStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $codes = ['basic_pos', 'product', 'payment_method', 'customer', 'promo', 'membership'];
    $features = [];
    foreach ($codes as $code) {
        $features[$code] = Feature::create([
            'code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0,
        ]);
    }
    $storeType->features()->attach(collect($features)->pluck('id'));

    $plan = Plan::create([
        'code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0,
    ]);
    $plan->features()->attach(collect($features)->pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'BNFCO1', 'name' => 'Benefit Checkout Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true,
    ]);

    $paymentMethod = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'cash', 'name' => 'Tunai',
        'type' => 'cash', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    foreach (['sale.create', 'sale.view'] as $permName) {
        $role->givePermissionTo(Permission::create(['name' => $permName, 'guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $paymentMethod, $user];
}

function benefitCheckoutProduct(Store $store, Branch $branch, float $price, float $stock = 100): Product
{
    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Barang '.fake()->unique()->word(),
        'sku' => 'SKU'.fake()->unique()->numberBetween(1000, 9999),
        'sell_price' => $price,
        'cost_price' => $price / 2,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => $stock,
        'reserved_quantity' => 0,
    ]);

    return $product;
}

function benefitCheckoutMember(Store $store, array $benefits, float $legacyDiscount = 0): Customer
{
    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'MBR'.fake()->unique()->numberBetween(100, 999),
        'name' => 'Paket '.fake()->unique()->word(),
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'discount_percent' => $legacyDiscount,
        'point_multiplier' => 1,
        'benefits' => $benefits,
        'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id,
        'code' => 'CST'.fake()->unique()->numberBetween(100, 999),
        'name' => 'Member',
        'tier' => 'bronze',
        'is_active' => true,
    ]);

    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->startOfDay(),
        'expired_date' => now()->addMonth(),
        'status' => 'active',
        'source' => 'manual',
    ]);

    return $customer;
}

test('gratis ongkir menolkan shipping_amount pada sale yang tersimpan', function () {
    [$store, $branch, $paymentMethod, $user] = setupBenefitCheckoutStore();
    $product = benefitCheckoutProduct($store, $branch, 50000);
    $customer = benefitCheckoutMember($store, [
        ['type' => 'free_shipping', 'label' => 'Gratis ongkir'],
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'delivery',
        'customer_id' => $customer->id,
        'delivery_address' => 'Jl. Contoh No. 1',
        'shipping_amount' => 25000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 50000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 50000],
        ],
    ]);

    $response->assertSuccessful();

    $sale = Sale::where('store_id', $store->id)->firstOrFail();

    expect((float) $sale->shipping_amount)->toBe(0.0);
    expect((float) $sale->grand_total)->toBe(50000.0);
});

test('plafon gratis ongkir hanya mensubsidi sebagian di checkout', function () {
    [$store, $branch, $paymentMethod, $user] = setupBenefitCheckoutStore();
    $product = benefitCheckoutProduct($store, $branch, 50000);
    $customer = benefitCheckoutMember($store, [
        ['type' => 'free_shipping', 'label' => 'Subsidi ongkir 10rb', 'max_amount' => 10000],
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->postJson('/app/kasir/store', [
        'order_type' => 'delivery',
        'customer_id' => $customer->id,
        'delivery_address' => 'Jl. Contoh No. 2',
        'shipping_amount' => 25000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 50000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 65000],
        ],
    ])->assertSuccessful();

    $sale = Sale::where('store_id', $store->id)->firstOrFail();

    expect((float) $sale->shipping_amount)->toBe(15000.0);
    expect((float) $sale->grand_total)->toBe(65000.0);
});

test('ongkir tetap penuh untuk pelanggan tanpa benefit gratis ongkir', function () {
    [$store, $branch, $paymentMethod, $user] = setupBenefitCheckoutStore();
    $product = benefitCheckoutProduct($store, $branch, 50000);
    $customer = benefitCheckoutMember($store, [
        ['type' => 'custom_text', 'label' => 'Gratis ongkir'], // teks bebas: tidak dieksekusi
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->postJson('/app/kasir/store', [
        'order_type' => 'delivery',
        'customer_id' => $customer->id,
        'delivery_address' => 'Jl. Contoh No. 3',
        'shipping_amount' => 25000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 50000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 75000],
        ],
    ])->assertSuccessful();

    $sale = Sale::where('store_id', $store->id)->firstOrFail();

    expect((float) $sale->shipping_amount)->toBe(25000.0);
    expect((float) $sale->grand_total)->toBe(75000.0);
});

test('diskon benefit dinamis masuk ke discount_amount pada checkout', function () {
    [$store, $branch, $paymentMethod, $user] = setupBenefitCheckoutStore();
    $product = benefitCheckoutProduct($store, $branch, 100000);
    $customer = benefitCheckoutMember($store, [
        ['type' => 'discount_percent', 'label' => 'Diskon 10%', 'value' => 10],
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->postJson('/app/kasir/store', [
        'order_type' => 'takeaway',
        'customer_id' => $customer->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 100000],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 90000],
        ],
    ])->assertSuccessful();

    $sale = Sale::where('store_id', $store->id)->firstOrFail();

    expect((float) $sale->discount_amount)->toBe(10000.0);
    expect((float) $sale->grand_total)->toBe(90000.0);
});

test('split bill ikut menerapkan diskon dan gratis ongkir membership', function () {
    [$store, $branch, $paymentMethod, $user] = setupBenefitCheckoutStore();
    $product = benefitCheckoutProduct($store, $branch, 100000);
    $customer = benefitCheckoutMember($store, [
        ['type' => 'discount_percent', 'label' => 'Diskon 10%', 'value' => 10],
        ['type' => 'free_shipping', 'label' => 'Gratis ongkir'],
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/split/start', [
        'order_type' => 'delivery',
        'customer_id' => $customer->id,
        'delivery_address' => 'Jl. Split No. 1',
        'shipping_amount' => 20000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 100000],
        ],
        'split_mode' => 'equal',
        'payers' => [
            ['name' => 'Orang A'],
            ['name' => 'Orang B'],
        ],
    ]);

    $response->assertSuccessful();

    $sale = Sale::where('store_id', $store->id)->firstOrFail();

    // 100.000 − 10.000 diskon member + 0 ongkir (disubsidi penuh)
    expect((float) $sale->discount_amount)->toBe(10000.0);
    expect((float) $sale->shipping_amount)->toBe(0.0);
    expect((float) $sale->grand_total)->toBe(90000.0);
});
