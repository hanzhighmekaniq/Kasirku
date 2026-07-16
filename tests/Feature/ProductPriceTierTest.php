<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPriceTier;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('product can have multiple price tiers sorted by min_qty', function () {
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
        'name' => 'Test Product', 'code' => 'PRD001', 'sku' => 'SKU001',
        'sell_price' => 10000, 'cost_price' => 5000, 'track_stock' => false,
        'is_active' => true, 'is_sellable' => true,
    ]);

    ProductPriceTier::create(['product_id' => $product->id, 'min_qty' => 144, 'price' => 7000]);
    ProductPriceTier::create(['product_id' => $product->id, 'min_qty' => 12, 'price' => 8500]);
    ProductPriceTier::create(['product_id' => $product->id, 'min_qty' => 1, 'price' => 10000]);

    expect($product->priceTiers)->toHaveCount(3);
    expect($product->priceTiers->first()->min_qty)->toBe(1);
    expect($product->priceTiers->last()->min_qty)->toBe(144);
});

test('getTierPrice returns correct tier for quantity', function () {
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
        'name' => 'Test Product', 'code' => 'PRD001', 'sku' => 'SKU001',
        'sell_price' => 10000, 'cost_price' => 5000, 'track_stock' => false,
        'is_active' => true, 'is_sellable' => true,
    ]);

    ProductPriceTier::create(['product_id' => $product->id, 'min_qty' => 1, 'price' => 10000]);
    ProductPriceTier::create(['product_id' => $product->id, 'min_qty' => 12, 'price' => 8500]);
    ProductPriceTier::create(['product_id' => $product->id, 'min_qty' => 144, 'price' => 7000]);

    // Reload product with tiers
    $product->load('priceTiers');

    // qty 5 → tier 1 (min_qty=1)
    expect($product->getTierPrice(5))->toBe(10000.0);

    // qty 15 → tier 12 (min_qty=12)
    expect($product->getTierPrice(15))->toBe(8500.0);

    // qty 200 → tier 144 (min_qty=144)
    expect($product->getTierPrice(200))->toBe(7000.0);
});

test('getTierPrice returns null when no tiers exist', function () {
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
        'name' => 'Test Product', 'code' => 'PRD001', 'sku' => 'SKU001',
        'sell_price' => 10000, 'cost_price' => 5000, 'track_stock' => false,
        'is_active' => true, 'is_sellable' => true,
    ]);

    expect($product->getTierPrice(10))->toBeNull();
});
