<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware();
    // Ensure permission exists in DB
    Permission::firstOrCreate(['name' => 'report.view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'sale.void', 'guard_name' => 'web']);
});

test('kasir or admin can view sales by employee report', function () {
    $type = StoreType::create(['name' => 'Retail', 'label' => 'Retail', 'code' => 'retail', 'pos_behavior' => 'retail']);
    $store = Store::create(['store_type_id' => $type->id, 'name' => 'Test Store', 'code' => 'TEST']);
    setPermissionsTeamId($store->id);
    $branch = Branch::create(['store_id' => $store->id, 'name' => 'Main', 'code' => 'MAIN']);
    $user = User::factory()->create();
    $user->stores()->attach($store->id);
    $user->update(['branch_id' => $branch->id]);
    session(['current_store_id' => $store->id]);

    $this->actingAs($user);
    $response = $this->get(route('admin.reports.sales-by-employee'));
    $response->assertStatus(200);
});

test('sales by employee report calculates correct values', function () {
    $type = StoreType::first() ?? StoreType::create(['name' => 'Retail', 'label' => 'Retail', 'code' => 'retail', 'pos_behavior' => 'retail']);
    $store = Store::create(['store_type_id' => $type->id, 'name' => 'Test Store 2', 'code' => 'TEST2']);
    setPermissionsTeamId($store->id);
    $branch = Branch::create(['store_id' => $store->id, 'name' => 'Main 2', 'code' => 'MAIN2']);

    // User 1
    $user1 = User::factory()->create(['name' => 'Cashier One']);
    $user1->stores()->attach($store->id);
    $user1->update(['branch_id' => $branch->id]);

    // User 2
    $user2 = User::factory()->create(['name' => 'Cashier Two']);
    $user2->stores()->attach($store->id);
    $user2->update(['branch_id' => $branch->id]);

    session(['current_store_id' => $store->id]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => Category::create(['store_id' => $store->id, 'name' => 'Food'])->id,
        'name' => 'Test Product',
        'sku' => 'SKU-001',
        'sell_price' => 50,
        'track_stock' => false,
    ]);

    // User 1 makes 2 sales, total 100
    Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user1->id,
        'sale_no' => 'SALE-1',
        'status' => 'completed',
        'sale_date' => Carbon::now(),
        'grand_total' => 40,
        'subtotal' => 40,
    ]);
    Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user1->id,
        'sale_no' => 'SALE-2',
        'status' => 'completed',
        'sale_date' => Carbon::now(),
        'grand_total' => 60,
        'subtotal' => 60,
    ]);

    // User 2 makes 1 sale, total 50
    Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user2->id,
        'sale_no' => 'SALE-3',
        'status' => 'completed',
        'sale_date' => Carbon::now(),
        'grand_total' => 50,
        'subtotal' => 50,
    ]);

    $user1->givePermissionTo('report.view');
    $user1->givePermissionTo('sale.void');
    $this->actingAs($user1);
    $response = $this->get(route('admin.reports.sales-by-employee'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Reports/SalesByEmployee')
        ->has('summary')
        ->where('summary.total_transaksi', 3)
        ->where('summary.total_pendapatan', 150)
    );
});
