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

    public function run(): void
    {
        $features = [
            // ── POS & Transaksi ──────────────────────────────────────────
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

            // ── Master Data ──────────────────────────────────────────────
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

            // ── Transaksi ────────────────────────────────────────────────
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

            // ── Inventaris ───────────────────────────────────────────────
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

            // ── Keuangan & Laporan ───────────────────────────────────────
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

            // ── Sistem & Admin Tools ─────────────────────────────────────
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

            // ── Legacy (keep for backward compat, not shown in sidebar) ──
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
                    'sort_order' => $f['sort_order'] ?? 0,
                    'is_active' => true,
                ],
            );
        }

        // ── Sync to store_type_feature table ────────────────────────────
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

        // ── Attach features to plans ──────────────────────────────────────

        // Feature code yang termasuk plan Free (dasar)
        $freeCodes = [
            'dashboard',
            'basic_pos',
            'shift',
            'product',
            'category',
            'customer',
            'employee',
            'expense',
        ];

        // Feature code yang termasuk plan Basic
        $basicCodes = [
            'dashboard',
            'basic_pos',
            'shift',
            'sale_return',
            'promo',
            'expense',
            'table',
            'kitchen',
            'queue',
            'booking',
            'product',
            'category',
            'modifier',
            'customer',
            'membership',
            'supplier',
            'employee',
            'commission',
            'purchase',
            'purchase_return',
            'stock',
            'batch_expired',
            'stock_adjustment',
            'stock_opname',
            'stock_transfer',
            'waste',
            'recipe',
            'report',
            'payment_gateway',
            'payment_method',
            'settings',
            'user_management',
            'role_management',
            'activity_log',
            'sidebar_order',
        ];

        $free = Plan::where('code', 'free')->first();
        $basic = Plan::where('code', 'basic')->first();
        $pro = Plan::where('code', 'pro')->first();

        if ($free) {
            $free
                ->features()
                ->sync(Feature::whereIn('code', $freeCodes)->pluck('id'));
        }
        if ($basic) {
            $basic
                ->features()
                ->sync(Feature::whereIn('code', $basicCodes)->pluck('id'));
        }
        if ($pro) {
            // Pro = semua fitur
            $pro->features()->sync(Feature::pluck('id'));
        }
    }
}
