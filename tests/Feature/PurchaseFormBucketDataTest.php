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

test('halaman purchases create mengirim bucket untuk picker produk-varian-satuan', function () {
    [$store, $branch, $user] = setupPurchaseTestContext(['purchase.create']);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Rokok', 'sku' => 'RKK-007', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create([
        'name' => 'Merah', 'sku' => 'RKK-007-M', 'price' => 25000,
        'cost_price' => 20000, 'is_active' => true,
    ]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 250000,
    ]);

    ProductStock::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'packaging_unit_id' => $unitDus->id, 'store_id' => $store->id,
        'branch_id' => $branch->id, 'quantity' => 3,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $response = $this->get(route('admin.purchases.create'));
    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($product, $variant, $unitDus, $branch) {
        $props = $page->toArray()['props'];
        $buckets = collect($props['buckets']);

        // Cabang aktif dikirim supaya picker bisa menampilkan stok per cabang.
        expect($props['currentBranchId'])->toBe($branch->id);

        // Produk bervariant tidak boleh menawarkan bucket dasar (varian null),
        // karena stoknya hidup di varian.
        expect($buckets->where('product_id', $product->id)->whereNull('variant_id'))
            ->toHaveCount(0);

        $variantBucket = $buckets->first(fn ($b) => $b['variant_id'] === $variant->id
            && $b['packaging_unit_id'] === null);
        expect($variantBucket)->not->toBeNull();
        expect($variantBucket['label'])->toBe('Rokok — Merah');
        // Props dibaca setelah JSON decode, jadi 20000.0 kembali sebagai int.
        expect((float) $variantBucket['cost_price'])->toBe(20000.0);

        $unitBucket = $buckets->first(fn ($b) => $b['packaging_unit_id'] === $unitDus->id);
        expect($unitBucket)->not->toBeNull();
        expect($unitBucket['label'])->toBe('Rokok — Merah — Dus');
        expect($unitBucket['key'])->toBe("{$product->id}-{$variant->id}-{$unitDus->id}");
        expect($unitBucket['conversion_qty'])->toBe(10);
        expect((float) $unitBucket['stock_by_branch'][(string) $branch->id])->toBe(3.0);
    });
});

test('bucket pembelian tetap memuat produk yang stoknya tidak dilacak', function () {
    [$store, $branch, $user] = setupPurchaseTestContext(['purchase.create']);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Jasa']);

    // Form stok menyaring track_stock, tapi pembelian tidak boleh —
    // item non-stok tetap sah dibeli.
    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Jasa Kirim', 'sku' => 'JSA-001', 'sell_price' => 50000,
        'cost_price' => 30000, 'track_stock' => false,
        'is_active' => true, 'is_sellable' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $this->get(route('admin.purchases.create'))
        ->assertSuccessful()
        ->assertInertia(function ($page) use ($product) {
            $buckets = collect($page->toArray()['props']['buckets']);
            $bucket = $buckets->firstWhere('product_id', $product->id);

            expect($bucket)->not->toBeNull();
            expect($bucket['label'])->toBe('Jasa Kirim');
            expect($bucket['variant_id'])->toBeNull();
            expect($bucket['packaging_unit_id'])->toBeNull();
        });
});
