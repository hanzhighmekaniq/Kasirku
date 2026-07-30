<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
use App\Models\PaymentGatewayTransaction;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function createKasirTestEnvironment(): array
{
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
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
        'code' => 'TESTKSR',
        'name' => 'Test Store Kasir',
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

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

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

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    return [$user, $store, $branch, $product];
}

test('kasir index returns null for pendingSale and pendingPgTransaction when no pending sale exists', function () {
    [$user, $store, $branch, $product] = createKasirTestEnvironment();

    $response = $this->actingAs($user)
        ->withSession([
            'current_store_id' => $store->id,
            'current_branch_id' => $branch->id,
        ])
        ->get('/app/kasir');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Kasir/modes/RetailKasir')
        ->where('pendingSale', null)
        ->where('pendingPgTransaction', null)
    );
});

test('kasir index returns pendingSale and pendingPgTransaction props when active pending sale exists', function () {
    [$user, $store, $branch, $product] = createKasirTestEnvironment();

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'sale_no' => 'INV-TEST-001',
        'sale_date' => now(),
        'status' => 'pending',
        'subtotal' => 30000,
        'grand_total' => 30000,
        'order_type' => 'dine_in',
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 2,
        'price' => 15000,
        'subtotal' => 30000,
    ]);

    $pgTrx = PaymentGatewayTransaction::create([
        'sale_id' => $sale->id,
        'provider' => 'midtrans',
        'external_id' => 'MID-12345',
        'payment_type' => 'qris',
        'status' => 'pending',
        'amount' => 30000,
        'raw_response' => [
            'qr_string' => '00020101021226680016ID.CO.MIDTRANS.WWW...',
            'qr_url' => 'https://midtrans.com/qr/12345.png',
        ],
    ]);

    $response = $this->actingAs($user)
        ->withSession([
            'current_store_id' => $store->id,
            'current_branch_id' => $branch->id,
        ])
        ->get('/app/kasir');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Kasir/modes/RetailKasir')
        ->where('pendingSale.sale_id', $sale->id)
        ->where('pendingSale.sale_no', 'INV-TEST-001')
        ->where('pendingSale.grand_total', 30000)
        ->where('pendingSale.items.0.productId', $product->id)
        ->where('pendingSale.items.0.quantity', 2)
        ->where('pendingSale.items.0.price', 15000)
        ->where('pendingSale.items.0.name', 'Kopi Susu')
        ->where('pendingPgTransaction.pg_trx_id', $pgTrx->id)
        ->where('pendingPgTransaction.payment_type', 'qris')
        ->where('pendingPgTransaction.status', 'pending')
        ->where('pendingPgTransaction.amount', 30000)
        ->where('pendingPgTransaction.qr_code', '00020101021226680016ID.CO.MIDTRANS.WWW...')
    );
});

/**
 * Refresh-safety untuk deep link halaman pembayaran.
 *
 * Tombol "Kembali" di header pembayaran membatalkan pending sale lalu
 * navigasi ke halaman kasir. Kalau kasir kemudian me-refresh URL pembayaran
 * yang lama, backend HARUS melempar balik ke halaman kasir — bukan merender
 * layar pembayaran tanpa transaksi yang bisa diproses.
 */
test('payment route redirects to kasir after the pending sale was cancelled', function () {
    [$user, $store, $branch, $product] = createKasirTestEnvironment();

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'sale_no' => 'INV-BACK-001',
        'sale_date' => now(),
        'status' => 'pending',
        'subtotal' => 15000,
        'grand_total' => 15000,
        'order_type' => 'dine_in',
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'price' => 15000,
        'subtotal' => 15000,
    ]);

    $session = [
        'current_store_id' => $store->id,
        'current_branch_id' => $branch->id,
    ];

    // Tombol kembali → batalkan pending sale.
    $this->actingAs($user)
        ->withSession($session)
        ->post("/app/kasir/cancel-pending/{$sale->id}")
        ->assertOk()
        ->assertJson(['success' => true]);

    // Refresh URL pembayaran lama → harus balik ke kasir, bukan render payment.
    $this->actingAs($user)
        ->withSession($session)
        ->get('/app/kasir/payment/INV-BACK-001')
        ->assertRedirect(route('admin.kasir.index'));

    // Halaman kasir juga tidak boleh lagi melihat pending sale itu.
    $this->actingAs($user)
        ->withSession($session)
        ->get('/app/kasir')
        ->assertInertia(fn (Assert $page) => $page
            ->where('pendingSale', null)
            ->where('pendingPgTransaction', null)
        );
});

test('payment route redirects to kasir when the sale is already completed', function () {
    [$user, $store, $branch, $product] = createKasirTestEnvironment();

    Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'sale_no' => 'INV-DONE-001',
        'sale_date' => now(),
        'status' => 'completed',
        'subtotal' => 15000,
        'grand_total' => 15000,
        'order_type' => 'dine_in',
    ]);

    $this->actingAs($user)
        ->withSession([
            'current_store_id' => $store->id,
            'current_branch_id' => $branch->id,
        ])
        ->get('/app/kasir/payment/INV-DONE-001')
        ->assertRedirect(route('admin.kasir.index'));
});

test('payment route redirects to kasir when the sale number is unknown', function () {
    [$user, $store, $branch] = createKasirTestEnvironment();

    $this->actingAs($user)
        ->withSession([
            'current_store_id' => $store->id,
            'current_branch_id' => $branch->id,
        ])
        ->get('/app/kasir/payment/INV-DOES-NOT-EXIST')
        ->assertRedirect(route('admin.kasir.index'));
});

test('payment route still renders the payment page for a live pending sale', function () {
    [$user, $store, $branch, $product] = createKasirTestEnvironment();

    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'sale_no' => 'INV-LIVE-001',
        'sale_date' => now(),
        'status' => 'pending',
        'subtotal' => 30000,
        'grand_total' => 30000,
        'order_type' => 'dine_in',
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 2,
        'price' => 15000,
        'subtotal' => 30000,
    ]);

    $this->actingAs($user)
        ->withSession([
            'current_store_id' => $store->id,
            'current_branch_id' => $branch->id,
        ])
        ->get('/app/kasir/payment/INV-LIVE-001')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Kasir/modes/RetailKasir')
            ->where('pendingSale.sale_id', $sale->id)
            ->where('pendingSale.sale_no', 'INV-LIVE-001')
        );
});
