<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\StoreType;
use App\Services\Stock\StockMutation;
use App\Services\Stock\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeBatchBlockContext(): array
{
    $storeType = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0]);
    $store = Store::create(['user_id' => null, 'code' => 'BLK001', 'name' => 'Block Store', 'store_type_id' => $storeType->id]);
    $branch = Branch::create(['store_id' => $store->id, 'name' => 'Pusat', 'code' => 'BR-003', 'is_active' => true]);
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Yogurt',
        'sku' => 'YGT-001',
        'sell_price' => 12000,
        'track_stock' => true,
        'track_batch' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    return compact('store', 'branch', 'product');
}

test('produk track_batch tanpa batch tetap bisa dijual (stok dipotong dari bucket)', function () {
    ['store' => $store, 'branch' => $branch, 'product' => $product] = makeBatchBlockContext();

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 5,
        'average_cost' => 8000,
    ]);

    // Tidak ada ProductBatch yang terdaftar

    $deductions = app(StockService::class)->decrease(new StockMutation(
        productId: $product->id,
        variantId: null,
        packagingUnitId: null,
        storeId: $store->id,
        branchId: $branch->id,
        quantity: 3,
        unitCost: 8000,
        movementType: 'sale_out',
        referenceType: 'Sale',
        referenceId: 1,
        referenceNo: 'SAL-001',
    ));

    // Tidak ada exception — penjualan berhasil
    // Deductions kosong karena tidak ada batch
    expect($deductions)->toBeEmpty();

    // Stok tetap berkurang dari bucket
    $stock = ProductStock::where('product_id', $product->id)->first();
    expect((float) $stock->quantity)->toBe(2.0);
});

test('batch habis tidak memblokir penjualan — sisa qty tetap dipotong dari bucket', function () {
    ['store' => $store, 'branch' => $branch, 'product' => $product] = makeBatchBlockContext();

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
        'average_cost' => 8000,
    ]);

    // Hanya ada 3 qty di batch
    ProductBatch::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'batch_no' => 'LAST-BTH',
        'expiry_date' => now()->addMonth()->toDateString(),
        'quantity' => 3,
        'cost_price' => 8000,
    ]);

    // Jual 5 — batch hanya cukup 3, tapi tidak diblokir
    $deductions = app(StockService::class)->decrease(new StockMutation(
        productId: $product->id,
        variantId: null,
        packagingUnitId: null,
        storeId: $store->id,
        branchId: $branch->id,
        quantity: 5,
        unitCost: 8000,
        movementType: 'sale_out',
        referenceType: 'Sale',
        referenceId: 1,
        referenceNo: 'SAL-002',
    ));

    // 1 deduction dari batch
    expect($deductions)->toHaveCount(1);
    expect($deductions[0]['quantity'])->toBe(3.0);

    // Stok bucket tetap berkurang 5
    $stock = ProductStock::where('product_id', $product->id)->first();
    expect((float) $stock->quantity)->toBe(5.0);
});
