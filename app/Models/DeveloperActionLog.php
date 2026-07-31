<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Audit log aksi developer platform — terpisah dari `ActivityLog` (log
 * aktivitas operasional di dalam toko). Mencatat siapa developer yang
 * melakukan apa terhadap data platform (plan, store, template bisnis,
 * fitur, dst), termasuk nilai sebelum/setelah untuk keperluan audit.
 */
class DeveloperActionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'developer_id',
        'action',
        'subject_type',
        'subject_id',
        'old_values',
        'new_values',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function developer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'developer_id');
    }

    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Catat satu aksi developer. Dipakai lewat trait `LogsDeveloperActions`
     * di controller Developer, tapi bisa juga dipanggil langsung.
     */
    public static function record(
        string $action,
        ?Model $subject = null,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): self {
        return self::create([
            'developer_id' => auth()->id(),
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()?->ip(),
        ]);
    }
}
