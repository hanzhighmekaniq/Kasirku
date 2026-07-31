<?php

/*
|--------------------------------------------------------------------------
| Audit Log Developer & Dashboard Metrics Bisnis
|--------------------------------------------------------------------------
|
| Memverifikasi bahwa aksi developer terhadap data platform (plan, store,
| business template, feature, store type) tercatat ke DeveloperActionLog
| terpisah dari ActivityLog operasional toko, dan bahwa dashboard developer
| menghitung metrik bisnis (MRR, distribusi plan, growth) dengan benar.
|
*/

use App\Models\DeveloperActionLog;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\PlanSubscription;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function auditDeveloper(): User
{
    return User::factory()->create(['is_developer' => true]);
}

// ── Audit log tercatat per aksi ───────────────────────────────────────────

test('creating a plan records a developer action log entry', function () {
    $developer = auditDeveloper();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post('/developer/plans', [
            'code' => 'audited',
            'label' => 'Audited Plan',
            'max_users' => 1,
            'max_branches' => 1,
            'max_stores' => 1,
        ]);

    $log = DeveloperActionLog::where('action', 'plan.create')->first();
    expect($log)->not->toBeNull();
    expect($log->developer_id)->toBe($developer->id);
    expect($log->new_values['code'])->toBe('audited');
});

test('updating a plan records old and new values', function () {
    $developer = auditDeveloper();
    $plan = Plan::create(['code' => 'x', 'label' => 'X', 'max_users' => 1, 'max_branches' => 1, 'max_stores' => 1, 'is_active' => true]);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->put("/developer/plans/{$plan->id}", [
            'code' => 'x',
            'label' => 'X Updated',
            'max_users' => 5,
            'max_branches' => 1,
            'max_stores' => 1,
        ]);

    $log = DeveloperActionLog::where('action', 'plan.update')->first();
    expect($log)->not->toBeNull();
    expect($log->old_values['label'])->toBe('X');
    expect($log->new_values['label'])->toBe('X Updated');
});

test('deleting a store type records a snapshot in old_values', function () {
    $developer = auditDeveloper();
    $type = StoreType::create(['code' => 'todelete', 'label' => 'To Delete', 'is_active' => true]);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->delete("/developer/store-types/{$type->id}");

    $log = DeveloperActionLog::where('action', 'store_type.destroy')->first();
    expect($log)->not->toBeNull();
    expect($log->old_values['code'])->toBe('todelete');
    expect($log->subject_id)->toBe($type->id);
});

test('creating a feature records developer action log', function () {
    $developer = auditDeveloper();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post('/developer/features', [
            'code' => 'audited_feature',
            'label' => 'Audited Feature',
            'display_group' => 'other',
        ]);

    expect(DeveloperActionLog::where('action', 'feature.create')->exists())->toBeTrue();
});

test('creating a business template records developer action log', function () {
    $developer = auditDeveloper();
    $type = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post('/developer/business-templates', [
            'store_type_id' => $type->id,
            'code' => 'audited_template',
            'label' => 'Audited Template',
        ]);

    expect(DeveloperActionLog::where('action', 'business_template.create')->exists())->toBeTrue();
});

test('creating a store from developer panel records developer action log', function () {
    $developer = auditDeveloper();
    $type = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post('/developer/stores', [
            'code' => 'AUDITSTORE',
            'name' => 'Audit Store',
            'store_type_id' => $type->id,
            'branches' => [['code' => 'BR01', 'name' => 'Pusat']],
        ]);

    $log = DeveloperActionLog::where('action', 'store.create')->first();
    expect($log)->not->toBeNull();
    expect($log->new_values['code'])->toBe('AUDITSTORE');
});

// ── Halaman audit log ──────────────────────────────────────────────────────

test('non-developer cannot access audit log page', function () {
    $user = User::factory()->create(['is_developer' => false]);

    $this->actingAs($user)->get('/developer/audit-log')->assertStatus(403);
});

test('audit log page lists recorded actions', function () {
    $developer = auditDeveloper();
    DeveloperActionLog::record('store.update', null, ['a' => 1], ['a' => 2]);

    $response = $this->actingAs($developer)->get('/developer/audit-log');

    $response->assertOk();
    $logs = collect($response->viewData('page')['props']['logs']['data']);
    expect($logs->pluck('action'))->toContain('store.update');
});

test('audit log page can filter by action', function () {
    $developer = auditDeveloper();
    DeveloperActionLog::record('plan.create');
    DeveloperActionLog::record('feature.create');

    $response = $this->actingAs($developer)->get('/developer/audit-log?action=plan');

    $actions = collect($response->viewData('page')['props']['logs']['data'])->pluck('action');
    expect($actions)->toContain('plan.create');
    expect($actions)->not->toContain('feature.create');
});

// ── Dashboard metrics bisnis ───────────────────────────────────────────────

test('dashboard mrr sums price of active stores only', function () {
    $developer = auditDeveloper();
    $storeType = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);
    $plan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'price' => 29000, 'is_active' => true]);

    Store::create(['code' => 'ACTIVE1', 'name' => 'Active 1', 'store_type_id' => $storeType->id, 'plan_id' => $plan->id, 'is_active' => true]);
    Store::create(['code' => 'ACTIVE2', 'name' => 'Active 2', 'store_type_id' => $storeType->id, 'plan_id' => $plan->id, 'is_active' => true]);
    Store::create(['code' => 'INACTIVE1', 'name' => 'Inactive', 'store_type_id' => $storeType->id, 'plan_id' => $plan->id, 'is_active' => false]);

    $response = $this->actingAs($developer)->get('/developer/dashboard');

    $metrics = $response->viewData('page')['props']['businessMetrics'];
    expect($metrics['mrr'])->toBe(58000.0);
});

test('dashboard plan distribution groups stores by plan', function () {
    $developer = auditDeveloper();
    $storeType = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);
    $free = Plan::create(['code' => 'free', 'label' => 'Free', 'price' => 0, 'is_active' => true]);
    $pro = Plan::create(['code' => 'pro', 'label' => 'Pro', 'price' => 29000, 'is_active' => true]);

    Store::create(['code' => 'S1', 'name' => 'S1', 'store_type_id' => $storeType->id, 'plan_id' => $free->id, 'is_active' => true]);
    Store::create(['code' => 'S2', 'name' => 'S2', 'store_type_id' => $storeType->id, 'plan_id' => $free->id, 'is_active' => true]);
    Store::create(['code' => 'S3', 'name' => 'S3', 'store_type_id' => $storeType->id, 'plan_id' => $pro->id, 'is_active' => true]);

    $response = $this->actingAs($developer)->get('/developer/dashboard');

    $distribution = collect($response->viewData('page')['props']['businessMetrics']['plan_distribution']);
    expect($distribution->firstWhere('plan_code', 'free')['total'])->toBe(2);
    expect($distribution->firstWhere('plan_code', 'pro')['total'])->toBe(1);
});

test('dashboard trial_active counts stores with future plan_expires_at', function () {
    $developer = auditDeveloper();
    $storeType = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);

    Store::create(['code' => 'TRIAL1', 'name' => 'Trial 1', 'store_type_id' => $storeType->id, 'plan_expires_at' => now()->addDays(5)]);
    Store::create(['code' => 'EXPIRED1', 'name' => 'Expired 1', 'store_type_id' => $storeType->id, 'plan_expires_at' => now()->subDay()]);

    $response = $this->actingAs($developer)->get('/developer/dashboard');

    $metrics = $response->viewData('page')['props']['businessMetrics'];
    expect($metrics['trial_active'])->toBe(1);
    expect($metrics['trial_expired_not_swept'])->toBe(1);
});

test('dashboard trial_to_paid conversion rate computed from plan_subscriptions history', function () {
    $developer = auditDeveloper();
    $storeType = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);
    $store = Store::create(['code' => 'CONV1', 'name' => 'Conv 1', 'store_type_id' => $storeType->id]);

    PlanSubscription::create(['store_id' => $store->id, 'started_at' => now(), 'reason' => 'upgraded']);
    PlanSubscription::create(['store_id' => $store->id, 'started_at' => now(), 'reason' => 'trial_expired']);
    PlanSubscription::create(['store_id' => $store->id, 'started_at' => now(), 'reason' => 'trial_expired']);
    PlanSubscription::create(['store_id' => $store->id, 'started_at' => now(), 'reason' => 'trial_expired']);

    $response = $this->actingAs($developer)->get('/developer/dashboard');

    $conversion = $response->viewData('page')['props']['businessMetrics']['trial_to_paid'];
    expect($conversion['converted'])->toBe(1);
    expect($conversion['expired_to_free'])->toBe(3);
    expect($conversion['conversion_rate'])->toBe(25.0);
});

test('dashboard growth includes 6 months with zero-filled data', function () {
    $developer = auditDeveloper();

    $response = $this->actingAs($developer)->get('/developer/dashboard');

    $growth = $response->viewData('page')['props']['businessMetrics']['growth'];
    expect($growth)->toHaveCount(6);
    expect($growth[5]['total'])->toBeGreaterThanOrEqual(0);
});
