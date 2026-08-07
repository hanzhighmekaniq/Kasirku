<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StoreWallet extends Model
{
    protected $fillable = [
        'store_id', 'balance', 'pending_balance', 'withdrawn',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'pending_balance' => 'decimal:2',
        'withdrawn' => 'decimal:2',
    ];

    // ── Relationships ────────────────────────────

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class, 'wallet_id');
    }

    // ── Helpers ───────────────────────────────────

    /**
     * Credit the wallet balance and record a transaction.
     * Wrap in DB::transaction() at the call site when part of a larger unit of work.
     */
    public function credit(float $amount, string $type, ?Model $referenceable = null, ?string $description = null, ?int $createdBy = null, string $environment = 'production'): WalletTransaction
    {
        $this->increment('balance', $amount);
        $this->refresh();

        return WalletTransaction::create([
            'store_id' => $this->store_id,
            'wallet_id' => $this->id,
            'type' => $type,
            'environment' => $environment,
            'amount' => $amount,
            'balance_after' => $this->balance,
            'referenceable_type' => $referenceable ? $referenceable::class : null,
            'referenceable_id' => $referenceable?->id,
            'description' => $description,
            'created_by' => $createdBy,
        ]);
    }

    /**
     * Debit the wallet balance and record a transaction.
     * Wrap in DB::transaction() at the call site when part of a larger unit of work.
     */
    public function debit(float $amount, string $type, ?Model $referenceable = null, ?string $description = null, ?int $createdBy = null): WalletTransaction
    {
        $this->decrement('balance', $amount);
        $this->refresh();

        return WalletTransaction::create([
            'store_id' => $this->store_id,
            'wallet_id' => $this->id,
            'type' => $type,
            'environment' => 'production',
            'amount' => -$amount,
            'balance_after' => $this->balance,
            'referenceable_type' => $referenceable ? $referenceable::class : null,
            'referenceable_id' => $referenceable?->id,
            'description' => $description,
            'created_by' => $createdBy,
        ]);
    }

    /**
     * Saldo yang bisa ditarik = hanya dari environment production.
     * Kalau PG sandbox, tidak ada saldo yang bisa ditarik —
     * termasuk data lama (default production) dianggap palsu karena
     * transaksi terjadi saat PG sandbox.
     */
    public function withdrawableBalance(): float
    {
        if (PlatformPaymentGateway::isSandbox()) {
            return 0;
        }

        $productionCredits = $this->transactions()
            ->where('environment', 'production')
            ->where('amount', '>', 0)
            ->sum('amount');

        $debits = $this->transactions()
            ->where('amount', '<', 0)
            ->sum('amount');

        return (float) $productionCredits + (float) $debits;
    }
}
