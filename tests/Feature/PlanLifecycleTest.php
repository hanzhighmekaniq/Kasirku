<?php

/*
|--------------------------------------------------------------------------
| Trial & Subscription Lifecycle
|--------------------------------------------------------------------------
|
| Plan sekarang menempel ke USER, bukan Store. Command plan:check-expired
| mengupdate users.plan_id ke free saat users.plan_expires_at sudah lewat.
|
*/

use App\Models\Plan;
use App\Models\PlanSubscription;
use App\Models\RegistrationOtp;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function lifecycleUser(array $overrides = []): User
{
    return User::factory()->create(array_merge([
        'is_developer' => false,
    ], $overrides));
}

function lifecycleStore(User $owner, array $storeOverrides = []): Store
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $store = Store::create(array_merge([
        'user_id' => $owner->id,
        'code' => 'LC'.uniqid(),
        'name' => 'Lifecycle Store',
        'store_type_id' => $storeType->id,
    ], $storeOverrides));

    $owner->stores()->attach($store->id);

    return $store;
}

// ── Command plan:check-expired ────────────────────────────────────────────

test('command downgrades user with expired plan to free', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $user = lifecycleUser(['plan_id' => $proPlan->id, 'plan_expires_at' => now()->subDay()]);

    $this->artisan('plan:check-expired')->assertSuccessful();

    $user->refresh();
    expect($user->plan_id)->toBe($freePlan->id);
    expect($user->plan_expires_at)->toBeNull();
});

test('command records history entry with reason trial_expired', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $user = lifecycleUser(['plan_id' => $proPlan->id, 'plan_expires_at' => now()->subDay()]);
    lifecycleStore($user);

    $this->artisan('plan:check-expired');

    $latest = PlanSubscription::where('user_id', $user->id)->latest('started_at')->first();
    expect($latest)->not->toBeNull();
    expect($latest->reason)->toBe('trial_expired');
    expect($latest->plan_id)->toBe($freePlan->id);
    expect($latest->ended_at)->toBeNull();
});

test('command does not touch user with non-expired plan', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $user = lifecycleUser(['plan_id' => $proPlan->id, 'plan_expires_at' => now()->addDays(5)]);

    $this->artisan('plan:check-expired');

    expect($user->fresh()->plan_id)->toBe($proPlan->id);
});

test('command does not touch user without plan_expires_at (unlimited plan)', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $user = lifecycleUser(['plan_id' => $proPlan->id, 'plan_expires_at' => null]);

    $this->artisan('plan:check-expired');

    expect($user->fresh()->plan_id)->toBe($proPlan->id);
});

test('command marks previous open subscription entry as ended', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $user = lifecycleUser(['plan_id' => $proPlan->id, 'plan_expires_at' => now()->subDay()]);
    lifecycleStore($user);

    $openEntry = PlanSubscription::create([
        'user_id' => $user->id,
        'plan_id' => $proPlan->id,
        'started_at' => now()->subDays(14),
        'reason' => 'initial',
    ]);

    $this->artisan('plan:check-expired');

    expect($openEntry->fresh()->ended_at)->not->toBeNull();
});

// ── Registrasi mencatat riwayat plan awal ─────────────────────────────────

test('registration creates initial plan subscription history entry', function () {
    $this->seed(PermissionSeeder::class);

    $storeType = StoreType::create(['code' => 'fnb', 'label' => 'F&B', 'is_active' => true, 'sort_order' => 1]);
    $plan = Plan::create(['code' => 'business', 'label' => 'Business', 'price' => 79000, 'trial_days' => 14, 'is_active' => true, 'sort_order' => 1]);

    $this->post('/register', [
        'name' => 'Test User',
        'email' => 'lifecycle@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'plan_id' => $plan->id,
    ]);

    $otp = RegistrationOtp::where('email', 'lifecycle@example.com')->first();
    $this->post('/register/verify', [
        'email' => 'lifecycle@example.com',
        'code' => $otp->code,
    ]);

    $user = User::where('email', 'lifecycle@example.com')->first();

    // Riwayat subscription sekarang di user, bukan store
    $history = PlanSubscription::where('user_id', $user->id)->get();
    expect($history)->toHaveCount(1);
    expect($history->first()->reason)->toBe('initial');
    expect($history->first()->plan_id)->toBe($plan->id);
    expect($history->first()->ended_at)->toBeNull();
});

// ── Developer mengubah plan manual tercatat riwayatnya ────────────────────

test('developer changing store plan records history against the owner user', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $owner = lifecycleUser(['plan_id' => $freePlan->id]);
    $store = lifecycleStore($owner);
    $developer = User::factory()->create(['is_developer' => true]);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->put("/developer/stores/{$store->id}", [
            'code' => $store->code,
            'name' => $store->name,
            'store_type_id' => $store->store_type_id,
            'plan_id' => $proPlan->id,
            'is_active' => true,
        ]);

    $response->assertRedirect(route('developer.stores.show', $store->id));

    // Plan tercatat di USER owner, bukan di store
    $latest = PlanSubscription::where('user_id', $owner->id)->latest('started_at')->first();
    expect($latest)->not->toBeNull();
    expect($latest->plan_id)->toBe($proPlan->id);
    expect($latest->reason)->toBe('upgraded');
    expect($latest->created_by)->toBe($developer->id);

    // User owner plan_id terupdate
    expect($owner->fresh()->plan_id)->toBe($proPlan->id);
});

test('changing plan to the same value does not create a new history entry', function () {
    $plan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $owner = lifecycleUser(['plan_id' => $plan->id]);
    $store = lifecycleStore($owner);
    $developer = User::factory()->create(['is_developer' => true]);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->put("/developer/stores/{$store->id}", [
            'code' => $store->code,
            'name' => $store->name,
            'store_type_id' => $store->store_type_id,
            'plan_id' => $plan->id,
            'is_active' => true,
        ]);

    expect(PlanSubscription::where('user_id', $owner->id)->count())->toBe(0);
});
