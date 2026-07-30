<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductStock;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Siapkan konteks retur pembelian: store, cabang, user, produk bervarian dengan
 * satuan Dus, plus satu purchase completed yang stoknya sudah masuk.
 *
 * @return array{store: mixed, branch: mixed, user: mixed, product: mixed, variant: mixed, unit: mixed, purchase: mixed}
 */
function setupPurchaseReturnContext(): array
{
    [$store, $branch, $user] = setupPurchaseTestContext([
        'purchase.create', 'purchase.view', 'purchase.edit', 'purchase.delete', 'purchase.return',
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-RET', 'name' => 'Supplier Retur']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Kopi Sachet', 'sku' => 'KPI-001', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create([
        'name' => 'Original', 'sku' => 'KPI-001-O', 'price' => 2000, 'is_active' => true,
    ]);

    $unit = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 20000,
    ]);

    test()->withoutMiddleware(ValidateCsrfToken::class);
    test()->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'current_branch_id' => $branch->id,
        'branch_id' => $branch->id,
    ]);

    // Purchase dibuat lalu dijadikan completed supaya stok masuk lebih dulu.
    test()->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 480000,
        'items' => [
            [
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'packaging_unit_id' => $unit->id,
                'unit_name' => 'Dus',
                'quantity' => 10,
                'cost_price' => 48000,
            ],
        ],
    ])->assertRedirect();

    $purchase = Purchase::where('store_id', $store->id)->latest()->first();

    test()->patch(route('admin.purchases.updateStatus', $purchase->id), [
        'status' => 'completed',
    ])->assertRedirect();

    return [
        'store' => $store,
        'branch' => $branch,
        'user' => $user,
        'product' => $product,
        'variant' => $variant,
        'unit' => $unit,
        'purchase' => $purchase->fresh(),
    ];
}

function bucketStockQty(array $ctx): float
{
    return (float) (ProductStock::where('product_id', $ctx['product']->id)
        ->where('variant_id', $ctx['variant']->id)
        ->where('packaging_unit_id', $ctx['unit']->id)
        ->value('quantity') ?? 0);
}

test('membuat retur pembelian mengurangi stok pada bucket variant dan satuan yang tepat', function () {
    $ctx = setupPurchaseReturnContext();
    $purchase = $ctx['purchase'];
    $purchaseItem = $purchase->items()->first();

    $stockBefore = bucketStockQty($ctx);

    $response = $this->post(route('admin.purchase-returns.store'), [
        'purchase_id' => $purchase->id,
        'return_date' => now()->toDateString(),
        'notes' => 'Sebagian rusak',
        'items' => [
            [
                'product_id' => $ctx['product']->id,
                'purchase_item_id' => $purchaseItem->id,
                'quantity' => 3,
                'cost_price' => 48000,
                'reason' => 'Kemasan rusak',
            ],
        ],
    ]);

    $response->assertRedirect(route('admin.purchase-returns.index'));

    $return = PurchaseReturn::latest()->first();
    expect($return)->not->toBeNull();
    expect($return->status)->toBe('completed');
    expect((float) $return->total_amount)->toBe(144000.0);

    // Bucket retur harus mewarisi variant & satuan dari purchase item asal.
    $returnItem = $return->items()->first();
    expect($returnItem->variant_id)->toBe($ctx['variant']->id);
    expect($returnItem->packaging_unit_id)->toBe($ctx['unit']->id);

    // Stok hidup per bucket (produk + variant + satuan), jadi retur 3 Dus
    // mengurangi 3 dari bucket Dus. Konversi packaging unit TIDAK dipakai di
    // sini; toBaseUnit() hanya berlaku untuk produk raw_material.
    expect(bucketStockQty($ctx))->toBe($stockBefore - 3.0);
});

test('membatalkan retur pembelian memulihkan stok dan mencatat movement tanpa error', function () {
    $ctx = setupPurchaseReturnContext();
    $purchase = $ctx['purchase'];
    $purchaseItem = $purchase->items()->first();

    $stockBeforeReturn = bucketStockQty($ctx);

    $this->post(route('admin.purchase-returns.store'), [
        'purchase_id' => $purchase->id,
        'return_date' => now()->toDateString(),
        'items' => [
            [
                'product_id' => $ctx['product']->id,
                'purchase_item_id' => $purchaseItem->id,
                'quantity' => 4,
                'cost_price' => 48000,
            ],
        ],
    ])->assertRedirect();

    $return = PurchaseReturn::latest()->first();
    expect(bucketStockQty($ctx))->toBe($stockBeforeReturn - 4.0);

    $movementsBefore = StockMovement::count();

    // Jalur inilah yang sebelumnya fatal error karena StockMovement dipakai
    // tanpa di-import di controller.
    $cancel = $this->patch(route('admin.purchase-returns.updateStatus', $return->id), [
        'status' => 'cancelled',
    ]);

    $cancel->assertRedirect(route('admin.purchase-returns.index'));
    $cancel->assertSessionHasNoErrors();

    expect($return->fresh()->status)->toBe('cancelled');

    // Stok kembali ke kondisi sebelum retur.
    expect(bucketStockQty($ctx))->toBe($stockBeforeReturn);

    // Movement pembalikan tercatat sekali saja, bukan dobel.
    expect(StockMovement::count())->toBe($movementsBefore + 1);
});

test('retur melebihi sisa yang bisa diretur ditolak', function () {
    $ctx = setupPurchaseReturnContext();
    $purchase = $ctx['purchase'];
    $purchaseItem = $purchase->items()->first();

    $response = $this->post(route('admin.purchase-returns.store'), [
        'purchase_id' => $purchase->id,
        'return_date' => now()->toDateString(),
        'items' => [
            [
                'product_id' => $ctx['product']->id,
                'purchase_item_id' => $purchaseItem->id,
                'quantity' => 999,
                'cost_price' => 48000,
            ],
        ],
    ]);

    $response->assertStatus(422);
    expect(PurchaseReturn::count())->toBe(0);
});

test('getPurchaseItems mengirim nama variant dan satuan untuk form retur', function () {
    $ctx = setupPurchaseReturnContext();

    $response = $this->get(route('admin.purchase-returns.getPurchaseItems', $ctx['purchase']->id));

    $response->assertOk();
    $item = $response->json('purchase.items.0');

    expect($item['variant_name'])->toBe('Original');
    expect($item['packaging_unit_name'])->toBe('Dus');
    expect($item['returnable_qty'])->toBe(10);
    expect($item['returned_qty'])->toBe(0);
});
