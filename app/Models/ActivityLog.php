<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        "user_id",
        "store_id",
        "branch_id",
        "log_name",
        "description",
        "subject_type",
        "subject_id",
        "properties",
        "ip_address",
        "user_agent",
    ];

    protected $casts = [
        "properties" => "array",
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }
}
