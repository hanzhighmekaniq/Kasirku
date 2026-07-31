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

    return Store::create(array_merge([
        'user_id' => $owner->id,
        'code' => 'NOTIF'.uniqid(),
        'name' => 'Notif Test Store',
        'store_type_id' => $storeType->id,
    ], $overrides));
}

// ── WelcomeStoreOwner ──────────────────────────────────────────────────────

test('registration sends welcome notification to the new owner', function () {
    Notification::fake();
    $this->seed(PermissionSeeder::class);

    $storeType = StoreType::create(['code' => 'fnb', 'label' => 'F&B', 'is_active' => true, 'sort_order' => 1]);
    $plan = Plan::create(['code' => 'business', 'label' => 'Business', 'price' => 79000, 'trial_days' => 14, 'is_active' => true, 'sort_order' => 1]);

    $this->post('/register', [
        'name' => 'Welcome User',
        'email' => 'welcome@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'store_type_id' => $storeType->id,
        'business_template_code' => null,
        'plan_id' => $plan->id,
    ]);

    $user = User::where('email', 'welcome@example.com')->first();

    Notification::assertSentTo($user, WelcomeStoreOwner::class);
});

// ── TrialEndingSoon ────────────────────────────────────────────────────────

test('notify-trial-ending sends reminder to owner exactly 3 days before expiry', function () {
    Notification::fake();
    $owner = User::factory()->create();
    $store = notificationTestStore($owner, ['plan_expires_at' => now()->addDays(3)]);

    $this->artisan('plan:notify-trial-ending')->assertSuccessful();

    Notification::assertSentTo(
        $owner,
        TrialEndingSoon::class,
        fn ($notification) => $notification->store->id === $store->id && $notification->daysRemaining === 3,
    );
});

test('notify-trial-ending sends reminder to owner exactly 1 day before expiry', function () {
    Notification::fake();
    $owner = User::factory()->create();
    $store = notificationTestStore($owner, ['plan_expires_at' => now()->addDay()]);

    $this->artisan('plan:notify-trial-ending');

    Notification::assertSentTo(
        $owner,
        TrialEndingSoon::class,
        fn ($notification) => $notification->store->id === $store->id && $notification->daysRemaining === 1,
    );
});

test('notify-trial-ending does not send reminder outside the H-3/H-1 window', function () {
    Notification::fake();
    $owner = User::factory()->create();
    notificationTestStore($owner, ['plan_expires_at' => now()->addDays(5)]);

    $this->artisan('plan:notify-trial-ending');

    Notification::assertNothingSentTo($owner);
});

test('notify-trial-ending skips store without owner', function () {
    Notification::fake();
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );
    Store::create([
        'user_id' => null,
        'code' => 'NOOWNER'.uniqid(),
        'name' => 'No Owner Store',
        'store_type_id' => $storeType->id,
        'plan_expires_at' => now()->addDays(3),
    ]);

    $this->artisan('plan:notify-trial-ending')->assertSuccessful();

    Notification::assertNothingSent();
});

// ── PlanExpiredDowngraded ──────────────────────────────────────────────────

test('check-expired command notifies owner when plan is downgraded', function () {
    Notification::fake();
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $owner = User::factory()->create();
    $store = notificationTestStore($owner, [
        'plan_id' => $proPlan->id,
        'plan_expires_at' => now()->subDay(),
    ]);

    $this->artisan('plan:check-expired');

    Notification::assertSentTo(
        $owner,
        PlanExpiredDowngraded::class,
        fn ($notification) => $notification->store->id === $store->id && $notification->previousPlanLabel === 'Pro',
    );
});

test('check-expired command does not fail when store has no owner', function () {
    Notification::fake();
    $freePlan = Plan::create(['code' => 'free', 'label' => 'Free', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $proPlan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true, 'sort_order' => 1, 'price' => 29000]);

    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );
    $store = Store::create([
        'user_id' => null,
        'code' => 'NOOWNEREXP'.uniqid(),
        'name' => 'No Owner Expired Store',
        'store_type_id' => $storeType->id,
        'plan_id' => $proPlan->id,
        'plan_expires_at' => now()->subDay(),
    ]);

    $this->artisan('plan:check-expired')->assertSuccessful();

    $store->refresh();
    expect($store->plan_id)->toBe($freePlan->id);
    Notification::assertNothingSent();
});
