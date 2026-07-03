<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class QueueTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'branch_id', 'customer_id', 'employee_id', 'sale_id',
        'queue_no', 'category', 'customer_name', 'customer_phone',
        'status', 'called_at', 'started_at', 'finished_at',
        'queue_date', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'called_at'   => 'datetime',
            'started_at'  => 'datetime',
            'finished_at' => 'datetime',
            'queue_date'  => 'date',
        ];
    }

    // --- Scopes ---

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('queue_date', today());
    }

    public function scopeWaiting(Builder $query): Builder
    {
        return $query->where('status', 'waiting');
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

    public function isWaiting(): bool   { return $this->status === 'waiting'; }
    public function isInService(): bool { return $this->status === 'in_service'; }
    public function isDone(): bool      { return $this->status === 'done'; }
}
