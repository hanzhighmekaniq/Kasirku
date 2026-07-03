<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'branch_id', 'customer_id', 'employee_id', 'sale_id',
        'booking_no', 'resource_type', 'resource_id',
        'customer_name', 'customer_phone',
        'booking_start_at', 'booking_end_at',
        'guest_count', 'deposit_amount', 'deposit_paid',
        'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'booking_start_at' => 'datetime',
            'booking_end_at'   => 'datetime',
            'deposit_amount'   => 'decimal:2',
            'deposit_paid'     => 'decimal:2',
        ];
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    // --- Helpers ---

    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isConfirmed(): bool { return $this->status === 'confirmed'; }
    public function isCancelled(): bool { return $this->status === 'cancelled'; }
}
