<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class ProductModifierGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        "store_id",
        "name",
        "description",
        "is_required",
        "selection_type",
        "max_selection",
        "sort_order",
        "is_active",
    ];

    protected static function booted(): void
    {
        static::creating(function ($group) {
            if (is_null($group->store_id)) {
                $group->store_id = session("current_store_id", 1);
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

    protected function casts(): array
    {
        return [
            "is_required" => "boolean",
            "is_active" => "boolean",
        ];
    }

    public function modifiers(): HasMany
    {
        return $this->hasMany(ProductModifier::class, "modifier_group_id");
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(
            Product::class,
            "product_modifier_products",
            "modifier_group_id",
            "product_id",
        );
    }
}
