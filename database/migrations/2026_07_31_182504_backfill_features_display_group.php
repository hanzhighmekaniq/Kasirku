<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill `display_group` untuk fitur yang sudah ada, memakai mapping yang
 * sama persis dengan FEATURE_CODE_TO_GROUP di
 * resources/js/Utils/featureGroups.js — supaya data lama konsisten sebelum
 * developer mulai menambah fitur baru lewat CRUD.
 */
return new class extends Migration
{
    /**
     * @var array<string, string>
     */
    private const CODE_TO_GROUP = [
        // Beranda
        'dashboard' => 'home',
        'basic_pos' => 'home',
        // Penjualan
        'shift' => 'transaction',
        'sale_return' => 'transaction',
        'promo' => 'transaction',
        'expense' => 'transaction',
        // Operasional
        'table' => 'operations',
        'kitchen' => 'operations',
        'queue' => 'operations',
        'booking' => 'operations',
        // Katalog & Stok
        'product' => 'catalog',
        'category' => 'catalog',
        'modifier' => 'catalog',
        'stock' => 'catalog',
        'batch_expired' => 'catalog',
        'stock_adjustment' => 'catalog',
        'stock_opname' => 'catalog',
        'stock_transfer' => 'catalog',
        'waste' => 'catalog',
        'recipe' => 'catalog',
        'purchase' => 'catalog',
        'purchase_return' => 'catalog',
        'supplier' => 'catalog',
        // Pelanggan & Tim
        'customer' => 'people',
        'membership' => 'people',
        'employee' => 'people',
        'commission' => 'people',
        'debt' => 'people',
        // Keuangan & Laporan
        'report' => 'finance',
        'payment_gateway' => 'finance',
        'payment_method' => 'finance',
        'cash_rounding' => 'finance',
        'deposit' => 'finance',
        // Sistem
        'settings' => 'system',
        'user_management' => 'system',
        'role_management' => 'system',
        'activity_log' => 'system',
        'sidebar_order' => 'system',
    ];

    public function up(): void
    {
        foreach (self::CODE_TO_GROUP as $code => $group) {
            DB::table('features')->where('code', $code)->update(['display_group' => $group]);
        }
    }

    public function down(): void
    {
        DB::table('features')->update(['display_group' => 'other']);
    }
};
