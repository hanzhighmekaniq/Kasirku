<?php

/*
|--------------------------------------------------------------------------
| Produk — base_unit (Satuan Pakai)
|--------------------------------------------------------------------------
|
| Menutup bug di Planing/PLANNING_create_fnb.md: kolom products.base_unit
| NOT NULL DEFAULT 'pcs', tapi controller mengirim NULL eksplisit sehingga
| MySQL menolak INSERT — default kolom hanya berlaku kalau kolomnya tidak
| disebut sama sekali. Plus aturan wajib base_unit untuk bahan baku FnB.
|
*/

use App\Models\Branch;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Toko dengan store type tertentu + user yang boleh kelola produk.
 *
 * Sengaja idempoten (firstOrCreate + syncWithoutDetaching) supaya bisa
 * dipanggil lebih dari sekali dalam satu test — dibutuhkan skenario
 * multi-toko, mis. memastikan SKU yang sama boleh dipakai di dua toko.
 *
 * @return array{user: User, store: Store, branch: Branch}
 */
function createProductTestContext(string $storeTypeCode = 'fnb'): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => $storeTypeCode],
        ['label' => ucfirst($storeTypeCode), 'is_active' => true, 'sort_order' => 0],
    );

    foreach (['product', 'category', 'purchase', 'stock', 'recipe', 'modifier'] as $code) {
        $f = Feature::firstOrCreate(
            ['code' => $code],
            ['label' => $code, 'is_active' => true, 'sort_order' => 0],
        );
        $storeType->features()->syncWithoutDetaching([$f->id]);
    }

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching(Feature::pluck('id')->all());

    $user = User::factory()->create();

    $store = Store::create([
        'user_id' => $user->id,
        'code' => 'TESTPRD'.uniqid(),
        'name' => 'Test Store Produk',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);
    $user->stores()->attach($store->id);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach (['product.create', 'product.edit', 'product.view'] as $permName) {
        // Permission bersifat global (bukan per-team), jadi pada skenario
        // multi-toko yang kedua harus memakai ulang yang sudah ada.
        // `guard_id` hanya dipakai saat membuat — bukan kolom yang bisa
        // dicari, jadi pencocokan cukup lewat nama.
        $role->givePermissionTo(
            Permission::firstOrCreate(
                ['name' => $permName],
                ['guard_id' => 1],
            ),
        );
    }
    $user->assignRole($role);

    return compact('user', 'store', 'branch');
}

function productSession(array $ctx): array
{
    return [
        'current_store_id' => $ctx['store']->id,
        'current_branch_id' => $ctx['branch']->id,
        'branch_id' => $ctx['branch']->id,
    ];
}

test('menu FnB tersimpan tanpa mengisi satuan pakai dan base_unit jatuh ke default pcs', function () {
    $ctx = createProductTestContext('fnb');

    // Persis kondisi yang bikin "Caffe Latte" gagal: form Menu tidak pernah
    // merender field Satuan Pakai, jadi base_unit dikirim kosong.
    $response = $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Caffe Latte',
            'sku' => 'LATTE-001',
            'type' => 'finished_goods',
            'unit' => 'cup',
            'base_unit' => '',
            'sell_price' => 25000,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('admin.products.index'));

    $product = Product::where('sku', 'LATTE-001')->first();

    expect($product)->not->toBeNull()
        ->and($product->base_unit)->toBe('pcs')
        ->and($product->type)->toBe('finished_goods');
});

test('paket combo FnB juga tersimpan tanpa satuan pakai', function () {
    $ctx = createProductTestContext('fnb');

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Paket Hemat',
            'sku' => 'PKT-001',
            'type' => 'combo',
            'unit' => 'paket',
            'base_unit' => '',
            'sell_price' => 40000,
        ])
        ->assertSessionHasNoErrors();

    expect(Product::where('sku', 'PKT-001')->first()->base_unit)->toBe('pcs');
});

test('bahan baku FnB ditolak kalau satuan pakai kosong', function () {
    $ctx = createProductTestContext('fnb');

    $response = $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Biji Kopi',
            'sku' => 'BIJI-001',
            'type' => 'raw_material',
            'unit' => 'kg',
            'base_unit' => '',
            'cost_price' => 120000,
        ]);

    $response->assertSessionHasErrors('base_unit');

    expect(Product::where('sku', 'BIJI-001')->exists())->toBeFalse();
});

test('bahan baku FnB tersimpan lengkap dengan satuan pakai dan konversi', function () {
    $ctx = createProductTestContext('fnb');

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Biji Kopi',
            'sku' => 'BIJI-002',
            'type' => 'raw_material',
            'unit' => 'kg',
            'base_unit' => 'gram',
            'base_unit_conversion' => 1000,
            'cost_price' => 120000,
        ])
        ->assertSessionHasNoErrors();

    $product = Product::where('sku', 'BIJI-002')->first();

    expect($product->base_unit)->toBe('gram')
        ->and((float) $product->base_unit_conversion)->toBe(1000.0);
});

test('bahan baku di toko retail tidak dipaksa mengisi satuan pakai', function () {
    $ctx = createProductTestContext('retail');

    // Di retail field Satuan Pakai memang tidak dirender, jadi aturan wajib
    // FnB tidak boleh ikut berlaku — kalau ikut, produk retail jadi mustahil dibuat.
    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->post('/app/products', [
            'name' => 'Gula Pasir',
            'sku' => 'GULA-001',
            'type' => 'raw_material',
            'unit' => 'kg',
            'base_unit' => '',
            'cost_price' => 15000,
        ])
        ->assertSessionHasNoErrors();

    expect(Product::where('sku', 'GULA-001')->first()->base_unit)->toBe('pcs');
});

test('mengedit menu FnB tanpa satuan pakai tidak error dan tidak menulis null', function () {
    $ctx = createProductTestContext('fnb');

    $product = Product::create([
        'store_id' => $ctx['store']->id,
        'name' => 'Teh Manis',
        'sku' => 'TEH-001',
        'type' => 'finished_goods',
        'unit' => 'gelas',
        'base_unit' => 'pcs',
        'sell_price' => 8000,
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->patch("/app/products/{$product->id}", [
            'name' => 'Teh Manis Dingin',
            'sku' => 'TEH-001',
            'type' => 'finished_goods',
            'unit' => 'gelas',
            'base_unit' => '',
            'sell_price' => 9000,
        ])
        ->assertSessionHasNoErrors();

    $product->refresh();

    expect($product->name)->toBe('Teh Manis Dingin')
        ->and($product->base_unit)->toBe('pcs');
});

test('mengedit bahan baku FnB menjadi tanpa satuan pakai ditolak', function () {
    $ctx = createProductTestContext('fnb');

    $product = Product::create([
        'store_id' => $ctx['store']->id,
        'name' => 'Susu Full Cream',
        'sku' => 'SUSU-001',
        'type' => 'raw_material',
        'unit' => 'liter',
        'base_unit' => 'ml',
        'base_unit_conversion' => 1000,
        'cost_price' => 20000,
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(productSession($ctx))
        ->patch("/app/products/{$product->id}", [
            'name' => 'Susu Full Cream',
            'sku' => 'SUSU-001',
            'type' => 'raw_material',
            'unit' => 'liter',
            'base_unit' => '',
            'cost_price' => 20000,
        ])
        ->assertSessionHasErrors('base_unit');

    // Data lama harus utuh — penolakan validasi tidak boleh menimpa apa pun.
    expect($product->fresh()->base_unit)->toBe('ml');
});
