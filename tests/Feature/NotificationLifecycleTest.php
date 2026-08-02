<?php

/*
|--------------------------------------------------------------------------
| Notifikasi Platform — Welcome, Trial Ending, Plan Expired, Suspended
|--------------------------------------------------------------------------
|
| Semua notification class implements ShouldQueue. Test ini memverifikasi
| notifikasi terkirim ke owner yang benar pada momen yang tepat, tanpa
| benar-benar mengirim email (Notification::fake()).
|
*/

use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use App\Notifications\PlanExpiredDowngraded;
use App\Notifications\TrialEndingSoon;
use App\Notifications\WelcomeStoreOwner;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function notificationTestStore(User $owner, array $overrides = []): Store
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $store = Store::create(array_merge([
        'user_id' => $owner->id,
        'code' => 'NOTIF'.uniqid(),
        'name' => 'Notif Test Store',
        'store_type_id' => $storeType->id,
    ], $overrides));

    // Attach ke pivot supaya $user->stores()->first() bisa menemukan toko ini
    $owner->stores()->syncWithoutDetaching([$store->id]);

    return $store;
}

// ── WelcomeStoreOwner ──────────────────────────────────────────────────────

test('onboarding sends welcome notification to the new owner', function () {
    Notification::fake();
    $this->seed(PermissionSeeder::class);

    $storeType = StoreType::create(['code' => 'fnb', 'label' => 'F&B', 'is_active' => true, 'sort_order' => 1]);
    $plan = Plan::create(['code' => 'free', 'label' => 'Free', 'price' => 0, 'trial_days' => 0, 'is_active' => true, 'sort_order' => 0]);

    // Registrasi hanya buat user (tanpa store), welcome notification
    // dikirim saat onboarding, bukan saat registrasi.
    $user = User::factory()->create(['plan_id' => $plan->id]);

    $this->actingAs($user);

    $this->post('/onboarding', [
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'plan_id' => $plan->id,
        'store_name' => 'Toko Welcome',
    ]);

    Notification::assertSentTo($user, WelcomeStoreOwner::class);
});

// ── TrialEndingSoon ────────────────────────────────────────────────────────

test('notify-trial-ending sends reminder to owner exactly 3 days before expiry', function () {
    Notification::fake();
    // plan_expires_at sekarang di USER, bukan store
    $owner = User::factory()->create(['plan_expires_at' => now()->addDays(3)]);
    $store = notificationTestStore($owner);

    $this->artisan('plan:notify-trial-ending')->assertSuccessful();

    Notification::assertSentTo(
        $owner,
        TrialEndingSoon::class,
        fn ($notification) => $notification->daysRemaining === 3,
    );
});

test('notify-trial-ending sends reminder to owner exactly 1 day before expiry', function () {
    Notification::fake();
    $owner = User::factory()->create(['plan_expires_at' => now()->addDay()]);
    $store = notificationTestStore($owner);

    $this->artisan('plan:notify-trial-ending');

    Notification::assertSentTo(
        $owner,
        TrialEndingSoon::class,
        fn ($notification) => $notification->daysRemaining === 1,
    );
});

test('notify-trial-ending does not send reminder outside the H-3/H-1 window', function () {
    Notification::fake();
    $owner = User::factory()->create(['plan_expires_at' => now()->addDays(5)]);
    notificationTestStore($owner);

    $this->artisan('plan:notify-trial-ending');

    Notification::assertNothingSentTo($owner);
});

test('notify-trial-ending skips user without stores', function () {
    Notification::fake();
    // User dengan plan_expires_at tapi tidak punya toko — command skip
    User::factory()->create(['plan_expires_at' => now()->addDays(3)]);

    $this->artisan('plan:notify-trial-ending')->assertSuccessful();

    Notification::assertNothingSent();
});

// ── PlanExpiredDowngraded ──────────────────────────────────────────────────

test('check-expired command notifies user when plan is downgraded', function () {
    Notification::fake();
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $owner = User::factory()->create(['plan_id' => $proPlan->id, 'plan_expires_at' => now()->subDay()]);
    $store = notificationTestStore($owner);

    $this->artisan('plan:check-expired');

    Notification::assertSentTo(
        $owner,
        PlanExpiredDowngraded::class,
        fn ($notification) => $notification->previousPlanLabel === 'Pro',
    );
});

test('check-expired command does not fail when user has no stores', function () {
    Notification::fake();
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    // User dengan expired plan tapi tidak punya toko
    $user = User::factory()->create(['plan_id' => $proPlan->id, 'plan_expires_at' => now()->subDay()]);

    $this->artisan('plan:check-expired')->assertSuccessful();

    expect($user->fresh()->plan_id)->toBe($freePlan->id);
});
