<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'code', 'name', 'phone', 'email', 'address',
        'birth_date', 'gender',
        'points', 'tier', 'total_spent', 'last_visit_at',
        'deposit_balance', 'debt_balance', 'credit_limit', 'notes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'last_visit_at' => 'datetime',
            'total_spent' => 'decimal:2',
            'deposit_balance' => 'decimal:2',
            'debt_balance' => 'decimal:2',
            'credit_limit' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(CustomerMembership::class);
    }

    public function depositLogs(): HasMany
    {
        return $this->hasMany(CustomerDepositLog::class);
    }

    public function debtLogs(): HasMany
    {
        return $this->hasMany(CustomerDebtLog::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function queueTickets(): HasMany
    {
        return $this->hasMany(QueueTicket::class);
    }

    // --- Helpers ---

    public function activeMembership(): ?CustomerMembership
    {
        return $this->memberships()
            ->where('status', 'active')
            ->where('expired_date', '>=', now())
            ->latest()
            ->first();
    }
}
