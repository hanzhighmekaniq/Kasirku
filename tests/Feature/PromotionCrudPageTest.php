<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\CustomerTier;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * Halaman CRUD promo dirender ulang mengikuti konvensi halaman lain
 * (PageHeader, Select bersama, tombol tambah lewat FAB di mobile). Test ini
 * menjaga kontrak prop yang dipakai halaman-halaman itu supaya tidak diam-diam
 * hilang: `promotions` + products_count, `customerTiers`, dan `customerTierName`
 * di halaman detail.
 *
 * @return array{0: User, 1: Store, 2: Branch, 3: Product, 4: CustomerTier}
 */
function createPromotionPageEnvironment(): array
{
    $storeType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'product', 'category', 'promo', 'membership', 'customer'] as $code) {
        $feature = Feature::create([
            'code' => $code,
            'label' => $code,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $storeType->features()->attach($feature->id);
    }

    $plan = Plan::create([
        'code' => 'basic',
        'label' => 'Basic',
        'is_active' => true,
        'sort_order' => 0,
        'price' => 0,
    ]);
    $plan->features()->attach(Feature::pluck('id'));

    $user = User::factory()->create();

    $store = Store::create([
        'user_id' => $user->id,
        'code' => 'PROMOCRUD',
        'name' => 'Toko Promo',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);
    $store->users()->attach($user->id);

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
        'sell_price' => 18000,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $tier = CustomerTier::create([
        'store_id' => $store->id,
        'name' => 'Gold',
        'rank' => 3,
        'color' => 'amber',
        'is_active' => true,
    ]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach (['promotion.view', 'promotion.create', 'promotion.edit', 'promotion.delete'] as $name) {
        $role->givePermissionTo(Permission::create(['name' => $name, 'guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$user, $store, $branch, $product, $tier];
}

/** @return array<string, int> */
function promotionPageSession(Store $store, Branch $branch): array
{
    return [
        'current_store_id' => $store->id,
        'current_branch_id' => $branch->id,
    ];
}

test('halaman daftar promo mengirim promotions beserta jumlah produk terikat', function () {
    [$user, $store, $branch, $product] = createPromotionPageEnvironment();

    $promo = Promotion::create([
        'store_id' => $store->id,
        'code' => 'PROMO-LIST01',
        'name' => 'Diskon Kopi',
        'type' => 'percentage',
        'scope' => 'item',
        'discount_value' => 10,
        'is_active' => true,
    ]);
    $promo->products()->attach($product->id);

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->get('/app/promotions')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Promotions/Index')
            ->where('promotions.0.id', $promo->id)
            ->where('promotions.0.name', 'Diskon Kopi')
            ->where('promotions.0.products_count', 1)
        );
});

test('halaman tambah promo mengirim bucket target dan daftar tier untuk dropdown', function () {
    [$user, $store, $branch, $product, $tier] = createPromotionPageEnvironment();

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->get('/app/promotions/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Promotions/Create')
            // Target promo dikirim sebagai bucket produk + varian + satuan.
            ->where('buckets.0.product_id', $product->id)
            ->where('buckets.0.variant_id', null)
            ->where('buckets.0.packaging_unit_id', null)
            ->where('scopeSupport.percentage', ['item', 'cart'])
            ->where('scopeSupport.bundle', ['item'])
            ->where('customerTiers.0.id', $tier->id)
            ->where('customerTiers.0.name', 'Gold')
            ->where('customerTiers.0.rank', 3)
        );
});

test('halaman edit promo mengirim promo, produk terpilih, dan daftar tier', function () {
    [$user, $store, $branch, $product, $tier] = createPromotionPageEnvironment();

    $promo = Promotion::create([
        'store_id' => $store->id,
        'code' => 'PROMO-EDIT01',
        'name' => 'Harga Member Gold',
        'type' => 'member_price',
        'scope' => 'item',
        'discount_value' => 0,
        'tier_price' => 12000,
        'customer_tier_id' => $tier->id,
        'is_active' => true,
    ]);
    $promo->products()->attach($product->id);

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->get("/app/promotions/{$promo->id}/edit")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Promotions/Edit')
            ->where('promotion.id', $promo->id)
            ->where('promotion.customer_tier_id', $tier->id)
            ->where('promotion.products.0.id', $product->id)
            ->where('customerTiers.0.id', $tier->id)
        );
});

test('halaman detail promo mengirim nama tier sebagai string terpisah', function () {
    [$user, $store, $branch, $product, $tier] = createPromotionPageEnvironment();

    $promo = Promotion::create([
        'store_id' => $store->id,
        'code' => 'PROMO-SHOW01',
        'name' => 'Harga Member Gold',
        'type' => 'member_price',
        'scope' => 'item',
        'discount_value' => 0,
        'tier_price' => 12000,
        'customer_tier_id' => $tier->id,
        'customer_tier' => 'gold',
        'is_active' => true,
    ]);
    $promo->products()->attach($product->id);

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->get("/app/promotions/{$promo->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Promotions/Show')
            ->where('promotion.id', $promo->id)
            ->where('promotion.products_count', 1)
            // Harus string, bukan objek relasi — halaman merendernya langsung.
            ->where('customerTierName', 'Gold')
        );
});

test('menyimpan promo ikut menyimpan varian dan satuan target', function () {
    [$user, $store, $branch, $product] = createPromotionPageEnvironment();

    $variant = ProductVariant::create([
        'product_id' => $product->id, 'name' => 'Large', 'sku' => 'V-'.uniqid(),
        'price' => 30000, 'cost_price' => 15000, 'is_active' => true,
    ]);

    $unit = ProductPackagingUnit::create([
        'product_id' => $product->id, 'variant_id' => $variant->id,
        'name' => 'Botol', 'conversion_qty' => 4, 'sell_price' => 100000,
    ]);

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->post('/app/promotions', [
            'name' => 'Diskon Botol Large',
            'type' => 'percentage',
            'scope' => 'item',
            'discount_value' => 15,
            'applicable_days' => ['mon', 'tue'],
            'items' => [
                [
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'packaging_unit_id' => $unit->id,
                ],
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.promotions.index'));

    $promo = Promotion::where('name', 'Diskon Botol Large')->firstOrFail();
    $pivot = $promo->products()->first()->pivot;

    expect($pivot->variant_id)->toBe($variant->id);
    expect($pivot->packaging_unit_id)->toBe($unit->id);
    expect($promo->applicable_days)->toBe(['mon', 'tue']);
});

test('cakupan keranjang ditolak untuk tipe yang tidak mendukungnya', function () {
    [$user, $store, $branch, $product] = createPromotionPageEnvironment();

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->post('/app/promotions', [
            'name' => 'Bundle Keranjang',
            'type' => 'bundle',
            'scope' => 'cart',
            'discount_value' => 5000,
        ])
        ->assertSessionHasErrors('scope');

    expect(Promotion::where('name', 'Bundle Keranjang')->exists())->toBeFalse();
});

test('promo cakupan keranjang tidak menyimpan target produk', function () {
    [$user, $store, $branch, $product] = createPromotionPageEnvironment();

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->post('/app/promotions', [
            'name' => 'Diskon Keranjang',
            'type' => 'percentage',
            'scope' => 'cart',
            'discount_value' => 10,
            // Target dikirim tapi harus diabaikan karena cakupannya keranjang.
            'items' => [
                ['product_id' => $product->id, 'variant_id' => null, 'packaging_unit_id' => null],
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $promo = Promotion::where('name', 'Diskon Keranjang')->firstOrFail();

    expect($promo->products()->count())->toBe(0);
});

test('memilih semua hari sama dengan tanpa batasan hari', function () {
    [$user, $store, $branch] = createPromotionPageEnvironment();

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->post('/app/promotions', [
            'name' => 'Diskon Tiap Hari',
            'type' => 'percentage',
            'scope' => 'cart',
            'discount_value' => 5,
            'applicable_days' => Promotion::DAYS,
        ])
        ->assertSessionHasNoErrors();

    $promo = Promotion::where('name', 'Diskon Tiap Hari')->firstOrFail();

    expect($promo->applicable_days)->toBeNull();
    expect($promo->isActiveOnDay())->toBeTrue();
});

test('halaman edit mengirim target promo sebagai bucket', function () {
    [$user, $store, $branch, $product] = createPromotionPageEnvironment();

    $variant = ProductVariant::create([
        'product_id' => $product->id, 'name' => 'Small', 'sku' => 'V-'.uniqid(),
        'price' => 20000, 'cost_price' => 10000, 'is_active' => true,
    ]);

    $promo = Promotion::create([
        'store_id' => $store->id,
        'code' => 'PROMO-BUCKET',
        'name' => 'Diskon Varian',
        'type' => 'percentage',
        'scope' => 'item',
        'discount_value' => 10,
        'is_active' => true,
    ]);
    $promo->products()->attach($product->id, [
        'variant_id' => $variant->id,
        'packaging_unit_id' => null,
    ]);

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->get("/app/promotions/{$promo->id}/edit")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('promotionItems.0.product_id', $product->id)
            ->where('promotionItems.0.variant_id', $variant->id)
            ->where('promotionItems.0.packaging_unit_id', null)
            ->where('promotionItems.0.key', "{$product->id}-{$variant->id}-")
        );
});

test('promo tanpa tier tidak mengirim nama tier', function () {
    [$user, $store, $branch] = createPromotionPageEnvironment();

    $promo = Promotion::create([
        'store_id' => $store->id,
        'code' => 'PROMO-SHOW02',
        'name' => 'Diskon Umum',
        'type' => 'percentage',
        'scope' => 'cart',
        'discount_value' => 5,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->withSession(promotionPageSession($store, $branch))
        ->get("/app/promotions/{$promo->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('customerTierName', null)
        );
});
