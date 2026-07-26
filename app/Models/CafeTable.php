<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
            'capacity' => 'integer',
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

    /**
     * Order yang sedang berjalan di meja ini (yang terbaru kalau ada
     * beberapa). Sengaja relasi HasOne — bukan method biasa — supaya bisa
     * di-eager-load (`with('activeSale')`) saat merender floor map tanpa
     * N+1 query.
     *
     * Filter status ditaruh di closure `ofMany` supaya ikut masuk ke dalam
     * subquery agregat. Kalau filternya dipasang di luar (mis.
     * `->whereNotIn(...)->latestOfMany()`), subquery akan mengambil sale
     * TERBARU tanpa peduli status, lalu baris itu tersaring habis di luar —
     * sehingga order lama yang masih aktif jadi tidak terlihat.
     */
    public function activeSale(): HasOne
    {
        return $this->hasOne(Sale::class, 'table_id')->ofMany(
            ['id' => 'max'],
            fn ($query) => $query->whereNotIn('status', Sale::CLOSED_STATUSES),
        );
    }

    // --- Helpers ---

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    public function isOccupied(): bool
    {
        return $this->status === 'occupied';
    }

    public function isReserved(): bool
    {
        return $this->status === 'reserved';
    }

    /**
     * Apakah meja ini masih menahan order yang belum selesai?
     *
     * Dipakai sebagai penentu boleh-tidaknya meja dibebaskan. Status
     * 'processing' yang dulu dicari tidak pernah terjadi pada siklus hidup
     * sale FnB (draft → pending → completed), jadi pengecekan dibalik:
     * apa pun yang belum berstatus closed dihitung masih aktif.
     */
    public function hasActiveOrder(): bool
    {
        return $this->sales()
            ->whereNotIn('status', Sale::CLOSED_STATUSES)
            ->exists();
    }
}
