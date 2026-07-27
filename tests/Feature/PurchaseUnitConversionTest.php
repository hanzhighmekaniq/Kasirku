<?php

/*
|--------------------------------------------------------------------------
| Konversi satuan beli → satuan pakai (bahan baku FnB)
|--------------------------------------------------------------------------
|
| Bahan baku FnB punya dua satuan di SATU baris produk: `unit` (satuan beli,
| mis. kg) dan `base_unit` (satuan pakai di resep, mis. gram). Stoknya juga
| satu bucket — tidak seperti retail yang memisahkan tiap satuan ke bucket
| packaging_unit sendiri.
|
| Akibatnya stok masuk lewat pembelian (kg) dan keluar lewat resep (gram)
| harus disamakan satuannya, kalau tidak saldo langsung minus:
| beli 5 kg → stok 5, jual butuh 150 gram → 5 - 150 = -145.
|
| Test ini mengunci dua hal sekaligus:
|   1. Bahan baku berkonversi disimpan dalam satuan pakai, modal ikut dibagi.
|   2. Produk retail TIDAK berubah perilakunya sama sekali — ini yang paling
|      penting, karena PurchaseController dipakai bersama kedua mode.
|
*/

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductStock;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Bahan baku FnB dengan satuan beli ≠ satuan pakai.
 */
function makeRawMaterial(
    int $storeId,
    string $sku,
    string $unit = 'kg',
    string $baseUnit = 'gram',
    ?float $conversion = 1000,
    float $costPrice = 20000,
): Product {
    return Product::create([
        'store_id' => $storeId,
        'name' => 'Bahan '.$sku,
        'sku' => $sku,
        'type' => 'raw_material',
        'unit' => $unit,
        'base_unit' => $baseUnit,
        'base_unit_conversion' => $conversion,
        'cost_price' => $costPrice,
        'sell_price' => 0,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => false,
    ]);
}

function purchaseActingContext(array $ctx): void
{
    test()->withoutMiddleware(ValidateCsrfToken::class);
    test()->actingAs($ctx['user']);
    session([
        'current_store_id' => $ctx['store']->id,
        'current_branch_id' => $ctx['branch']->id,
        'branch_id' => $ctx['branch']->id,
    ]);
}

test('beli 5 kg bahan berkonversi 1000 menyimpan stok 5000 gram dengan modal per gram', function () {
    [$store, $branch, $user] = setupPurchaseTestContext();
    purchaseActingContext(compact('store', 'branch', 'user'));

    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-K1', 'name' => 'Supplier Kopi']);
    // 1 kg = 1000 gram, harga Rp 20.000 / kg
    $product = makeRawMaterial($store->id, 'BIJI-001');

    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 100000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5, 'cost_price' => 20000],
        ],
    ])->assertRedirect();

    $stock = ProductStock::where('product_id', $product->id)
        ->whereNull('variant_id')
        ->whereNull('packaging_unit_id')
        ->first();

    // 5 kg × 1000 = 5.000 gram; Rp 100.000 ÷ 5.000 = Rp 20 / gram
    expect((float) $stock->quantity)->toBe(5000.0)
        ->and((float) $stock->average_cost)->toBe(20.0);

    // Baris pembelian tetap mencatat satuan nota supplier (5 kg), bukan hasil
    // konversi — laporan pembelian harus cocok dengan fisik nota.
    $item = Purchase::first()->items()->first();
    expect((float) $item->quantity)->toBe(5.0)
        ->and((float) $item->cost_price)->toBe(20000.0);
});

test('riwayat stok pembelian dicatat dalam satuan pakai supaya cocok dengan saldo', function () {
    [$store, $branch, $user] = setupPurchaseTestContext();
    purchaseActingContext(compact('store', 'branch', 'user'));

    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-K2', 'name' => 'Supplier']);
    $product = makeRawMaterial($store->id, 'BIJI-002');

    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 100000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5, 'cost_price' => 20000],
        ],
    ])->assertRedirect();

    $movement = StockMovement::where('product_id', $product->id)
        ->where('movement_type', 'purchase_in')
        ->first();

    expect((float) $movement->quantity)->toBe(5000.0)
        ->and((float) $movement->unit_cost)->toBe(20.0);
});

test('bahan baku tanpa konversi tersimpan apa adanya', function () {
    [$store, $branch, $user] = setupPurchaseTestContext();
    purchaseActingContext(compact('store', 'branch', 'user'));

    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-K3', 'name' => 'Supplier']);
    // Pola data seeder yang ada sekarang: beli gram, pakai gram, konversi NULL.
    $product = makeRawMaterial($store->id, 'GULA-001', 'gram', 'gram', null, 15);

    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 15000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1000, 'cost_price' => 15],
        ],
    ])->assertRedirect();

    $stock = ProductStock::where('product_id', $product->id)->first();

    expect((float) $stock->quantity)->toBe(1000.0)
        ->and((float) $stock->average_cost)->toBe(15.0);
});

test('membatalkan pembelian bahan berkonversi mengembalikan stok dan modal ke nol', function () {
    [$store, $branch, $user] = setupPurchaseTestContext([
        'purchase.create', 'purchase.view', 'purchase.edit', 'purchase.delete',
    ]);
    purchaseActingContext(compact('store', 'branch', 'user'));

    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-K4', 'name' => 'Supplier']);
    $product = makeRawMaterial($store->id, 'BIJI-003');

    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 100000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5, 'cost_price' => 20000],
        ],
    ])->assertRedirect();

    $purchase = Purchase::first();
    expect($purchase->status)->toBe('completed');

    // Pembatalan harus memakai satuan yang sama dengan saat menambah —
    // kalau tidak, sisa stok jadi 4.995 gram (5.000 dikurangi 5).
    $this->patch(route('admin.purchases.updateStatus', $purchase->id), [
        'status' => 'cancelled',
    ]);

    $stock = ProductStock::where('product_id', $product->id)->first();

    expect((float) $stock->quantity)->toBe(0.0)
        ->and((float) $stock->average_cost)->toBe(0.0);
});

test('dua pembelian bahan berkonversi menghitung average_cost tertimbang per satuan pakai', function () {
    [$store, $branch, $user] = setupPurchaseTestContext();
    purchaseActingContext(compact('store', 'branch', 'user'));

    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-K5', 'name' => 'Supplier']);
    $product = makeRawMaterial($store->id, 'BIJI-004');

    // 2 kg @ Rp 20.000 → 2.000 gram @ Rp 20
    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 40000,
        'items' => [['product_id' => $product->id, 'quantity' => 2, 'cost_price' => 20000]],
    ])->assertRedirect();

    // 2 kg @ Rp 30.000 → 2.000 gram @ Rp 30
    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 60000,
        'items' => [['product_id' => $product->id, 'quantity' => 2, 'cost_price' => 30000]],
    ])->assertRedirect();

    $stock = ProductStock::where('product_id', $product->id)->first();

    // (2000×20 + 2000×30) ÷ 4000 = Rp 25 / gram
    expect((float) $stock->quantity)->toBe(4000.0)
        ->and((float) $stock->average_cost)->toBe(25.0);
});

/*
|--------------------------------------------------------------------------
| Regresi retail — jaminan bahwa perubahan di atas tidak menyentuh retail
|--------------------------------------------------------------------------
*/

test('produk retail finished_goods tidak terpengaruh konversi walau kolomnya terisi', function () {
    [$store, $branch, $user] = setupPurchaseTestContext();
    purchaseActingContext(compact('store', 'branch', 'user'));

    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-R1', 'name' => 'Supplier Retail']);

    // Sengaja diisi konversi 1000 untuk membuktikan gerbang type-nya bekerja:
    // hanya raw_material yang boleh dikonversi, finished_goods tidak pernah.
    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Beras Rojolele 5kg',
        'sku' => 'BRS-001',
        'type' => 'finished_goods',
        'unit' => 'pcs',
        'base_unit' => 'gram',
        'base_unit_conversion' => 1000,
        'cost_price' => 60000,
        'sell_price' => 68000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 600000,
        'items' => [['product_id' => $product->id, 'quantity' => 10, 'cost_price' => 60000]],
    ])->assertRedirect();

    $stock = ProductStock::where('product_id', $product->id)->first();

    expect((float) $stock->quantity)->toBe(10.0)
        ->and((float) $stock->average_cost)->toBe(60000.0);
});

test('bucket packaging unit retail tetap tersimpan dalam satuan bucket sendiri', function () {
    [$store, $branch, $user] = setupPurchaseTestContext();
    purchaseActingContext(compact('store', 'branch', 'user'));

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);
    $supplier = Supplier::create(['store_id' => $store->id, 'code' => 'SUP-R2', 'name' => 'Supplier']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Indomie Goreng', 'sku' => 'IDM-001',
        'type' => 'finished_goods', 'unit' => 'pcs',
        'cost_price' => 2800, 'sell_price' => 3500,
        'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    $dus = ProductPackagingUnit::create([
        'product_id' => $product->id,
        'name' => 'Dus', 'conversion_qty' => 40, 'sell_price' => 147200,
    ]);

    // Beli 5 dus — bucket dus harus berisi 5 (satuan dus), BUKAN 200 pcs.
    // Inilah pembeda retail: konversi kemasan tidak pernah diterapkan ke stok.
    $this->post(route('admin.purchases.store'), [
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->toDateString(),
        'paid_amount' => 560000,
        'items' => [[
            'product_id' => $product->id,
            'packaging_unit_id' => $dus->id,
            'unit_name' => 'Dus',
            'quantity' => 5,
            'cost_price' => 112000,
        ]],
    ])->assertRedirect();

    $stock = ProductStock::where('product_id', $product->id)
        ->where('packaging_unit_id', $dus->id)
        ->first();

    expect((float) $stock->quantity)->toBe(5.0)
        ->and((float) $stock->average_cost)->toBe(112000.0);
});
