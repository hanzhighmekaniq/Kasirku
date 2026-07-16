<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'code',
        'name',
        'type',
        'scope',
        'discount_value',
        'min_purchase_amount',
        'max_discount_amount',
        'min_quantity',
        'tier_price',
        'customer_tier',
        'start_date',
        'end_date',
        'start_hour',
        'end_hour',
        'free_product_id',
        'is_active',
        'max_usage',
        'used_count',
    ];

    protected static function booted(): void
    {
        static::creating(function ($promotion) {
            if (is_null($promotion->store_id)) {
                $promotion->store_id = session('current_store_id', 1);
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

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_purchase_amount' => 'decimal:2',
            'max_discount_amount' => 'decimal:2',
            'tier_price' => 'decimal:2',
            'min_quantity' => 'integer',
            'max_usage' => 'integer',
            'used_count' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'promotion_products');
    }

    public function freeProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'free_product_id');
    }

    public function isActiveNow(): bool
    {
        if (! $this->is_active) {
            return false;
        }
        if ($this->start_date && $this->start_date->isFuture()) {
            return false;
        }
        if ($this->end_date && $this->end_date->isPast()) {
            return false;
        }

        // Flash sale: check time window
        if ($this->start_hour && $this->end_hour) {
            $now = now()->format('H:i');
            if ($now < $this->start_hour || $now > $this->end_hour) {
                return false;
            }
        }

        return true;
    }
}
