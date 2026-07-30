<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Level tier pelanggan, dikelola sendiri oleh tiap toko.
 *
 * Hierarki ditentukan `rank`: makin besar makin tinggi. Owner bebas menambah
 * level di tengah (misal antara Silver dan Gold) dengan menggeser urutannya —
 * sistem membaca `rank`, bukan nama atau urutan baris di tabel.
 */
class CustomerTier extends Model
{
    use HasFactory;

    /**
     * Warna badge yang boleh dipakai.
     *
     * Dibatasi ke daftar ini supaya kelas Tailwind-nya bisa ditulis statis di
     * frontend; kelas yang dirakit dinamis akan dibuang saat build.
     */
    public const COLORS = [
        'slate',
        'amber',
        'yellow',
        'indigo',
        'emerald',
        'sky',
        'rose',
        'violet',
    ];

    /** Tier bawaan untuk toko baru, urut dari terendah. */
    public const DEFAULTS = [
        ['name' => 'Bronze', 'color' => 'amber'],
        ['name' => 'Silver', 'color' => 'slate'],
        ['name' => 'Gold', 'color' => 'yellow'],
        ['name' => 'Platinum', 'color' => 'indigo'],
    ];

    protected $fillable = [
        'store_id',
        'name',
        'rank',
        'color',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'rank' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class, 'customer_tier_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class, 'maps_to_tier_id');
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class, 'customer_tier_id');
    }

    // --- Scopes ---

    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    /** Urut dari tier terendah ke tertinggi. */
    public function scopeRanked(Builder $query): Builder
    {
        return $query->orderBy('rank')->orderBy('id');
    }

    // --- Helpers ---

    /**
     * Buat tier bawaan untuk toko yang belum punya sama sekali.
     *
     * Dipanggil saat toko dibuat. Aman dipanggil berulang: kalau toko sudah
     * punya tier, tidak ada yang ditambahkan.
     */
    public static function seedDefaultsForStore(int $storeId): void
    {
        if (self::where('store_id', $storeId)->exists()) {
            return;
        }

        foreach (self::DEFAULTS as $index => $tier) {
            self::create([
                'store_id' => $storeId,
                'name' => $tier['name'],
                'color' => $tier['color'],
                'rank' => $index + 1,
                'is_active' => true,
            ]);
        }
    }

    /** Tier terendah milik toko — dipakai sebagai tier default pelanggan. */
    public static function lowestForStore(?int $storeId): ?self
    {
        if (! $storeId) {
            return null;
        }

        return self::forStore($storeId)->where('is_active', true)->ranked()->first();
    }
}
