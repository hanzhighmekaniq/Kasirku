<?php

use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\CustomerTier;
use App\Models\Feature;
use App\Models\Membership;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Services\MembershipBenefitService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;

uses(RefreshDatabase::class);

function setupBenefitStore(): Store
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['customer', 'membership', 'promo'] as $code) {
        $feature = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($feature->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'BNF001', 'name' => 'Benefit Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    CustomerTier::seedDefaultsForStore($store->id);

    return $store;
}

/** Tier dinamis milik store, akses cepat via nama lowercase. */
function tierMap(Store $store): Collection
{
    return CustomerTier::forStore($store->id)->get()->keyBy(fn ($t) => strtolower($t->name));
}

function memberWithBenefits(Store $store, array $benefits, float $legacyDiscount = 0): Customer
{
    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'MBR'.fake()->unique()->numberBetween(100, 999),
        'name' => 'Paket '.fake()->unique()->word(),
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'discount_percent' => $legacyDiscount,
        'point_multiplier' => 1,
        'benefits' => $benefits,
        'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id,
        'code' => 'CST'.fake()->unique()->numberBetween(100, 999),
        'name' => 'Pelanggan',
        'tier' => 'bronze',
    ]);

    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->startOfDay(),
        'expired_date' => now()->addMonth(),
        'status' => 'active',
        'source' => 'manual',
    ]);

    return $customer;
}

test('benefit string lama dinormalisasi jadi custom_text', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, ['Gratis ongkir', 'Poin 2x']);

    $benefits = $customer->activeMembership()->membership->normalizedBenefits();

    expect($benefits)->toHaveCount(2);
    expect($benefits[0]['type'])->toBe('custom_text');
    expect($benefits[0]['label'])->toBe('Gratis ongkir');
});

test('diskon persen dinamis dipakai saat min belanja terpenuhi', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'discount_percent', 'label' => 'Diskon 10%', 'value' => 10, 'min_purchase' => 100000],
    ]);

    $service = app(MembershipBenefitService::class);

    expect($service->cartDiscount($customer, 200000)['discount'])->toBe(20000.0);
    expect($service->cartDiscount($customer, 50000))->toBeNull();
});

test('plafon max_amount membatasi diskon persen', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'discount_percent', 'label' => 'Diskon 10% maks 30rb', 'value' => 10, 'max_amount' => 30000],
    ]);

    expect(app(MembershipBenefitService::class)->cartDiscount($customer, 1000000)['discount'])
        ->toBe(30000.0);
});

test('diskon terbesar antara benefit dinamis dan discount_percent legacy yang menang', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'discount_amount', 'label' => 'Potongan 5rb', 'value' => 5000],
    ], legacyDiscount: 10);

    $result = app(MembershipBenefitService::class)->cartDiscount($customer, 100000);

    expect($result['discount'])->toBe(10000.0);
    expect($result['benefit_type'])->toBe('discount_percent');
});

test('diskon nominal tidak melebihi subtotal', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'discount_amount', 'label' => 'Potongan 50rb', 'value' => 50000],
    ]);

    expect(app(MembershipBenefitService::class)->cartDiscount($customer, 20000)['discount'])
        ->toBe(20000.0);
});

test('gratis ongkir menolkan biaya kirim', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'free_shipping', 'label' => 'Gratis ongkir'],
    ]);

    $waiver = app(MembershipBenefitService::class)->shippingWaiver($customer, 25000, 100000);

    expect($waiver['waived'])->toBe(25000.0);
    expect($waiver['remaining'])->toBe(0.0);
});

test('gratis ongkir dengan plafon hanya mensubsidi sebagian', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'free_shipping', 'label' => 'Subsidi ongkir 20rb', 'max_amount' => 20000],
    ]);

    $waiver = app(MembershipBenefitService::class)->shippingWaiver($customer, 30000, 100000);

    expect($waiver['waived'])->toBe(20000.0);
    expect($waiver['remaining'])->toBe(10000.0);
});

test('gratis ongkir tidak berlaku jika min belanja belum terpenuhi', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'free_shipping', 'label' => 'Gratis ongkir min 200rb', 'min_purchase' => 200000],
    ]);

    expect(app(MembershipBenefitService::class)->shippingWaiver($customer, 25000, 100000))
        ->toBeNull();
});

test('pelanggan tanpa membership tidak dapat benefit apa pun', function () {
    $store = setupBenefitStore();
    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CST999', 'name' => 'Non Member', 'tier' => 'bronze',
    ]);

    $service = app(MembershipBenefitService::class);

    expect($service->cartDiscount($customer, 500000))->toBeNull();
    expect($service->shippingWaiver($customer, 25000, 500000))->toBeNull();
    expect($service->freeProductEntitlements($customer, 500000))->toBe([]);
    expect($service->hasPriorityQueue($customer))->toBeFalse();
});

test('hak produk gratis dan prioritas antrean terbaca', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'free_product', 'label' => 'Gratis 1 kopi', 'product_id' => 7, 'quantity' => 2],
        ['type' => 'priority_queue', 'label' => 'Antrean prioritas'],
    ]);

    $service = app(MembershipBenefitService::class);
    $entitlements = $service->freeProductEntitlements($customer, 50000);

    expect($entitlements)->toHaveCount(1);
    expect($entitlements[0]['product_id'])->toBe(7);
    expect($entitlements[0]['quantity'])->toBe(2);
    expect($service->hasPriorityQueue($customer))->toBeTrue();
});

test('ringkasan untuk kasir memisahkan syarat diskon persen dan nominal', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'discount_percent', 'label' => 'Diskon 10%', 'value' => 10, 'min_purchase' => 100000, 'max_amount' => 30000],
        ['type' => 'discount_amount', 'label' => 'Potongan 5rb', 'value' => 5000, 'min_purchase' => 20000],
        ['type' => 'free_shipping', 'label' => 'Gratis ongkir', 'min_purchase' => 50000, 'max_amount' => 15000],
        ['type' => 'priority_queue', 'label' => 'Antrean prioritas'],
    ]);

    $summary = app(MembershipBenefitService::class)->summaryForCustomers([$customer->id]);
    $entry = $summary[$customer->id];

    // Syarat masing-masing diskon tidak boleh saling menimpa.
    expect($entry['percent'])->toBe(['value' => 10.0, 'min_purchase' => 100000.0, 'cap' => 30000.0]);
    expect($entry['amount'])->toBe(['value' => 5000.0, 'min_purchase' => 20000.0]);
    expect($entry['free_shipping'])->toBe(['active' => true, 'min_purchase' => 50000.0, 'cap' => 15000.0]);
    expect($entry['priority_queue'])->toBeTrue();
    expect($entry['labels'])->toHaveCount(4);
});

test('ringkasan memakai persen terbesar beserta syaratnya', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'discount_percent', 'label' => 'Diskon 5%', 'value' => 5, 'min_purchase' => 10000],
        ['type' => 'discount_percent', 'label' => 'Diskon 20%', 'value' => 20, 'min_purchase' => 500000],
    ]);

    $entry = app(MembershipBenefitService::class)->summaryForCustomers([$customer->id])[$customer->id];

    expect($entry['percent']['value'])->toBe(20.0);
    expect($entry['percent']['min_purchase'])->toBe(500000.0);
});

test('ringkasan hanya memuat pelanggan yang punya membership aktif', function () {
    $store = setupBenefitStore();
    $member = memberWithBenefits($store, [
        ['type' => 'discount_percent', 'label' => 'Diskon 5%', 'value' => 5],
    ]);
    $nonMember = Customer::create([
        'store_id' => $store->id, 'code' => 'CST888', 'name' => 'Non Member', 'tier' => 'bronze',
    ]);

    $summary = app(MembershipBenefitService::class)
        ->summaryForCustomers([$member->id, $nonMember->id]);

    expect($summary)->toHaveKey($member->id);
    expect($summary)->not->toHaveKey($nonMember->id);
});

test('ringkasan kosong saat tidak ada customer id', function () {
    setupBenefitStore();

    expect(app(MembershipBenefitService::class)->summaryForCustomers([]))->toBe([]);
});

test('kolom lama dinaikkan jadi benefit saat belum dimigrasi', function () {
    $store = setupBenefitStore();
    $tiers = tierMap($store);

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'LEGACY01',
        'name' => 'Paket Legacy',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'discount_percent' => 12,
        'point_multiplier' => 3,
        'maps_to_tier' => 'gold',
        'maps_to_tier_id' => $tiers['gold']?->id,
        'benefits' => null,
        'is_active' => true,
    ]);

    $types = collect($membership->normalizedBenefits())->pluck('type');

    expect($types)->toContain('discount_percent', 'point_multiplier', 'maps_to_tier');
    expect($membership->pointMultiplier())->toBe(3);
    expect($membership->mapsToTier()?->name)->toBe('Gold');
    expect($membership->tierRank())->toBe(3);
});

test('kolom lama tidak dobel kalau benefit bertipe sama sudah ada', function () {
    $store = setupBenefitStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'MIX01',
        'name' => 'Paket Campuran',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'discount_percent' => 12,
        'point_multiplier' => 3,
        'benefits' => [
            ['type' => 'discount_percent', 'label' => 'Diskon 20%', 'value' => 20],
        ],
        'is_active' => true,
    ]);

    $percentRows = collect($membership->normalizedBenefits())
        ->where('type', 'discount_percent');

    // Benefit eksplisit menang; kolom lama tidak menambah baris kedua.
    expect($percentRows)->toHaveCount(1);
    expect($percentRows->first()['value'])->toBe(20.0);
    // point_multiplier belum ada sebagai benefit, jadi kolom lama tetap dipakai.
    expect($membership->pointMultiplier())->toBe(3);
});

test('multiplier poin dan tier dibaca dari benefit', function () {
    $store = setupBenefitStore();
    $tiers = tierMap($store);
    $customer = memberWithBenefits($store, [
        ['type' => 'point_multiplier', 'label' => 'Poin 4x', 'value' => 4],
        ['type' => 'maps_to_tier', 'label' => 'Setara Platinum', 'tier' => 'platinum',
            'tier_id' => $tiers['platinum']?->id],
    ]);

    $membership = $customer->activeMembership()->membership;

    expect($membership->pointMultiplier())->toBe(4);
    expect($membership->mapsToTier()?->name)->toBe('Platinum');
    expect($membership->tierRank())->toBe(4);
});

test('tier di luar daftar yang dikenal diabaikan', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'maps_to_tier', 'label' => 'Setara Diamond', 'tier' => 'diamond'],
    ]);

    $membership = $customer->activeMembership()->membership;

    // 'diamond' tidak ada di customer_tiers toko, jadi resolusi harus null.
    expect($membership->mapsToTier())->toBeNull();
    expect($membership->tierRank())->toBe(0);
});

test('ringkasan kasir memuat multiplier poin dan tier', function () {
    $store = setupBenefitStore();
    $tiers = tierMap($store);
    $customer = memberWithBenefits($store, [
        ['type' => 'point_multiplier', 'label' => 'Poin 3x', 'value' => 3],
        ['type' => 'maps_to_tier', 'label' => 'Setara Gold', 'tier' => 'gold',
            'tier_id' => $tiers['gold']?->id],
    ]);

    $entry = app(MembershipBenefitService::class)
        ->summaryForCustomers([$customer->id])[$customer->id];

    expect($entry['point_multiplier'])->toBe(3);
    expect($entry['tier'])->toBe('Gold');
});

test('multiplier poin minimal 1 walau benefit tidak ada', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'custom_text', 'label' => 'Cuma teks'],
    ]);

    expect($customer->activeMembership()->membership->pointMultiplier())->toBe(1);
});

test('tipe benefit tidak dikenal diabaikan', function () {
    $store = setupBenefitStore();
    $customer = memberWithBenefits($store, [
        ['type' => 'teleportasi_gratis', 'label' => 'Ngawur', 'value' => 99],
        ['type' => 'discount_percent', 'label' => 'Diskon 5%', 'value' => 5],
    ]);

    $membership = $customer->activeMembership()->membership;

    expect($membership->normalizedBenefits())->toHaveCount(1);
    expect(app(MembershipBenefitService::class)->cartDiscount($customer, 100000)['discount'])
        ->toBe(5000.0);
});
