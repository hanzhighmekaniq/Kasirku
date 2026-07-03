<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Feature extends Model
{
    use HasFactory;

    protected $fillable = [
        "code",
        "label",
        "description",
        "category",
        "applicable_types",
        "is_active",
        "sort_order",
    ];

    protected function casts(): array
    {
        return [
            "is_active" => "boolean",
            "sort_order" => "integer",
            "applicable_types" => "array",
        ];
    }

    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, "plan_feature");
    }
}
