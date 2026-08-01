<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Kode OTP verifikasi email untuk registrasi mandiri.
 *
 * Data form registrasi (nama, password ter-hash, pilihan jenis usaha,
 * template, dan plan) ditahan di kolom `payload` sampai kodenya
 * terverifikasi — User & Store baru dibuat SETELAH verifikasi berhasil,
 * sehingga tidak ada akun/toko setengah jadi di database.
 */
class RegistrationOtp extends Model
{
    use HasFactory;

    /** Masa berlaku kode sejak dibuat. */
    public const TTL_MINUTES = 10;

    /** Batas percobaan kode salah sebelum harus minta kode baru. */
    public const MAX_ATTEMPTS = 5;

    protected $fillable = [
        'email',
        'code',
        'payload',
        'attempts',
        'expires_at',
    ];

    protected $hidden = ['code', 'payload'];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'attempts' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Buat (atau perbarui) kode untuk sebuah email. Memakai email sebagai
     * kunci unik supaya percobaan registrasi ulang menggantikan kode lama,
     * bukan menumpuk baris baru.
     *
     * @param  array<string, mixed>  $payload
     */
    public static function issueFor(string $email, array $payload): self
    {
        return self::updateOrCreate(
            ['email' => $email],
            [
                'code' => self::generateCode(),
                'payload' => $payload,
                'attempts' => 0,
                'expires_at' => now()->addMinutes(self::TTL_MINUTES),
            ],
        );
    }

    /** Kode numerik 6 digit, aman secara kriptografis. */
    public static function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function hasReachedMaxAttempts(): bool
    {
        return $this->attempts >= self::MAX_ATTEMPTS;
    }

    /** Cocokkan kode secara timing-safe. */
    public function matches(string $code): bool
    {
        return hash_equals($this->code, $code);
    }

    public function recordFailedAttempt(): void
    {
        $this->increment('attempts');
    }

    /** Sisa percobaan sebelum kode harus diminta ulang. */
    public function remainingAttempts(): int
    {
        return max(0, self::MAX_ATTEMPTS - $this->attempts);
    }
}
