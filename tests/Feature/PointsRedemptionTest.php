<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware();
});

test('can redeem points during sale', function () {
    $type = StoreType::first() ?? StoreType::create(['name' => 'Retail', 'label' => 'Retail', 'code' => 'retail', 'pos_behavior' => 'retail']);
    $store = Store::create(['store_type_id' => $type->id, 'name' => 'Test', 'code' => 'TEST', 'point_value' => 1000]);
    $branch = Branch::create(['store_id' => $store->id, 'name' => 'Main', 'code' => 'MAIN']);
    $user = User::factory()->create();
    $user->stores()->attach($store->id);
    $user->update(['branch_id' => $branch->id]);
    session(['current_store_id' => $store->id]);

    // Create customer with 5 points (worth 5000)
    $customer = Customer::create(['store_id' => $store->id, 'name' => 'John', 'code' => 'C01', 'points' => 5]);

    // Product worth 20000
    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => Category::create(['store_id' => $store->id, 'name' => 'Food'])->id,
        'name' => 'Food',
        'sku' => 'SKU01',
        'sell_price' => 20000,
        'track_stock' => false,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('admin.kasir.store'), [
        'customer_id' => $customer->id,
        'order_type' => 'takeaway',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 20000],
        ],
        'subtotal' => 20000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'grand_total' => 15000, // 20000 - 5000 points
        'redeem_points' => 5, // Redeeming 5 points
        'payments' => [
            ['method_id' => PaymentMethod::create(['store_id' => $store->id, 'name' => 'Cash', 'type' => 'cash', 'code' => 'CASH'])->id, 'amount' => 15000],
        ],
    ]);

    $response->assertStatus(200);

    // Check points deducted
    $this->assertEquals(0, $customer->fresh()->points);

    // Check log created
    $this->assertDatabaseHas('customer_point_logs', [
        'customer_id' => $customer->id,
        'type' => 'redeem',
        'points' => -5,
        'balance_after' => 0,
    ]);
});
