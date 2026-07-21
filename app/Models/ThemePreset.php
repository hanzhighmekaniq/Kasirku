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
        'is_system',
        'tokens',
    ];

    /**
     * Accessor turunan yang wajib ikut ter-serialize ke frontend (Inertia)
     * supaya kartu preview (Theme Index/Create/Edit) tetap bisa akses
     * primary/secondary/accent/light_tokens/dark_tokens tanpa frontend
     * harus tahu bahwa semuanya derived dari kolom `tokens`.
     */
    protected $appends = [
        'primary',
        'secondary',
        'accent',
        'light_tokens',
        'dark_tokens',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'tokens' => 'array',
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

    /** Token 36-key untuk mode terang. */
    public function getLightTokensAttribute(): array
    {
        return $this->tokens['light'] ?? [];
    }

    /** Token 36-key untuk mode gelap. */
    public function getDarkTokensAttribute(): array
    {
        return $this->tokens['dark'] ?? [];
    }

    /** Warna primary mode terang — dipakai preview kartu di Theme Index. */
    public function getPrimaryAttribute(): ?string
    {
        return $this->tokens['light']['primary'] ?? $this->tokens['dark']['primary'] ?? null;
    }

    /** Warna secondary mode terang — dipakai preview kartu di Theme Index. */
    public function getSecondaryAttribute(): ?string
    {
        return $this->tokens['light']['secondary'] ?? $this->tokens['dark']['secondary'] ?? null;
    }

    /** Warna accent mode terang — dipakai preview kartu di Theme Index. */
    public function getAccentAttribute(): ?string
    {
        return $this->tokens['light']['accent'] ?? $this->tokens['dark']['accent'] ?? null;
    }
}
