<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('StockMovement::create menyimpan variant_id dan packaging_unit_id serta relasinya jalan', function () {
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

    $variant = $product->variants()->create(['name' => 'Merah', 'sku' => 'KPS-001-M', 'price' => 50000, 'is_active' => true]);
    $unit = ProductPackagingUnit::create([
        'product_id' => $product->id, 'name' => 'Dus', 'conversion_qty' => 12, 'sell_price' => 550000,
    ]);

    $movement = StockMovement::create([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'packaging_unit_id' => $unit->id,
        'store_id' => $store->id,
        'movement_type' => 'purchase_in',
        'quantity' => 12,
        'unit_cost' => 45000,
        'moved_at' => now(),
    ]);

    $movement->refresh();
    $movement->load(['variant', 'packagingUnit']);

    expect($movement->variant_id)->toBe($variant->id);
    expect($movement->packaging_unit_id)->toBe($unit->id);
    expect($movement->variant->name)->toBe('Merah');
    expect($movement->packagingUnit->name)->toBe('Dus');
});

test('StockMovement bucket base (tanpa variant/unit) tetap bisa dibuat seperti sebelumnya', function () {
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

    $movement = StockMovement::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'movement_type' => 'sale_out',
        'quantity' => 2,
        'unit_cost' => 12000,
        'moved_at' => now(),
    ]);

    expect($movement->variant_id)->toBeNull();
    expect($movement->packaging_unit_id)->toBeNull();
});
