<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feature extends Model
{
    use HasFactory;

    protected $fillable = [
        "code",
        "label",
        "description",
        "category",
        "is_active",
        "sort_order",
    ];

    protected function casts(): array
    {
        return [
            "is_active" => "boolean",
            "sort_order" => "integer",
        ];
    }

    // --- Relationships ---

    /**
     * Plans yang memiliki feature ini (many-to-many via plan_feature)
     */
    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, "plan_feature")
            ->withTimestamps();
    }

    /**
     * Store types yang memiliki feature ini (many-to-many via store_type_feature)
     */
    public function storeTypes(): BelongsToMany
    {
        return $this->belongsToMany(
            StoreType::class,
            "store_type_feature"
        )->withTimestamps();
    }

    /**
     * Feature details yang terkait dengan feature ini (one-to-many)
     */
    public function featureDetails(): HasMany
    {
        return $this->hasMany(FeatureDetail::class);
    }

    /**
     * Ambil semua detail codes dari feature ini
     */
    public function detailCodes(): array
    {
        return $this->featureDetails()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('code')
            ->toArray();
    }

    /**
     * Ambil detail dengan label untuk display
     */
    public function detailList(): array
    {
        return $this->featureDetails()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('label', 'code')
            ->toArray();
    }
}
