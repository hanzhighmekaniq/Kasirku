<?php

/*
|--------------------------------------------------------------------------
| Aturan resep produk — satuan terkunci & komponen paket
|--------------------------------------------------------------------------
|
| 1. Satuan resep SELALU diturunkan dari base_unit bahan, tidak pernah dari
|    form. Kalau qty ditulis dalam satuan berbeda (mis. "sdm" padahal bahan
|    dipakai per gram), costPerBaseUnit() menghitung modal yang salah dan
|    pemotongan stok ikut meleset — tanpa gejala apa pun.
|
| 2. Paket (combo) boleh diisi produk jadi, tapi hanya produk sederhana:
|    tidak punya resep sendiri (cegah pemotongan bertingkat) dan tidak punya
|    varian/kemasan (pemotongan stok resep selalu menyasar bucket dasar).
|
*/

use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductRecipe;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Bahan baku dengan satuan beli ≠ satuan pakai.
 */
function makeRecipeRawMaterial(int $storeId, string $sku, string $baseUnit = 'gram'): Product
{
    return Product::create([
        'store_id' => $storeId,
        'name' => 'Bahan '.$sku,
        'sku' => $sku,
        'type' => 'raw_material',
        'unit' => 'kg',
        'base_unit' => $baseUnit,
        'base_unit_conversion' => 1000,
        'cost_price' => 20000,
        'sell_price' => 0,
        'track_stock' => true,
        'is_active' => true,
    ]);
}

/**
 * Produk jadi sederhana — layak jadi isi paket.
 */
function makeSimpleFinishedGoods(int $storeId, string $sku): Product
{
    return Product::create([
        'store_id' => $storeId,
        'name' => 'Menu '.$sku,
        'sku' => $sku,
        'type' => 'finished_goods',
        'unit' => 'porsi',
        'base_unit' => 'pcs',
        'cost_price' => 12000,
        'sell_price' => 20000,
        'track_stock' => true,
        'is_active' => true,
    ]);
}

function makeComboProduct(int $storeId, string $sku): Product
{
    return Product::create([
        'store_id' => $storeId,
        'name' => 'Paket '.$sku,
        'sku' => $sku,
        'type' => 'combo',
        'unit' => 'paket',
        'base_unit' => 'pcs',
        'sell_price' => 35000,
        'track_stock' => false,
        'is_active' => true,
    ]);
}

/* ── Task A: satuan resep terkunci ─────────────────────── */

test('satuan resep mengikuti base_unit bahan walau form mengirim satuan lain', function () {
    $ctx = createProductTestContext('fnb');
    $menu = makeSimpleFinishedGoods($ctx['store']->id, 'MENU-001');
    $bahan = makeRecipeRawMaterial($ctx['store']->id, 'BAHAN-001', 'gram');

    // Kirim "sdm" — satuan yang tidak sepadan dengan base_unit bahan.
    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post("/app/products/{$menu->id}/recipes", [
            'raw_material_id' => $bahan->id,
            'quantity' => 150,
            'unit' => 'sdm',
        ])->assertSessionHasNoErrors();

    $recipe = ProductRecipe::where('product_id', $menu->id)->first();

    expect($recipe->unit)->toBe('gram')
        ->and((float) $recipe->quantity)->toBe(150.0);
});

test('resep tanpa mengirim satuan tetap tersimpan dengan base_unit bahan', function () {
    $ctx = createProductTestContext('fnb');
    $menu = makeSimpleFinishedGoods($ctx['store']->id, 'MENU-002');
    $bahan = makeRecipeRawMaterial($ctx['store']->id, 'BAHAN-002', 'ml');

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post("/app/products/{$menu->id}/recipes", [
            'raw_material_id' => $bahan->id,
            'quantity' => 50,
        ])->assertSessionHasNoErrors();

    expect(ProductRecipe::where('product_id', $menu->id)->first()->unit)->toBe('ml');
});

/* ── Task B: komponen paket ────────────────────────────── */

test('paket bisa diisi produk jadi sederhana', function () {
    $ctx = createProductTestContext('fnb');
    $paket = makeComboProduct($ctx['store']->id, 'PKT-001');
    $menu = makeSimpleFinishedGoods($ctx['store']->id, 'MENU-003');

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post("/app/products/{$paket->id}/recipes", [
            'raw_material_id' => $menu->id,
            'quantity' => 1,
        ])->assertSessionHasNoErrors();

    $recipe = ProductRecipe::where('product_id', $paket->id)->first();

    expect($recipe)->not->toBeNull()
        ->and($recipe->raw_material_id)->toBe($menu->id);
});

test('paket menolak komponen yang punya resep sendiri', function () {
    $ctx = createProductTestContext('fnb');
    $paket = makeComboProduct($ctx['store']->id, 'PKT-002');
    $menu = makeSimpleFinishedGoods($ctx['store']->id, 'MENU-004');
    $bahan = makeRecipeRawMaterial($ctx['store']->id, 'BAHAN-003');

    // Menu ini punya resep sendiri — kalau dijadikan isi paket, pemotongan
    // stok harus bertingkat dan itu belum didukung.
    ProductRecipe::create([
        'product_id' => $menu->id,
        'raw_material_id' => $bahan->id,
        'quantity' => 100,
        'unit' => 'gram',
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post("/app/products/{$paket->id}/recipes", [
            'raw_material_id' => $menu->id,
            'quantity' => 1,
        ])->assertSessionHasErrors('raw_material_id');

    expect(ProductRecipe::where('product_id', $paket->id)->exists())->toBeFalse();
});

test('paket menolak komponen yang punya varian', function () {
    $ctx = createProductTestContext('fnb');
    $paket = makeComboProduct($ctx['store']->id, 'PKT-003');

    $menu = makeSimpleFinishedGoods($ctx['store']->id, 'MENU-005');
    $menu->update(['is_variant' => true]);

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post("/app/products/{$paket->id}/recipes", [
            'raw_material_id' => $menu->id,
            'quantity' => 1,
        ])->assertSessionHasErrors('raw_material_id');

    expect(ProductRecipe::where('product_id', $paket->id)->exists())->toBeFalse();
});

test('paket menolak komponen yang punya kemasan', function () {
    $ctx = createProductTestContext('fnb');
    $paket = makeComboProduct($ctx['store']->id, 'PKT-004');
    $menu = makeSimpleFinishedGoods($ctx['store']->id, 'MENU-006');

    ProductPackagingUnit::create([
        'product_id' => $menu->id,
        'name' => 'Dus',
        'conversion_qty' => 10,
        'sell_price' => 180000,
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post("/app/products/{$paket->id}/recipes", [
            'raw_material_id' => $menu->id,
            'quantity' => 1,
        ])->assertSessionHasErrors('raw_material_id');

    expect(ProductRecipe::where('product_id', $paket->id)->exists())->toBeFalse();
});

test('menu biasa tetap hanya boleh diisi bahan baku', function () {
    $ctx = createProductTestContext('fnb');
    $menu = makeSimpleFinishedGoods($ctx['store']->id, 'MENU-007');
    $bahan = makeRecipeRawMaterial($ctx['store']->id, 'BAHAN-004');

    // Guard combo tidak boleh ikut menahan alur menu biasa.
    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post("/app/products/{$menu->id}/recipes", [
            'raw_material_id' => $bahan->id,
            'quantity' => 200,
        ])->assertSessionHasNoErrors();

    expect(ProductRecipe::where('product_id', $menu->id)->exists())->toBeTrue();
});
