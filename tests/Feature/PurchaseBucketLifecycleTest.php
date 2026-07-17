<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductStock;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('siklus draft -> completed -> cancelled menjaga integritas stok dan average_cost per bucket', function () {
    [$store, $branch, $user] = setupPurchaseTestContext([
        'purchase.create', 'purchase.view', 'purchase.edit', 'purchase.delete',
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-1', 'name' => 'Supplier 1']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Rokok', 'sku' => 'RKK-002', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Biru', 'sku' => 'RKK-002-B', 'price' => 25000, 'is_active' => true]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 250000,
    ]);

    $this->withoutMiddleware(ValidateCsrfToken::class);
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    // ── Step 1: Buat purchase draft (belum bayar) untuk bucket dus ──
    $createResponse = $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 0,
        'items' => [
            [
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'packaging_unit_id' => $unitDus->id,
                'unit_name' => 'Dus',
                'quantity' => 5,
                'cost_price' => 48000,
            ],
        ],
    ]);
    $createResponse->assertRedirect();

    $purchase = Purchase::where('store_id', $store->id)->latest()->first();
    expect($purchase->status)->toBe('draft');

    // Stok belum bertambah karena masih draft
    $stockAfterDraft = ProductStock::where('product_id', $product->id)
        ->where('variant_id', $variant->id)
        ->where('packaging_unit_id', $unitDus->id)
        ->first();
    expect($stockAfterDraft)->toBeNull();

    // ── Step 2: Ubah status ke completed via updateStatus ──
    $completeResponse = $this->patch(route('admin.purchases.updateStatus', $purchase->id), [
        'status' => 'completed',
    ]);
    $completeResponse->assertRedirect();

    $stock = ProductStock::where('product_id', $product->id)
        ->where('variant_id', $variant->id)
        ->where('packaging_unit_id', $unitDus->id)
        ->first();

    expect($stock)->not->toBeNull();
    expect((float) $stock->quantity)->toBe(5.0);
    expect((float) $stock->average_cost)->toBe(48000.0);

    // ── Step 3: Batalkan purchase completed -> stok & average_cost balik ke semula ──
    $cancelResponse = $this->patch(route('admin.purchases.updateStatus', $purchase->id), [
        'status' => 'cancelled',
    ]);
    $cancelResponse->assertRedirect();

    $stock->refresh();
    expect((float) $stock->quantity)->toBe(0.0);
    expect((float) $stock->average_cost)->toBe(0.0);

    $purchase->refresh();
    expect($purchase->status)->toBe('cancelled');
});

test('menghapus purchase completed membalikkan stok bucket dan average_cost-nya', function () {
    [$store, $branch, $user] = setupPurchaseTestContext([
        'purchase.create', 'purchase.view', 'purchase.edit', 'purchase.delete',
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-2', 'name' => 'Supplier 2']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Minyak Goreng', 'sku' => 'MG-002', 'sell_price' => 15000,
        'is_variant' => false, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $this->withoutMiddleware(ValidateCsrfToken::class);
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    // Beli 10 pcs @ Rp10.000 (langsung lunas -> completed)
    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 100000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 10, 'cost_price' => 10000],
        ],
    ])->assertRedirect();

    $purchase = Purchase::where('store_id', $store->id)->latest()->first();
    expect($purchase->status)->toBe('completed');

    $stock = ProductStock::where('product_id', $product->id)
        ->whereNull('variant_id')->whereNull('packaging_unit_id')->first();
    expect((float) $stock->quantity)->toBe(10.0);
    expect((float) $stock->average_cost)->toBe(10000.0);

    // Hapus purchase -> stok & average_cost harus balik ke 0
    $this->delete(route('admin.purchases.destroy', $purchase->id))->assertRedirect();

    $stock->refresh();
    expect((float) $stock->quantity)->toBe(0.0);
    expect((float) $stock->average_cost)->toBe(0.0);
});
