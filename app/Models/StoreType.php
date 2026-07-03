<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'label', 'icon', 'description',
        'order_types', 'pos_behavior', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'order_types'  => 'array',
            'is_active'    => 'boolean',
            'sort_order'   => 'integer',
        ];
    }

    /** Ambil semua tipe aktif, diurutkan */
    public static function active(): array
    {
        return self::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->toArray();
    }

    /** Ambil kode tipe saja */
    public static function codes(): array
    {
        return self::where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('code')
            ->toArray();
    }
}
