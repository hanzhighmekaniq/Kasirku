<?php

/*
|--------------------------------------------------------------------------
| Cloudflare Turnstile — verifikasi anti-bot di registrasi
|--------------------------------------------------------------------------
|
| Rule ini fail-closed: kalau secret key belum dikonfigurasi di environment
| non-lokal, registrasi ditolak (bukan dibiarkan lolos). Di environment
| lokal, verifikasi dilewati supaya development tidak terblokir sebelum
| key didaftarkan.
|
*/

use App\Rules\Turnstile;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

function validateTurnstile(mixed $token): Illuminate\Validation\Validator
{
    return Validator::make(
        ['cf_turnstile_response' => $token],
        ['cf_turnstile_response' => [new Turnstile]],
    );
}

test('verification is skipped in local environment when secret key is empty', function () {
    config(['services.turnstile.secret_key' => null]);
    app()->detectEnvironment(fn () => 'local');

    expect(validateTurnstile(null)->passes())->toBeTrue();
});

test('verification fails closed in production when secret key is empty', function () {
    config(['services.turnstile.secret_key' => null]);
    app()->detectEnvironment(fn () => 'production');

    expect(validateTurnstile('some-token')->fails())->toBeTrue();
});

test('empty token is rejected when secret key is configured', function () {
    config(['services.turnstile.secret_key' => 'test-secret']);

    expect(validateTurnstile(null)->fails())->toBeTrue();
});

test('token accepted when cloudflare reports success', function () {
    config(['services.turnstile.secret_key' => 'test-secret']);
    Http::fake([
        '*challenges.cloudflare.com*' => Http::response(['success' => true]),
    ]);

    expect(validateTurnstile('valid-token')->passes())->toBeTrue();
});

test('token rejected when cloudflare reports failure', function () {
    config(['services.turnstile.secret_key' => 'test-secret']);
    Http::fake([
        '*challenges.cloudflare.com*' => Http::response([
            'success' => false,
            'error-codes' => ['invalid-input-response'],
        ]),
    ]);

    expect(validateTurnstile('bad-token')->fails())->toBeTrue();
});

test('token rejected when cloudflare is unreachable', function () {
    config(['services.turnstile.secret_key' => 'test-secret']);
    Http::fake(function () {
        throw new ConnectionException('Connection timed out');
    });

    expect(validateTurnstile('any-token')->fails())->toBeTrue();
});
