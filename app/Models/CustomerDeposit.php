<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerDeposit extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'store_id', 'customer_id', 'user_id',
        'deposit_no', 'type', 'amount', 'remaining_balance', 'total_used',
        'payment_method', 'reference_no', 'notes', 'deposit_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'remaining_balance' => 'decimal:2',
            'total_used' => 'decimal:2',
            'deposit_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isFullyUsed(): bool
    {
        return $this->remaining_balance <= 0.01;
    }

    public function deduct(float $amount): void
    {
        $this->increment('total_used', $amount);
        $this->decrement('remaining_balance', $amount);
    }
}
