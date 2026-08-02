<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Order upgrade plan — menghubungkan permintaan upgrade dengan pembayaran
 * dan perubahan plan aktif toko.
 *
 * Mode manual: status tetap `pending`, developer approve via panel Developer.
 * Mode otomatis (PG aktif): redirect ke PG, status berubah via webhook.
 */
class PlanOrder extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_LABELS = [
        'pending' => 'Menunggu Pembayaran',
        'paid' => 'Lunas',
        'failed' => 'Gagal',
        'expired' => 'Kedaluwarsa',
        'cancelled' => 'Dibatalkan',
    ];

    public const PERIOD_MONTHLY = 'monthly';

    public const PERIOD_YEARLY = 'yearly';

    public const PERIOD_LABELS = [
        'monthly' => 'Bulanan',
        'yearly' => 'Tahunan',
    ];

    protected $fillable = [
        'store_id',
        'plan_id',
        'billing_period',
        'amount',
        'status',
        'paid_at',
        'plan_active_until',
        'payment_gateway',
        'pg_transaction_id',
        'pg_token',
        'idempotency_key',
        'created_by',
        'processed_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'plan_active_until' => 'date',
        ];
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // --- Helpers ---

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isManual(): bool
    {
        return $this->payment_gateway === null;
    }

    public function statusLabel(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function periodLabel(): string
    {
        return self::PERIOD_LABELS[$this->billing_period] ?? $this->billing_period;
    }

    /**
     * Generate kode referensi unik (ditampilkan ke user sebagai nomor order).
     * Format: ORD-YYYYMMDD-XXXXXXXX (8 karakter hex random)
     */
    public static function generateIdempotencyKey(): string
    {
        do {
            $key = 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(8));
        } while (self::where('idempotency_key', $key)->exists());

        return $key;
    }

    /**
     * Hitung tanggal plan_active_until berdasarkan plan_expires_at toko
     * dan periode billing. Kalau toko masih dalam trial/plan aktif, extend
     * dari tanggal expired. Kalau sudah expired, mulai dari sekarang.
     */
    public static function calculateActiveUntil(Store $store, string $billingPeriod): Carbon
    {
        $expiresAt = $store->owner?->plan_expires_at;
        $base = ($expiresAt && $expiresAt->isFuture())
            ? $expiresAt
            : now();

        return match ($billingPeriod) {
            self::PERIOD_YEARLY => $base->copy()->addYear(),
            default => $base->copy()->addMonth(),
        };
    }
}
