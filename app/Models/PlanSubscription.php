<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Riwayat perubahan plan seorang user — dicatat setiap kali plan berubah
 * (registrasi awal, upgrade/downgrade manual oleh developer, atau otomatis
 * saat trial expired via command `plan:check-expired`).
 *
 * Baris dengan `ended_at = null` berarti itu periode plan yang sedang aktif.
 */
class PlanSubscription extends Model
{
    use HasFactory;

    public const REASONS = [
        'initial' => 'Plan awal saat akun dibuat',
        'upgraded' => 'Upgrade plan',
        'downgraded' => 'Downgrade plan',
        'trial_expired' => 'Trial habis, otomatis turun ke Free',
        'manual' => 'Diubah manual oleh developer',
        'reactivated' => 'Diaktifkan kembali',
    ];

    protected $fillable = [
        'user_id',
        'plan_id',
        'started_at',
        'ended_at',
        'reason',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
