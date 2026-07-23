<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentMethod extends Model
{
    protected $fillable = [
        'store_id',
        'code',
        'name',
        'type',
        'provider',
        'image',
        'account_number',
        'account_name',
        'is_active',
        'sort_order',
    ];

    protected static function booted(): void
    {
        static::creating(function ($method) {
            if (is_null($method->store_id)) {
                $method->store_id = session('current_store_id', 1);
            }
        });
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // ── Relationships ────────────────────────────

    public function salePayments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }

    public function purchasePayments(): HasMany
    {
        return $this->hasMany(PurchasePayment::class);
    }

    // ── Scopes ───────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Helpers ──────────────────────────────────

    /**
     * Daftar tipe yang tersedia.
     */
    public static function types(): array
    {
        return ['cash', 'digital', 'card', 'credit', 'debt'];
    }
}
