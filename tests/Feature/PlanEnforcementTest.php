<?php

/*
|--------------------------------------------------------------------------
| Plan Enforcement — max_branches, max_products, max_transactions_per_month
|--------------------------------------------------------------------------
|
| Sebelum ini, hanya max_users yang benar-benar ditegakkan.
|
| max_branches: satu-satunya endpoint pembuatan cabang adalah panel
| Developer (Developer\BranchController) — tidak ada endpoint self-service
| untuk pemilik toko sendiri (Admin\BranchController ada di kode tapi tidak
| punya route terdaftar, jadi dead code). Karena developer butuh override
| manual (mis. bonus cabang tanpa upgrade plan), developer TIDAK diblokir —
| hanya diberi peringatan jelas kalau toko jadi melebihi limit plan-nya.
|
| max_products & max_transactions_per_month: punya endpoint self-service
| nyata (ProductController::store, KasirController::store) sehingga
| di-blokir keras begitu limit tercapai.
|
*/

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * @return array{user: User, store: Store, branch: Branch}
 */
function planEnforcementContext(array $planOverrides = [], array $permissions = ['product.create', 'sale.create']): array
{
    $storeType = StoreType::create(['code' => 'retail'.uniqid(), 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0]);

    // CheckFeatureAccess middleware butuh store_type + plan sama-sama
    // mengizinkan fitur ini, baru endpoint self-service (product/kasir)
    // bisa diakses sama sekali — tanpa ini semua request kena redirect
    // "fitur tidak tersedia", bukan logic limit yang mau diuji.
    foreach (['basic_pos', 'product', 'category', 'payment_method', 'customer'] as $code) {
        $f = Feature::firstOrCreate(['code' => $code], ['label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->syncWithoutDetaching([$f->id]);
    }

    $plan = Plan::create(array_merge([
        'code' => 'limited'.uniqid(),
        'label' => 'Limited Plan',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
        'max_users' => 5,
        'max_branches' => 1,
    ], $planOverrides));
    $plan->features()->syncWithoutDetaching(Feature::pluck('id'));

    $user = User::factory()->create([
        'plan_id' => $plan->id,
    ]);

    $store = Store::create([
        'user_id' => $user->id,
        'code' => 'PLANTEST'.uniqid(),
        'name' => 'Plan Test Store',
        'store_type_id' => $storeType->id,
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
    foreach ($permissions as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);
    app(PermissionRegistrar::class)->setPermissionsTeamId(null);

    return compact('user', 'store', 'branch');
}

function planEnforcementSession(array $ctx): array
{
    return [
        'current_store_id' => $ctx['store']->id,
        'current_branch_id' => $ctx['branch']->id,
        'branch_id' => $ctx['branch']->id,
    ];
}

function developerUser(): User
{
    return User::factory()->create(['is_developer' => true]);
}

// ── max_branches (via panel Developer — satu-satunya endpoint nyata) ─────

test('developer adding branch beyond plan limit succeeds but gets warning flash', function () {
    $ctx = planEnforcementContext(['max_branches' => 1]); // sudah punya 1 branch dari setup

    $response = $this->actingAs(developerUser())
        ->withoutMiddleware(ValidateCsrfToken::class)
        ->post('/developer/branches', [
            'store_id' => $ctx['store']->id,
            'code' => 'BR002',
            'name' => 'Cabang Kedua',
        ]);

    $response->assertRedirect(route('developer.branches.index'));
    $response->assertSessionHas('warning');
    // Developer TIDAK diblokir — cabang tetap dibuat
    expect(Branch::where('store_id', $ctx['store']->id)->count())->toBe(2);
});

test('developer adding branch within plan limit gets plain success, no warning', function () {
    $ctx = planEnforcementContext(['max_branches' => 3]);

    $response = $this->actingAs(developerUser())
        ->withoutMiddleware(ValidateCsrfToken::class)
        ->post('/developer/branches', [
            'store_id' => $ctx['store']->id,
            'code' => 'BR002',
            'name' => 'Cabang Kedua',
        ]);

    $response->assertRedirect(route('developer.branches.index'));
    $response->assertSessionHas('success');
    $response->assertSessionMissing('warning');
    expect(Branch::where('store_id', $ctx['store']->id)->count())->toBe(2);
});

// ── max_products (self-service, blokir keras) ─────────────────────────────

test('product creation blocked when plan max_products reached', function () {
    $ctx = planEnforcementContext(['max_products' => 1]);
    $category = Category::create(['store_id' => $ctx['store']->id, 'name' => 'Umum']);
    Product::create([
        'store_id' => $ctx['store']->id,
        'category_id' => $category->id,
        'name' => 'Produk Pertama',
        'sku' => 'SKU-001',
        'type' => 'finished_goods',
        'unit' => 'pcs',
        'sell_price' => 10000,
    ]);

    $response = $this->actingAs($ctx['user'])
        ->withSession(planEnforcementSession($ctx))
        ->post('/app/products', [
            'name' => 'Produk Kedua',
            'sku' => 'SKU-002',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 15000,
        ]);

    $response->assertSessionHas('error');
    expect(Product::where('store_id', $ctx['store']->id)->count())->toBe(1);
});

test('product creation succeeds when under plan limit', function () {
    $ctx = planEnforcementContext(['max_products' => 2]);
    $category = Category::create(['store_id' => $ctx['store']->id, 'name' => 'Umum']);
    Product::create([
        'store_id' => $ctx['store']->id,
        'category_id' => $category->id,
        'name' => 'Produk Pertama',
        'sku' => 'SKU-001',
        'type' => 'finished_goods',
        'unit' => 'pcs',
        'sell_price' => 10000,
    ]);

    $response = $this->actingAs($ctx['user'])
        ->withSession(planEnforcementSession($ctx))
        ->post('/app/products', [
            'name' => 'Produk Kedua',
            'sku' => 'SKU-002',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 15000,
        ]);

    $response->assertSessionHasNoErrors();
    expect(Product::where('store_id', $ctx['store']->id)->count())->toBe(2);
});

test('product creation succeeds when max_products is null (unlimited)', function () {
    $ctx = planEnforcementContext(['max_products' => null]);

    $response = $this->actingAs($ctx['user'])
        ->withSession(planEnforcementSession($ctx))
        ->post('/app/products', [
            'name' => 'Produk Bebas',
            'sku' => 'SKU-FREE',
            'type' => 'finished_goods',
            'unit' => 'pcs',
            'sell_price' => 10000,
        ]);

    $response->assertSessionHasNoErrors();
    expect(Product::where('store_id', $ctx['store']->id)->count())->toBe(1);
});

// ── max_transactions_per_month (self-service, blokir keras) ───────────────

test('checkout blocked when monthly transaction limit reached', function () {
    $ctx = planEnforcementContext(['max_transactions_per_month' => 1]);

    // Isi 1 transaksi bulan ini supaya limit langsung penuh
    Sale::create([
        'store_id' => $ctx['store']->id,
        'branch_id' => $ctx['branch']->id,
        'sale_no' => 'SALE-EXISTING',
        'sale_date' => now(),
        'status' => 'completed',
        'grand_total' => 10000,
        'subtotal' => 10000,
    ]);

    $category = Category::create(['store_id' => $ctx['store']->id, 'name' => 'Umum']);
    $product = Product::create([
        'store_id' => $ctx['store']->id,
        'category_id' => $category->id,
        'name' => 'Produk Uji',
        'sku' => 'SKU-TX',
        'type' => 'finished_goods',
        'unit' => 'pcs',
        'sell_price' => 10000,
        'is_sellable' => true,
        'is_active' => true,
        'track_stock' => false,
    ]);
    $paymentMethod = PaymentMethod::create([
        'store_id' => $ctx['store']->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $response = $this->actingAs($ctx['user'])
        ->withSession(planEnforcementSession($ctx))
        ->postJson('/app/kasir/store', [
            'order_type' => 'dine_in',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'price' => 10000],
            ],
            'payments' => [
                ['method_id' => $paymentMethod->id, 'amount' => 10000],
            ],
        ]);

    $response->assertStatus(422);
    $response->assertJson(['success' => false]);
    expect(Sale::where('store_id', $ctx['store']->id)->count())->toBe(1);
});

test('checkout succeeds when under monthly transaction limit', function () {
    $ctx = planEnforcementContext(['max_transactions_per_month' => 5]);

    $category = Category::create(['store_id' => $ctx['store']->id, 'name' => 'Umum']);
    $product = Product::create([
        'store_id' => $ctx['store']->id,
        'category_id' => $category->id,
        'name' => 'Produk Uji',
        'sku' => 'SKU-TX2',
        'type' => 'finished_goods',
        'unit' => 'pcs',
        'sell_price' => 10000,
        'is_sellable' => true,
        'is_active' => true,
        'track_stock' => false,
    ]);
    $paymentMethod = PaymentMethod::create([
        'store_id' => $ctx['store']->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $response = $this->actingAs($ctx['user'])
        ->withSession(planEnforcementSession($ctx))
        ->postJson('/app/kasir/store', [
            'order_type' => 'dine_in',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'price' => 10000],
            ],
            'payments' => [
                ['method_id' => $paymentMethod->id, 'amount' => 10000],
            ],
        ]);

    $response->assertSuccessful();
});

test('checkout succeeds when max_transactions_per_month is null (unlimited)', function () {
    $ctx = planEnforcementContext(['max_transactions_per_month' => null]);

    for ($i = 0; $i < 3; $i++) {
        Sale::create([
            'store_id' => $ctx['store']->id,
            'branch_id' => $ctx['branch']->id,
            'sale_no' => "SALE-EXIST-{$i}",
            'sale_date' => now(),
            'status' => 'completed',
            'grand_total' => 10000,
            'subtotal' => 10000,
        ]);
    }

    $category = Category::create(['store_id' => $ctx['store']->id, 'name' => 'Umum']);
    $product = Product::create([
        'store_id' => $ctx['store']->id,
        'category_id' => $category->id,
        'name' => 'Produk Uji',
        'sku' => 'SKU-TX3',
        'type' => 'finished_goods',
        'unit' => 'pcs',
        'sell_price' => 10000,
        'is_sellable' => true,
        'is_active' => true,
        'track_stock' => false,
    ]);
    $paymentMethod = PaymentMethod::create([
        'store_id' => $ctx['store']->id,
        'code' => 'cash',
        'name' => 'Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $response = $this->actingAs($ctx['user'])
        ->withSession(planEnforcementSession($ctx))
        ->postJson('/app/kasir/store', [
            'order_type' => 'dine_in',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'price' => 10000],
            ],
            'payments' => [
                ['method_id' => $paymentMethod->id, 'amount' => 10000],
            ],
        ]);

    $response->assertSuccessful();
});

// ── usagePercentage & planUsageSummary ────────────────────────────────────

test('usagePercentage returns null for unlimited metric', function () {
    $ctx = planEnforcementContext(['max_products' => null]);

    expect($ctx['store']->fresh()->usagePercentage('products'))->toBeNull();
});

test('usagePercentage returns correct value and matches near-limit threshold', function () {
    $ctx = planEnforcementContext(['max_branches' => 5]);
    // 1 branch sudah ada dari setup, tambah 3 lagi manual (tanpa lewat HTTP)
    for ($i = 0; $i < 3; $i++) {
        Branch::create(['store_id' => $ctx['store']->id, 'code' => 'X'.$i, 'name' => 'X'.$i, 'is_active' => true]);
    }

    // 4 dari 5 = 80% → tepat di ambang NEAR_LIMIT_THRESHOLD
    expect($ctx['store']->fresh()->usagePercentage('branches'))->toBe(80.0);
    expect(Store::NEAR_LIMIT_THRESHOLD)->toBe(80.0);
});

test('planUsageSummary returns all four metrics', function () {
    $ctx = planEnforcementContext();

    $summary = $ctx['store']->fresh()->planUsageSummary();

    expect($summary)->toHaveKeys(['users', 'branches', 'products', 'transactions']);
    expect($summary['branches']['current'])->toBe(1);
    expect($summary['branches']['max'])->toBe(1);
});
