<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'label',
        'description',
        'max_users',
        'max_branches',
        'max_stores',
        'max_products',
        'max_transactions_per_month',
        'price',
        'price_yearly',
        'trial_days',
        'is_active',
        'is_popular',
        'is_seasonal',
        'seasonal_label',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_popular' => 'boolean',
            'is_seasonal' => 'boolean',
            'price' => 'decimal:2',
            'price_yearly' => 'decimal:2',
            'max_users' => 'integer',
            'max_branches' => 'integer',
            'max_stores' => 'integer',
            'max_products' => 'integer',
            'max_transactions_per_month' => 'integer',
            'trial_days' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    // --- Relationships ---

    /**
     * Stores yang menggunakan plan ini (via owner user).
     */
    public function stores(): HasManyThrough
    {
        return $this->hasManyThrough(Store::class, User::class, 'plan_id', 'user_id');
    }

    /**
     * Add-on yang tersedia untuk plan ini
     */
    public function addons(): HasMany
    {
        return $this->hasMany(PlanAddon::class)->orderBy('sort_order');
    }

    /**
     * Features yang dimiliki plan ini (many-to-many via plan_feature)
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(
            Feature::class,
            'plan_feature',
        )->withTimestamps();
    }

    /**
     * Alias untuk konsistensi dengan naming convention lama
     *
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

    /**
     * Ambil semua feature detail codes dari seluruh fitur plan ini.
     * Relasi: Plan → plan_feature → Feature → feature_details
     */
    public function featureDetailCodes(): array
    {
        return FeatureDetail::whereIn(
            'feature_id',
            $this->features()->pluck('features.id'),
        )
            ->where('is_active', true)
            ->pluck('code')
            ->toArray();
    }

    /**
     * Cek apakah plan ini punya feature detail tertentu
     */
    public function hasFeatureDetail(string $detailCode): bool
    {
        return FeatureDetail::whereIn(
            'feature_id',
            $this->features()->pluck('features.id'),
        )
            ->where('code', $detailCode)
            ->where('is_active', true)
            ->exists();
    }

    /** Apakah limit produk di plan ini unlimited (null = unlimited)? */
    public function isUnlimitedProducts(): bool
    {
        return $this->max_products === null;
    }

    /** Apakah limit transaksi per bulan di plan ini unlimited (null = unlimited)? */
    public function isUnlimitedTransactions(): bool
    {
        return $this->max_transactions_per_month === null;
    }

    /** Apakah limit cabang di plan ini unlimited? Konvensi project: 999 = unlimited. */
    public function isUnlimitedBranches(): bool
    {
        return $this->max_branches === null || $this->max_branches >= 999;
    }
}
