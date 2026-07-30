<?php

/*
|--------------------------------------------------------------------------
| Target promo per varian & satuan
|--------------------------------------------------------------------------
|
| Sebelumnya promo hanya bisa diikat ke produk induk, sehingga produk yang
| punya varian atau multi-satuan tidak bisa dipromokan secara spesifik.
| Sekarang pivot promotion_products menyimpan variant_id & packaging_unit_id,
| dengan aturan menurun dari umum ke spesifik:
|
|   - promo tanpa target      -> semua produk
|   - target produk saja      -> semua varian & satuan produk itu
|   - target + varian         -> semua satuan pada varian itu
|   - target + varian + satuan-> hanya kombinasi itu
|
*/

use App\Models\Category;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\Store;
use App\Models\StoreType;
use App\Services\PromotionService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * @return array{0: Store, 1: Product, 2: ProductVariant, 3: ProductVariant, 4: ProductPackagingUnit}
 */
function setupPromoTargetStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['promo', 'product', 'category'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'PT'.uniqid(),
        'name' => 'Toko Target Promo',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Minuman']);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Kopi',
        'sku' => 'KOPI-'.uniqid(),
        'sell_price' => 20000,
        'cost_price' => 10000,
        'unit' => 'cup',
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $small = ProductVariant::create([
        'product_id' => $product->id, 'name' => 'Small', 'sku' => 'KOPI-S'.uniqid(),
        'price' => 20000, 'cost_price' => 10000, 'is_active' => true,
    ]);

    $large = ProductVariant::create([
        'product_id' => $product->id, 'name' => 'Large', 'sku' => 'KOPI-L'.uniqid(),
        'price' => 30000, 'cost_price' => 15000, 'is_active' => true,
    ]);

    $unit = ProductPackagingUnit::create([
        'product_id' => $product->id,
        'variant_id' => $large->id,
        'name' => 'Botol Liter',
        'conversion_qty' => 4,
        'sell_price' => 100000,
    ]);

    return [$store, $product, $small, $large, $unit];
}

function makeItemPromo(Store $store, array $attributes = []): Promotion
{
    return Promotion::create(array_merge([
        'store_id' => $store->id,
        'code' => 'PROMO-'.strtoupper(uniqid()),
        'name' => 'Diskon Uji',
        'type' => 'percentage',
        'scope' => 'item',
        'discount_value' => 10,
        'is_active' => true,
        'max_usage' => 0,
    ], $attributes));
}

test('promo tanpa target berlaku untuk semua produk', function () {
    [$store, $product, $small] = setupPromoTargetStore();

    makeItemPromo($store);

    $result = (new PromotionService)->findBestPromoForItem(
        (string) $product->id, 1, 20000, null, $small->id, null
    );

    expect($result)->not->toBeNull();
    expect($result['discount'])->toBe(2000.0);
});

test('target produk tanpa varian berlaku untuk semua varian produk itu', function () {
    [$store, $product, $small, $large] = setupPromoTargetStore();

    $promo = makeItemPromo($store);
    $promo->products()->attach($product->id, [
        'variant_id' => null,
        'packaging_unit_id' => null,
    ]);

    $service = new PromotionService;

    expect($service->findBestPromoForItem((string) $product->id, 1, 20000, null, $small->id, null))
        ->not->toBeNull();
    expect($service->findBestPromoForItem((string) $product->id, 1, 30000, null, $large->id, null))
        ->not->toBeNull();
});

test('target varian spesifik hanya berlaku untuk varian itu', function () {
    [$store, $product, $small, $large] = setupPromoTargetStore();

    $promo = makeItemPromo($store);
    $promo->products()->attach($product->id, [
        'variant_id' => $large->id,
        'packaging_unit_id' => null,
    ]);

    $service = new PromotionService;

    expect($service->findBestPromoForItem((string) $product->id, 1, 30000, null, $large->id, null))
        ->not->toBeNull();
    expect($service->findBestPromoForItem((string) $product->id, 1, 20000, null, $small->id, null))
        ->toBeNull();
});

test('target varian berlaku untuk semua satuan pada varian itu', function () {
    [$store, $product, $small, $large, $unit] = setupPromoTargetStore();

    $promo = makeItemPromo($store);
    $promo->products()->attach($product->id, [
        'variant_id' => $large->id,
        'packaging_unit_id' => null,
    ]);

    $service = new PromotionService;

    expect($service->findBestPromoForItem((string) $product->id, 1, 30000, null, $large->id, null))
        ->not->toBeNull();
    expect($service->findBestPromoForItem((string) $product->id, 1, 100000, null, $large->id, $unit->id))
        ->not->toBeNull();
});

test('target satuan spesifik hanya berlaku untuk satuan itu', function () {
    [$store, $product, $small, $large, $unit] = setupPromoTargetStore();

    $promo = makeItemPromo($store);
    $promo->products()->attach($product->id, [
        'variant_id' => $large->id,
        'packaging_unit_id' => $unit->id,
    ]);

    $service = new PromotionService;

    expect($service->findBestPromoForItem((string) $product->id, 1, 100000, null, $large->id, $unit->id))
        ->not->toBeNull();
    // Varian sama tapi satuan dasar -> tidak kena promo.
    expect($service->findBestPromoForItem((string) $product->id, 1, 30000, null, $large->id, null))
        ->toBeNull();
});

test('produk lain tidak kena promo yang menargetkan produk tertentu', function () {
    [$store, $product, $small] = setupPromoTargetStore();

    $other = Product::create([
        'store_id' => $store->id,
        'name' => 'Teh',
        'sku' => 'TEH-'.uniqid(),
        'sell_price' => 10000,
        'track_stock' => false,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $promo = makeItemPromo($store);
    $promo->products()->attach($product->id, [
        'variant_id' => null,
        'packaging_unit_id' => null,
    ]);

    expect((new PromotionService)->findBestPromoForItem((string) $other->id, 1, 10000))
        ->toBeNull();
});

test('applyPromosToCart meneruskan varian sehingga target varian dihormati', function () {
    [$store, $product, $small, $large] = setupPromoTargetStore();

    $promo = makeItemPromo($store);
    $promo->products()->attach($product->id, [
        'variant_id' => $large->id,
        'packaging_unit_id' => null,
    ]);

    $items = (new PromotionService)->applyPromosToCart([
        ['product_id' => $product->id, 'variant_id' => $large->id, 'quantity' => 1, 'price' => 30000],
        ['product_id' => $product->id, 'variant_id' => $small->id, 'quantity' => 1, 'price' => 20000],
    ]);

    expect($items[0]['promo_discount'])->toBe(3000.0);
    expect($items[1]['promo_discount'])->toBe(0);
});

test('promo di luar hari berlaku tidak diterapkan', function () {
    [$store, $product, $small] = setupPromoTargetStore();

    // Kunci promo ke hari yang bukan hari ini.
    $today = Promotion::DAYS[(now()->dayOfWeek + 6) % 7];
    $otherDays = array_values(array_diff(Promotion::DAYS, [$today]));

    makeItemPromo($store, ['applicable_days' => $otherDays]);

    expect((new PromotionService)->findBestPromoForItem((string) $product->id, 1, 20000, null, $small->id))
        ->toBeNull();
});

test('promo pada hari berlaku tetap diterapkan', function () {
    [$store, $product, $small] = setupPromoTargetStore();

    $today = Promotion::DAYS[(now()->dayOfWeek + 6) % 7];

    makeItemPromo($store, ['applicable_days' => [$today]]);

    expect((new PromotionService)->findBestPromoForItem((string) $product->id, 1, 20000, null, $small->id))
        ->not->toBeNull();
});

test('applicable_days kosong berarti berlaku setiap hari', function () {
    expect((new Promotion(['applicable_days' => null]))->isActiveOnDay())->toBeTrue();
    expect((new Promotion(['applicable_days' => []]))->isActiveOnDay())->toBeTrue();
});

test('bogo memakai free_quantity dan harga varian gratis', function () {
    [$store, $product, $small, $large] = setupPromoTargetStore();

    $promo = makeItemPromo($store, [
        'type' => 'bogo',
        'discount_value' => 2,        // beli 2
        'free_quantity' => 2,         // gratis 2
        'free_product_id' => $product->id,
        'free_variant_id' => $large->id, // harga 30.000
    ]);

    $result = (new PromotionService)->findBestPromoForItem(
        (string) $product->id, 4, 20000, null, $small->id
    );

    // 4 / 2 = 2 kelipatan, tiap kelipatan gratis 2 item @30.000 = 120.000
    expect($result)->not->toBeNull();
    expect($result['promotion']->id)->toBe($promo->id);
    expect($result['discount'])->toBe(120000.0);
});

test('bogo tanpa free_quantity tetap menggratiskan satu item', function () {
    [$store, $product, $small, $large] = setupPromoTargetStore();

    // Promo lama tidak mengisi free_quantity — perilakunya harus tidak berubah.
    $promo = makeItemPromo($store, [
        'type' => 'bogo',
        'discount_value' => 2,
        'free_quantity' => null,
        'free_product_id' => $product->id,
        'free_variant_id' => $large->id,
    ]);

    $result = (new PromotionService)->findBestPromoForItem(
        (string) $product->id, 4, 20000, null, $small->id
    );

    // 2 kelipatan x 1 item gratis @30.000 = 60.000
    expect($result['discount'])->toBe(60000.0);
});

test('scope keranjang hanya valid untuk tipe yang mendukungnya', function () {
    expect(Promotion::supportsScope('percentage', 'cart'))->toBeTrue();
    expect(Promotion::supportsScope('fixed_amount', 'cart'))->toBeTrue();
    expect(Promotion::supportsScope('bundle', 'cart'))->toBeFalse();
    expect(Promotion::supportsScope('tiered', 'cart'))->toBeFalse();
    expect(Promotion::supportsScope('member_price', 'cart'))->toBeFalse();
    expect(Promotion::supportsScope('bogo', 'cart'))->toBeFalse();
    expect(Promotion::supportsScope('buy_x_get_y', 'cart'))->toBeFalse();

    foreach (Promotion::TYPES as $type) {
        expect(Promotion::supportsScope($type, 'item'))->toBeTrue();
    }
});
