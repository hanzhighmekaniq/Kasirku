<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Riwayat suspend/aktivasi kembali sebuah toko — memperkuat kolom
 * `stores.is_active` yang sudah ada dengan alasan wajib dan histori
 * lengkap (siapa, kapan, kenapa). Baris dengan `reactivated_at = null`
 * berarti suspend itu masih berlaku.
 */
class StoreSuspension extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'reason',
        'suspended_by',
        'suspended_at',
        'reactivated_at',
        'reactivated_by',
    ];

    protected function casts(): array
    {
        return [
            'suspended_at' => 'datetime',
            'reactivated_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function suspendedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'suspended_by');
    }

    public function reactivatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reactivated_by');
    }

    /** Apakah suspend ini masih berlaku (belum diaktifkan kembali). */
    public function isActive(): bool
    {
        return $this->reactivated_at === null;
    }
}
