<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('PurchaseItem::create menyimpan variant_id, packaging_unit_id, dan unit_name dengan benar', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-A', 'name' => 'Supplier A']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Kaos Polos', 'sku' => 'KPS-001', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Merah', 'sku' => 'KPS-001-M', 'price' => 50000, 'is_active' => true]);
    $unit = ProductPackagingUnit::create([
        'product_id' => $product->id, 'name' => 'Dus', 'conversion_qty' => 12, 'sell_price' => 550000,
    ]);

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'supplier_id' => $supplier->id,
        'purchase_no' => 'PO-TEST-001',
        'purchase_date' => now(),
        'subtotal' => 0,
        'grand_total' => 0,
        'status' => 'draft',
        'payment_status' => 'unpaid',
    ]);

    $item = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'packaging_unit_id' => $unit->id,
        'unit_name' => 'Dus',
        'quantity' => 5,
        'cost_price' => 480000,
        'subtotal' => 2400000,
    ]);

    $item->refresh();
    $item->load(['variant', 'packagingUnit']);

    expect($item->variant_id)->toBe($variant->id);
    expect($item->packaging_unit_id)->toBe($unit->id);
    expect($item->unit_name)->toBe('Dus');
    expect($item->variant->name)->toBe('Merah');
    expect($item->packagingUnit->name)->toBe('Dus');
});

test('PurchaseItem tanpa variant/unit (produk simple) tetap tersimpan seperti sebelumnya', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST002', 'name' => 'Test Store 2',
        'store_type_id' => $storeType->id,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-B', 'name' => 'Supplier B']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Minyak Goreng', 'sku' => 'MG-001', 'sell_price' => 15000,
        'is_variant' => false, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'supplier_id' => $supplier->id,
        'purchase_no' => 'PO-TEST-002',
        'purchase_date' => now(),
        'subtotal' => 0,
        'grand_total' => 0,
        'status' => 'draft',
        'payment_status' => 'unpaid',
    ]);

    $item = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'cost_price' => 12000,
        'subtotal' => 120000,
    ]);

    expect($item->variant_id)->toBeNull();
    expect($item->packaging_unit_id)->toBeNull();
    expect($item->unit_name)->toBeNull();
});
