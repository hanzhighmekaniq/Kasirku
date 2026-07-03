<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        "code",
        "label",
        "description",
        "max_users",
        "max_branches",
        "price",
        "trial_days",
        "is_active",
        "sort_order",
    ];

    protected function casts(): array
    {
        return [
            "is_active" => "boolean",
            "price" => "decimal:2",
            "max_users" => "integer",
            "max_branches" => "integer",
            "trial_days" => "integer",
            "sort_order" => "integer",
        ];
    }

    public function stores(): HasMany
    {
        return $this->hasMany(Store::class, "plan", "code");
    }

    public function planFeatures(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, "plan_feature");
    }

    public function featureCodes(): array
    {
        return $this->planFeatures()->pluck("code")->toArray();
    }

    /** Get all features as label-friendly array */
    public function featureList(): array
    {
        return $this->planFeatures()
            ->orderBy("sort_order")
            ->pluck("label", "code")
            ->toArray();
    }
}
