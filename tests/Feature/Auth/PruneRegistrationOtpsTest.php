<?php

/*
|--------------------------------------------------------------------------
| Pembersihan kode OTP registrasi yang kedaluwarsa
|--------------------------------------------------------------------------
|
| Baris OTP menahan data form registrasi yang belum diselesaikan. Command
| ini membersihkan yang sudah lewat 24 jam dari masa berlaku, supaya tabel
| tidak menumpuk sampah — tapi TIDAK menyentuh kode yang masih berlaku
| atau yang baru saja kedaluwarsa (masih bisa ditelusuri kalau ada laporan).
|
*/

use App\Models\RegistrationOtp;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeOtp(string $email, CarbonInterface $expiresAt): RegistrationOtp
{
    return RegistrationOtp::create([
        'email' => $email,
        'code' => '123456',
        'payload' => ['name' => 'X'],
        'expires_at' => $expiresAt,
    ]);
}

test('prune deletes otps expired more than 24 hours ago', function () {
    makeOtp('old@example.com', now()->subDays(2));

    $this->artisan('registration-otp:prune')->assertSuccessful();

    expect(RegistrationOtp::where('email', 'old@example.com')->exists())->toBeFalse();
});

test('prune keeps codes that are still valid', function () {
    makeOtp('active@example.com', now()->addMinutes(5));

    $this->artisan('registration-otp:prune');

    expect(RegistrationOtp::where('email', 'active@example.com')->exists())->toBeTrue();
});

test('prune keeps recently expired codes within the 24 hour grace period', function () {
    makeOtp('recent@example.com', now()->subHours(2));

    $this->artisan('registration-otp:prune');

    expect(RegistrationOtp::where('email', 'recent@example.com')->exists())->toBeTrue();
});
