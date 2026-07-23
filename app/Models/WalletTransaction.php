<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'store_id', 'wallet_id', 'type', 'amount', 'balance_after',
        'referenceable_type', 'referenceable_id', 'description', 'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    // ── Relationships ────────────────────────────

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(StoreWallet::class, 'wallet_id');
    }

    public function referenceable(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Helpers ───────────────────────────────────

    public static function typeLabels(): array
    {
        return [
            'sale_credit' => 'Pembayaran Masuk',
            'withdrawal_debit' => 'Penarikan Dana',
            'refund_debit' => 'Refund',
            'adjustment' => 'Penyesuaian',
        ];
    }
}
