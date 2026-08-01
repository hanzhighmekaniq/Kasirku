<?php

/*
|--------------------------------------------------------------------------
| Proteksi Lupa Password — rate limit & captcha
|--------------------------------------------------------------------------
|
| Tanpa proteksi ini, bot bisa spam kirim email reset ke alamat siapa pun:
| kuota SMTP terbakar dan pemilik email diteror email yang tidak diminta.
|
*/

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    RateLimiter::clear('');
    // Bersihkan seluruh limiter supaya throttle test tidak bocor antar test.
    cache()->flush();
});

test('forgot password page exposes the turnstile site key', function () {
    config(['services.turnstile.site_key' => 'test-site-key']);

    $response = $this->get('/forgot-password');

    $response->assertOk();
    expect($response->viewData('page')['props']['turnstileSiteKey'])
        ->toBe('test-site-key');
});

test('reset link is sent when captcha passes', function () {
    Notification::fake();
    config(['services.turnstile.secret_key' => 'test-secret']);
    Http::fake(['*challenges.cloudflare.com*' => Http::response(['success' => true])]);

    $user = User::factory()->create();

    $this->post('/forgot-password', [
        'email' => $user->email,
        'cf_turnstile_response' => 'valid-token',
    ])->assertSessionHasNoErrors();

    Notification::assertSentTo($user, ResetPassword::class);
});

test('reset link is NOT sent when captcha fails', function () {
    Notification::fake();
    config(['services.turnstile.secret_key' => 'test-secret']);
    Http::fake(['*challenges.cloudflare.com*' => Http::response(['success' => false])]);

    $user = User::factory()->create();

    $this->post('/forgot-password', [
        'email' => $user->email,
        'cf_turnstile_response' => 'bad-token',
    ])->assertSessionHasErrors('cf_turnstile_response');

    Notification::assertNothingSent();
});

test('forgot password is rate limited after 3 attempts per minute', function () {
    Notification::fake();

    // Email berbeda per percobaan: Laravel punya throttle bawaan di password
    // broker (60 detik untuk email yang SAMA), jadi memakai satu email hanya
    // menguji throttle broker, bukan throttle route per-IP yang kita tambahkan.
    $users = User::factory()->count(4)->create();

    foreach ($users->take(3) as $user) {
        $this->post('/forgot-password', ['email' => $user->email])
            ->assertSessionHasNoErrors();
    }

    // Percobaan ke-4 dari IP yang sama ditahan throttle route (HTTP 429).
    $this->post('/forgot-password', ['email' => $users->last()->email])
        ->assertStatus(429);
});
