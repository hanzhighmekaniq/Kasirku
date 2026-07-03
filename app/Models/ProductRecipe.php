<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductRecipe extends Model
{
    protected $fillable = [
        'product_id',
        'raw_material_id',
        'quantity',
        'unit',
        'is_nullable',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity'    => 'decimal:4',
            'is_nullable' => 'boolean',
        ];
    }

    // ── Relationships ────────────────────────────

    /** Produk jadi (finished_goods / combo) */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /** Bahan baku (raw_material) */
    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'raw_material_id');
    }
}
