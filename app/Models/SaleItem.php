<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id', 'product_id', 'variant_id', 'product_batch_id',
        'promotion_id', 'quantity', 'price', 'discount_amount', 'promo_discount', 'subtotal',
        'modifiers', 'recipe_snapshot', 'ingredient_cost', 'notes',
    ];

    protected $casts = [
        'modifiers'       => 'array',
        'recipe_snapshot' => 'array',
        'ingredient_cost' => 'decimal:2',
        'promo_discount'  => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function productBatch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class);
    }

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }
}
