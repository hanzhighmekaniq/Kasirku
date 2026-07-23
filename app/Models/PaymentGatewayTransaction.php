<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentGatewayTransaction extends Model
{
    /**
     * Terminal states — once reached, polling/cron should stop touching
     * the record (aside from being finalized by webhook/checkStatus).
     */
    public const TERMINAL_STATUSES = ['paid', 'expired', 'failed', 'cancelled'];

    /**
     * States where the outcome is not yet known and needs reconciliation
     * against the provider before deciding what happens next.
     */
    public const AMBIGUOUS_STATUSES = ['unknown', 'checking'];

    /** Max charge attempts allowed for a single PG transaction before retry is blocked. */
    public const MAX_ATTEMPTS = 3;

    protected $fillable = [
        'sale_id', 'sale_split_payer_id', 'provider', 'external_id',
        'idempotency_key', 'attempt_no',
        'payment_type', 'status', 'gateway_http_status', 'amount',
        'raw_response', 'status_checked_at', 'error_message', 'gateway_error_code',
    ];

    protected $casts = [
        'raw_response' => 'array',
        'amount' => 'decimal:2',
        'status_checked_at' => 'datetime',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function splitPayer(): BelongsTo
    {
        return $this->belongsTo(SaleSplitPayer::class, 'sale_split_payer_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class, 'pg_transaction_id');
    }

    // ── State machine helpers ──────────────────────

    /**
     * Mark this transaction as "unknown" after a 5xx/timeout from the
     * gateway. The charge may or may not have succeeded on the
     * provider's side — must be reconciled before deciding retry vs paid.
     */
    public function markUnknown(?int $httpStatus, ?string $errorMessage): void
    {
        $this->update([
            'status' => 'unknown',
            'gateway_http_status' => $httpStatus,
            'error_message' => $errorMessage,
        ]);
    }

    /** Mark this transaction as actively being reconciled against the provider. */
    public function markChecking(): void
    {
        $this->update(['status' => 'checking']);
    }

    /** Apply the actual status returned by the provider's Status API. */
    public function markReconciled(string $actualStatus): void
    {
        $this->update([
            'status' => $actualStatus,
            'status_checked_at' => now(),
        ]);
    }

    /** Whether this transaction can be retried with a new attempt. */
    public function isRetryable(): bool
    {
        return $this->status === 'failed' && $this->attempt_no < self::MAX_ATTEMPTS;
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, self::TERMINAL_STATUSES, true);
    }

    public function isAmbiguous(): bool
    {
        return in_array($this->status, self::AMBIGUOUS_STATUSES, true);
    }
}
