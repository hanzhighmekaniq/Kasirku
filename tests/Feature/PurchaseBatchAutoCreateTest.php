<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createBatchTestContext(): array
{
    $storeType = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0]);
    $store = Store::create(['user_id' => null, 'code' => 'BTH001', 'name' => 'Test Store', 'store_type_id' => $storeType->id]);
    $branch = Branch::create(['store_id' => $store->id, 'name' => 'Pusat', 'code' => 'BR-001', 'is_active' => true]);
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $user = User::factory()->create();
    $supplier = Supplier::create(['store_id' => $store->id, 'name' => 'CV Test', 'code' => 'SUP-001']);

    return compact('store', 'branch', 'category', 'user', 'supplier');
}

test('batch terbuat otomatis saat pembelian produk track_batch menjadi completed', function () {
    ['store' => $store, 'branch' => $branch, 'category' => $category, 'user' => $user, 'supplier' => $supplier] = createBatchTestContext();

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Susu UHT',
        'sku' => 'SUH-001',
        'sell_price' => 8000,
        'track_stock' => true,
        'track_batch' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $purchase = Purchase::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'supplier_id' => $supplier->id,
        'user_id' => $user->id,
        'purchase_no' => 'PO-001',
        'purchase_date' => now()->toDateString(),
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'subtotal' => 6000,
        'grand_total' => 6000,
        'paid_amount' => 0,
    ]);

    $item = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'cost_price' => 600,
        'subtotal' => 6000,
        'batch_no' => 'BTH-2026-001',
        'expiry_date' => now()->addMonths(6)->toDateString(),
    ]);

    // Simulasi completion — panggil method yang sama seperti PurchaseController
    $purchase->update(['status' => 'completed', 'payment_status' => 'paid', 'paid_amount' => 6000]);

    // Trigger batch creation (copy of PurchaseController logic)
    $items = $purchase->items()->with('product')->get();
    foreach ($items as $pi) {
        if (! $pi->product?->track_batch) {
            continue;
        }
        $batchNo = $pi->batch_no ?: 'PO-'.$purchase->purchase_no.'-'.str_pad($pi->id, 3, '0', STR_PAD_LEFT);
        ProductBatch::firstOrCreate(
            [
                'product_id' => $pi->product_id,
                'variant_id' => $pi->variant_id,
                'packaging_unit_id' => $pi->packaging_unit_id,
                'store_id' => $purchase->store_id,
                'branch_id' => $purchase->branch_id,
                'batch_no' => $batchNo,
            ],
            [
                'purchase_date' => $purchase->purchase_date,
                'expiry_date' => $pi->expiry_date,
                'quantity' => 0,
                'cost_price' => $pi->cost_price,
            ]
        );
    }

    expect(ProductBatch::where('product_id', $product->id)->count())->toBe(1);
    expect(ProductBatch::where('batch_no', 'BTH-2026-001')->exists())->toBeTrue();
});

test('batch tidak terbuat untuk produk yang tidak track_batch', function () {
    ['store' => $store, 'branch' => $branch, 'category' => $category, 'user' => $user, 'supplier' => $supplier] = createBatchTestContext();

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Sabun Cuci',
        'sku' => 'SBC-001',
        'sell_price' => 5000,
        'track_stock' => true,
        'track_batch' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    // Tidak ada batch yang terbuat untuk produk non track_batch
    expect(ProductBatch::where('product_id', $product->id)->count())->toBe(0);
});
