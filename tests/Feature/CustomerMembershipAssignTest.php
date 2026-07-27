<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerMembership;
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

function setUpMembershipTestContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $customerFeature = Feature::create(['code' => 'customer', 'label' => 'Customer', 'is_active' => true, 'sort_order' => 0]);
    $membershipFeature = Feature::create(['code' => 'membership', 'label' => 'Membership', 'is_active' => true, 'sort_order' => 1]);
    $storeType->features()->attach([$customerFeature->id, $membershipFeature->id]);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach([$customerFeature->id, $membershipFeature->id]);

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create(['store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST001', 'name' => 'Budi', 'tier' => 'bronze',
    ]);

    $membership = Membership::create([
        'store_id' => $store->id, 'code' => 'GOLD01', 'name' => 'Gold Member',
        'duration_type' => 'month', 'duration_value' => 1,
        'price' => 100000, 'discount_percent' => 10, 'point_multiplier' => 2,
        'maps_to_tier' => 'gold', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $permView = Permission::create(['name' => 'customer.view', 'guard_id' => 1]);
    $permEdit = Permission::create(['name' => 'customer.edit', 'guard_id' => 1]);
    $role->givePermissionTo([$permView, $permEdit]);
    $user->assignRole($role);

    return compact('store', 'branch', 'customer', 'membership', 'user');
}

test('assigning membership creates active customer membership and syncs tier', function () {
    ['store' => $store, 'branch' => $branch, 'customer' => $customer, 'membership' => $membership, 'user' => $user] =
        setUpMembershipTestContext();

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $response = $this->post("/app/customers/{$customer->id}/assign-membership", [
        'membership_id' => $membership->id,
    ]);

    $response->assertRedirect();

    $customer->refresh();
    expect($customer->tier)->toBe('gold');

    $customerMembership = CustomerMembership::where('customer_id', $customer->id)->first();
    expect($customerMembership)->not->toBeNull();
    expect($customerMembership->status)->toBe('active');
    expect($customerMembership->membership_id)->toBe($membership->id);
    expect($customerMembership->expired_date->toDateString())
        ->toBe(now()->startOfDay()->addMonth()->toDateString());
});

test('assigning a new membership cancels the previous active membership', function () {
    ['store' => $store, 'branch' => $branch, 'customer' => $customer, 'membership' => $membership, 'user' => $user] =
        setUpMembershipTestContext();

    $silverMembership = Membership::create([
        'store_id' => $store->id, 'code' => 'SILVER01', 'name' => 'Silver Member',
        'duration_type' => 'month', 'duration_value' => 1,
        'price' => 50000, 'discount_percent' => 5, 'point_multiplier' => 1,
        'maps_to_tier' => 'silver', 'is_active' => true,
    ]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->post("/app/customers/{$customer->id}/assign-membership", [
        'membership_id' => $silverMembership->id,
    ])->assertRedirect();

    $this->post("/app/customers/{$customer->id}/assign-membership", [
        'membership_id' => $membership->id,
    ])->assertRedirect();

    $customer->refresh();
    expect($customer->tier)->toBe('gold');
    expect(CustomerMembership::where('customer_id', $customer->id)->where('status', 'active')->count())->toBe(1);
    expect(CustomerMembership::where('customer_id', $customer->id)->where('status', 'cancelled')->count())->toBe(1);
});

test('revoking membership resets customer tier to bronze', function () {
    ['store' => $store, 'branch' => $branch, 'customer' => $customer, 'membership' => $membership, 'user' => $user] =
        setUpMembershipTestContext();

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    $this->post("/app/customers/{$customer->id}/assign-membership", [
        'membership_id' => $membership->id,
    ])->assertRedirect();

    $customerMembership = CustomerMembership::where('customer_id', $customer->id)->first();

    $response = $this->delete("/app/customer-memberships/{$customerMembership->id}");
    $response->assertRedirect();

    $customer->refresh();
    $customerMembership->refresh();

    expect($customerMembership->status)->toBe('cancelled');
    expect($customer->tier)->toBe('bronze');
});
