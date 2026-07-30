<?php

use App\Models\CustomerTier;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Promotion;
use App\Models\Store;
use App\Models\StoreType;
use App\Services\PromotionService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function setupPromoBaselineStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $features = ['promo', 'customer', 'membership'];
    foreach ($features as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'PROMO001', 'name' => 'Promo Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    CustomerTier::seedDefaultsForStore($store->id);

    return [$store];
}

test('cart promo percentage applies to subtotal without membership', function () {
    [$store] = setupPromoBaselineStore();

    Promotion::create([
        'store_id' => $store->id,
        'code' => 'CART10',
        'name' => 'Cart 10%',
        'type' => 'percentage',
        'scope' => 'cart',
        'discount_value' => 10,
        'is_active' => true,
        'max_usage' => 0,
    ]);

    $service = new PromotionService;
    // Promo tanpa tier target → berlaku untuk semua, null tier_id juga cocok
    $result = $service->findBestCartPromo(100000, null);

    expect($result)->not->toBeNull();
    expect($result['discount'])->toBe(10000.0);
});

test('cart promo tier-gated only matches correct tier', function () {
    [$store] = setupPromoBaselineStore();

    $goldTierId = CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id');
    $bronzeTierId = CustomerTier::forStore($store->id)->where('name', 'Bronze')->value('id');

    Promotion::create([
        'store_id' => $store->id,
        'code' => 'GOLD20',
        'name' => 'Gold 20%',
        'type' => 'percentage',
        'scope' => 'cart',
        'discount_value' => 20,
        'customer_tier' => 'gold',
        'customer_tier_id' => $goldTierId,
        'is_active' => true,
        'max_usage' => 0,
    ]);

    $service = new PromotionService;

    $resultGold = $service->findBestCartPromo(100000, $goldTierId);
    expect($resultGold)->not->toBeNull();
    expect($resultGold['discount'])->toBe(20000.0);

    $resultBronze = $service->findBestCartPromo(100000, $bronzeTierId);
    expect($resultBronze)->toBeNull();
});

test('cart fixed_amount promo applies correctly', function () {
    [$store] = setupPromoBaselineStore();

    Promotion::create([
        'store_id' => $store->id,
        'code' => 'FIXED5K',
        'name' => 'Fixed 5K',
        'type' => 'fixed_amount',
        'scope' => 'cart',
        'discount_value' => 5000,
        'is_active' => true,
        'max_usage' => 0,
    ]);

    $service = new PromotionService;
    $result = $service->findBestCartPromo(50000, null);

    expect($result)->not->toBeNull();
    expect($result['discount'])->toBe(5000.0);
});

test('membership discount candidate returns null when customer has no active membership', function () {
    $service = new PromotionService;
    $result = $service->membershipDiscountCandidate(null, 100000);
    expect($result)->toBeNull();
});
