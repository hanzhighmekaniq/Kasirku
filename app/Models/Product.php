<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'category_id', 'supplier_id',
        'sku', 'barcode', 'name', 'description', 'type', 'image',
        'is_composable', 'preparation_time',
        'is_sellable', 'unit', 'base_unit',
        'cost_price', 'sell_price',
        'price_per_hour', 'min_duration_minutes',
        'stock_minimum', 'track_stock', 'is_active',
        // per-type fields
        'capacity', 'max_guests',
        'valid_duration_minutes', 'session_duration_minutes',
        'deposit_amount',
    ];

    protected function casts(): array
    {
        return [
            'cost_price'               => 'decimal:2',
            'sell_price'               => 'decimal:2',
            'price_per_hour'           => 'decimal:2',
            'deposit_amount'           => 'decimal:2',
            'is_composable'            => 'boolean',
            'is_sellable'              => 'boolean',
            'track_stock'              => 'boolean',
            'is_active'                => 'boolean',
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
            'modifier_group_id'
        );
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

    // --- Helpers ---

    public function currentStock(?int $branchId = null): float
    {
        $q = $this->stocks();
        if ($branchId) $q = $q->where('branch_id', $branchId);
        return $q->sum('quantity') - $q->sum('reserved_quantity');
    }

    public function isLowStock(?int $branchId = null): bool
    {
        return $this->track_stock && $this->currentStock($branchId) <= $this->stock_minimum;
    }

    public function isService(): bool   { return $this->type === 'service'; }
    public function isRental(): bool    { return $this->type === 'rental_item'; }
    public function isTimeBased(): bool { return $this->type === 'time_based'; }
}
