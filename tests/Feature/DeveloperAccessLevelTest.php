<?php

/*
|--------------------------------------------------------------------------
| Level Akses Developer — Super Admin vs Support
|--------------------------------------------------------------------------
|
| Sebelum ini `is_developer` hanya boolean: setiap developer punya kuasa
| identik, termasuk hapus toko, ubah plan siapa pun, dan impersonate akun
| owner mana pun.
|
| Support agent BOLEH: lihat data, impersonate (inti pekerjaan diagnosis),
| dan tulis catatan internal — semuanya tercatat di audit log.
| Support agent DITOLAK: aksi destruktif dan perubahan konfigurasi platform.
|
*/

use App\Models\DeveloperActionLog;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreNote;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function superAdmin(): User
{
    return User::factory()->create([
        'is_developer' => true,
        'developer_role' => User::DEV_SUPER_ADMIN,
    ]);
}

function supportAgent(): User
{
    return User::factory()->create([
        'is_developer' => true,
        'developer_role' => User::DEV_SUPPORT,
    ]);
}

function accessTestStore(?User $owner = null): Store
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $store = Store::create([
        'user_id' => $owner?->id,
        'code' => 'ACCESS'.uniqid(),
        'name' => 'Access Test Store',
        'store_type_id' => $storeType->id,
        'is_active' => true,
    ]);

    if ($owner) {
        $owner->stores()->attach($store->id);
    }

    return $store;
}

// ── Helper model ───────────────────────────────────────────────────────────

test('model helpers distinguish super admin from support', function () {
    expect(superAdmin()->isSuperAdmin())->toBeTrue();
    expect(superAdmin()->isSupportAgent())->toBeFalse();

    expect(supportAgent()->isSupportAgent())->toBeTrue();
    expect(supportAgent()->isSuperAdmin())->toBeFalse();
});

test('developer with null role is treated as super admin for backward compatibility', function () {
    // Developer lama (sebelum kolom ada) tidak boleh kehilangan akses.
    $legacy = User::factory()->create([
        'is_developer' => true,
        'developer_role' => null,
    ]);

    expect($legacy->isSuperAdmin())->toBeTrue();
});

test('non developer is neither super admin nor support', function () {
    $user = User::factory()->create(['is_developer' => false]);

    expect($user->isSuperAdmin())->toBeFalse();
    expect($user->isSupportAgent())->toBeFalse();
});

// ── Support: yang BOLEH ────────────────────────────────────────────────────

test('support can view dashboard, store list, and store detail', function () {
    $support = supportAgent();
    $store = accessTestStore();

    $this->actingAs($support)->get('/developer/dashboard')->assertOk();
    $this->actingAs($support)->get('/developer/stores')->assertOk();
    $this->actingAs($support)->get("/developer/stores/{$store->id}")->assertOk();
});

test('support can view branches, users, wallets, and audit log', function () {
    $support = supportAgent();

    $this->actingAs($support)->get('/developer/branches')->assertOk();
    $this->actingAs($support)->get('/developer/users')->assertOk();
    $this->actingAs($support)->get('/developer/wallets')->assertOk();
    $this->actingAs($support)->get('/developer/audit-log')->assertOk();
});

test('support can impersonate a store owner', function () {
    $support = supportAgent();
    $owner = User::factory()->create();
    $store = accessTestStore($owner);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($support)
        ->post("/developer/stores/{$store->id}/impersonate/{$owner->id}")
        ->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($owner);

    // Level pelaku tercatat di audit log.
    $log = DeveloperActionLog::where('action', 'store.impersonate')->first();
    expect($log->new_values['developer_role'])->toBe(User::DEV_SUPPORT);
});

test('support can write and delete internal notes', function () {
    $support = supportAgent();
    $store = accessTestStore();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($support)
        ->post("/developer/stores/{$store->id}/notes", ['note' => 'Diagnosis awal.'])
        ->assertRedirect();

    $note = StoreNote::where('store_id', $store->id)->first();
    expect($note)->not->toBeNull();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($support)
        ->delete("/developer/stores/{$store->id}/notes/{$note->id}")
        ->assertRedirect();
});

// ── Support: yang DITOLAK ──────────────────────────────────────────────────

test('support cannot delete a store', function () {
    $support = supportAgent();
    $store = accessTestStore();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($support)
        ->delete("/developer/stores/{$store->id}")
        ->assertForbidden();

    expect(Store::find($store->id))->not->toBeNull();
});

test('support cannot edit a store or change its plan', function () {
    $support = supportAgent();
    $store = accessTestStore();
    $plan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'price' => 29000, 'is_active' => true]);

    $this->actingAs($support)
        ->get("/developer/stores/{$store->id}/edit")
        ->assertForbidden();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($support)
        ->put("/developer/stores/{$store->id}", [
            'code' => $store->code,
            'name' => 'Diubah Paksa',
            'store_type_id' => $store->store_type_id,
            'plan_id' => $plan->id,
            'is_active' => true,
        ])
        ->assertForbidden();

    expect($store->fresh()->name)->toBe('Access Test Store');
    expect($store->fresh()->plan_id)->toBeNull();
});

test('support cannot create stores, branches, or users', function () {
    $support = supportAgent();

    $this->actingAs($support)->get('/developer/stores/create')->assertForbidden();
    $this->actingAs($support)->get('/developer/branches/create')->assertForbidden();
    $this->actingAs($support)->get('/developer/users/create')->assertForbidden();
});

test('support cannot delete users', function () {
    $support = supportAgent();
    $target = User::factory()->create();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($support)
        ->delete("/developer/users/{$target->id}")
        ->assertForbidden();

    expect(User::find($target->id))->not->toBeNull();
});

test('support cannot access platform configuration pages', function () {
    $support = supportAgent();

    foreach ([
        '/developer/plans',
        '/developer/store-types',
        '/developer/business-templates',
        '/developer/features',
        '/developer/type-features',
        '/developer/roles',
        '/developer/role-templates',
        '/developer/payment-gateway',
    ] as $path) {
        $this->actingAs($support)->get($path)->assertForbidden();
    }
});

test('support cannot adjust wallet balance', function () {
    $support = supportAgent();
    $store = accessTestStore();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($support)
        ->post("/developer/wallets/{$store->id}/adjust", [
            'amount' => 100000,
            'note' => 'Penyesuaian paksa',
        ])
        ->assertForbidden();
});

// ── Super admin: semua boleh ───────────────────────────────────────────────

test('super admin can access platform configuration pages', function () {
    $admin = superAdmin();

    foreach ([
        '/developer/plans',
        '/developer/store-types',
        '/developer/business-templates',
        '/developer/features',
        '/developer/roles',
        '/developer/role-templates',
        '/developer/payment-gateway',
    ] as $path) {
        $this->actingAs($admin)->get($path)->assertOk();
    }
});

test('super admin can delete a store', function () {
    $admin = superAdmin();
    $store = accessTestStore();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($admin)
        ->delete("/developer/stores/{$store->id}")
        ->assertRedirect(route('developer.stores.index'));

    expect(Store::find($store->id))->toBeNull();
});

test('super admin can reach store create and edit pages', function () {
    $admin = superAdmin();
    $store = accessTestStore();

    $this->actingAs($admin)->get('/developer/stores/create')->assertOk();
    $this->actingAs($admin)->get("/developer/stores/{$store->id}/edit")->assertOk();
});

// ── Pengelolaan level lewat form user ──────────────────────────────────────

test('super admin can create a support agent', function () {
    $admin = superAdmin();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($admin)
        ->post('/developer/users', [
            'name' => 'Agen Support',
            'email' => 'support@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'is_developer' => true,
            'developer_role' => User::DEV_SUPPORT,
        ])
        ->assertRedirect(route('developer.users.index'));

    $created = User::where('email', 'support@example.com')->first();
    expect($created->isSupportAgent())->toBeTrue();
});

test('developer role is cleared when the developer flag is revoked', function () {
    $admin = superAdmin();
    $target = User::factory()->create([
        'is_developer' => true,
        'developer_role' => User::DEV_SUPPORT,
    ]);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($admin)
        ->put("/developer/users/{$target->id}", [
            'name' => $target->name,
            'email' => $target->email,
            'is_developer' => false,
        ])
        ->assertRedirect();

    $target->refresh();
    expect($target->is_developer)->toBeFalse();
    expect($target->developer_role)->toBeNull();
});

test('developer without explicit role defaults to super admin on create', function () {
    $admin = superAdmin();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($admin)
        ->post('/developer/users', [
            'name' => 'Dev Tanpa Level',
            'email' => 'nolevel@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'is_developer' => true,
        ]);

    $created = User::where('email', 'nolevel@example.com')->first();
    expect($created->developer_role)->toBe(User::DEV_SUPER_ADMIN);
});
