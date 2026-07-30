<?php

use App\Models\Branch;
use App\Models\CustomerTier;
use App\Models\Feature;
use App\Models\Membership;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * Store dengan fitur membership aktif dan user yang punya permission
 * membership.view — satu-satunya permission yang menjaga rute membership.
 *
 * @return array{0: Store, 1: Branch, 2: User}
 */
function setupMembershipFormStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $features = [];
    foreach (['basic_pos', 'product', 'customer', 'membership'] as $code) {
        $features[$code] = Feature::create([
            'code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0,
        ]);
    }
    $storeType->features()->attach(collect($features)->pluck('id'));

    $plan = Plan::create([
        'code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0,
    ]);
    $plan->features()->attach(collect($features)->pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'MBRFRM1', 'name' => 'Membership Form Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    // Tier bawaan diperlukan untuk validasi benefit tier_id.
    CustomerTier::seedDefaultsForStore($store->id);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    // sale.void ikut diberikan karena BranchMiddleware memakainya untuk
    // membedakan owner dari kasir; tanpa itu request dialihkan ke dashboard.
    foreach (['membership.view', 'sale.void'] as $permName) {
        $role->givePermissionTo(Permission::create(['name' => $permName, 'guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

function membershipFormPayload(array $benefits, array $overrides = []): array
{
    return array_merge([
        'code' => 'PKT01',
        'name' => 'Paket Uji',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'is_sellable_at_pos' => false,
        'is_active' => true,
        'benefits' => $benefits,
    ], $overrides);
}

test('membership bisa dibuat tanpa kolom diskon, poin, dan tier', function () {
    [$store, $branch, $user] = setupMembershipFormStore();
    $goldId = CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id');

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->post(route('admin.memberships.store'), membershipFormPayload([
        ['type' => 'discount_percent', 'label' => 'Diskon 10%', 'value' => 10],
        ['type' => 'point_multiplier', 'label' => 'Poin 3x', 'value' => 3],
        ['type' => 'maps_to_tier', 'label' => 'Setara Gold', 'tier_id' => $goldId],
    ]))->assertSessionHasNoErrors()->assertRedirect();

    $membership = Membership::where('store_id', $store->id)->firstOrFail();

    expect($membership->pointMultiplier())->toBe(3);
    expect($membership->mapsToTier()?->name)->toBe('Gold');
    expect(collect($membership->benefits)->pluck('type')->all())
        ->toBe(['discount_percent', 'point_multiplier', 'maps_to_tier']);
});

test('kolom lama ikut diturunkan dari benefit saat disimpan', function () {
    [$store, $branch, $user] = setupMembershipFormStore();
    $platId = CustomerTier::forStore($store->id)->where('name', 'Platinum')->value('id');

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->post(route('admin.memberships.store'), membershipFormPayload([
        ['type' => 'discount_percent', 'label' => 'Diskon 15%', 'value' => 15],
        ['type' => 'point_multiplier', 'label' => 'Poin 4x', 'value' => 4],
        ['type' => 'maps_to_tier', 'label' => 'Setara Platinum', 'tier_id' => $platId],
    ]))->assertRedirect();

    $membership = Membership::where('store_id', $store->id)->firstOrFail();

    expect((float) $membership->discount_percent)->toBe(15.0);
    expect($membership->point_multiplier)->toBe(4);
    expect($membership->maps_to_tier)->toBe('platinum');
});

test('diskon bersyarat tidak diturunkan ke kolom lama', function () {
    [$store, $branch, $user] = setupMembershipFormStore();

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->post(route('admin.memberships.store'), membershipFormPayload([
        ['type' => 'discount_percent', 'label' => 'Diskon 20% min 500rb', 'value' => 20, 'min_purchase' => 500000],
    ]))->assertRedirect();

    $membership = Membership::where('store_id', $store->id)->firstOrFail();

    // Kolom lama tidak bisa menyimpan syarat min belanja. Kalau nilainya tetap
    // dituliskan, konsumen kolom itu akan memberi diskon 20% tanpa syarat.
    expect((float) $membership->discount_percent)->toBe(0.0);
    expect($membership->benefitOfType('discount_percent')['value'])->toBe(20.0);
});

test('menghapus benefit menetralkan kolom lamanya', function () {
    [$store, $branch, $user] = setupMembershipFormStore();

    $membership = Membership::create([
        'store_id' => $store->id,
        'code' => 'PKT01',
        'name' => 'Paket Uji',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 0,
        'discount_percent' => 10,
        'point_multiplier' => 3,
        'maps_to_tier' => 'gold',
        'benefits' => [
            ['type' => 'discount_percent', 'label' => 'Diskon 10%', 'value' => 10],
        ],
        'is_active' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    // Semua benefit otomatis dibuang, sisa teks saja.
    $this->patch(route('admin.memberships.update', $membership), membershipFormPayload([
        ['type' => 'custom_text', 'label' => 'Cuma informasi'],
    ]))->assertRedirect();

    $membership->refresh();

    // Kolom lama wajib dinetralkan. Kalau tidak, fallback di normalizedBenefits()
    // akan membangkitkan lagi benefit yang baru saja dihapus owner.
    expect((float) $membership->discount_percent)->toBe(0.0);
    expect($membership->point_multiplier)->toBe(1);
    expect($membership->maps_to_tier)->toBeNull();
    expect(collect($membership->normalizedBenefits())->pluck('type')->all())
        ->toBe(['custom_text']);
});

test('tipe benefit sekali pakai tidak boleh dobel', function () {
    [$store, $branch, $user] = setupMembershipFormStore();

    $silverId = CustomerTier::forStore($store->id)->where('name', 'Silver')->value('id');
    $goldId = CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id');

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->post(route('admin.memberships.store'), membershipFormPayload([
        ['type' => 'maps_to_tier', 'label' => 'Setara Silver', 'tier_id' => $silverId],
        ['type' => 'maps_to_tier', 'label' => 'Setara Gold', 'tier_id' => $goldId],
    ]))->assertRedirect();

    $membership = Membership::where('store_id', $store->id)->firstOrFail();
    $tierRows = collect($membership->benefits)->where('type', 'maps_to_tier');

    // Baris pertama yang menang; sisanya dibuang.
    expect($tierRows)->toHaveCount(1);
    expect($tierRows->first()['tier_id'])->toBe($silverId);
});

test('tier tidak valid ditolak validasi', function () {
    [$store, $branch, $user] = setupMembershipFormStore();

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    // ID 99999 tidak ada di customer_tiers → validasi Rule::exists gagal.
    $this->post(route('admin.memberships.store'), membershipFormPayload([
        ['type' => 'maps_to_tier', 'label' => 'Setara Tidak Ada', 'tier_id' => 99999],
    ]))->assertSessionHasErrors('benefits.0.tier_id');

    expect(Membership::where('store_id', $store->id)->count())->toBe(0);
});

test('benefit tier tanpa tier terpilih dibuang', function () {
    [$store, $branch, $user] = setupMembershipFormStore();

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->post(route('admin.memberships.store'), membershipFormPayload([
        ['type' => 'maps_to_tier', 'label' => 'Belum pilih tier', 'tier_id' => null],
        ['type' => 'custom_text', 'label' => 'Informasi lain'],
    ]))->assertRedirect();

    $membership = Membership::where('store_id', $store->id)->firstOrFail();

    expect(collect($membership->benefits)->pluck('type')->all())->toBe(['custom_text']);
    expect($membership->maps_to_tier)->toBeNull();
});
