<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessHour extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'day_of_week', 'open_time', 'close_time', 'is_closed',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'is_closed' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Cek apakah toko buka pada waktu tertentu.
     */
    public function isOpenAt(string $time): bool
    {
        if ($this->is_closed) {
            return false;
        }

        if (! $this->open_time || ! $this->close_time) {
            return false;
        }

        return $time >= $this->open_time && $time <= $this->close_time;
    }

    /**
     * Format jam operasional untuk display.
     */
    public function getFormattedAttribute(): string
    {
        if ($this->is_closed) {
            return 'Tutup';
        }

        if (! $this->open_time || ! $this->close_time) {
            return 'Tutup';
        }

        return $this->open_time.' - '.$this->close_time;
    }
}
