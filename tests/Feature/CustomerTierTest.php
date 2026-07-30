<?php

use App\Models\Branch;
use App\Models\Customer;
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
 * Setup store lengkap dengan permission membership.view & sale.void
 * (diperlukan BranchMiddleware & permission check).
 *
 * @return array{0: Store, 1: Branch, 2: User}
 */
function setupTierTestStore(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['customer', 'membership'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'TIER001', 'name' => 'Tier Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    foreach (['membership.view', 'sale.void'] as $permName) {
        $role->givePermissionTo(Permission::create(['name' => $permName, 'guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('index auto seeds default tiers when store has none', function () {
    [$store, $branch, $user] = setupTierTestStore();

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    expect(CustomerTier::forStore($store->id)->count())->toBe(0);

    $response = $this->get(route('admin.customer-tiers.index'));
    $response->assertSuccessful();

    // Otomatis ter-seed 4 tier bawaan (Bronze, Silver, Gold, Platinum)
    expect(CustomerTier::forStore($store->id)->count())->toBe(4);
});

test('store creates new tier at highest rank', function () {
    [$store, $branch, $user] = setupTierTestStore();
    CustomerTier::seedDefaultsForStore($store->id);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->post(route('admin.customer-tiers.store'), [
        'name' => 'Sultan',
        'color' => 'indigo',
        'is_active' => true,
    ]);

    $response->assertRedirect();

    $tier = CustomerTier::forStore($store->id)->where('name', 'Sultan')->firstOrFail();
    expect($tier->rank)->toBe(5); // 4 bawaan + 1 baru = rank 5
});

test('duplicate tier name per store is rejected', function () {
    [$store, $branch, $user] = setupTierTestStore();
    CustomerTier::seedDefaultsForStore($store->id);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->post(route('admin.customer-tiers.store'), [
        'name' => 'Gold', // sudah ada
        'color' => 'yellow',
    ]);

    $response->assertSessionHasErrors('name');
});

test('reorder updates ranks atomically from lowest to highest', function () {
    [$store, $branch, $user] = setupTierTestStore();
    CustomerTier::seedDefaultsForStore($store->id);

    $tiers = CustomerTier::forStore($store->id)->ranked()->get();
    $gold = $tiers->firstWhere('name', 'Gold');
    $bronze = $tiers->firstWhere('name', 'Bronze');
    $silver = $tiers->firstWhere('name', 'Silver');
    $platinum = $tiers->firstWhere('name', 'Platinum');

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    // Urutan baru: Gold (rank 1), Bronze (rank 2), Silver (rank 3), Platinum (rank 4)
    $response = $this->postJson(route('admin.customer-tiers.reorder'), [
        'ids' => [$gold->id, $bronze->id, $silver->id, $platinum->id],
    ]);

    $response->assertSuccessful();

    expect($gold->fresh()->rank)->toBe(1);
    expect($bronze->fresh()->rank)->toBe(2);
    expect($silver->fresh()->rank)->toBe(3);
    expect($platinum->fresh()->rank)->toBe(4);
});

test('tier in use cannot be deleted', function () {
    [$store, $branch, $user] = setupTierTestStore();
    CustomerTier::seedDefaultsForStore($store->id);

    $gold = CustomerTier::forStore($store->id)->where('name', 'Gold')->firstOrFail();

    Customer::create([
        'store_id' => $store->id,
        'code' => 'CST001',
        'name' => 'Member Gold',
        'customer_tier_id' => $gold->id,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->delete(route('admin.customer-tiers.destroy', $gold->id));
    $response->assertRedirect();
    $response->assertSessionHas('error');

    expect(CustomerTier::where('id', $gold->id)->exists())->toBeTrue();
});

test('last remaining tier cannot be deleted', function () {
    [$store, $branch, $user] = setupTierTestStore();

    $onlyTier = CustomerTier::create([
        'store_id' => $store->id, 'name' => 'Satu-Satunya', 'rank' => 1, 'color' => 'slate',
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->delete(route('admin.customer-tiers.destroy', $onlyTier->id));
    $response->assertSessionHas('error');

    expect(CustomerTier::where('id', $onlyTier->id)->exists())->toBeTrue();
});
