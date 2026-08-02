<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware();
});

test('kasir or admin can view profit loss report', function () {
    $this->withoutMiddleware();
    // Create the store type first
    $type = StoreType::create(['name' => 'Retail', 'label' => 'Retail', 'code' => 'retail', 'pos_behavior' => 'retail']);
    $store = Store::create(['store_type_id' => $type->id, 'name' => 'Test Store', 'code' => 'TEST']);
    setPermissionsTeamId($store->id);
    $branch = Branch::create(['store_id' => $store->id, 'name' => 'Main', 'code' => 'MAIN']);
    $user = User::factory()->create();
    $user->stores()->attach($store->id);
    $user->update(['branch_id' => $branch->id]);
    session(['current_store_id' => $store->id]);

    // Give permission
    // $user->givePermissionTo('report.view');

    $this->actingAs($user);

    $response = $this->get(route('admin.reports.profit-loss'));

    $response->assertStatus(200);
});

test('profit loss report calculates correct values', function () {
    $this->withoutMiddleware();
    // Create the store type first
    $type = StoreType::create(['name' => 'Retail', 'label' => 'Retail', 'code' => 'retail', 'pos_behavior' => 'retail']);
    $store = Store::create(['store_type_id' => $type->id, 'name' => 'Test Store', 'code' => 'TEST']);
    setPermissionsTeamId($store->id);
    $branch = Branch::create(['store_id' => $store->id, 'name' => 'Main', 'code' => 'MAIN']);
    $user = User::factory()->create();
    $user->stores()->attach($store->id);
    $user->update(['branch_id' => $branch->id]);
    session(['current_store_id' => $store->id]);

    // $user->givePermissionTo('report.view');
    // $user->givePermissionTo('sale.void'); // can view all branches

    // Create a product with cost 10, sell 20
    $category = Category::create(['store_id' => $store->id, 'name' => 'Food']);
    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Test Product',
        'sku' => 'TEST-01',
        'sell_price' => 20,
        'track_stock' => false,
    ]);

    ProductStock::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'product_id' => $product->id,
        'average_cost' => 10,
        'quantity' => 10,
    ]);

    // Create a sale for 2 items (Revenue 40, COGS 20, GP 20)
    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'sale_no' => 'SALE-01',
        'status' => 'completed',
        'sale_date' => Carbon::today(),
        'grand_total' => 40,
        'subtotal' => 40,
    ]);
    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 2,
        'price' => 20,
        'subtotal' => 40,
    ]);

    // Create an expense for 5
    $expenseCat = ExpenseCategory::create(['store_id' => $store->id, 'name' => 'Utility', 'code' => 'UTIL']);
    Expense::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'expense_no' => 'EXP-01',
        'expense_category_id' => $expenseCat->id,
        'amount' => 5,
        'expense_date' => Carbon::today(),
    ]);

    $this->actingAs($user);
    $response = $this->get(route('admin.reports.profit-loss'));

    $response->assertStatus(200);
});
