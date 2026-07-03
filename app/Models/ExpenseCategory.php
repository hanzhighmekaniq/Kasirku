<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ExpenseCategory extends Model
{
    use HasFactory;

    protected $fillable = ["store_id", "code", "name", "description"];

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

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
