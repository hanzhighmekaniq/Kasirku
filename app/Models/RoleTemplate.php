<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Template role level platform — dipakai StoreRoleService untuk membuat role
 * di setiap store baru. Satu template = satu role per store yang tipenya
 * tercantum di `store_type_codes`.
 */
class RoleTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'description',
        'icon',
        'color',
        'is_core',
        'permissions',
        'store_type_codes',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_core' => 'boolean',
            'permissions' => 'array',
            'store_type_codes' => 'array',
            'sort_order' => 'integer',
        ];
    }

    /** Urutan tampil standar: sort_order lalu nama. */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Template yang berlaku untuk kode tipe toko tertentu.
     * Tipe toko null/kosong dianggap tidak cocok dengan apa pun kecuali
     * template yang memakai wildcard "*".
     */
    public function scopeForStoreType(Builder $query, ?string $storeTypeCode): Builder
    {
        return $query->where(function (Builder $q) use ($storeTypeCode) {
            $q->whereJsonContains('store_type_codes', '*');

            if ($storeTypeCode !== null && $storeTypeCode !== '') {
                $q->orWhereJsonContains('store_type_codes', $storeTypeCode);
            }
        });
    }

    /** Apakah template ini berlaku di tipe toko tertentu. */
    public function appliesTo(?string $storeTypeCode): bool
    {
        $codes = $this->store_type_codes ?? [];

        if (in_array('*', $codes, true)) {
            return true;
        }

        return $storeTypeCode !== null && in_array($storeTypeCode, $codes, true);
    }

    /** Apakah template memberi seluruh permission yang ada. */
    public function grantsAllPermissions(): bool
    {
        return in_array('*', $this->permissions ?? [], true);
    }
}
