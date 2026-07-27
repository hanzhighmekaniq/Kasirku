<?php

/*
|--------------------------------------------------------------------------
| Stok produk di POS sesuai cabang aktif
|--------------------------------------------------------------------------
|
| Mengunci perbaikan: KasirController::index() dulu memuat relasi 'stocks'
| hanya difilter store_id, sehingga $product->stock menjumlahkan stok
| SEMUA cabang toko. Kasir di cabang 2 bisa melihat (dan menjual) stok
| yang sebenarnya cuma ada di cabang 1. Sekarang query juga difilter
| branch_id dari session, sama seperti pola di ProductController::index().
|
*/

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('kasir index hanya menampilkan stok produk milik cabang aktif, bukan gabungan semua cabang', function () {
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
        'user_id' => null, 'code' => 'TESTBR2'.uniqid(), 'name' => 'Test Store Dua Cabang',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch1 = Branch::create(['store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang 1', 'is_active' => true]);
    $branch2 = Branch::create(['store_id' => $store->id, 'code' => 'BR2', 'name' => 'Cabang 2', 'is_active' => true]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Kopi Sachet', 'sku' => 'KS-'.uniqid(), 'sell_price' => 5000,
        'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    // Stok berbeda di tiap cabang.
    ProductStock::create([
        'product_id' => $product->id, 'store_id' => $store->id, 'branch_id' => $branch1->id,
        'quantity' => 100, 'reserved_quantity' => 0, 'average_cost' => 3000,
    ]);
    ProductStock::create([
        'product_id' => $product->id, 'store_id' => $store->id, 'branch_id' => $branch2->id,
        'quantity' => 7, 'reserved_quantity' => 0, 'average_cost' => 3000,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'sale.create'], ['guard_id' => 1]));
    $user->assignRole($role);

    $this->actingAs($user);

    // Kasir sedang berada di Cabang 2 — stok yang tampil harus 7, bukan 107.
    session([
        'current_store_id' => $store->id,
        'branch_id' => $branch2->id,
        'current_branch_id' => $branch2->id,
    ]);

    $response = $this->get(route('admin.kasir.index'));
    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($product) {
        $products = collect($page->toArray()['props']['products']);
        $p = $products->firstWhere('id', $product->id);

        expect($p)->not->toBeNull();
        expect((float) $p['stock'])->toBe(7.0, 'Stok yang tampil harus milik cabang aktif (Cabang 2), bukan gabungan semua cabang');
    });
});

test('kasir index menampilkan stok cabang 1 saat kasir pindah ke cabang 1', function () {
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
        'user_id' => null, 'code' => 'TESTBR3'.uniqid(), 'name' => 'Test Store Dua Cabang 2',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch1 = Branch::create(['store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang 1', 'is_active' => true]);
    $branch2 = Branch::create(['store_id' => $store->id, 'code' => 'BR2', 'name' => 'Cabang 2', 'is_active' => true]);

    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id, 'category_id' => $category->id,
        'name' => 'Kopi Sachet', 'sku' => 'KS-'.uniqid(), 'sell_price' => 5000,
        'track_stock' => true, 'is_active' => true, 'is_sellable' => true,
    ]);

    ProductStock::create([
        'product_id' => $product->id, 'store_id' => $store->id, 'branch_id' => $branch1->id,
        'quantity' => 100, 'reserved_quantity' => 0, 'average_cost' => 3000,
    ]);
    ProductStock::create([
        'product_id' => $product->id, 'store_id' => $store->id, 'branch_id' => $branch2->id,
        'quantity' => 7, 'reserved_quantity' => 0, 'average_cost' => 3000,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'sale.create'], ['guard_id' => 1]));
    $user->assignRole($role);

    $this->actingAs($user);

    session([
        'current_store_id' => $store->id,
        'branch_id' => $branch1->id,
        'current_branch_id' => $branch1->id,
    ]);

    $response = $this->get(route('admin.kasir.index'));
    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($product) {
        $products = collect($page->toArray()['props']['products']);
        $p = $products->firstWhere('id', $product->id);

        expect($p)->not->toBeNull();
        expect((float) $p['stock'])->toBe(100.0, 'Stok yang tampil harus milik Cabang 1');
    });
});
