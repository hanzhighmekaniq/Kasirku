<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class CustomerMembership extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id', 'membership_id', 'sale_id',
        'start_date', 'expired_date',
        'remaining_visits', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date'   => 'date',
            'expired_date' => 'date',
        ];
    }

    // --- Scopes ---

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expired_date')
                  ->orWhere('expired_date', '>=', now());
            });
    }

    // --- Relationships ---

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function membership(): BelongsTo
    {
        return $this->belongsTo(Membership::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    // --- Helpers ---

    public function isActive(): bool
    {
        return $this->status === 'active'
            && ($this->expired_date === null || $this->expired_date->isFuture());
    }

    public function isExpired(): bool
    {
        return $this->expired_date !== null && $this->expired_date->isPast();
    }
}
