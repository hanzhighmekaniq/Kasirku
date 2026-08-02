<?php

/*
|--------------------------------------------------------------------------
| Registrasi Mandiri — Dua Tahap dengan Verifikasi OTP Wajib
|--------------------------------------------------------------------------
|
| Alur baru:
|   1. POST /register        → validasi form akun + captcha, kirim kode OTP.
|                              User BELUM dibuat.
|   2. POST /register/verify → kode benar, User dibuat (plan Free), login,
|                              redirect ke onboarding.
|   3. POST /onboarding      → user pilih plan, jenis usaha, nama toko.
|                              Store baru dibuat di sini.
|
| Verifikasi bersifat WAJIB: tidak ada jalur yang membuat akun tanpa kode
| terverifikasi.
|
*/

use App\Models\Plan;
use App\Models\RegistrationOtp;
use App\Models\User;
use App\Notifications\RegistrationOtpCode;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function registrationPrerequisites(): void
{
    test()->seed(PermissionSeeder::class);

    Plan::create([
        'code' => 'free',
        'label' => 'Free',
        'price' => 0,
        'trial_days' => 0,
        'is_active' => true,
        'sort_order' => 0,
    ]);
}

/**
 * Selesaikan tahap 1 dan kembalikan baris OTP-nya.
 */
function submitRegistrationForm(array $overrides = []): array
{
    registrationPrerequisites();

    $payload = array_merge([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ], $overrides);

    $response = test()->post('/register', $payload);

    return [$response, $payload];
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

    // Akun belum ada — verifikasi dulu.
    expect(User::where('email', $payload['email'])->exists())->toBeFalse();
    $this->assertGuest();

    $otp = RegistrationOtp::where('email', $payload['email'])->first();
    expect($otp)->not->toBeNull();
    expect($otp->code)->toHaveLength(6);

    // Password disimpan sudah ter-hash, bukan plaintext.
    expect($otp->payload['password'])->not->toBe($payload['password']);
    expect(Hash::check($payload['password'], $otp->payload['password']))->toBeTrue();

    Notification::assertSentOnDemand(RegistrationOtpCode::class);
});

test('weak password is rejected by the password policy', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'name' => 'Weak Password User',
        'email' => 'weak@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors('password');
    expect(RegistrationOtp::count())->toBe(0);
});

test('duplicate email is rejected before sending a code', function () {
    registrationPrerequisites();
    User::factory()->create(['email' => 'taken@example.com']);

    $response = $this->post('/register', [
        'name' => 'Duplicate',
        'email' => 'taken@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    $response->assertSessionHasErrors('email');
    expect(RegistrationOtp::count())->toBe(0);
});

// ── Tahap 2: verifikasi kode ───────────────────────────────────────────────

test('correct code creates the account (without store) and logs the user in', function () {
    Notification::fake();

    [, $payload] = submitRegistrationForm();
    $otp = RegistrationOtp::where('email', $payload['email'])->first();

    $response = $this->post('/register/verify', [
        'email' => $payload['email'],
        'code' => $otp->code,
    ]);

    // Redirect ke onboarding, bukan dashboard.
    $response->assertRedirect(route('onboarding'));
    $this->assertAuthenticated();

    $user = User::where('email', $payload['email'])->first();
    expect($user)->not->toBeNull();
    // Password hasil hash tahap 1 tetap dipakai (tidak di-hash dua kali).
    expect(Hash::check($payload['password'], $user->password))->toBeTrue();

    // User dibuat dengan plan Free.
    $freePlan = Plan::where('code', 'free')->first();
    expect($user->plan_id)->toBe($freePlan?->id);

    // Store BELUM dibuat — user harus onboarding dulu.
    expect($user->stores()->count())->toBe(0);

    // OTP dibersihkan setelah dipakai.
    expect(RegistrationOtp::where('email', $payload['email'])->exists())->toBeFalse();
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

    [, $payload] = submitRegistrationForm();
    $firstCode = RegistrationOtp::where('email', $payload['email'])->first()->code;

    $this->post('/register', [
        'name' => 'Test User Updated',
        'email' => $payload['email'],
        'password' => 'Password456',
        'password_confirmation' => 'Password456',
    ])->assertSessionHasNoErrors();

    expect(RegistrationOtp::where('email', $payload['email'])->count())->toBe(1);

    $otp = RegistrationOtp::where('email', $payload['email'])->first();
    expect($otp->code)->not->toBe($firstCode);
    expect($otp->payload['name'])->toBe('Test User Updated');
});
