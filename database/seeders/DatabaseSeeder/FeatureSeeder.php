<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Feature;
use App\Models\Plan;
use App\Models\StoreType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Semua 34 feature code yang mengontrol sidebar & route access.
 *
 * Kategori:
 *  - pos        : POS & Transaksi
 *  - inventory  : Inventaris & Stok
 *  - crm        : Pelanggan & CRM
 *  - finance    : Keuangan & Laporan
 *  - system     : Sistem & Admin Tools
 */
class FeatureSeeder extends Seeder
{
    // Semua tipe toko
    private const ALL_TYPES = [
        'retail',
        'fnb',
        'service',
        'rental',
        'ticket',
        'hospitality',
        'parking',
        'session',
    ];

    /**
     * feature_code => display_group. Mengikuti persis FEATURE_CODE_TO_GROUP
     * di resources/js/Utils/featureGroups.js — satu sumber kebenaran yang
     * disalin di dua tempat (PHP seeder & JS util) karena keduanya jalan di
     * runtime berbeda. Kode yang tidak terdaftar jatuh ke 'other'.
     *
     * @see resources/js/Utils/featureGroups.js
     */
    private const DISPLAY_GROUP_MAP = [
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

    public function run(): void
    {
        $features = [
            // â”€â”€ POS & Transaksi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            [
                'code' => 'dashboard',
                'label' => 'Dashboard',
                'category' => 'pos',
                'sort_order' => 1,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'basic_pos',
                'label' => 'Kasir / POS',
                'category' => 'pos',
                'sort_order' => 2,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'shift',
                'label' => 'Shift Kasir',
                'category' => 'pos',
                'sort_order' => 3,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'sale_return',
                'label' => 'Retur Penjualan',
                'category' => 'pos',
                'sort_order' => 4,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'promo',
                'label' => 'Promo & Diskon',
                'category' => 'pos',
                'sort_order' => 5,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'expense',
                'label' => 'Pengeluaran',
                'category' => 'pos',
                'sort_order' => 6,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'table',
                'label' => 'Manajemen Meja',
                'category' => 'pos',
                'sort_order' => 7,
                'applicable_types' => ['fnb', 'hospitality'],
            ],
            [
                'code' => 'kitchen',
                'label' => 'Kitchen Display',
                'category' => 'pos',
                'sort_order' => 8,
                'applicable_types' => ['fnb'],
            ],
            [
                'code' => 'queue',
                'label' => 'Antrian',
                'category' => 'pos',
                'sort_order' => 9,
                'applicable_types' => ['service'],
            ],
            [
                'code' => 'booking',
                'label' => 'Booking / Reservasi',
                'category' => 'pos',
                'sort_order' => 10,
                'applicable_types' => [
                    'fnb',
                    'service',
                    'rental',
                    'ticket',
                    'hospitality',
                    'parking',
                    'session',
                ],
            ],

            // â”€â”€ Master Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            [
                'code' => 'product',
                'label' => 'Produk',
                'category' => 'crm',
                'sort_order' => 11,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'category',
                'label' => 'Kategori',
                'category' => 'crm',
                'sort_order' => 12,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'modifier',
                'label' => 'Modifier / Topping',
                'category' => 'crm',
                'sort_order' => 13,
                'applicable_types' => ['fnb'],
            ],
            [
                'code' => 'customer',
                'label' => 'Pelanggan',
                'category' => 'crm',
                'sort_order' => 14,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'membership',
                'label' => 'Membership',
                'category' => 'crm',
                'sort_order' => 15,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'supplier',
                'label' => 'Supplier',
                'category' => 'crm',
                'sort_order' => 16,
                'applicable_types' => ['retail', 'fnb', 'rental'],
            ],
            [
                'code' => 'employee',
                'label' => 'Karyawan',
                'category' => 'crm',
                'sort_order' => 17,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'commission',
                'label' => 'Komisi Karyawan',
                'category' => 'crm',
                'sort_order' => 18,
                'applicable_types' => self::ALL_TYPES,
            ],

            // â”€â”€ Transaksi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            [
                'code' => 'purchase',
                'label' => 'Pembelian',
                'category' => 'inventory',
                'sort_order' => 19,
                'applicable_types' => ['retail', 'fnb', 'rental'],
            ],
            [
                'code' => 'purchase_return',
                'label' => 'Retur Pembelian',
                'category' => 'inventory',
                'sort_order' => 20,
                'applicable_types' => ['retail', 'fnb', 'rental'],
            ],

            // â”€â”€ Inventaris â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            [
                'code' => 'stock',
                'label' => 'Manajemen Stok',
                'category' => 'inventory',
                'sort_order' => 21,
                'applicable_types' => ['retail', 'fnb', 'rental'],
            ],
            [
                'code' => 'batch_expired',
                'label' => 'Batch / Expired',
                'category' => 'inventory',
                'sort_order' => 22,
                'applicable_types' => ['retail', 'fnb'],
            ],
            [
                'code' => 'stock_adjustment',
                'label' => 'Penyesuaian Stok',
                'category' => 'inventory',
                'sort_order' => 23,
                'applicable_types' => ['retail', 'fnb', 'rental'],
            ],
            [
                'code' => 'stock_opname',
                'label' => 'Opname Stok',
                'category' => 'inventory',
                'sort_order' => 24,
                'applicable_types' => ['retail', 'fnb', 'rental'],
            ],
            [
                'code' => 'stock_transfer',
                'label' => 'Transfer Stok',
                'category' => 'inventory',
                'sort_order' => 25,
                'applicable_types' => ['retail', 'fnb', 'rental'],
            ],
            [
                'code' => 'waste',
                'label' => 'Waste / Pemborosan',
                'category' => 'inventory',
                'sort_order' => 26,
                'applicable_types' => ['fnb'],
            ],
            [
                'code' => 'recipe',
                'label' => 'Resep Bahan Baku',
                'category' => 'inventory',
                'sort_order' => 27,
                'applicable_types' => ['fnb'],
            ],

            // â”€â”€ Keuangan & Laporan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            [
                'code' => 'report',
                'label' => 'Laporan',
                'category' => 'finance',
                'sort_order' => 28,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'payment_gateway',
                'label' => 'Payment Gateway',
                'category' => 'finance',
                'sort_order' => 29,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'payment_method',
                'label' => 'Metode Pembayaran',
                'category' => 'finance',
                'sort_order' => 30,
                'applicable_types' => self::ALL_TYPES,
            ],

            // â”€â”€ Sistem & Admin Tools â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            [
                'code' => 'settings',
                'label' => 'Pengaturan Toko',
                'category' => 'system',
                'sort_order' => 31,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'user_management',
                'label' => 'Pengguna & Akses',
                'category' => 'system',
                'sort_order' => 32,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'role_management',
                'label' => 'Role & Permission',
                'category' => 'system',
                'sort_order' => 33,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'activity_log',
                'label' => 'Log Aktivitas',
                'category' => 'system',
                'sort_order' => 34,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'sidebar_order',
                'label' => 'Urutan Sidebar',
                'category' => 'system',
                'sort_order' => 35,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'cash_rounding',
                'label' => 'Pembulatan Kas',
                'description' => 'Bulatkan total ke kelipatan terdekat (50/100/500/1000)',
                'category' => 'pos',
                'sort_order' => 36,
                'applicable_types' => self::ALL_TYPES,
            ],
            [
                'code' => 'debt',
                'label' => 'Hutang / Kasbon',
                'description' => 'Catat pembayaran hutang pelanggan, atur limit kredit, & pelunasan',
                'category' => 'finance',
                'sort_order' => 37,
                'applicable_types' => self::ALL_TYPES,
            ],

            // â”€â”€ Legacy (keep for backward compat, not shown in sidebar) â”€â”€
            [
                'code' => 'deposit',
                'label' => 'Deposit Pelanggan',
                'category' => 'finance',
                'sort_order' => 36,
                'applicable_types' => [
                    'service',
                    'rental',
                    'hospitality',
                    'parking',
                    'session',
                ],
            ],
        ];

        foreach ($features as $f) {
            Feature::updateOrCreate(
                ['code' => $f['code']],
                [
                    'label' => $f['label'],
                    'description' => $f['description'] ?? null,
                    'category' => $f['category'] ?? null,
                    'display_group' => self::DISPLAY_GROUP_MAP[$f['code']] ?? 'other',
                    'sort_order' => $f['sort_order'] ?? 0,
                    'is_active' => true,
                ],
            );
        }

        // â”€â”€ Sync to store_type_feature table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $storeTypeIds = StoreType::pluck('id', 'code');

        DB::table('store_type_feature')->delete();
        foreach ($features as $f) {
            $feature = Feature::where('code', $f['code'])->first();
            if ($feature && ! empty($f['applicable_types'])) {
                foreach ($f['applicable_types'] as $type) {
                    $storeTypeId = $storeTypeIds->get($type);

                    if (! $storeTypeId) {
                        continue;
                    }

                    DB::table('store_type_feature')->updateOrInsert(
                        [
                            'store_type_id' => $storeTypeId,
                            'feature_id' => $feature->id,
                        ],
                        ['created_at' => now(), 'updated_at' => now()],
                    );
                }
            }
        }

        // Attach features to plans dipindah ke PlanSeeder supaya tidak
        // saling ketimpa. PlanSeeder adalah satu-satunya sumber kebenaran
        // untuk relasi plan <-> feature.
    }
}
