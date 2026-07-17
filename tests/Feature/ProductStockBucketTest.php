<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('bucket stok berbeda (variant + unit) untuk produk yang sama tidak collision', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Kaos Polos', 'sku' => 'KPS-001', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variantMerah = $product->variants()->create(['name' => 'Merah', 'sku' => 'KPS-001-M', 'price' => 50000, 'is_active' => true]);
    $variantBiru = $product->variants()->create(['name' => 'Biru', 'sku' => 'KPS-001-B', 'price' => 50000, 'is_active' => true]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'name' => 'Dus', 'conversion_qty' => 12, 'sell_price' => 550000,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main Branch', 'is_active' => true,
    ]);

    // Bucket 1: variant Merah, unit pcs (packaging_unit_id null)
    $stockMerahPcs = ProductStock::create([
        'product_id' => $product->id,
        'variant_id' => $variantMerah->id,
        'packaging_unit_id' => null,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    // Bucket 2: variant Merah, unit Dus — beda bucket walau variant sama
    $stockMerahDus = ProductStock::create([
        'product_id' => $product->id,
        'variant_id' => $variantMerah->id,
        'packaging_unit_id' => $unitDus->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 3,
    ]);

    // Bucket 3: variant Biru, unit pcs — beda variant
    $stockBiruPcs = ProductStock::create([
        'product_id' => $product->id,
        'variant_id' => $variantBiru->id,
        'packaging_unit_id' => null,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 7,
    ]);

    expect(ProductStock::where('product_id', $product->id)->count())->toBe(3);
    expect((float) $stockMerahPcs->quantity)->toBe(10.0);
    expect((float) $stockMerahDus->quantity)->toBe(3.0);
    expect((float) $stockBiruPcs->quantity)->toBe(7.0);

    // Bucket sama (variant Merah + unit Dus + branch sama) tidak boleh bisa dibuat dua kali
    expect(fn () => ProductStock::create([
        'product_id' => $product->id,
        'variant_id' => $variantMerah->id,
        'packaging_unit_id' => $unitDus->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 1,
    ]))->toThrow(QueryException::class);
});

test('bucket base lama (variant_id=null, packaging_unit_id=null) tetap terbaca sebagai stok produk simple', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST002', 'name' => 'Test Store 2',
        'store_type_id' => $storeType->id,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Minyak Goreng', 'sku' => 'MG-001', 'sell_price' => 15000,
        'is_variant' => false, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    // Simulasikan data lama: dibuat tanpa variant_id/packaging_unit_id sama sekali
    $stock = ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'quantity' => 25,
    ]);

    $stock->refresh();

    expect($stock->variant_id)->toBeNull();
    expect($stock->packaging_unit_id)->toBeNull();
    expect((float) $stock->quantity)->toBe(25.0);
    expect((float) $stock->average_cost)->toBe(0.0);

    $product->load('stocks');
    expect($product->currentStock())->toBe(25.0);
});

test('ProductStock punya relasi variant() dan packagingUnit()', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST003', 'name' => 'Test Store 3',
        'store_type_id' => $storeType->id,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Kaos Polos', 'sku' => 'KPS-002', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'S', 'sku' => 'KPS-002-S', 'price' => 50000, 'is_active' => true]);
    $unit = ProductPackagingUnit::create([
        'product_id' => $product->id, 'name' => 'Lusin', 'conversion_qty' => 12, 'sell_price' => 550000,
    ]);

    $stock = ProductStock::create([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'packaging_unit_id' => $unit->id,
        'store_id' => $store->id,
        'quantity' => 5,
        'average_cost' => 40000,
    ]);

    $stock->load(['variant', 'packagingUnit']);

    expect($stock->variant->id)->toBe($variant->id);
    expect($stock->packagingUnit->id)->toBe($unit->id);
    expect((float) $stock->average_cost)->toBe(40000.0);
});
