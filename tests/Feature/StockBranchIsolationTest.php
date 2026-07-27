<?php

/*
|--------------------------------------------------------------------------
| Isolasi stok per cabang
|--------------------------------------------------------------------------
|
| Mengunci perilaku yang diperbaiki di Tahap 0.2: setiap mutasi stok
| (jual, retur, pembelian, pembatalan) harus mengenai bucket cabang yang
| tepat. Bug lama: branch_id tidak disertakan, sehingga transaksi di
| cabang 2 bisa mengurangi stok cabang 1 — atau membuat baris hantu
| ber-branch_id NULL yang tidak pernah tampil di halaman stok mana pun.
|
*/

use App\Models\Branch;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * Dua cabang di satu toko retail, masing-masing punya stok tersendiri.
 */
function setupTwoBranchStore(): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    foreach (['basic_pos', 'product', 'category', 'payment_method', 'customer'] as $code) {
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

    $store = Store::create([
        'user_id' => null,
        'code' => 'TBRANCH'.uniqid(),
        'name' => 'Two Branch Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch1 = Branch::create(['store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang 1', 'is_active' => true]);
    $branch2 = Branch::create(['store_id' => $store->id, 'code' => 'BR2', 'name' => 'Cabang 2', 'is_active' => true]);

    $pm = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'cash', 'name' => 'Tunai', 'type' => 'cash', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(
        Permission::firstOrCreate(['name' => 'sale.create'], ['guard_id' => 1]),
    );
    $user->assignRole($role);

    return [$store, $branch1, $branch2, $pm, $user];
}

/** Buat produk sederhana dengan stok di tiap cabang. */
function makeProductWithBranchStock(Store $store, Branch $b1, Branch $b2, int $qty1, int $qty2): Product
{
    $product = Product::create([
        'store_id' => $store->id,
        'name' => 'Produk Isolasi',
        'sku' => 'ISO-'.uniqid(),
        'sell_price' => 10000,
        'cost_price' => 5000,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $b1->id,
        'quantity' => $qty1,
        'reserved_quantity' => 0,
        'average_cost' => 5000,
    ]);

    ProductStock::create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'branch_id' => $b2->id,
        'quantity' => $qty2,
        'reserved_quantity' => 0,
        'average_cost' => 5000,
    ]);

    return $product;
}

/** Helper: POST ke /app/kasir/store di cabang tertentu. */
function sellAtBranch(object $test, User $user, Store $store, Branch $branch, PaymentMethod $pm, int $productId, int $qty, int $price): TestResponse
{
    $test->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    return $test->postJson('/app/kasir/store', [
        'order_type' => 'takeaway',
        'items' => [
            ['product_id' => $productId, 'quantity' => $qty, 'price' => $price],
        ],
        'payments' => [
            ['method_id' => $pm->id, 'amount' => $qty * $price],
        ],
    ]);
}

/* ── Uji isolasi ────────────────────────────────────────────────────── */

test('jual di cabang 2 mengurangi stok cabang 2 bukan cabang 1', function () {
    [$store, $b1, $b2, $pm, $user] = setupTwoBranchStore();
    $product = makeProductWithBranchStock($store, $b1, $b2, 50, 20);

    sellAtBranch($this, $user, $store, $b2, $pm, $product->id, 3, 10000)
        ->assertSuccessful();

    $stock1 = ProductStock::where('product_id', $product->id)->where('branch_id', $b1->id)->first();
    $stock2 = ProductStock::where('product_id', $product->id)->where('branch_id', $b2->id)->first();

    expect((float) $stock1->quantity)->toBe(50.0, 'Stok cabang 1 tidak boleh berubah')
        ->and((float) $stock2->quantity)->toBe(17.0, 'Stok cabang 2 harus berkurang 3');
});

test('jual di cabang 1 tidak menyentuh stok cabang 2', function () {
    [$store, $b1, $b2, $pm, $user] = setupTwoBranchStore();
    $product = makeProductWithBranchStock($store, $b1, $b2, 50, 20);

    sellAtBranch($this, $user, $store, $b1, $pm, $product->id, 5, 10000)
        ->assertSuccessful();

    $stock1 = ProductStock::where('product_id', $product->id)->where('branch_id', $b1->id)->first();
    $stock2 = ProductStock::where('product_id', $product->id)->where('branch_id', $b2->id)->first();

    expect((float) $stock1->quantity)->toBe(45.0)
        ->and((float) $stock2->quantity)->toBe(20.0);
});

test('validasi stok menggunakan saldo cabang yang tepat', function () {
    [$store, $b1, $b2, $pm, $user] = setupTwoBranchStore();
    // Cabang 1 punya stok, cabang 2 kosong
    $product = makeProductWithBranchStock($store, $b1, $b2, 50, 0);

    // Cabang 2 tidak boleh bisa jual meski cabang 1 punya stok
    sellAtBranch($this, $user, $store, $b2, $pm, $product->id, 1, 10000)
        ->assertStatus(422);

    // Memastikan tidak ada baris stok hantu ber-branch_id NULL
    $ghost = ProductStock::where('product_id', $product->id)->whereNull('branch_id')->first();
    expect($ghost)->toBeNull('Tidak boleh ada baris stok dengan branch_id NULL');
});

test('tidak ada baris stok hantu branch_id null setelah transaksi', function () {
    [$store, $b1, $b2, $pm, $user] = setupTwoBranchStore();
    $product = makeProductWithBranchStock($store, $b1, $b2, 30, 10);

    sellAtBranch($this, $user, $store, $b1, $pm, $product->id, 2, 10000)->assertSuccessful();
    sellAtBranch($this, $user, $store, $b2, $pm, $product->id, 1, 10000)->assertSuccessful();

    $ghost = ProductStock::where('product_id', $product->id)->whereNull('branch_id')->first();
    expect($ghost)->toBeNull();

    expect(ProductStock::where('product_id', $product->id)->count())->toBe(2,
        'Harus tetap 2 baris — satu per cabang');
});
