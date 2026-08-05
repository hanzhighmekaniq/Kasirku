<?php

/*
|--------------------------------------------------------------------------
| Onboarding — Buat Toko Setelah Registrasi
|--------------------------------------------------------------------------
|
| User yang baru registrasi (belum punya toko) diarahkan ke halaman
| onboarding. Satu layar saja: pilih template bisnis (atau tipe toko
| kosong) + nama toko + nama pemilik. Tidak ada langkah pilih plan —
| toko otomatis dibuat dengan plan Free, upgrade dilakukan belakangan
| dari halaman Plan & Billing. Verifikasi email BUKAN syarat untuk
| mengakses halaman ini atau submit toko.
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

function createFreshUser(?Plan $plan = null): User
{
    return User::factory()->create(['plan_id' => $plan?->id]);
}

// ── Halaman onboarding ─────────────────────────────────────────────────────

test('onboarding page requires authentication', function () {
    $this->get('/onboarding')->assertRedirect('/login');
});

test('onboarding page renders even for a user with unverified email', function () {
    onboardingPrerequisites();
    $user = createFreshUser();
    $user->forceFill(['email_verified_at' => null])->save();

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertStatus(200);
});

test('onboarding page renders for user without store', function () {
    onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertStatus(200);
});

test('onboarding page exposes business templates with their store type', function () {
    [, $template] = onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertInertia(
            fn ($page) => $page
                ->component('Onboarding/Index')
                ->has('businessTemplates', 1)
                ->where('businessTemplates.0.code', $template->code)
                ->where('businessTemplates.0.store_type_id', $template->store_type_id)
        );
});

test('onboarding page does not expose a plans prop anymore', function () {
    onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertInertia(fn ($page) => $page->component('Onboarding/Index')->missing('plans'));
});

// ── Submit onboarding ──────────────────────────────────────────────────────

test('onboarding creates store, branch, roles, and redirects to dashboard', function () {
    Notification::fake();

    [$storeType] = onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user);

    $response = $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
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

test('onboarding automatically assigns the free plan without requiring plan_id', function () {
    Notification::fake();

    [$storeType, , $freePlan] = onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user);

    $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'store_name' => 'Toko Test',
    ])->assertRedirect(route('admin.dashboard'));

    $user->refresh();
    expect($user->plan_id)->toBe($freePlan->id);
});

test('onboarding with business template creates categories and products', function () {
    Notification::fake();

    [$storeType, $template] = onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user);

    $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => $template->code,
        'store_name' => 'Cafe Test',
    ])->assertRedirect(route('admin.dashboard'));

    $store = Store::where('user_id', $user->id)->first();

    expect(Category::where('store_id', $store->id)->count())->toBeGreaterThan(0);
    expect(Product::where('store_id', $store->id)->count())->toBeGreaterThan(0);
});

test('onboarding without business template creates empty store', function () {
    Notification::fake();

    [$storeType] = onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user);

    $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'store_name' => 'Toko Kosong',
    ])->assertRedirect(route('admin.dashboard'));

    $store = Store::where('user_id', $user->id)->first();

    expect(Category::where('store_id', $store->id)->count())->toBe(0);
    expect(Product::where('store_id', $store->id)->count())->toBe(0);
});

test('onboarding works for a user with unverified email', function () {
    Notification::fake();

    [$storeType] = onboardingPrerequisites();
    $user = createFreshUser();
    $user->forceFill(['email_verified_at' => null])->save();

    $this->actingAs($user)
        ->post('/onboarding', [
            'store_type_id' => $storeType->id,
            'store_name' => 'Toko Test',
        ])
        ->assertRedirect(route('admin.dashboard'));

    expect(Store::where('user_id', $user->id)->exists())->toBeTrue();
});

test('onboarding requires store type', function () {
    onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user);

    $response = $this->post('/onboarding', [
        'store_name' => 'Toko Test',
    ]);

    $response->assertSessionHasErrors(['store_type_id']);
});

test('onboarding requires store name', function () {
    [$storeType] = onboardingPrerequisites();
    $user = createFreshUser();

    $this->actingAs($user);

    $response = $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
    ]);

    $response->assertSessionHasErrors('store_name');
});

test('onboarding rejects a business template that does not belong to the chosen store type', function () {
    [$storeType, $template] = onboardingPrerequisites();
    $user = createFreshUser();

    // Tipe toko lain, tapi template tetap dari store type yang benar —
    // pasangan ini tidak konsisten dan harus ditolak.
    $otherStoreType = StoreType::create([
        'code' => 'retail',
        'label' => 'Retail',
        'icon' => '🏪',
        'is_active' => true,
        'sort_order' => 2,
    ]);

    $this->actingAs($user)
        ->post('/onboarding', [
            'store_type_id' => $otherStoreType->id,
            'business_template_code' => $template->code,
            'store_name' => 'Toko Test',
        ])
        ->assertSessionHasErrors('business_template_code');

    expect(Store::where('user_id', $user->id)->exists())->toBeFalse();
});
