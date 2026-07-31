<?php

use App\Models\BusinessTemplate;
use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function registrationPrerequisites(): array
{
    test()->seed(PermissionSeeder::class);

    $storeType = StoreType::create([
        'code' => 'fnb',
        'label' => 'F&B',
        'icon' => '☕',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $template = BusinessTemplate::create([
        'store_type_id' => $storeType->id,
        'code' => 'fnb_cafe',
        'label' => 'Cafe / Coffee Shop',
        'icon' => '☕',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $category = $template->categories()->create(['name' => 'Minuman Kopi', 'sort_order' => 1]);
    $category->products()->create([
        'sku' => 'FC-001',
        'name' => 'Espresso',
        'unit' => 'cup',
        'cost_price' => 5000,
        'sell_price' => 18000,
    ]);
    $template->syncIsReady();

    $plan = Plan::create([
        'code' => 'business',
        'label' => 'Business',
        'price' => 79000,
        'trial_days' => 14,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    return [$storeType, $template, $plan];
}

test('registration screen can be rendered', function () {
    registrationPrerequisites();

    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register with a business template and trial plan', function () {
    [$storeType, $template, $plan] = registrationPrerequisites();

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'store_type_id' => $storeType->id,
        'business_template_code' => $template->code,
        'plan_id' => $plan->id,
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('admin.dashboard', absolute: false));

    $user = User::where('email', 'test@example.com')->first();
    expect($user)->not->toBeNull();

    $store = Store::whereIn('id', $user->stores()->pluck('stores.id'))->first();
    expect($store)->not->toBeNull();
    expect($store->user_id)->toBe($user->id);
    expect($store->store_type_id)->toBe($storeType->id);
    expect($store->plan_id)->toBe($plan->id);
    expect($store->plan_expires_at)->not->toBeNull();
    expect($store->plan_expires_at->isSameDay(now()->addDays(14)))->toBeTrue();

    expect($store->branches()->count())->toBe(1);
    expect($store->paymentMethods()->count())->toBe(2);

    expect(Category::where('store_id', $store->id)->count())->toBeGreaterThan(0);
    expect(Product::where('store_id', $store->id)->count())->toBeGreaterThan(0);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $freshUser = User::find($user->id);
    expect($freshUser->hasRole('owner'))->toBeTrue();
});

test('new users can register without picking a business template (mulai kosong)', function () {
    [$storeType, , $plan] = registrationPrerequisites();

    $response = $this->post('/register', [
        'name' => 'Empty Store User',
        'email' => 'empty@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'plan_id' => $plan->id,
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('admin.dashboard', absolute: false));

    $user = User::where('email', 'empty@example.com')->first();
    $store = Store::whereIn('id', $user->stores()->pluck('stores.id'))->first();

    expect(Category::where('store_id', $store->id)->count())->toBe(0);
    expect(Product::where('store_id', $store->id)->count())->toBe(0);
});

test('registration requires store type and plan', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test2@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors(['store_type_id', 'plan_id']);
    $this->assertGuest();
});
