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

    // --- Relationships ---

    /**
     * Stores yang menggunakan plan ini
     */
    public function stores(): HasMany
    {
        return $this->hasMany(Store::class, "plan_id");
    }

    /**
     * Features yang dimiliki plan ini (many-to-many via plan_feature)
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(
            Feature::class,
            "plan_feature",
        )->withTimestamps();
    }

    /**
     * Alias untuk konsistensi dengan naming convention lama
     * @deprecated Use features() instead
     */
    public function planFeatures(): BelongsToMany
    {
        return $this->features();
    }

    /**
     * Ambil semua feature codes dari plan ini
     */
    public function featureCodes(): array
    {
        return $this->features()
            ->where("is_active", true)
            ->pluck("code")
            ->toArray();
    }

    /**
     * Get all features as label-friendly array
     */
    public function featureList(): array
    {
        return $this->features()
            ->where("is_active", true)
            ->orderBy("sort_order")
            ->pluck("label", "code")
            ->toArray();
    }

    /**
     * Ambil semua feature detail codes dari seluruh fitur plan ini.
     * Relasi: Plan → plan_feature → Feature → feature_details
     */
    public function featureDetailCodes(): array
    {
        return \App\Models\FeatureDetail::whereIn(
            "feature_id",
            $this->features()->pluck("features.id"),
        )
            ->where("is_active", true)
            ->pluck("code")
            ->toArray();
    }

    /**
     * Cek apakah plan ini punya feature detail tertentu
     */
    public function hasFeatureDetail(string $detailCode): bool
    {
        return \App\Models\FeatureDetail::whereIn(
            "feature_id",
            $this->features()->pluck("features.id"),
        )
            ->where("code", $detailCode)
            ->where("is_active", true)
            ->exists();
    }
}
