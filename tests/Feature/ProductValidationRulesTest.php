<?php

/*
|--------------------------------------------------------------------------
| Aturan validasi produk — SKU per toko & field wajib
|--------------------------------------------------------------------------
|
| Dua hal yang dikunci di sini:
|
| 1. SKU unik PER TOKO. Dulu unik global, sehingga Product::generateSku()
|    yang selalu mulai dari BRG-00001 untuk tiap toko membuat toko kedua
|    langsung bentrok begitu tombol "Auto" dipakai.
|
| 2. Field wajib di backend selaras dengan attribute `required` di form.
|    Kalau HTML menahan sebuah field, backend harus menahannya juga —
|    kalau tidak, request langsung ke endpoint melewati aturan yang
|    dilihat user di layar.
|
*/

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('sku yang sama boleh dipakai di dua toko berbeda', function () {
    $tokoA = createProductTestContext('retail');
    $tokoB = createProductTestContext('fnb');

    $this->actingAs($tokoA['user'])
        ->withSession(productSession($tokoA))
        ->post('/app/products', [
            'name' => 'Produk Toko A',
            'sku' => 'BRG-00001',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 10000,
        ])->assertSessionHasNoErrors();

    // Nomor auto-generate selalu mulai dari BRG-00001 di tiap toko —
    // toko kedua harus tetap bisa memakainya.
    $this->actingAs($tokoB['user'])
        ->withSession(productSession($tokoB))
        ->post('/app/products', [
            'name' => 'Produk Toko B',
            'sku' => 'BRG-00001',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 20000,
        ])->assertSessionHasNoErrors();

    expect(Product::where('sku', 'BRG-00001')->count())->toBe(2);
});

test('sku yang sama di toko yang sama tetap ditolak', function () {
    $ctx = createProductTestContext('retail');

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Produk Pertama',
            'sku' => 'DUP-001',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 10000,
        ])->assertSessionHasNoErrors();

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Produk Kedua',
            'sku' => 'DUP-001',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 15000,
        ])->assertSessionHasErrors('sku');

    expect(Product::where('sku', 'DUP-001')->count())->toBe(1);
});

test('mengedit produk tanpa mengubah sku tidak dianggap duplikat', function () {
    $ctx = createProductTestContext('retail');

    $product = Product::create([
        'store_id' => $ctx['store']->id,
        'name' => 'Produk Lama',
        'sku' => 'EDIT-001',
        'type' => 'finished_goods',
        'unit' => 'pcs',
        'base_unit' => 'pcs',
        'sell_price' => 10000,
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->patch("/app/products/{$product->id}", [
            'name' => 'Produk Baru',
            'sku' => 'EDIT-001',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 12000,
        ])->assertSessionHasNoErrors();

    expect($product->fresh()->name)->toBe('Produk Baru');
});

test('menu tanpa harga jual ditolak', function () {
    $ctx = createProductTestContext('fnb');

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Menu Tanpa Harga',
            'sku' => 'MENU-001',
            'type' => 'finished_goods',
            'unit' => 'porsi',
        ])->assertSessionHasErrors('sell_price');

    expect(Product::where('sku', 'MENU-001')->exists())->toBeFalse();
});

test('bahan baku FnB tanpa harga modal ditolak', function () {
    $ctx = createProductTestContext('fnb');

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Biji Kopi',
            'sku' => 'BIJI-900',
            'type' => 'raw_material',
            'unit' => 'kg',
            'base_unit' => 'gram',
            'base_unit_conversion' => 1000,
        ])->assertSessionHasErrors('cost_price');

    expect(Product::where('sku', 'BIJI-900')->exists())->toBeFalse();
});

test('bahan baku FnB tanpa harga jual tetap boleh disimpan', function () {
    $ctx = createProductTestContext('fnb');

    // Bahan baku memang tidak dijual satuan — harga jual harus tetap opsional.
    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Susu Segar',
            'sku' => 'SUSU-900',
            'type' => 'raw_material',
            'unit' => 'liter',
            'base_unit' => 'ml',
            'base_unit_conversion' => 1000,
            'cost_price' => 18000,
        ])->assertSessionHasNoErrors();

    expect(Product::where('sku', 'SUSU-900')->exists())->toBeTrue();
});

test('kategori milik toko lain ditolak', function () {
    $tokoA = createProductTestContext('retail');
    $tokoB = createProductTestContext('retail');

    $kategoriTokoB = Category::create([
        'store_id' => $tokoB['store']->id,
        'name' => 'Kategori Toko B',
    ]);

    $this->actingAs($tokoA['user'])
        ->withSession(productSession($tokoA))
        ->post('/app/products', [
            'name' => 'Produk Nyasar',
            'sku' => 'NYASAR-001',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 10000,
            'category_id' => $kategoriTokoB->id,
        ])->assertSessionHasErrors('category_id');

    expect(Product::where('sku', 'NYASAR-001')->exists())->toBeFalse();
});

test('supplier milik toko lain ditolak', function () {
    $tokoA = createProductTestContext('retail');
    $tokoB = createProductTestContext('retail');

    $supplierTokoB = Supplier::create([
        'store_id' => $tokoB['store']->id,
        'code' => 'SUP-B',
        'name' => 'Supplier Toko B',
    ]);

    $this->actingAs($tokoA['user'])
        ->withSession(productSession($tokoA))
        ->post('/app/products', [
            'name' => 'Produk Nyasar 2',
            'sku' => 'NYASAR-002',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 10000,
            'supplier_id' => $supplierTokoB->id,
        ])->assertSessionHasErrors('supplier_id');

    expect(Product::where('sku', 'NYASAR-002')->exists())->toBeFalse();
});
