<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomField extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'entity_type', 'field_name', 'field_label',
        'field_type', 'options', 'is_required', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'is_required' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(CustomFieldValue::class);
    }

    /**
     * Scope: filter by entity type (product/customer).
     */
    public function scopeForEntity($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }
}
