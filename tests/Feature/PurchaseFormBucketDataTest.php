<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductStock;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('halaman purchases create mengirim produk lengkap dengan variant, unit, dan stok per bucket', function () {
    [$store, $branch, $user] = setupPurchaseTestContext(['purchase.create']);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Rokok', 'sku' => 'RKK-006', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Merah', 'sku' => 'RKK-006-M', 'price' => 25000, 'is_active' => true]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 250000,
    ]);

    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => null, 'store_id' => $store->id, 'quantity' => 12,
    ]);
    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => $unitDus->id, 'store_id' => $store->id, 'quantity' => 3,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $response = $this->get(route('admin.purchases.create'));

    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($product, $variant, $unitDus) {
        $products = collect($page->toArray()['props']['products']);
        $p = $products->firstWhere('id', $product->id);

        expect($p)->not->toBeNull();

        $variants = collect($p['variants']);
        $v = $variants->firstWhere('id', $variant->id);
        expect($v)->not->toBeNull();
        expect((float) $v['stock'])->toBe(12.0);

        $units = collect($v['packaging_units']);
        $u = $units->firstWhere('id', $unitDus->id);
        expect($u)->not->toBeNull();
        expect((float) $u['stock'])->toBe(3.0);
    });
});
