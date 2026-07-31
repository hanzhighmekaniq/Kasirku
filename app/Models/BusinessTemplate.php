<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Template bisnis level platform — pilihan jenis bisnis spesifik di dalam satu
 * tipe toko. Contoh: tipe toko "fnb" punya template Cafe, Restoran, Warteg.
 *
 * Template menentukan data awal (kategori & produk contoh) yang dibuatkan
 * untuk toko baru saat registrasi, sementara StoreType tetap yang menentukan
 * perilaku teknis POS dan fitur yang tersedia.
 *
 * Template dengan `is_ready` false berarti katalog data contohnya belum
 * tersedia — tokonya tetap bisa dibuat, hanya saja mulai tanpa data awal.
 */
class BusinessTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_type_id',
        'code',
        'label',
        'icon',
        'description',
        'is_ready',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_ready' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // --- Relationships ---

    public function storeType(): BelongsTo
    {
        return $this->belongsTo(StoreType::class);
    }

    /** Kategori contoh di dalam template ini (data-driven, dikelola developer). */
    public function categories(): HasMany
    {
        return $this->hasMany(BusinessTemplateCategory::class);
    }

    /**
     * Sinkronkan `is_ready` berdasarkan keberadaan kategori.
     *
     * `is_ready` TIDAK dimaksudkan untuk di-toggle manual oleh developer —
     * ini murni derived state yang otomatis mengikuti apakah template sudah
     * punya minimal 1 kategori contoh. Dipanggil dari event model
     * BusinessTemplateCategory setiap kali kategori dibuat/dihapus.
     */
    public function syncIsReady(): void
    {
        $this->update(['is_ready' => $this->categories()->exists()]);
    }

    // --- Scopes ---

    /** Urutan tampil standar: sort_order lalu label. */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('label');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Hanya template yang katalog data contohnya sudah tersedia. */
    public function scopeReady(Builder $query): Builder
    {
        return $query->where('is_ready', true);
    }
}
