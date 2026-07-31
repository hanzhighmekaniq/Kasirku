<?php

/*
|--------------------------------------------------------------------------
| Support Tooling — Impersonation, Suspend Reason, Internal Notes
|--------------------------------------------------------------------------
*/

use App\Models\DeveloperActionLog;
use App\Models\Store;
use App\Models\StoreNote;
use App\Models\StoreSuspension;
use App\Models\StoreType;
use App\Models\User;
use App\Notifications\StoreSuspended;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function supportToolingStore(User $owner): Store
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $store = Store::create([
        'user_id' => $owner->id,
        'code' => 'SUPPORT'.uniqid(),
        'name' => 'Support Test Store',
        'store_type_id' => $storeType->id,
        'is_active' => true,
    ]);
    $owner->stores()->attach($store->id);

    return $store;
}

// ── Suspend wajib alasan ──────────────────────────────────────────────────

test('deactivating a store without reason is rejected', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->put("/developer/stores/{$store->id}", [
            'code' => $store->code,
            'name' => $store->name,
            'store_type_id' => $store->store_type_id,
            'is_active' => false,
        ]);

    $response->assertSessionHasErrors('suspend_reason');
    expect($store->fresh()->is_active)->toBeTrue();
});

test('deactivating a store with reason succeeds and records suspension history', function () {
    Notification::fake();
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->put("/developer/stores/{$store->id}", [
            'code' => $store->code,
            'name' => $store->name,
            'store_type_id' => $store->store_type_id,
            'is_active' => false,
            'suspend_reason' => 'Pelanggaran kebijakan penggunaan',
        ]);

    $response->assertRedirect(route('developer.stores.show', $store->id));
    expect($store->fresh()->is_active)->toBeFalse();

    $suspension = StoreSuspension::where('store_id', $store->id)->first();
    expect($suspension)->not->toBeNull();
    expect($suspension->reason)->toBe('Pelanggaran kebijakan penggunaan');
    expect($suspension->suspended_by)->toBe($developer->id);
    expect($suspension->reactivated_at)->toBeNull();

    Notification::assertSentTo($owner, StoreSuspended::class, fn ($n) => $n->reason === 'Pelanggaran kebijakan penggunaan');
    expect(DeveloperActionLog::where('action', 'store.suspend')->exists())->toBeTrue();
});

test('reactivating a suspended store closes the open suspension record', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);
    $store->update(['is_active' => false]);
    $suspension = StoreSuspension::create([
        'store_id' => $store->id,
        'reason' => 'Awal',
        'suspended_at' => now()->subDay(),
    ]);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->put("/developer/stores/{$store->id}", [
            'code' => $store->code,
            'name' => $store->name,
            'store_type_id' => $store->store_type_id,
            'is_active' => true,
        ]);

    expect($store->fresh()->is_active)->toBeTrue();
    $suspension->refresh();
    expect($suspension->reactivated_at)->not->toBeNull();
    expect($suspension->reactivated_by)->toBe($developer->id);
});

test('updating a store without changing is_active does not require suspend_reason', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->put("/developer/stores/{$store->id}", [
            'code' => $store->code,
            'name' => 'Nama Baru',
            'store_type_id' => $store->store_type_id,
            'is_active' => true,
        ]);

    $response->assertSessionHasNoErrors();
    expect($store->fresh()->name)->toBe('Nama Baru');
});

// ── Catatan internal developer ────────────────────────────────────────────

test('developer can add an internal note to a store', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post("/developer/stores/{$store->id}/notes", [
            'note' => 'Owner minta bantuan migrasi data dari sistem lama.',
        ]);

    $response->assertRedirect();
    $note = StoreNote::where('store_id', $store->id)->first();
    expect($note)->not->toBeNull();
    expect($note->developer_id)->toBe($developer->id);
    expect($note->note)->toBe('Owner minta bantuan migrasi data dari sistem lama.');
});

test('developer can delete their own note', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);
    $note = StoreNote::create(['store_id' => $store->id, 'developer_id' => $developer->id, 'note' => 'X']);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->delete("/developer/stores/{$store->id}/notes/{$note->id}")
        ->assertRedirect();

    expect(StoreNote::find($note->id))->toBeNull();
});

test('note from another store cannot be deleted via wrong store id', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $storeA = supportToolingStore($owner);
    $storeB = supportToolingStore($owner);
    $note = StoreNote::create(['store_id' => $storeA->id, 'developer_id' => $developer->id, 'note' => 'X']);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->delete("/developer/stores/{$storeB->id}/notes/{$note->id}");

    // Handler global aplikasi mengubah 404 jadi redirect dashboard + flash error
    $response->assertRedirect(route('admin.dashboard'));
    expect(StoreNote::find($note->id))->not->toBeNull();
});

// ── Impersonation ──────────────────────────────────────────────────────────

test('developer can start impersonating a store owner', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post("/developer/stores/{$store->id}/impersonate/{$owner->id}");

    $response->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticatedAs($owner);
    expect(session('impersonator_id'))->toBe($developer->id);
    expect(session('current_store_id'))->toBe($store->id);

    $log = DeveloperActionLog::where('action', 'store.impersonate')->first();
    expect($log)->not->toBeNull();
    expect($log->developer_id)->toBe($developer->id);
});

test('developer cannot impersonate another developer', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $otherDeveloper = User::factory()->create(['is_developer' => true]);
    $storeType = StoreType::firstOrCreate(['code' => 'retail'], ['label' => 'Retail', 'is_active' => true]);
    $store = Store::create(['code' => 'DEVDEV', 'name' => 'X', 'store_type_id' => $storeType->id]);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post("/developer/stores/{$store->id}/impersonate/{$otherDeveloper->id}");

    $response->assertForbidden();
});

test('developer cannot impersonate a user not connected to the store', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $unrelatedUser = User::factory()->create();
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post("/developer/stores/{$store->id}/impersonate/{$unrelatedUser->id}");

    // Handler global aplikasi mengubah 404 jadi redirect dashboard + flash error
    $response->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticatedAs($developer);
});

test('stop-impersonating returns to the original developer account', function () {
    $developer = User::factory()->create(['is_developer' => true]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($developer)
        ->post("/developer/stores/{$store->id}/impersonate/{$owner->id}");

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->post('/stop-impersonating');

    $response->assertRedirect(route('developer.dashboard'));
    $this->assertAuthenticatedAs($developer);
    expect(session('impersonator_id'))->toBeNull();
});

test('non-developer cannot start impersonation', function () {
    $user = User::factory()->create(['is_developer' => false]);
    $owner = User::factory()->create();
    $store = supportToolingStore($owner);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($user)
        ->post("/developer/stores/{$store->id}/impersonate/{$owner->id}");

    $response->assertStatus(403);
});
