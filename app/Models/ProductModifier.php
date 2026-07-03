<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductModifier extends Model
{
    use HasFactory;

    protected $fillable = [
        'modifier_group_id', 'name', 'price_addition', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_addition' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function modifierGroup(): BelongsTo
    {
        return $this->belongsTo(ProductModifierGroup::class, 'modifier_group_id');
    }
}
