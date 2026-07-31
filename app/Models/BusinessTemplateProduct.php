<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Produk contoh di dalam satu kategori template bisnis — level kedua dari
 * data yang di-seed ke toko baru (lihat BusinessTemplateBlueprint::apply()).
 */
class BusinessTemplateProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_template_category_id',
        'sku',
        'name',
        'unit',
        'cost_price',
        'sell_price',
        'track_stock',
        'stock_minimum',
        'preparation_time',
        'is_composable',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'sell_price' => 'decimal:2',
            'track_stock' => 'boolean',
            'stock_minimum' => 'integer',
            'preparation_time' => 'integer',
            'is_composable' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BusinessTemplateCategory::class, 'business_template_category_id');
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
