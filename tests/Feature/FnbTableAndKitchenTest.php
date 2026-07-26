<?php

/*
|--------------------------------------------------------------------------
| FnB — siklus meja & antrian dapur
|--------------------------------------------------------------------------
|
| Menutup bug-bug yang tercatat di Planing/PLANNING_KITCHEN_MEJA.md:
|   1. Meja tidak pernah dibebaskan otomatis setelah bayar.
|   2. CafeTable::activeSale() memakai status yang tidak pernah terjadi.
|   3/4. Order FnB — termasuk yang lewat payment gateway — harus masuk
|        antrian dapur sejak dibuat, bukan setelah dibayar.
|   5/6. guest_count & delivery_platform tidak pernah sampai ke database.
|   8. Floor map tidak tahu order mana yang ada di meja mana.
|
*/

use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Models\Branch;
use App\Models\CafeTable;
use App\Models\Category;
use App\Models\Feature;
use App\Models\PaymentGatewayTransaction;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Toko FnB lengkap dengan satu meja, satu produk, dan metode bayar tunai.
 *
 * @return array{user: User, store: Store, branch: Branch, product: Product, table: CafeTable, cash: PaymentMethod}
 */
function createFnbTestEnvironment(): array
{
    $storeType = StoreType::create([
        'code' => 'fnb',
        'label' => 'Food & Beverage',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $features = ['basic_pos', 'product', 'category', 'payment_method', 'customer'];
    foreach ($features as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $user = User::factory()->create();

    $store = Store::create([
        'user_id' => $user->id,
        'code' => 'TESTFNB',
        'name' => 'Test Warung',
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

    $category = Category::create(['store_id' => $store->id, 'name' => 'Minuman']);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Kopi Susu',
        'sku' => 'KPI-001',
        'sell_price' => 15000,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $table = CafeTable::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'table_number' => 'A-01',
        'capacity' => 4,
        'status' => 'available',
        'is_active' => true,
    ]);

    $cash = PaymentMethod::create([
        'store_id' => $store->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(Permission::create(['name' => 'sale.create', 'guard_id' => 1]));
    $user->assignRole($role);

    return compact('user', 'store', 'branch', 'product', 'table', 'cash');
}

/** Session yang dipakai POS untuk menentukan scope toko + cabang. */
function fnbSession(array $env): array
{
    return [
        'current_store_id' => $env['store']->id,
        'current_branch_id' => $env['branch']->id,
        'branch_id' => $env['branch']->id,
    ];
}

/** Payload minimal untuk memulai satu order dine-in. */
function fnbStartPayload(array $env, array $overrides = []): array
{
    return array_merge([
        'table_id' => $env['table']->id,
        'order_type' => 'dine_in',
        'guest_count' => 3,
        'items' => [[
            'product_id' => $env['product']->id,
            'quantity' => 2,
            'price' => 15000,
        ]],
    ], $overrides);
}

test('order dine-in menandai meja terisi, mengisi guest_count, dan langsung masuk antrian dapur', function () {
    $env = createFnbTestEnvironment();

    $response = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env));

    $response->assertStatus(200)->assertJson(['success' => true]);

    $sale = Sale::findOrFail($response->json('sale_id'));

    expect($sale->pos_mode)->toBe('fnb')
        ->and($sale->status)->toBe('pending')
        ->and($sale->kitchen_status)->toBe('pending')  // dapur tahu sebelum dibayar
        ->and($sale->guest_count)->toBe(3);

    expect($env['table']->fresh()->status)->toBe('occupied');
});

test('melunasi order dengan tunai membebaskan meja kembali', function () {
    $env = createFnbTestEnvironment();

    $start = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env));

    $saleId = $start->json('sale_id');
    expect($env['table']->fresh()->status)->toBe('occupied');

    $finalize = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/finalize', [
            'sale_id' => $saleId,
            'payments' => [[
                'method_id' => $env['cash']->id,
                'amount' => 30000,
            ]],
        ]);

    $finalize->assertStatus(200)->assertJson(['success' => true]);

    expect(Sale::find($saleId)->status)->toBe('completed')
        ->and($env['table']->fresh()->status)->toBe('available');
});

test('order lewat payment gateway baru membebaskan meja setelah pembayaran dikonfirmasi', function () {
    $env = createFnbTestEnvironment();

    $start = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env));

    $saleId = $start->json('sale_id');
    $sale = Sale::findOrFail($saleId);

    // Order QRIS/e-wallet tetap harus terlihat oleh dapur sejak awal.
    expect($sale->kitchen_status)->toBe('pending');

    // Sale masih menggantung menunggu konfirmasi gateway — meja tetap terisi.
    expect($env['table']->fresh()->status)->toBe('occupied');

    $pgTrx = PaymentGatewayTransaction::create([
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'external_id' => 'MID-FNB-001',
        'payment_type' => 'qris',
        'status' => 'settlement',
        'amount' => 30000,
        'raw_response' => [],
    ]);

    app(PaymentGatewayController::class)
        ->finalizeSale($sale, $pgTrx);

    expect($sale->fresh()->status)->toBe('completed')
        ->and($env['table']->fresh()->status)->toBe('available');
});

test('membatalkan order yang belum dibayar membebaskan meja', function () {
    $env = createFnbTestEnvironment();

    $start = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env));

    $saleId = $start->json('sale_id');
    expect($env['table']->fresh()->status)->toBe('occupied');

    $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson("/app/kasir/cancel-pending/{$saleId}")
        ->assertStatus(200)
        ->assertJson(['success' => true]);

    expect(Sale::find($saleId))->toBeNull()
        ->and($env['table']->fresh()->status)->toBe('available');
});

test('meja dengan dua order tetap terisi selama masih ada order yang berjalan', function () {
    $env = createFnbTestEnvironment();

    $first = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env));

    $second = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env));

    // Order pertama lunas, tapi order kedua masih jalan di meja yang sama.
    $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/finalize', [
            'sale_id' => $first->json('sale_id'),
            'payments' => [['method_id' => $env['cash']->id, 'amount' => 30000]],
        ])->assertStatus(200);

    expect($env['table']->fresh()->status)->toBe('occupied');

    // Setelah order kedua ikut lunas, meja baru boleh bebas.
    $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/finalize', [
            'sale_id' => $second->json('sale_id'),
            'payments' => [['method_id' => $env['cash']->id, 'amount' => 30000]],
        ])->assertStatus(200);

    expect($env['table']->fresh()->status)->toBe('available');
});

test('order delivery menyimpan platform dan nomor order dari platform', function () {
    $env = createFnbTestEnvironment();

    $response = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env, [
            'table_id' => null,
            'order_type' => 'delivery',
            'delivery_address' => 'Jl. Merdeka No. 1',
            'delivery_platform' => 'GoFood',
            'delivery_order_no' => 'GF-99887',
        ]));

    $response->assertStatus(200);

    $sale = Sale::findOrFail($response->json('sale_id'));

    expect($sale->delivery_platform)->toBe('GoFood')
        ->and($sale->delivery_order_no)->toBe('GF-99887')
        ->and($sale->kitchen_status)->toBe('pending');
});

test('order dine-in tidak ikut menyimpan info delivery', function () {
    $env = createFnbTestEnvironment();

    $response = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env, [
            'delivery_platform' => 'GoFood',
            'delivery_order_no' => 'GF-99887',
        ]));

    $sale = Sale::findOrFail($response->json('sale_id'));

    expect($sale->delivery_platform)->toBeNull()
        ->and($sale->delivery_order_no)->toBeNull();
});

test('activeSale mengabaikan order yang sudah selesai dan tetap menemukan order lama yang masih jalan', function () {
    $env = createFnbTestEnvironment();

    $stillOpen = Sale::create([
        'store_id' => $env['store']->id,
        'branch_id' => $env['branch']->id,
        'user_id' => $env['user']->id,
        'table_id' => $env['table']->id,
        'sale_no' => 'SL-OPEN',
        'sale_date' => now(),
        'pos_mode' => 'fnb',
        'order_type' => 'dine_in',
        'status' => 'pending',
        'grand_total' => 30000,
    ]);

    // Dibuat SETELAH order yang masih jalan — id-nya lebih besar. Kalau filter
    // status bocor ke luar subquery, relasi akan memilih baris ini lalu
    // menyaringnya habis dan mengembalikan null.
    Sale::create([
        'store_id' => $env['store']->id,
        'branch_id' => $env['branch']->id,
        'user_id' => $env['user']->id,
        'table_id' => $env['table']->id,
        'sale_no' => 'SL-DONE',
        'sale_date' => now(),
        'pos_mode' => 'fnb',
        'order_type' => 'dine_in',
        'status' => 'completed',
        'grand_total' => 15000,
    ]);

    $table = CafeTable::with('activeSale')->find($env['table']->id);

    expect($table->activeSale)->not->toBeNull()
        ->and($table->activeSale->sale_no)->toBe('SL-OPEN')
        ->and($table->hasActiveOrder())->toBeTrue();
});

test('halaman kasir FnB mengirim info order aktif per meja dan antrian dapur', function () {
    $env = createFnbTestEnvironment();

    $start = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env));

    $saleNo = $start->json('sale_no');

    $response = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->get('/app/kasir');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Kasir/modes/FnBKasir')
        ->where('tables.0.status', 'occupied')
        ->where('tables.0.active_sale.sale_no', $saleNo)
        ->where('tables.0.active_sale.kitchen_status', 'pending')
        ->where('tables.0.active_sale.guest_count', 3)
        ->where('kitchenQueue.0.sale_no', $saleNo)
        ->where('kitchenQueue.0.table', 'A-01')
        ->where('kitchenQueue.0.status', 'pending')
        ->where('kitchenQueue.0.items', 'Kopi Susu ×2')
    );
});

test('antrian dapur kosong setelah order ditandai served', function () {
    $env = createFnbTestEnvironment();

    $start = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->postJson('/app/kasir/start', fnbStartPayload($env));

    Sale::where('id', $start->json('sale_id'))->update(['kitchen_status' => 'served']);

    $response = $this->actingAs($env['user'])
        ->withSession(fnbSession($env))
        ->get('/app/kasir');

    $response->assertInertia(fn (Assert $page) => $page->count('kitchenQueue', 0));
});
