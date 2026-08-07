<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('halaman label barcode mengirim nama toko dan bucket produk-varian-satuan', function () {
    [$store, $branch, $user] = setupPurchaseTestContext(['product.view']);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Indomie Goreng', 'sku' => 'IDM-001', 'barcode' => '8991002101012',
        'sell_price' => 3000, 'is_variant' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create([
        'name' => 'Original', 'sku' => 'IDM-001-O', 'barcode' => '8991002101029',
        'price' => 3000, 'is_active' => true,
    ]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 40, 'sell_price' => 110000, 'barcode' => '8991002101036',
    ]);

    $this->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'current_branch_id' => $branch->id,
        'branch_id' => $branch->id,
    ]);

    $response = $this->get(route('admin.barcode-labels.index'));

    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($store, $product, $variant, $unitDus) {
        $page->component('Admin/BarcodeLabels/Index');

        $props = $page->toArray()['props'];

        expect($props['storeName'])->toBe($store->name);

        $buckets = collect($props['buckets']);

        // Produk bervariant tidak boleh menawarkan bucket dasar (varian
        // null), karena label harus dicetak per-varian.
        expect($buckets->where('product_id', $product->id)->whereNull('variant_id'))
            ->toHaveCount(0);

        $variantBucket = $buckets->first(fn ($b) => $b['variant_id'] === $variant->id
            && $b['packaging_unit_id'] === null);
        expect($variantBucket)->not->toBeNull();
        expect($variantBucket['product_sku'])->toBe('IDM-001-O');
        expect($variantBucket['barcode'])->toBe('8991002101029');
        expect((float) $variantBucket['sell_price'])->toBe(3000.0);

        $unitBucket = $buckets->first(fn ($b) => $b['packaging_unit_id'] === $unitDus->id);
        expect($unitBucket)->not->toBeNull();
        expect($unitBucket['barcode'])->toBe('8991002101036');
        expect((float) $unitBucket['sell_price'])->toBe(110000.0);
        expect($unitBucket['conversion_qty'])->toBe(40);
    });
});

test('produk tanpa variant tetap muncul sebagai bucket tunggal', function () {
    [$store, $branch, $user] = setupPurchaseTestContext(['product.view']);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Air Mineral 600ml', 'sku' => 'AIR-001', 'barcode' => '8991002999999',
        'sell_price' => 4000, 'is_active' => true, 'is_sellable' => true,
    ]);

    $this->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'current_branch_id' => $branch->id,
        'branch_id' => $branch->id,
    ]);

    $this->get(route('admin.barcode-labels.index'))
        ->assertSuccessful()
        ->assertInertia(function ($page) use ($product) {
            $buckets = collect($page->toArray()['props']['buckets']);
            $bucket = $buckets->firstWhere('product_id', $product->id);

            expect($bucket)->not->toBeNull();
            expect($bucket['variant_id'])->toBeNull();
            expect($bucket['packaging_unit_id'])->toBeNull();
            expect($bucket['product_sku'])->toBe('AIR-001');
            expect($bucket['barcode'])->toBe('8991002999999');
        });
});

test('produk nonaktif tidak muncul di bucket label barcode', function () {
    [$store, $branch, $user] = setupPurchaseTestContext(['product.view']);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $inactive = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Produk Nonaktif', 'sku' => 'NA-001', 'sell_price' => 1000,
        'is_active' => false, 'is_sellable' => false,
    ]);

    $this->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'current_branch_id' => $branch->id,
        'branch_id' => $branch->id,
    ]);

    $this->get(route('admin.barcode-labels.index'))
        ->assertSuccessful()
        ->assertInertia(function ($page) use ($inactive) {
            $buckets = collect($page->toArray()['props']['buckets']);

            expect($buckets->firstWhere('product_id', $inactive->id))->toBeNull();
        });
});
