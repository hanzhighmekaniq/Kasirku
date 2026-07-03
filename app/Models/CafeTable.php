<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CafeTable extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'branch_id', 'table_number', 'zone',
        'capacity', 'status', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'capacity'  => 'integer',
            'is_active' => 'boolean',
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

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'table_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'resource_id')
            ->where('resource_type', 'table');
    }

    // --- Helpers ---

    public function isAvailable(): bool  { return $this->status === 'available'; }
    public function isOccupied(): bool   { return $this->status === 'occupied'; }
    public function isReserved(): bool   { return $this->status === 'reserved'; }

    public function activeSale(): ?Sale
    {
        return $this->sales()
            ->whereIn('status', ['pending', 'processing'])
            ->latest()
            ->first();
    }
}
