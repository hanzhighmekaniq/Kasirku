<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        "store_id",
        "parent_id",
        "name",
        "type",
        "slug",
        "description",
    ];

    protected static function booted(): void
    {
        static::creating(function ($category) {
            if (is_null($category->store_id)) {
                $category->store_id = session("current_store_id", 1);
            }
        });
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->where("store_id", $storeId);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, "parent_id");
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, "parent_id");
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
