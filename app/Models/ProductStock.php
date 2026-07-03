<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'store_id', 'branch_id',
        'quantity', 'reserved_quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity'          => 'decimal:4',
            'reserved_quantity' => 'decimal:4',
        ];
    }

    // --- Relationships ---

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    // --- Helpers ---

    public function availableQuantity(): float
    {
        return $this->quantity - $this->reserved_quantity;
    }
}
