<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Membership extends Model
{
    use HasFactory;

    protected $fillable = [
        "store_id",
        "code",
        "name",
        "description",
        "duration_type",
        "duration_value",
        "price",
        "discount_percent",
        "point_multiplier",
        "sort_order",
        "benefits",
        "is_active",
    ];

    protected function casts(): array
    {
        return [
            "benefits" => "array",
            "is_active" => "boolean",
            "price" => "decimal:2",
            "discount_percent" => "decimal:2",
            "point_multiplier" => "integer",
            "sort_order" => "integer",
            "duration_value" => "integer",
        ];
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customerMemberships(): HasMany
    {
        return $this->hasMany(CustomerMembership::class);
    }

    // --- Helpers ---

    /** Hitung tanggal expired dari tanggal mulai */
    public function calculateExpiry(\Carbon\Carbon $from): ?\Carbon\Carbon
    {
        return match ($this->duration_type) {
            "day" => $from->copy()->addDays($this->duration_value),
            "month" => $from->copy()->addMonths($this->duration_value),
            "year" => $from->copy()->addYears($this->duration_value),
            "visit" => null, // berbasis kunjungan, tidak ada expired date
            default => null,
        };
    }
}
