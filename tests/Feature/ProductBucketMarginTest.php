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

test('halaman detail produk membawa margin per bucket yang benar (pcs vs dus per variant)', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $features = ['product'];
    foreach ($features as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'TESTMRG', 'name' => 'Test Store Margin',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main Branch', 'is_active' => true,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Rokok', 'sku' => 'RKK-007', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Merah', 'sku' => 'RKK-007-M', 'price' => 3000, 'is_active' => true]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 28000,
    ]);

    // Bucket pcs: sell 3000, modal 2200 -> margin 800 (26.7%)
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => null, 'store_id' => $store->id,
        'quantity' => 20, 'average_cost' => 2200,
    ]);

    // Bucket dus: sell 28000, modal 25000 -> margin 3000 (10.7%)
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => $unitDus->id, 'store_id' => $store->id,
        'quantity' => 5, 'average_cost' => 25000,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'product.view', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $response = $this->get(route('admin.products.show', $product->id));

    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($unitDus) {
        $margins = collect($page->toArray()['props']['bucketMargins']);

        expect($margins)->toHaveCount(2);

        $pcsBucket = $margins->firstWhere('packaging_unit_id', null);
        $dusBucket = $margins->firstWhere('packaging_unit_id', $unitDus->id);

        expect($pcsBucket)->not->toBeNull();
        expect((float) $pcsBucket['average_cost'])->toBe(2200.0);
        expect((float) $pcsBucket['margin_rp'])->toBe(800.0);
        expect((float) $pcsBucket['margin_percent'])->toBe(26.7);

        expect($dusBucket)->not->toBeNull();
        expect((float) $dusBucket['average_cost'])->toBe(25000.0);
        expect((float) $dusBucket['margin_rp'])->toBe(3000.0);
    });
});
