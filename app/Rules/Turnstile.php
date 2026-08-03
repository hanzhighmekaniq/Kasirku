<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * Verifikasi token Cloudflare Turnstile (anti-bot) ke API Cloudflare.
 *
 * Dilewati otomatis kalau secret key belum diisi DAN aplikasi berjalan di
 * environment lokal — supaya development tidak terblokir sebelum key
 * didaftarkan. Di environment lain, secret key kosong berarti token
 * dianggap tidak valid (fail-closed, bukan fail-open).
 */
class Turnstile implements ValidationRule
{
    /**
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Di environment lokal, Turnstile selalu dilewati — baik key ada
        // maupun tidak — supaya development tidak terblokir.
        if (app()->environment('local')) {
            return;
        }

        $secret = config('services.turnstile.secret_key');

        if (blank($secret)) {
            Log::warning('[Turnstile] Secret key belum dikonfigurasi — registrasi ditolak.');
            $fail('Verifikasi anti-bot belum dikonfigurasi. Hubungi administrator.');

            return;
        }

        if (blank($value)) {
            $fail('Verifikasi anti-bot belum diselesaikan. Silakan coba lagi.');

            return;
        }

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post(config('services.turnstile.verify_url'), [
                    'secret' => $secret,
                    'response' => $value,
                    'remoteip' => request()->ip(),
                ]);
        } catch (\Throwable $e) {
            Log::error('[Turnstile] Gagal menghubungi Cloudflare: '.$e->getMessage());
            $fail('Verifikasi anti-bot gagal dihubungi. Silakan coba lagi.');

            return;
        }

        if (! $response->successful() || $response->json('success') !== true) {
            Log::info('[Turnstile] Token ditolak.', [
                'errors' => $response->json('error-codes'),
            ]);
            $fail('Verifikasi anti-bot gagal. Silakan muat ulang halaman dan coba lagi.');
        }
    }
}
