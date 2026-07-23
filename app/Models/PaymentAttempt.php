<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAttempt extends Model
{
    protected $fillable = [
        'pg_transaction_id', 'attempt_no', 'idempotency_key',
        'http_status', 'result', 'gateway_error_code', 'error_message',
        'request_snapshot', 'response_snapshot',
    ];

    protected $casts = [
        'request_snapshot' => 'array',
        'response_snapshot' => 'array',
    ];

    // ── Relationships ────────────────────────────

    public function pgTransaction(): BelongsTo
    {
        return $this->belongsTo(PaymentGatewayTransaction::class, 'pg_transaction_id');
    }
}
