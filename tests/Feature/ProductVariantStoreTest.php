<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Setup store + branch + user dengan permission product.edit, siap dipakai
 * test ProductVariantController.
 *
 * @return array{0: Store, 1: Branch, 2: User}
 */
function setupProductVariantTestContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $feature = Feature::create(['code' => 'product', 'label' => 'Produk', 'is_active' => true, 'sort_order' => 0]);
    $storeType->features()->attach($feature->id);

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach($feature->id);

    $store = Store::create([
        'user_id' => null, 'code' => 'TESTVAR'.uniqid(), 'name' => 'Test Store Variant',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main Branch', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $perm = Permission::create(['name' => 'product.edit', 'guard_id' => 1]);
    $role->givePermissionTo($perm);
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('menambah variant pertama mengaktifkan is_variant tapi tetap pertahankan harga produk-level', function () {
    [$store, $branch, $user] = setupProductVariantTestContext();
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Kaos Polos',
        'sku' => 'KPS-001',
        'sell_price' => 25000,
        'is_variant' => false,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    // Product-level pricing — harus tetap ada setelah variant dibuat (hybrid)
    $product->priceTiers()->create(['min_qty' => 12, 'price' => 20000]);
    $product->packagingUnits()->create(['name' => 'Lusin', 'conversion_qty' => 12, 'sell_price' => 240000]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->post(route('admin.products.variants.store', $product->id), [
            'name' => 'S',
            'sku' => 'KPS-001-S',
            'price' => 25000,
            'is_active' => true,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $product->refresh();

    // is_variant otomatis jadi true
    expect($product->is_variant)->toBeTrue();

    // Harga produk-level TETAP (hybrid: product masih bisa dijual)
    expect((float) $product->sell_price)->toBe(25000.0);

    // Product-level tiers dan units TETAP
    expect($product->priceTiers()->whereNull('variant_id')->count())->toBe(1);
    expect($product->packagingUnits()->whereNull('variant_id')->count())->toBe(1);

    // Variant baru terbuat
    expect($product->variants)->toHaveCount(1);
});

test('menambah variant kedua tidak membersihkan ulang data produk-level', function () {
    [$store, $branch, $user] = setupProductVariantTestContext();
    $category = Category::create(['store_id' => $store->id, 'name' => 'Umum']);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Kaos Polos',
        'sku' => 'KPS-002',
        'sell_price' => 0,
        'is_variant' => true,
        'track_stock' => true,
        'is_active' => true,
        'is_sellable' => true,
    ]);

    $product->variants()->create(['name' => 'S', 'sku' => 'KPS-002-S', 'price' => 25000, 'is_active' => true]);

    // Tier khusus variant lain — tidak boleh terpengaruh saat variant kedua dibuat
    $variantS = $product->variants()->first();
    $product->priceTiers()->create(['variant_id' => $variantS->id, 'min_qty' => 12, 'price' => 20000]);

    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id, 'branch_id' => $branch->id]);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->post(route('admin.products.variants.store', $product->id), [
            'name' => 'M',
            'sku' => 'KPS-002-M',
            'price' => 27000,
            'is_active' => true,
        ]);

    $response->assertSessionHasNoErrors();

    $product->refresh();

    expect($product->variants)->toHaveCount(2);
    // Tier variant S tetap ada, tidak dihapus oleh pembuatan variant kedua
    expect($product->priceTiers()->where('variant_id', $variantS->id)->count())->toBe(1);
});
