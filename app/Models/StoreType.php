<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StoreType extends Model
{
    use HasFactory;

    protected $fillable = [
        "code",
        "label",
        "icon",
        "description",
        "order_types",
        "pos_behavior",
        "is_active",
        "sort_order",
    ];

    protected function casts(): array
    {
        return [
            "order_types" => "array",
            "is_active" => "boolean",
            "sort_order" => "integer",
        ];
    }

    // --- Relationships ---

    /**
     * Stores yang menggunakan store type ini
     */
    public function stores(): HasMany
    {
        return $this->hasMany(Store::class, 'store_type_id');
    }

    /**
     * Features yang dimiliki store type ini (many-to-many via store_type_feature)
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(
            Feature::class,
            "store_type_feature"
        )->withTimestamps();
    }

    /**
     * Ambil semua feature codes dari store type ini
     */
    public function featureCodes(): array
    {
        return $this->features()
            ->where('is_active', true)
            ->pluck('code')
            ->toArray();
    }

    /**
     * Get all features as label-friendly array
     */
    public function featureList(): array
    {
        return $this->features()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('label', 'code')
            ->toArray();
    }

    // --- Static Helpers ---

    /**
     * Ambil semua tipe aktif, diurutkan
     */
    public static function active(): array
    {
        return self::where("is_active", true)
            ->orderBy("sort_order")
            ->get()
            ->toArray();
    }

    /**
     * Ambil kode tipe saja
     */
    public static function codes(): array
    {
        return self::where("is_active", true)
            ->orderBy("sort_order")
            ->pluck("code")
            ->toArray();
    }
}
