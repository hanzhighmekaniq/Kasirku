<?php

/*
|--------------------------------------------------------------------------
| Onboarding — Buat Toko Setelah Registrasi
|--------------------------------------------------------------------------
|
| User yang baru registrasi (belum punya toko) diarahkan ke halaman
| onboarding. Di sini user memilih plan, jenis usaha, dan nama toko.
| Setelah submit, store dibuat dan user masuk dashboard.
|
*/

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

function onboardingPrerequisites(): array
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

    $freePlan = Plan::create([
        'code' => 'free',
        'label' => 'Free',
        'price' => 0,
        'trial_days' => 0,
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $businessPlan = Plan::create([
        'code' => 'business',
        'label' => 'Business',
        'price' => 79000,
        'trial_days' => 14,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    return [$storeType, $template, $freePlan, $businessPlan];
}

function createFreshUser(Plan $plan): User
{
    return User::factory()->create(['plan_id' => $plan->id]);
}

// ── Halaman onboarding ─────────────────────────────────────────────────────

test('onboarding page requires authentication', function () {
    $this->get('/onboarding')->assertRedirect('/login');
});

test('onboarding page renders for authenticated user without store', function () {
    [, , $freePlan] = onboardingPrerequisites();
    $user = createFreshUser($freePlan);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertStatus(200);
});

// ── Submit onboarding ──────────────────────────────────────────────────────

test('onboarding creates store, branch, roles, and redirects to dashboard', function () {
    Notification::fake();

    [$storeType, , $freePlan] = onboardingPrerequisites();
    $user = createFreshUser($freePlan);

    $this->actingAs($user);

    $response = $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'plan_id' => $freePlan->id,
        'store_name' => 'Toko Test',
    ]);

    $response->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticated();

    // Store dibuat.
    $store = Store::where('user_id', $user->id)->first();
    expect($store)->not->toBeNull();
    expect($store->name)->toBe('Toko Test');
    expect($store->store_type_id)->toBe($storeType->id);
    expect($store->is_active)->toBeTrue();

    // Branch dibuat.
    expect($store->branches()->count())->toBe(1);
    expect($store->branches()->first()->code)->toBe('PUSAT');

    // User punya role owner.
    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    expect(User::find($user->id)->hasRole('owner'))->toBeTrue();

    // Payment methods dibuat.
    expect($store->paymentMethods()->count())->toBe(2);

    // Session diisi current_store_id.
    $this->assertEquals($store->id, session('current_store_id'));
});

test('onboarding with business template creates categories and products', function () {
    Notification::fake();

    [$storeType, $template, $freePlan] = onboardingPrerequisites();
    $user = createFreshUser($freePlan);

    $this->actingAs($user);

    $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => $template->code,
        'plan_id' => $freePlan->id,
        'store_name' => 'Cafe Test',
    ])->assertRedirect(route('admin.dashboard'));

    $store = Store::where('user_id', $user->id)->first();

    expect(Category::where('store_id', $store->id)->count())->toBeGreaterThan(0);
    expect(Product::where('store_id', $store->id)->count())->toBeGreaterThan(0);
});

test('onboarding without business template creates empty store', function () {
    Notification::fake();

    [$storeType, , $freePlan] = onboardingPrerequisites();
    $user = createFreshUser($freePlan);

    $this->actingAs($user);

    $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'plan_id' => $freePlan->id,
        'store_name' => 'Toko Kosong',
    ])->assertRedirect(route('admin.dashboard'));

    $store = Store::where('user_id', $user->id)->first();

    expect(Category::where('store_id', $store->id)->count())->toBe(0);
    expect(Product::where('store_id', $store->id)->count())->toBe(0);
});

test('onboarding updates user plan when selecting non-free plan', function () {
    Notification::fake();

    [$storeType, , $freePlan, $businessPlan] = onboardingPrerequisites();
    $user = createFreshUser($freePlan);

    // User awalnya plan Free.
    expect($user->plan_id)->toBe($freePlan->id);

    $this->actingAs($user);

    $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'plan_id' => $businessPlan->id,
        'store_name' => 'Toko Business',
    ])->assertRedirect(route('admin.dashboard'));

    // Plan user berubah ke Business.
    $user->refresh();
    expect($user->plan_id)->toBe($businessPlan->id);
    expect($user->plan_expires_at)->not->toBeNull();
});

test('onboarding requires store type and plan', function () {
    [, , $freePlan] = onboardingPrerequisites();
    $user = createFreshUser($freePlan);

    $this->actingAs($user);

    $response = $this->post('/onboarding', [
        'store_name' => 'Toko Test',
    ]);

    $response->assertSessionHasErrors(['store_type_id', 'plan_id']);
});

test('onboarding requires store name', function () {
    [$storeType, , $freePlan] = onboardingPrerequisites();
    $user = createFreshUser($freePlan);

    $this->actingAs($user);

    $response = $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'plan_id' => $freePlan->id,
    ]);

    $response->assertSessionHasErrors('store_name');
});
