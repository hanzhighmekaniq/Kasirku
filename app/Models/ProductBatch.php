<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'store_id', 'branch_id',
        'batch_no', 'purchase_date', 'expiry_date',
        'quantity', 'cost_price',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'expiry_date'   => 'date',
            'cost_price'    => 'decimal:2',
        ];
    }

    // ── Relationships ────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    // ── Helpers ──────────────────────────────────

    /**
     * 'active' | 'expiring_soon' | 'expired'
     * expiring_soon = kadaluarsa dalam 30 hari ke depan
     */
    public function getExpiryStatusAttribute(): string
    {
        if (is_null($this->expiry_date)) return 'active';

        $today = Carbon::today();
        if ($this->expiry_date->lt($today)) return 'expired';
        if ($this->expiry_date->diffInDays($today) <= 30) return 'expiring_soon';

        return 'active';
    }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (is_null($this->expiry_date)) return null;
        return Carbon::today()->diffInDays($this->expiry_date, false);
    }
}
