<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/** Setup store + branch + user + payment method siap dipakai test kasir */
function setupKasirTestContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $features = ['basic_pos', 'product', 'category', 'payment_method', 'customer'];
    foreach ($features as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'TESTKSR'.uniqid(), 'name' => 'Test Store Kasir',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main Branch', 'is_active' => true,
    ]);

    $paymentMethod = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'cash', 'name' => 'Tunai', 'type' => 'cash', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    return [$store, $branch, $user, $paymentMethod];
}

test('jual per dus tidak mengurangi stok bucket pcs pada variant yang sama', function () {
    [$store, $branch, $user, $paymentMethod] = setupKasirTestContext();

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Rokok', 'sku' => 'RKK-004', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Merah', 'sku' => 'RKK-004-M', 'price' => 25000, 'is_active' => true]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 250000,
    ]);

    // Bucket pcs (packaging_unit_id null)
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => null, 'store_id' => $store->id, 'quantity' => 20,
    ]);

    // Bucket dus
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => $unitDus->id, 'store_id' => $store->id, 'quantity' => 5,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'items' => [
            [
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'packaging_unit_id' => $unitDus->id,
                'unit_name' => 'Dus',
                'unit_conversion_qty' => 10,
                'quantity' => 2,
                'price' => 250000,
            ],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 500000],
        ],
    ]);

    $response->assertSuccessful();

    $pcsStock = ProductStock::where('product_id', $product->id)
        ->where('variant_id', $variant->id)->whereNull('packaging_unit_id')->first();
    $dusStock = ProductStock::where('product_id', $product->id)
        ->where('variant_id', $variant->id)->where('packaging_unit_id', $unitDus->id)->first();

    // Bucket dus berkurang 2 (qty 2 dus, bukan dikali conversion_qty karena
    // stok disimpan dalam satuan dus itu sendiri, bukan pcs)
    expect((float) $dusStock->quantity)->toBe(3.0);
    // Bucket pcs sama sekali tidak tersentuh
    expect((float) $pcsStock->quantity)->toBe(20.0);
});

test('jual variant A tidak mengurangi stok bucket variant B', function () {
    [$store, $branch, $user, $paymentMethod] = setupKasirTestContext();

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Kaos', 'sku' => 'KS-001', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variantA = $product->variants()->create(['name' => 'Merah', 'sku' => 'KS-001-M', 'price' => 50000, 'is_active' => true]);
    $variantB = $product->variants()->create(['name' => 'Biru', 'sku' => 'KS-001-B', 'price' => 50000, 'is_active' => true]);

    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variantA->id,
        'packaging_unit_id' => null, 'store_id' => $store->id, 'quantity' => 10,
    ]);
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variantB->id,
        'packaging_unit_id' => null, 'store_id' => $store->id, 'quantity' => 8,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'items' => [
            [
                'product_id' => $product->id,
                'variant_id' => $variantA->id,
                'quantity' => 3,
                'price' => 50000,
            ],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 150000],
        ],
    ]);

    $response->assertSuccessful();

    $stockA = ProductStock::where('product_id', $product->id)->where('variant_id', $variantA->id)->first();
    $stockB = ProductStock::where('product_id', $product->id)->where('variant_id', $variantB->id)->first();

    expect((float) $stockA->quantity)->toBe(7.0);
    expect((float) $stockB->quantity)->toBe(8.0);
});

test('checkout gagal jika stok bucket dus tidak cukup, walau bucket pcs variant sama masih banyak', function () {
    [$store, $branch, $user, $paymentMethod] = setupKasirTestContext();

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Rokok', 'sku' => 'RKK-005', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Merah', 'sku' => 'RKK-005-M', 'price' => 25000, 'is_active' => true]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 250000,
    ]);

    // Bucket pcs banyak, tapi bucket dus cuma 1
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => null, 'store_id' => $store->id, 'quantity' => 100,
    ]);
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => $unitDus->id, 'store_id' => $store->id, 'quantity' => 1,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'items' => [
            [
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'packaging_unit_id' => $unitDus->id,
                'unit_name' => 'Dus',
                'unit_conversion_qty' => 10,
                'quantity' => 5,
                'price' => 250000,
            ],
        ],
        'payments' => [
            ['method_id' => $paymentMethod->id, 'amount' => 1250000],
        ],
    ]);

    $response->assertStatus(422);

    $dusStock = ProductStock::where('product_id', $product->id)
        ->where('variant_id', $variant->id)->where('packaging_unit_id', $unitDus->id)->first();
    expect((float) $dusStock->quantity)->toBe(1.0);
});
