<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThemePreset extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'primary',
        'secondary',
        'accent',
        'is_dark',
        'is_system',
        'light_tokens',
        'dark_tokens',
    ];

    protected function casts(): array
    {
        return [
            'is_dark' => 'boolean',
            'is_system' => 'boolean',
            'light_tokens' => 'array',
            'dark_tokens' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Preset sistem (built-in), tidak bisa diubah/dihapus oleh user.
     */
    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_system', true);
    }

    /**
     * Preset custom milik user tertentu.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId)->where('is_system', false);
    }
}
