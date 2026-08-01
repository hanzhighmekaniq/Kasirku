<?php

/*
|--------------------------------------------------------------------------
| Registrasi Mandiri — Dua Tahap dengan Verifikasi OTP Wajib
|--------------------------------------------------------------------------
|
| Alur:
|   1. POST /register        → validasi form, kirim kode OTP. Akun & toko
|                              BELUM dibuat.
|   2. POST /register/verify → kode benar, baru User + Store dibuat.
|
| Verifikasi bersifat WAJIB: tidak ada jalur yang membuat akun tanpa kode
| terverifikasi.
|
*/

use App\Models\BusinessTemplate;
use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\RegistrationOtp;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use App\Notifications\RegistrationOtpCode;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
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

/**
 * Selesaikan tahap 1 dan kembalikan baris OTP-nya.
 */
function submitRegistrationForm(array $overrides = []): array
{
    [$storeType, $template, $plan] = registrationPrerequisites();

    $payload = array_merge([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
        'store_type_id' => $storeType->id,
        'business_template_code' => $template->code,
        'plan_id' => $plan->id,
    ], $overrides);

    $response = test()->post('/register', $payload);

    return [$response, $payload, $storeType, $template, $plan];
}

// ── Tahap 1: kirim kode ────────────────────────────────────────────────────

test('registration screen can be rendered', function () {
    registrationPrerequisites();

    $this->get('/register')->assertStatus(200);
});

test('submitting the form sends an otp and does NOT create the account yet', function () {
    Notification::fake();

    [$response, $payload] = submitRegistrationForm();

    $response->assertSessionHasNoErrors();

    // Akun & toko belum ada — verifikasi dulu.
    expect(User::where('email', $payload['email'])->exists())->toBeFalse();
    expect(Store::count())->toBe(0);
    $this->assertGuest();

    $otp = RegistrationOtp::where('email', $payload['email'])->first();
    expect($otp)->not->toBeNull();
    expect($otp->code)->toHaveLength(6);

    // Password disimpan sudah ter-hash, bukan plaintext.
    expect($otp->payload['password'])->not->toBe($payload['password']);
    expect(Hash::check($payload['password'], $otp->payload['password']))->toBeTrue();

    Notification::assertSentOnDemand(RegistrationOtpCode::class);
});

test('registration requires store type and plan', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test2@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    $response->assertSessionHasErrors(['store_type_id', 'plan_id']);
    expect(RegistrationOtp::count())->toBe(0);
});

test('weak password is rejected by the password policy', function () {
    [$storeType, $template, $plan] = registrationPrerequisites();

    $response = $this->post('/register', [
        'name' => 'Weak Password User',
        'email' => 'weak@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $response->assertSessionHasErrors('password');
    expect(RegistrationOtp::count())->toBe(0);
});

test('duplicate email is rejected before sending a code', function () {
    [$storeType, , $plan] = registrationPrerequisites();
    User::factory()->create(['email' => 'taken@example.com']);

    $response = $this->post('/register', [
        'name' => 'Duplicate',
        'email' => 'taken@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $response->assertSessionHasErrors('email');
    expect(RegistrationOtp::count())->toBe(0);
});

// ── Tahap 2: verifikasi kode ───────────────────────────────────────────────

test('correct code creates the account, store, and logs the user in', function () {
    Notification::fake();

    [, $payload, $storeType, , $plan] = submitRegistrationForm();
    $otp = RegistrationOtp::where('email', $payload['email'])->first();

    $response = $this->post('/register/verify', [
        'email' => $payload['email'],
        'code' => $otp->code,
    ]);

    $response->assertRedirect(route('admin.dashboard', absolute: false));
    $this->assertAuthenticated();

    $user = User::where('email', $payload['email'])->first();
    expect($user)->not->toBeNull();
    // Password hasil hash tahap 1 tetap dipakai (tidak di-hash dua kali).
    expect(Hash::check($payload['password'], $user->password))->toBeTrue();

    $store = Store::whereIn('id', $user->stores()->pluck('stores.id'))->first();
    expect($store)->not->toBeNull();
    expect($store->user_id)->toBe($user->id);
    expect($store->store_type_id)->toBe($storeType->id);
    expect($store->plan_id)->toBe($plan->id);
    expect($store->plan_expires_at->isSameDay(now()->addDays(14)))->toBeTrue();
    expect($store->branches()->count())->toBe(1);
    expect($store->paymentMethods()->count())->toBe(2);

    expect(Category::where('store_id', $store->id)->count())->toBeGreaterThan(0);
    expect(Product::where('store_id', $store->id)->count())->toBeGreaterThan(0);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    expect(User::find($user->id)->hasRole('owner'))->toBeTrue();

    // OTP dibersihkan setelah dipakai.
    expect(RegistrationOtp::where('email', $payload['email'])->exists())->toBeFalse();
});

test('registration without a business template creates an empty store', function () {
    Notification::fake();

    [, $payload] = submitRegistrationForm([
        'email' => 'empty@example.com',
        'business_template_code' => null,
    ]);
    $otp = RegistrationOtp::where('email', $payload['email'])->first();

    $this->post('/register/verify', [
        'email' => $payload['email'],
        'code' => $otp->code,
    ])->assertRedirect(route('admin.dashboard', absolute: false));

    $user = User::where('email', $payload['email'])->first();
    $store = Store::whereIn('id', $user->stores()->pluck('stores.id'))->first();

    expect(Category::where('store_id', $store->id)->count())->toBe(0);
    expect(Product::where('store_id', $store->id)->count())->toBe(0);
});

test('wrong code is rejected and increments the attempt counter', function () {
    Notification::fake();

    [, $payload] = submitRegistrationForm();

    $response = $this->post('/register/verify', [
        'email' => $payload['email'],
        'code' => '000000',
    ]);

    $response->assertSessionHasErrors('code');
    $this->assertGuest();
    expect(User::where('email', $payload['email'])->exists())->toBeFalse();
    expect(RegistrationOtp::where('email', $payload['email'])->first()->attempts)->toBe(1);
});

test('code is rejected after max attempts are exhausted', function () {
    Notification::fake();

    [, $payload] = submitRegistrationForm();
    $otp = RegistrationOtp::where('email', $payload['email'])->first();
    $otp->update(['attempts' => RegistrationOtp::MAX_ATTEMPTS]);

    // Bahkan kode yang benar ditolak setelah percobaan habis.
    $response = $this->post('/register/verify', [
        'email' => $payload['email'],
        'code' => $otp->code,
    ]);

    $response->assertSessionHasErrors('code');
    expect(User::where('email', $payload['email'])->exists())->toBeFalse();
});

test('expired code is rejected and the pending registration is discarded', function () {
    Notification::fake();

    [, $payload] = submitRegistrationForm();
    RegistrationOtp::where('email', $payload['email'])
        ->update(['expires_at' => now()->subMinute()]);

    $otp = RegistrationOtp::where('email', $payload['email'])->first();

    $response = $this->post('/register/verify', [
        'email' => $payload['email'],
        'code' => $otp->code,
    ]);

    $response->assertSessionHasErrors('code');
    expect(User::where('email', $payload['email'])->exists())->toBeFalse();
    expect(RegistrationOtp::where('email', $payload['email'])->exists())->toBeFalse();
});

test('verifying an unknown email is rejected', function () {
    registrationPrerequisites();

    $response = $this->post('/register/verify', [
        'email' => 'nobody@example.com',
        'code' => '123456',
    ]);

    $response->assertSessionHasErrors('code');
    $this->assertGuest();
});

// ── Kirim ulang kode ───────────────────────────────────────────────────────

test('resending issues a new code and resets the attempt counter', function () {
    Notification::fake();

    [, $payload] = submitRegistrationForm();
    $original = RegistrationOtp::where('email', $payload['email'])->first();
    $original->update(['attempts' => 3]);
    $originalCode = $original->code;

    $this->post('/register/resend', ['email' => $payload['email']])
        ->assertSessionHasNoErrors();

    $fresh = RegistrationOtp::where('email', $payload['email'])->first();
    expect($fresh->attempts)->toBe(0);
    expect($fresh->code)->not->toBe($originalCode);
    // Data form yang ditahan tetap sama.
    expect($fresh->payload['name'])->toBe($payload['name']);

    Notification::assertSentOnDemandTimes(RegistrationOtpCode::class, 2);
});

test('resending for an unknown email is rejected', function () {
    registrationPrerequisites();

    $this->post('/register/resend', ['email' => 'nobody@example.com'])
        ->assertSessionHasErrors('code');
});

// ── Re-submit menggantikan kode lama, bukan menumpuk ──────────────────────

test('submitting the form again replaces the pending code instead of stacking rows', function () {
    Notification::fake();

    [, $payload, $storeType, $template, $plan] = submitRegistrationForm();
    $firstCode = RegistrationOtp::where('email', $payload['email'])->first()->code;

    $this->post('/register', [
        'name' => 'Test User Updated',
        'email' => $payload['email'],
        'password' => 'Password456',
        'password_confirmation' => 'Password456',
        'store_type_id' => $storeType->id,
        'business_template_code' => $template->code,
        'plan_id' => $plan->id,
    ])->assertSessionHasNoErrors();

    expect(RegistrationOtp::where('email', $payload['email'])->count())->toBe(1);

    $otp = RegistrationOtp::where('email', $payload['email'])->first();
    expect($otp->code)->not->toBe($firstCode);
    expect($otp->payload['name'])->toBe('Test User Updated');
});
