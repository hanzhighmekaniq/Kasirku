<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Add-on yang bisa dibeli oleh pemilik toko di luar batas plan utama.
 *
 * Setiap plan hanya boleh punya satu baris per kode add-on (unique plan_id+code).
 * Free & Starter tidak punya add-on; Pro bisa tambah cabang/user;
 * Business bisa tambah store/cabang/user.
 */
class PlanAddon extends Model
{
    protected $fillable = [
        'plan_id',
        'code',
        'label',
        'price',
        'description',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** Kode add-on yang didukung */
    public const CODES = [
        'branch' => 'Tambah Cabang',
        'user' => 'Tambah User',
        'store' => 'Tambah Store',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
