<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductStock;
use App\Models\Supplier;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('beli dus dan pcs untuk variant yang sama membentuk 2 bucket stok terpisah dengan average_cost masing-masing', function () {
    [$store, $branch, $user] = setupPurchaseTestContext();

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-1', 'name' => 'Supplier 1']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Rokok', 'sku' => 'RKK-001', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Merah', 'sku' => 'RKK-001-M', 'price' => 25000, 'is_active' => true]);

    $unitDus = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Dus', 'conversion_qty' => 10, 'sell_price' => 250000,
    ]);

    $this->withoutMiddleware(ValidateCsrfToken::class);
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    // Beli 10 dus @ Rp48.000/dus (langsung lunas -> completed)
    $response1 = $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 480000,
        'items' => [
            [
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'packaging_unit_id' => $unitDus->id,
                'unit_name' => 'Dus',
                'quantity' => 10,
                'cost_price' => 48000,
            ],
        ],
    ]);

    $response1->assertRedirect();

    // Beli 5 pcs @ Rp2.200/pcs (langsung lunas -> completed) - bucket pcs (packaging_unit_id null)
    $response2 = $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 11000,
        'items' => [
            [
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'quantity' => 5,
                'cost_price' => 2200,
            ],
        ],
    ]);

    $response2->assertRedirect();

    $stocks = ProductStock::where('product_id', $product->id)
        ->where('variant_id', $variant->id)
        ->get();

    expect($stocks)->toHaveCount(2);

    $dusStock = $stocks->firstWhere('packaging_unit_id', $unitDus->id);
    $pcsStock = $stocks->firstWhere('packaging_unit_id', null);

    expect($dusStock)->not->toBeNull();
    expect($pcsStock)->not->toBeNull();

    expect((float) $dusStock->quantity)->toBe(10.0);
    expect((float) $dusStock->average_cost)->toBe(48000.0);

    expect((float) $pcsStock->quantity)->toBe(5.0);
    expect((float) $pcsStock->average_cost)->toBe(2200.0);
});

test('pembelian 2x untuk bucket yang sama menghitung average_cost tertimbang dengan benar', function () {
    [$store, $branch, $user] = setupPurchaseTestContext();

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-2', 'name' => 'Supplier 2']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Minyak Goreng', 'sku' => 'MG-001', 'sell_price' => 15000,
        'is_variant' => false, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $this->withoutMiddleware(ValidateCsrfToken::class);
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    // Beli 10 pcs @ Rp10.000
    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 100000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 10, 'cost_price' => 10000],
        ],
    ])->assertRedirect();

    // Beli lagi 10 pcs @ Rp12.000 -> rata2 tertimbang harus (10*10000 + 10*12000) / 20 = 11000
    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 120000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 10, 'cost_price' => 12000],
        ],
    ])->assertRedirect();

    $stock = ProductStock::where('product_id', $product->id)
        ->whereNull('variant_id')
        ->whereNull('packaging_unit_id')
        ->first();

    expect((float) $stock->quantity)->toBe(20.0);
    expect((float) $stock->average_cost)->toBe(11000.0);
});
