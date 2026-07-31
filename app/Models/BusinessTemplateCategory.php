<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Kategori contoh di dalam satu template bisnis — level pertama dari data
 * yang di-seed ke toko baru (lihat BusinessTemplateBlueprint::apply()).
 */
class BusinessTemplateCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_template_id',
        'name',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function businessTemplate(): BelongsTo
    {
        return $this->belongsTo(BusinessTemplate::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(BusinessTemplateProduct::class);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
