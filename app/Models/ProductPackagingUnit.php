<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPackagingUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'variant_id',
        'name',
        'conversion_qty',
        'sell_price',
        'barcode',
    ];

    protected function casts(): array
    {
        return [
            'conversion_qty' => 'integer',
            'sell_price' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
