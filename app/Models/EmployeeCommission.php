<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class EmployeeCommission extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'store_id', 'sale_id', 'sale_item_id',
        'type', 'commission_rate', 'base_amount', 'commission_amount',
        'status', 'commission_date', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate'   => 'decimal:2',
            'base_amount'       => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'commission_date'   => 'date',
        ];
    }

    // --- Scopes ---

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeForPeriod(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('commission_date', [$from, $to]);
    }

    // --- Relationships ---

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }
}
