<?php

/*
|--------------------------------------------------------------------------
| Trial & Subscription Lifecycle
|--------------------------------------------------------------------------
|
| Command plan:check-expired melakukan downgrade NYATA (persisted) ke
| database, bukan cuma computed on-the-fly seperti Store::isPlanExpired().
| Setiap perubahan plan (awal, upgrade, downgrade, trial habis) tercatat
| di plan_subscriptions.
|
*/

use App\Models\Plan;
use App\Models\PlanSubscription;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function planLifecycleStore(array $overrides = []): Store
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    return Store::create(array_merge([
        'code' => 'LIFECYCLE'.uniqid(),
        'name' => 'Lifecycle Store',
        'store_type_id' => $storeType->id,
    ], $overrides));
}

// ── Command plan:check-expired ────────────────────────────────────────────

test('command downgrades store with expired plan to free', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $store = planLifecycleStore([
        'plan_id' => $proPlan->id,
        'plan_expires_at' => now()->subDay(),
    ]);

    $this->artisan('plan:check-expired')->assertSuccessful();

    $store->refresh();
    expect($store->plan_id)->toBe($freePlan->id);
    expect($store->plan_expires_at)->toBeNull();
});

test('command records history entry with reason trial_expired', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $store = planLifecycleStore([
        'plan_id' => $proPlan->id,
        'plan_expires_at' => now()->subDay(),
    ]);

    $this->artisan('plan:check-expired');

    $latest = PlanSubscription::where('store_id', $store->id)->latest('started_at')->first();
    expect($latest)->not->toBeNull();
    expect($latest->reason)->toBe('trial_expired');
    expect($latest->plan_id)->toBe($freePlan->id);
    expect($latest->ended_at)->toBeNull();
});

test('command does not touch store with non-expired plan', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $store = planLifecycleStore([
        'plan_id' => $proPlan->id,
        'plan_expires_at' => now()->addDays(5),
    ]);

    $this->artisan('plan:check-expired');

    $store->refresh();
    expect($store->plan_id)->toBe($proPlan->id);
});

test('command does not touch store without plan_expires_at (unlimited plan)', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $store = planLifecycleStore([
        'plan_id' => $proPlan->id,
        'plan_expires_at' => null,
    ]);

    $this->artisan('plan:check-expired');

    $store->refresh();
    expect($store->plan_id)->toBe($proPlan->id);
});

test('command marks previous open subscription entry as ended', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $store = planLifecycleStore([
        'plan_id' => $proPlan->id,
        'plan_expires_at' => now()->subDay(),
    ]);

    $openEntry = PlanSubscription::create([
        'store_id' => $store->id,
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
        'password' => 'password',
        'password_confirmation' => 'password',
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'plan_id' => $plan->id,
    ]);

    $user = User::where('email', 'lifecycle@example.com')->first();
    $store = Store::whereIn('id', $user->stores()->pluck('stores.id'))->first();

    $history = PlanSubscription::where('store_id', $store->id)->get();
    expect($history)->toHaveCount(1);
    expect($history->first()->reason)->toBe('initial');
    expect($history->first()->plan_id)->toBe($plan->id);
    expect($history->first()->ended_at)->toBeNull();
});

// ── Developer mengubah plan manual tercatat riwayatnya ────────────────────

test('developer changing store plan records history with correct reason', function () {
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $store = planLifecycleStore(['plan_id' => $freePlan->id]);
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

    $latest = PlanSubscription::where('store_id', $store->id)->latest('started_at')->first();
    expect($latest)->not->toBeNull();
    expect($latest->plan_id)->toBe($proPlan->id);
    expect($latest->reason)->toBe('upgraded');
    expect($latest->created_by)->toBe($developer->id);
});

test('changing plan to the same value does not create a new history entry', function () {
    $plan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $store = planLifecycleStore(['plan_id' => $plan->id]);
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

    expect(PlanSubscription::where('store_id', $store->id)->count())->toBe(0);
});
