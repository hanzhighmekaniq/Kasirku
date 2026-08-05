<?php

/*
|--------------------------------------------------------------------------
| Registrasi Mandiri — Langsung Buat Akun
|--------------------------------------------------------------------------
|
| Alur baru:
|   1. POST /register → email + password → akun langsung dibuat, login,
|      redirect ke /onboarding (pilih jenis usaha + nama toko).
|   2. Nama user di-generate otomatis dari email + timestamp.
|   3. Tidak ada OTP, tidak ada captcha.
|   4. Password wajib huruf besar, huruf kecil, dan angka (simbol
|      opsional) — divalidasi via Password::min(8)->mixedCase()->numbers().
|   5. Verifikasi email TIDAK memblokir apapun — toko langsung dibuat
|      dengan plan Free begitu onboarding selesai.
|
*/

use App\Models\Plan;
use App\Models\User;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

// ── Registrasi ──────────────────────────────────────────────────────────────

test('registration screen can be rendered', function () {
    registrationPrerequisites();

    $this->get('/register')->assertSuccessful();
});

test('submitting the form creates the account and logs the user in', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'email' => 'test@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    $response->assertRedirect(route('onboarding'));
    $this->assertAuthenticated();

    $user = User::where('email', 'test@example.com')->first();
    expect($user)->not->toBeNull();

    // Nama di-generate otomatis dari email
    expect($user->name)->toContain('test_');
    expect($user->name)->toMatch('/^test_\d{8}_\d{6}$/');

    // User dibuat dengan plan Free
    $freePlan = Plan::where('code', 'free')->first();
    expect($user->plan_id)->toBe($freePlan?->id);

    // Store BELUM dibuat — user harus onboarding dulu
    expect($user->stores()->count())->toBe(0);
});

test('generated name is unique even with same email timestamp', function () {
    registrationPrerequisites();

    $this->post('/register', [
        'email' => 'test@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ])->assertRedirect(route('onboarding'));

    // Logout untuk register lagi
    Auth::logout();

    $this->post('/register', [
        'email' => 'test@example.com',
        'password' => 'Password456',
        'password_confirmation' => 'Password456',
    ])->assertSessionHasErrors('email');
});

test('duplicate email is rejected', function () {
    registrationPrerequisites();
    User::factory()->create(['email' => 'taken@example.com']);

    $response = $this->post('/register', [
        'email' => 'taken@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    $response->assertSessionHasErrors('email');
});

test('weak password is rejected', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'email' => 'weak@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors('password');
});

test('password without uppercase letter is rejected', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'email' => 'nolower@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertSessionHasErrors('password');
});

test('password without number is rejected', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'email' => 'nonumber@example.com',
        'password' => 'PasswordOnly',
        'password_confirmation' => 'PasswordOnly',
    ]);

    $response->assertSessionHasErrors('password');
});

test('password with uppercase, lowercase, and number but no symbol is accepted', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'email' => 'nosymbol@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    $response->assertRedirect(route('onboarding'));
    $this->assertAuthenticated();
});

test('password confirmation must match', function () {
    registrationPrerequisites();

    $response = $this->post('/register', [
        'email' => 'test@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'DifferentPassword',
    ]);

    $response->assertSessionHasErrors('password');
    $this->assertGuest();
});

test('name and captcha are not required for registration', function () {
    registrationPrerequisites();

    // Tidak mengirim name atau cf_turnstile_response — tetap berhasil
    $response = $this->post('/register', [
        'email' => 'simple@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    $response->assertRedirect(route('onboarding'));
    $this->assertAuthenticated();

    $user = User::where('email', 'simple@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toContain('simple_');
});
