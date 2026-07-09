<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashierShift extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        "store_id",
        "branch_id",
        "user_id",
        "shift_no",
        "opened_at",
        "closed_at",
        "opening_cash",
        "expected_cash",
        "actual_cash",
        "cash_difference",
        "total_sales",
        "total_refunds",
        "status",
        "opening_note",
        "closing_note",
        "deleted_by",
    ];

    protected function casts(): array
    {
        return [
            "opened_at" => "datetime",
            "closed_at" => "datetime",
            "opening_cash" => "decimal:2",
            "expected_cash" => "decimal:2",
            "actual_cash" => "decimal:2",
            "cash_difference" => "decimal:2",
            "total_sales" => "decimal:2",
            "total_refunds" => "decimal:2",
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(CashierShiftPayment::class);
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, "deleted_by");
    }

    public function isOpen(): bool
    {
        return $this->status === "open";
    }
}
