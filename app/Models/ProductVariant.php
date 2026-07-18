<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'name', 'sku', 'barcode', 'price', 'cost_price', 'is_active',
    ];

    protected $appends = ['stock'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function priceTiers(): HasMany
    {
        return $this->hasMany(ProductPriceTier::class, 'variant_id')->orderBy('min_qty');
    }

    public function packagingUnits(): HasMany
    {
        return $this->hasMany(ProductPackagingUnit::class, 'variant_id');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(ProductStock::class, 'variant_id');
    }

    public function getStockAttribute(): int
    {
        if ($this->relationLoaded('stocks')) {
            return $this->stocks
                ->whereNull('packaging_unit_id')
                ->sum('quantity') - $this->stocks
                ->whereNull('packaging_unit_id')
                ->sum('reserved_quantity');
        }

        return $this->stocks()
            ->whereNull('packaging_unit_id')
            ->sum('quantity') - $this->stocks()
            ->whereNull('packaging_unit_id')
            ->sum('reserved_quantity');
    }

    /** Ambil harga tier yang berlaku untuk qty tertentu dari variant ini */
    public function getTierPrice(int $quantity): ?float
    {
        $tier = $this->priceTiers
            ->where('min_qty', '<=', $quantity)
            ->sortByDesc('min_qty')
            ->first();

        return $tier ? (float) $tier->price : null;
    }
}
