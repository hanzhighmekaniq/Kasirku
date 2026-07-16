<?php

use App\Models\Category;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/** Helper — buat store retail minimal */
function makeRetailStore(): Store
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);
    $f = Feature::create(['code' => 'product', 'label' => 'Produk', 'is_active' => true, 'sort_order' => 0]);
    $storeType->features()->attach($f->id);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    return Store::create([
        'user_id' => null, 'code' => 'TST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);
}

// ── Task 17: Skenario 1 ──────────────────────────────────────────────────────
test('produk is_variant=true dapat disimpan dengan variant + grosir per variant', function () {
    $store = makeRetailStore();
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Kaos Polos',
        'sku' => 'KPS-001',
        'sell_price' => 0,
        'is_variant' => true,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $varS = $product->variants()->create(['name' => 'S', 'sku' => 'KPS-001-S', 'price' => 50000, 'is_active' => true]);
    $varM = $product->variants()->create(['name' => 'M', 'sku' => 'KPS-001-M', 'price' => 55000, 'is_active' => true]);

    // Tier per variant S
    $product->priceTiers()->create(['variant_id' => $varS->id, 'min_qty' => 12, 'price' => 45000]);
    $product->priceTiers()->create(['variant_id' => $varS->id, 'min_qty' => 24, 'price' => 40000]);

    // Tier per variant M
    $product->priceTiers()->create(['variant_id' => $varM->id, 'min_qty' => 12, 'price' => 48000]);

    $product->refresh();
    $product->load('variants.priceTiers');

    expect($product->is_variant)->toBeTrue();
    expect($product->variants)->toHaveCount(2);
    expect($product->variants->firstWhere('name', 'S')->priceTiers)->toHaveCount(2);
    expect($product->variants->firstWhere('name', 'M')->priceTiers)->toHaveCount(1);
});

// ── Task 17: Skenario 2 ──────────────────────────────────────────────────────
test('produk is_variant=false tetap bisa simpan grosir product-level', function () {
    $store = makeRetailStore();
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Minyak Goreng',
        'sku' => 'MG-001',
        'sell_price' => 15000,
        'is_variant' => false,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $product->priceTiers()->create(['min_qty' => 6, 'price' => 13000]);
    $product->priceTiers()->create(['min_qty' => 12, 'price' => 11500]);

    $product->refresh();
    $product->load('priceTiers');

    expect($product->is_variant)->toBeFalse();
    expect($product->priceTiers)->toHaveCount(2);
    // Tier product-level tidak punya variant_id
    expect($product->priceTiers->every(fn ($t) => $t->variant_id === null))->toBeTrue();
});

// ── Task 17: Skenario 3 ──────────────────────────────────────────────────────
test('Product::getTierPrice(qty, variantId) mengembalikan tier variant', function () {
    $store = makeRetailStore();
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Tas', 'sku' => 'TAS-001', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => false, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Biru', 'sku' => 'TAS-001-B', 'price' => 100000, 'is_active' => true]);
    $product->priceTiers()->create(['variant_id' => $variant->id, 'min_qty' => 5, 'price' => 90000]);
    $product->priceTiers()->create(['variant_id' => $variant->id, 'min_qty' => 10, 'price' => 80000]);

    $product->load('priceTiers');

    expect($product->getTierPrice(5, $variant->id))->toBe(90000.0);
    expect($product->getTierPrice(10, $variant->id))->toBe(80000.0);
    expect($product->getTierPrice(15, $variant->id))->toBe(80000.0); // masih pakai 10+ tier
    expect($product->getTierPrice(4, $variant->id))->toBeNull();     // di bawah threshold
});

// ── Task 17: Skenario 4 ──────────────────────────────────────────────────────
test('Product::getTierPrice dengan variantId fallback ke product tier jika variant tidak punya tier', function () {
    $store = makeRetailStore();
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Baju', 'sku' => 'BJ-001', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => false, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => 'Merah', 'sku' => 'BJ-001-M', 'price' => 75000, 'is_active' => true]);

    // Tier product-level (bukan per variant)
    $product->priceTiers()->create(['variant_id' => null, 'min_qty' => 5, 'price' => 65000]);

    $product->load('priceTiers');

    // Variant ini tidak punya tier sendiri → fallback ke product tier
    expect($product->getTierPrice(5, $variant->id))->toBe(65000.0);
});

// ── Task 17: Skenario 5 ──────────────────────────────────────────────────────
test('Product::getTierPrice tanpa variantId mengembalikan tier product-level', function () {
    $store = makeRetailStore();
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Gula', 'sku' => 'GUL-001', 'sell_price' => 12000,
        'is_variant' => false, 'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $product->priceTiers()->create(['min_qty' => 10, 'price' => 10000]);

    $product->load('priceTiers');

    expect($product->getTierPrice(10))->toBe(10000.0);
    expect($product->getTierPrice(9))->toBeNull();
});

// ── Task 17: Skenario 6 ──────────────────────────────────────────────────────
test('ProductVariant::getTierPrice mengembalikan tier dari relasi variant', function () {
    $store = makeRetailStore();
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Sepatu', 'sku' => 'SPT-001', 'sell_price' => 0,
        'is_variant' => true, 'track_stock' => false, 'is_active' => true, 'is_sellable' => true,
    ]);

    $variant = $product->variants()->create(['name' => '42', 'sku' => 'SPT-001-42', 'price' => 200000, 'is_active' => true]);
    $product->priceTiers()->create(['variant_id' => $variant->id, 'min_qty' => 3, 'price' => 180000]);

    $variant->load('priceTiers');

    expect($variant->getTierPrice(3))->toBe(180000.0);
    expect($variant->getTierPrice(2))->toBeNull();
});
