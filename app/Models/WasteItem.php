<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WasteItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'waste_id', 'product_id', 'product_batch_id', 'quantity',
        'unit_cost', 'total_cost', 'waste_category', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'unit_cost'  => 'decimal:2',
            'total_cost' => 'decimal:2',
        ];
    }

    public function waste(): BelongsTo
    {
        return $this->belongsTo(Waste::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productBatch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class);
    }
}
