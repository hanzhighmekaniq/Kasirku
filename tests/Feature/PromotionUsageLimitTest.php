<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('promo stops applying after max_usage is reached', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'product', 'category', 'payment_method', 'customer', 'promo'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'TEST001', 'name' => 'Test Store',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create(['store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main', 'is_active' => true]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Test Product', 'code' => 'PRD001', 'sku' => 'SKU001',
        'sell_price' => 10000, 'cost_price' => 5000, 'track_stock' => false,
        'is_active' => true, 'is_sellable' => true,
    ]);

    $promo = Promotion::create([
        'store_id' => $store->id, 'code' => 'DISC10', 'name' => 'Diskon 10%',
        'type' => 'percentage', 'scope' => 'item', 'discount_value' => 10,
        'is_active' => true, 'max_usage' => 1, 'used_count' => 0,
    ]);
    $promo->products()->attach($product->id);

    $paymentMethod = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'cash', 'name' => 'Tunai',
        'type' => 'cash', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner', 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'sale.create', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'branch_id' => $branch->id]);

    // First transaction — promo should apply
    $response1 = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 10000]],
        'payments' => [['method_id' => $paymentMethod->id, 'amount' => 9000]],
    ]);
    $response1->assertSuccessful();

    // used_count should be 1
    $promo->refresh();
    expect($promo->used_count)->toBe(1);

    // Second transaction — promo should NOT apply (max_usage=1 reached)
    $response2 = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 10000]],
        'payments' => [['method_id' => $paymentMethod->id, 'amount' => 10000]],
    ]);
    $response2->assertSuccessful();

    // used_count should still be 1 (not incremented because promo didn't apply)
    $promo->refresh();
    expect($promo->used_count)->toBe(1);
});
