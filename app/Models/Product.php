<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'category_id',
        'supplier_id',
        'sku',
        'barcode',
        'name',
        'description',
        'type',
        'image',
        'is_composable',
        'preparation_time',
        'is_sellable',
        'unit',
        'base_unit',
        'base_unit_conversion',
        'cost_price',
        'sell_price',
        'price_per_hour',
        'min_duration_minutes',
        'stock_minimum',
        'track_stock',
        'is_active',
        'is_variant',
        'sell_base',
        'track_batch',
        // per-type fields
        'capacity',
        'max_guests',
        'valid_duration_minutes',
        'session_duration_minutes',
        'deposit_amount',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'sell_price' => 'decimal:2',
            'base_unit_conversion' => 'decimal:4',
            'price_per_hour' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'is_composable' => 'boolean',
            'is_sellable' => 'boolean',
            'track_stock' => 'boolean',
            'track_batch' => 'boolean',
            'is_active' => 'boolean',
            'is_variant' => 'boolean',
            'sell_base' => 'boolean',
        ];
    }

    // --- Scopes ---

    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSellable(Builder $query): Builder
    {
        return $query->where('is_sellable', true)->where('is_active', true);
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(ProductBatch::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(ProductStock::class);
    }

    public function modifierGroups(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductModifierGroup::class,
            'product_modifier_products',
            'product_id',
            'modifier_group_id',
        )->withTimestamps();
    }

    /** Resep bahan baku produk ini */
    public function recipes(): HasMany
    {
        return $this->hasMany(ProductRecipe::class, 'product_id');
    }

    /** Produk jadi mana saja yang pakai bahan baku ini */
    public function usedInRecipes(): HasMany
    {
        return $this->hasMany(ProductRecipe::class, 'raw_material_id');
    }

    /** Multi-satuan / packaging units */
    public function packagingUnits(): HasMany
    {
        return $this->hasMany(ProductPackagingUnit::class);
    }

    /** Harga grosir bertingkat */
    public function priceTiers(): HasMany
    {
        return $this->hasMany(ProductPriceTier::class)->orderBy('min_qty');
    }

    /** Ambil harga tier yang berlaku untuk qty tertentu, opsional scoped ke variant */
    public function getTierPrice(int $quantity, ?int $variantId = null): ?float
    {
        // Jika variantId diberikan, cari tier khusus variant dulu
        if ($variantId !== null) {
            $variantTier = $this->priceTiers
                ->where('variant_id', $variantId)
                ->where('min_qty', '<=', $quantity)
                ->sortByDesc('min_qty')
                ->first();

            if ($variantTier) {
                return (float) $variantTier->price;
            }
        }

        // Fallback ke tier product-level (variant_id = NULL)
        $tier = $this->priceTiers
            ->whereNull('variant_id')
            ->where('min_qty', '<=', $quantity)
            ->sortByDesc('min_qty')
            ->first();

        return $tier ? (float) $tier->price : null;
    }

    /** Generate next SKU — BRG-00001, BRG-00002, ... */
    public static function generateSku(int $storeId): string
    {
        $prefix = 'BRG-';
        $last = static::where('store_id', $storeId)
            ->where('sku', 'like', $prefix.'%')
            ->orderByDesc('sku')
            ->first();

        if ($last) {
            $seq = intval(substr($last->sku, strlen($prefix))) + 1;
        } else {
            $seq = 1;
        }

        return $prefix.str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }

    // --- Helpers ---

    /**
     * Selaraskan is_composable dengan keberadaan resep.
     * Field ini tidak pernah di-expose ke user — dikelola otomatis.
     */
    public function syncIsComposable(): void
    {
        $hasRecipes = $this->recipes()->exists();

        if ($this->is_composable !== $hasRecipes) {
            $this->update(['is_composable' => $hasRecipes]);
        }
    }

    /**
     * Apakah produk ini memakai konversi satuan beli → satuan pakai?
     *
     * Ini SATU-SATUNYA gerbang menuju semua logika konversi. Syaratnya ganda
     * dan sengaja ketat:
     *
     *   1. type === 'raw_material' — hanya bahan baku yang punya dua satuan
     *      di satu baris produk (beli kg, pakai gram). Barang jadi retail
     *      memisahkan satuannya ke bucket packaging_unit masing-masing, jadi
     *      tidak pernah butuh konversi (lihat komentar di KasirController
     *      soal "bucket tidak melakukan konversi otomatis").
     *   2. base_unit_conversion > 0 — konversi memang diisi.
     *
     * Selama salah satu tidak terpenuhi, seluruh helper di bawah mengembalikan
     * nilai apa adanya sehingga perilaku lama terjaga persis.
     */
    public function usesUnitConversion(): bool
    {
        return $this->type === 'raw_material'
            && (float) ($this->base_unit_conversion ?? 0) > 0;
    }

    /**
     * Konversi qty dari satuan beli (unit) ke satuan pakai (base_unit).
     * Contoh: beli 5 kg, konversi 1000 → 5.000 gram masuk ke stok.
     *
     * Dipakai di titik masuk stok (pembelian) supaya saldo stok selalu
     * tersimpan dalam satuan yang sama dengan yang dipotong resep.
     */
    public function toBaseUnit(float $quantity): float
    {
        if (! $this->usesUnitConversion()) {
            return $quantity;
        }

        return $quantity * (float) $this->base_unit_conversion;
    }

    /**
     * Modal per satuan pakai (base_unit).
     * Kalau ada konversi: cost_price dibagi konversi.
     * Contoh: beli 1 kg Rp 20.000, konversi 1000 → Rp 20 / gram.
     */
    public function costPerBaseUnit(): float
    {
        if (! $this->usesUnitConversion()) {
            return (float) $this->cost_price;
        }

        return (float) $this->cost_price / (float) $this->base_unit_conversion;
    }

    public function currentStock(?int $branchId = null): float
    {
        $q = $this->stocks();
        if ($branchId) {
            $q = $q->where('branch_id', $branchId);
        }

        return $q->sum('quantity') - $q->sum('reserved_quantity');
    }

    public function isLowStock(?int $branchId = null): bool
    {
        return $this->track_stock &&
            $this->currentStock($branchId) <= $this->stock_minimum;
    }

    public function isService(): bool
    {
        return $this->type === 'service';
    }

    public function isRental(): bool
    {
        return $this->type === 'rental_item';
    }

    public function isTimeBased(): bool
    {
        return $this->type === 'time_based';
    }
}
