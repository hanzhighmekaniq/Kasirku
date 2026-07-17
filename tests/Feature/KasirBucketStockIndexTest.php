<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
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

test('kasir index mengirim stok terpisah per variant dan per packaging unit sesuai data ProductStock', function () {
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
        'user_id' => null, 'code' => 'TESTKSR', 'name' => 'Test Store Kasir',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main Branch', 'is_active' => true,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Rokok', 'sku' => 'RKK-003', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variantMerah = $product->variants()->create(['name' => 'Merah', 'sku' => 'RKK-003-M', 'price' => 25000, 'is_active' => true]);
    $variantBiru = $product->variants()->create(['name' => 'Biru', 'sku' => 'RKK-003-B', 'price' => 25000, 'is_active' => true]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variantMerah->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 250000,
    ]);

    // Bucket variant Merah, pcs (packaging_unit_id null)
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variantMerah->id,
        'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branch->id,
        'quantity' => 15,
    ]);

    // Bucket variant Merah, unit Dus
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variantMerah->id,
        'packaging_unit_id' => $unitDus->id, 'store_id' => $store->id, 'branch_id' => $branch->id,
        'quantity' => 4,
    ]);

    // Bucket variant Biru, pcs
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variantBiru->id,
        'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branch->id,
        'quantity' => 9,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id, 'current_branch_id' => $branch->id]);

    $response = $this->get(route('admin.kasir.index'));

    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($product, $variantMerah, $variantBiru, $unitDus) {
        $products = collect($page->toArray()['props']['products']);
        $p = $products->firstWhere('id', $product->id);

        expect($p)->not->toBeNull();

        $variants = collect($p['variants']);
        $merah = $variants->firstWhere('id', $variantMerah->id);
        $biru = $variants->firstWhere('id', $variantBiru->id);

        expect((float) $merah['stock'])->toBe(15.0);
        expect((float) $biru['stock'])->toBe(9.0);

        $dusUnit = collect($merah['packaging_units'])->firstWhere('id', $unitDus->id);
        expect((float) $dusUnit['stock'])->toBe(4.0);
    });
});
