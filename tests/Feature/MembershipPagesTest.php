<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerMembership;
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
 * Halaman Create/Edit/Show membership.
 *
 * Form membership dipindah dari modal di halaman index ke halaman sendiri,
 * jadi rute baru dan redirect-nya perlu dijaga: setelah simpan harus mendarat
 * di halaman detail, bukan kembali ke index lewat back().
 *
 * Setup store ditulis lokal (bukan memakai helper dari file test lain) supaya
 * file ini bisa dijalankan sendiri tanpa bergantung urutan pemuatan test.
 *
 * @return array{0: Store, 1: Branch, 2: User}
 */
function actAsMembershipOwner(): array
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
        'user_id' => null, 'code' => 'MBRPG'.uniqid(), 'name' => 'Membership Pages Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    CustomerTier::seedDefaultsForStore($store->id);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    // sale.void ikut diberikan karena BranchMiddleware memakainya untuk
    // membedakan owner dari kasir; tanpa itu request dialihkan ke dashboard.
    foreach (['membership.view', 'sale.void'] as $permName) {
        $role->givePermissionTo(Permission::create(['name' => $permName, 'guard_id' => 1]));
    }
    $user->assignRole($role);

    test()->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    return [$store, $branch, $user];
}

function makeMembership(int $storeId, array $overrides = []): Membership
{
    return Membership::create(array_merge([
        'store_id' => $storeId,
        'code' => 'GOLD01',
        'name' => 'Gold Member',
        'description' => 'Paket unggulan',
        'duration_type' => 'month',
        'duration_value' => 3,
        'price' => 150000,
        'is_sellable_at_pos' => true,
        'is_active' => true,
    ], $overrides));
}

test('halaman create menampilkan katalog benefit, produk, dan tier', function () {
    [$store] = actAsMembershipOwner();

    $response = $this->get(route('admin.memberships.create'));

    $response->assertOk();
    $response->assertInertia(function ($page) {
        $page->component('Admin/Memberships/Create')
            ->has('benefitTypes')
            ->has('products')
            ->has('customerTiers');
    });
});

test('menyimpan membership mengarahkan ke halaman detail, bukan kembali ke index', function () {
    [$store, $branch] = actAsMembershipOwner();
    $goldId = CustomerTier::forStore($store->id)->where('name', 'Gold')->value('id');

    $response = $this->post(route('admin.memberships.store'), [
        'code' => 'SLV01',
        'name' => 'Silver Member',
        'duration_type' => 'month',
        'duration_value' => 1,
        'price' => 50000,
        'is_sellable_at_pos' => false,
        'is_active' => true,
        'benefits' => [
            ['type' => 'discount_percent', 'label' => 'Diskon 5%', 'value' => 5],
            ['type' => 'maps_to_tier', 'label' => 'Setara Gold', 'tier_id' => $goldId],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $membership = Membership::where('store_id', $store->id)
        ->where('code', 'SLV01')
        ->firstOrFail();

    $response->assertRedirect(route('admin.memberships.show', $membership->id));
});

test('halaman edit memuat data membership beserta benefitnya', function () {
    [$store] = actAsMembershipOwner();
    $membership = makeMembership($store->id);

    $response = $this->get(route('admin.memberships.edit', $membership->id));

    $response->assertOk();
    $response->assertInertia(function ($page) use ($membership) {
        $page->component('Admin/Memberships/Edit')
            ->where('membership.id', $membership->id)
            ->where('membership.code', 'GOLD01')
            ->has('membership.benefits')
            ->has('benefitTypes')
            ->has('customerTiers');
    });
});

test('memperbarui membership mengarahkan ke halaman detailnya', function () {
    [$store] = actAsMembershipOwner();
    $membership = makeMembership($store->id);

    $response = $this->patch(route('admin.memberships.update', $membership->id), [
        'code' => 'GOLD01',
        'name' => 'Gold Member Plus',
        'duration_type' => 'month',
        'duration_value' => 6,
        'price' => 200000,
        'is_sellable_at_pos' => true,
        'is_active' => true,
        'benefits' => [],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('admin.memberships.show', $membership->id));

    expect($membership->fresh()->name)->toBe('Gold Member Plus');
    expect($membership->fresh()->duration_value)->toBe(6);
});

test('halaman show mengirim statistik anggota dan daftar anggota terbaru', function () {
    [$store] = actAsMembershipOwner();
    $membership = makeMembership($store->id);

    $customer = Customer::create([
        'store_id' => $store->id,
        'code' => 'CST-1',
        'name' => 'Budi',
        'phone' => '08123',
    ]);

    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->subDay(),
        'expired_date' => now()->addMonth(),
        'status' => 'active',
        'source' => 'manual',
    ]);

    CustomerMembership::create([
        'customer_id' => $customer->id,
        'membership_id' => $membership->id,
        'start_date' => now()->subYear(),
        'expired_date' => now()->subMonths(6),
        'status' => 'expired',
        'source' => 'purchase',
    ]);

    $response = $this->get(route('admin.memberships.show', $membership->id));

    $response->assertOk();
    $response->assertInertia(function ($page) use ($membership) {
        $page->component('Admin/Memberships/Show')
            ->where('membership.id', $membership->id)
            ->where('stats.total_members', 2)
            ->where('stats.active_members', 1)
            ->where('stats.expired_members', 1)
            ->has('recentMembers', 2)
            ->where('recentMembers.0.customer.name', 'Budi');
    });
});

test('membership milik toko lain tidak bisa dilihat atau diedit', function () {
    [$store] = actAsMembershipOwner();

    // Store kedua dengan membership sendiri.
    $otherStore = Store::create([
        'user_id' => null,
        'code' => 'OTHER1',
        'name' => 'Toko Lain',
        'store_type_id' => $store->store_type_id,
        'plan_id' => $store->plan_id,
    ]);

    $foreign = makeMembership($otherStore->id, ['code' => 'FRGN01']);

    // `abort_unless(..., 404)` di controller memang jalan, tapi handler global
    // di bootstrap/app.php mengubah NotFoundHttpException menjadi redirect ke
    // dashboard untuk user yang sudah login. Jadi yang dijaga di sini adalah
    // hasil akhirnya: data toko lain tidak pernah sampai ke halaman.
    $this->get(route('admin.memberships.show', $foreign->id))
        ->assertRedirect(route('admin.dashboard'));

    $this->get(route('admin.memberships.edit', $foreign->id))
        ->assertRedirect(route('admin.dashboard'));

    // Sebagai pembanding, membership milik toko sendiri tetap bisa dibuka.
    $own = makeMembership($store->id, ['code' => 'OWN01']);
    $this->get(route('admin.memberships.show', $own->id))->assertOk();
});

test('menghapus membership mengarahkan ke index', function () {
    [$store] = actAsMembershipOwner();
    $membership = makeMembership($store->id);

    $response = $this->delete(route('admin.memberships.destroy', $membership->id));

    $response->assertRedirect(route('admin.memberships.index'));
    expect(Membership::find($membership->id))->toBeNull();
});
