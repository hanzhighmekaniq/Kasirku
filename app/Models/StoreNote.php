<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Catatan internal developer per toko — untuk keperluan support/debug,
 * tidak pernah ditampilkan ke pemilik toko.
 */
class StoreNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'developer_id',
        'note',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function developer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'developer_id');
    }
}
