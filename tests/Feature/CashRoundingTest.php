<?php

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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('cash rounding adjustment is saved to sale', function () {
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'product', 'category', 'payment_method', 'customer'] as $code) {
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
        'sell_price' => 48730, 'cost_price' => 30000, 'track_stock' => false,
        'is_active' => true, 'is_sellable' => true,
    ]);

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

    // Grand total = 48730, rounding to nearest 100 = -30 (48700)
    $response = $this->postJson('/app/kasir/store', [
        'order_type' => 'dine_in',
        'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 48730]],
        'payments' => [['method_id' => $paymentMethod->id, 'amount' => 48700]],
        'rounding_adjustment' => -30,
    ]);

    $response->assertSuccessful();

    $sale = Sale::orderByDesc('id')->first();
    expect((float) $sale->rounding_adjustment)->toBe(-30.0);
    expect((float) $sale->grand_total)->toBe(48700.0);
    expect((float) $sale->paid_amount)->toBe(48700.0);
});
