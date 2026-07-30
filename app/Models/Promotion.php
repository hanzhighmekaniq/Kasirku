<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'code',
        'name',
        'type',
        'scope',
        'discount_value',
        'min_purchase_amount',
        'max_discount_amount',
        'min_quantity',
        'tier_price',
        'customer_tier',
        'customer_tier_id',
        'start_date',
        'end_date',
        'start_hour',
        'end_hour',
        'free_product_id',
        'free_variant_id',
        'free_quantity',
        'applicable_days',
        'is_active',
        'max_usage',
        'used_count',
    ];

    /** Tipe promo yang didukung, dipakai untuk validasi & label di UI. */
    public const TYPES = [
        'percentage',
        'fixed_amount',
        'buy_x_get_y',
        'bundle',
        'tiered',
        'member_price',
        'bogo',
    ];

    /**
     * Cakupan yang valid per tipe promo. Tipe yang hanya bisa dihitung per
     * baris item tidak boleh dipakai sebagai diskon keranjang, karena
     * perhitungannya butuh konteks produk dan kuantitas.
     *
     * @var array<string, list<string>>
     */
    public const SCOPE_SUPPORT = [
        'percentage' => ['item', 'cart'],
        'fixed_amount' => ['item', 'cart'],
        'buy_x_get_y' => ['item'],
        'bundle' => ['item'],
        'tiered' => ['item'],
        'member_price' => ['item'],
        'bogo' => ['item'],
    ];

    /** Kode hari yang dipakai di kolom applicable_days. */
    public const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    /** Cakupan yang boleh dipakai untuk sebuah tipe promo. */
    public static function scopesForType(?string $type): array
    {
        return self::SCOPE_SUPPORT[$type] ?? ['item', 'cart'];
    }

    /** Apakah kombinasi tipe + cakupan ini valid? */
    public static function supportsScope(?string $type, ?string $scope): bool
    {
        return in_array($scope, self::scopesForType($type), true);
    }

    protected static function booted(): void
    {
        static::creating(function ($promotion) {
            if (is_null($promotion->store_id)) {
                $promotion->store_id = session('current_store_id', 1);
            }
        });
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customerTier(): BelongsTo
    {
        return $this->belongsTo(CustomerTier::class, 'customer_tier_id');
    }

    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_purchase_amount' => 'decimal:2',
            'max_discount_amount' => 'decimal:2',
            'tier_price' => 'decimal:2',
            'min_quantity' => 'integer',
            'max_usage' => 'integer',
            'used_count' => 'integer',
            'free_quantity' => 'integer',
            'applicable_days' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'promotion_products')
            ->withPivot(['variant_id', 'packaging_unit_id']);
    }

    public function freeProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'free_product_id');
    }

    public function freeVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'free_variant_id');
    }

    public function isActiveNow(): bool
    {
        if (! $this->is_active) {
            return false;
        }
        if ($this->start_date && $this->start_date->isFuture()) {
            return false;
        }
        if ($this->end_date && $this->end_date->isPast()) {
            return false;
        }

        // Flash sale: check time window
        if ($this->start_hour && $this->end_hour) {
            $now = now()->format('H:i');
            if ($now < $this->start_hour || $now > $this->end_hour) {
                return false;
            }
        }

        if (! $this->isActiveOnDay()) {
            return false;
        }

        return true;
    }

    /**
     * Apakah promo berlaku pada hari ini? applicable_days yang kosong berarti
     * promo berlaku setiap hari.
     */
    public function isActiveOnDay(?Carbon $at = null): bool
    {
        $days = $this->applicable_days;

        if (empty($days) || ! is_array($days)) {
            return true;
        }

        // Carbon dayOfWeek: 0 = Minggu, jadi indeks DAYS digeser agar Senin = 0.
        $index = (($at ?? now())->dayOfWeek + 6) % 7;

        return in_array(self::DAYS[$index], $days, true);
    }
}
