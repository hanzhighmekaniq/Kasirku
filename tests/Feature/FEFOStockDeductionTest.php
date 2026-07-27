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

function makeFEFOContext(): array
{
    $storeType = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0]);
    $store = Store::create(['user_id' => null, 'code' => 'FEF001', 'name' => 'FEFO Store', 'store_type_id' => $storeType->id]);
    $branch = Branch::create(['store_id' => $store->id, 'name' => 'Pusat', 'code' => 'BR-002', 'is_active' => true]);
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Susu UHT',
        'sku' => 'SUH-FEFO',
        'sell_price' => 8000,
        'track_stock' => true,
        'track_batch' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    return compact('store', 'branch', 'product');
}

test('FEFO: batch dengan expiry paling awal dipotong duluan', function () {
    ['store' => $store, 'branch' => $branch, 'product' => $product] = makeFEFOContext();

    // Seed ProductStock
    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 30,
        'average_cost' => 600,
    ]);

    // Batch A: expired 1 bulan lagi (seharusnya dipotong duluan)
    $batchA = ProductBatch::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'batch_no' => 'FEFO-A',
        'purchase_date' => now()->toDateString(),
        'expiry_date' => now()->addMonth()->toDateString(),
        'quantity' => 10,
        'cost_price' => 600,
    ]);

    // Batch B: expired 3 bulan lagi
    $batchB = ProductBatch::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'batch_no' => 'FEFO-B',
        'purchase_date' => now()->toDateString(),
        'expiry_date' => now()->addMonths(3)->toDateString(),
        'quantity' => 20,
        'cost_price' => 600,
    ]);

    $deductions = app(StockService::class)->decrease(new StockMutation(
        productId: $product->id,
        variantId: null,
        packagingUnitId: null,
        storeId: $store->id,
        branchId: $branch->id,
        quantity: 15,
        unitCost: 600,
        movementType: 'sale_out',
        referenceType: 'Sale',
        referenceId: 1,
        referenceNo: 'SAL-001',
    ));

    // Harus dapat 2 deductions: all 10 dari A, 5 dari B
    expect($deductions)->toHaveCount(2);
    expect($deductions[0]['batch_id'])->toBe($batchA->id);
    expect($deductions[0]['quantity'])->toBe(10.0);
    expect($deductions[1]['batch_id'])->toBe($batchB->id);
    expect($deductions[1]['quantity'])->toBe(5.0);

    expect((float) $batchA->fresh()->quantity)->toBe(0.0);
    expect((float) $batchB->fresh()->quantity)->toBe(15.0);
});

test('FEFO: batch tanpa expiry_date diambil terakhir', function () {
    ['store' => $store, 'branch' => $branch, 'product' => $product] = makeFEFOContext();

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'quantity' => 20,
        'average_cost' => 600,
    ]);

    // Batch dengan expiry (harus diambil duluan)
    $withExpiry = ProductBatch::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'batch_no' => 'WITH-EXP',
        'expiry_date' => now()->addMonths(2)->toDateString(),
        'quantity' => 10,
        'cost_price' => 600,
    ]);

    // Batch tanpa expiry (harus diambil terakhir)
    $noExpiry = ProductBatch::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'batch_no' => 'NO-EXP',
        'quantity' => 10,
        'cost_price' => 600,
    ]);

    $deductions = app(StockService::class)->decrease(new StockMutation(
        productId: $product->id,
        variantId: null,
        packagingUnitId: null,
        storeId: $store->id,
        branchId: $branch->id,
        quantity: 10,
        movementType: 'sale_out',
        referenceType: 'Sale',
        referenceId: 1,
        referenceNo: 'SAL-002',
    ));

    // Harus potong dari withExpiry duluan
    expect($deductions[0]['batch_id'])->toBe($withExpiry->id);
    expect((float) $noExpiry->fresh()->quantity)->toBe(10.0); // tidak tersentuh
});
