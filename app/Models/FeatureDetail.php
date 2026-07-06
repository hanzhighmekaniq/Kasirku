<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeatureDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'feature_id',
        'code',
        'label',
        'description',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // --- Relationships ---

    public function feature(): BelongsTo
    {
        return $this->belongsTo(Feature::class);
    }
}
