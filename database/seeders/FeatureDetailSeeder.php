<?php

namespace Database\Seeders;

use App\Models\Feature;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Isi tabel feature_details — sub-aktivitas dalam setiap fitur.
 *
 * Digunakan untuk:
 *  - Menampilkan detail fitur di sidebar / info panel
 *  - Nantinya untuk middleware granular (fitur X, detail Y)
 *  - TERPISAH dari Spatie permission (yang ngontrol role karyawan)
 */
class FeatureDetailSeeder extends Seeder
{
    private const DETAILS = [
        // ── Dashboard ───────────────────────────────────────────────────
        'dashboard' => [
            ['code' => 'dashboard.view',   'label' => 'Lihat Dashboard',   'sort' => 1],
        ],

        // ── POS / Kasir ─────────────────────────────────────────────────
        'basic_pos' => [
            ['code' => 'pos.transaction',  'label' => 'Transaksi Penjualan', 'sort' => 1],
            ['code' => 'pos.history',      'label' => 'Riwayat Penjualan',   'sort' => 2],
            ['code' => 'pos.void',         'label' => 'Void Transaksi',      'sort' => 3],
            ['code' => 'pos.discount',     'label' => 'Diskon Per Item',     'sort' => 4],
            ['code' => 'pos.return',       'label' => 'Retur Penjualan',     'sort' => 5],
            ['code' => 'pos.payment',      'label' => 'Pembayaran',          'sort' => 6],
        ],

        // ── Shift Kasir ────────────────────────────────────────────────
        'shift' => [
            ['code' => 'shift.open',       'label' => 'Buka Shift',         'sort' => 1],
            ['code' => 'shift.close',      'label' => 'Tutup Shift',        'sort' => 2],
            ['code' => 'shift.history',    'label' => 'Riwayat Shift',      'sort' => 3],
            ['code' => 'shift.manage',     'label' => 'Kelola Shift',       'sort' => 4],
        ],

        // ── Produk ──────────────────────────────────────────────────────
        'product' => [
            ['code' => 'product.view',     'label' => 'Lihat Produk',       'sort' => 1],
            ['code' => 'product.create',   'label' => 'Tambah Produk',      'sort' => 2],
            ['code' => 'product.edit',     'label' => 'Edit Produk',        'sort' => 3],
            ['code' => 'product.delete',   'label' => 'Hapus Produk',       'sort' => 4],
            ['code' => 'product.import',   'label' => 'Import Produk',      'sort' => 5],
            ['code' => 'product.variant',  'label' => 'Varian Produk',      'sort' => 6],
        ],

        // ── Kategori ────────────────────────────────────────────────────
        'category' => [
            ['code' => 'category.view',    'label' => 'Lihat Kategori',     'sort' => 1],
            ['code' => 'category.create',  'label' => 'Tambah Kategori',    'sort' => 2],
            ['code' => 'category.edit',    'label' => 'Edit Kategori',      'sort' => 3],
            ['code' => 'category.delete',  'label' => 'Hapus Kategori',     'sort' => 4],
        ],

        // ── Pelanggan ───────────────────────────────────────────────────
        'customer' => [
            ['code' => 'customer.view',    'label' => 'Lihat Pelanggan',    'sort' => 1],
            ['code' => 'customer.create',  'label' => 'Tambah Pelanggan',   'sort' => 2],
            ['code' => 'customer.edit',    'label' => 'Edit Pelanggan',     'sort' => 3],
            ['code' => 'customer.delete',  'label' => 'Hapus Pelanggan',    'sort' => 4],
            ['code' => 'customer.deposit', 'label' => 'Deposit Pelanggan',  'sort' => 5],
        ],

        // ── Karyawan ────────────────────────────────────────────────────
        'employee' => [
            ['code' => 'employee.view',    'label' => 'Lihat Karyawan',     'sort' => 1],
            ['code' => 'employee.create',  'label' => 'Tambah Karyawan',    'sort' => 2],
            ['code' => 'employee.edit',    'label' => 'Edit Karyawan',      'sort' => 3],
            ['code' => 'employee.delete',  'label' => 'Hapus Karyawan',     'sort' => 4],
        ],

        // ── Supplier ────────────────────────────────────────────────────
        'supplier' => [
            ['code' => 'supplier.view',    'label' => 'Lihat Supplier',     'sort' => 1],
            ['code' => 'supplier.create',  'label' => 'Tambah Supplier',    'sort' => 2],
            ['code' => 'supplier.edit',    'label' => 'Edit Supplier',      'sort' => 3],
            ['code' => 'supplier.delete',  'label' => 'Hapus Supplier',     'sort' => 4],
        ],

        // ── Stok ────────────────────────────────────────────────────────
        'stock' => [
            ['code' => 'stock.view',       'label' => 'Lihat Stok',         'sort' => 1],
            ['code' => 'stock.movement',   'label' => 'Riwayat Mutasi',     'sort' => 2],
            ['code' => 'stock.adjust',     'label' => 'Penyesuaian Stok',   'sort' => 3],
            ['code' => 'stock.opname',     'label' => 'Opname Stok',        'sort' => 4],
            ['code' => 'stock.transfer',   'label' => 'Transfer Stok',      'sort' => 5],
        ],

        // ── Batch / Expired ─────────────────────────────────────────────
        'batch_expired' => [
            ['code' => 'batch.view',       'label' => 'Lihat Batch',        'sort' => 1],
            ['code' => 'batch.create',     'label' => 'Tambah Batch',       'sort' => 2],
            ['code' => 'batch.expiry',     'label' => 'Pantau Kadaluarsa',  'sort' => 3],
        ],

        // ── Pembelian ───────────────────────────────────────────────────
        'purchase' => [
            ['code' => 'purchase.view',    'label' => 'Lihat Pembelian',    'sort' => 1],
            ['code' => 'purchase.create',  'label' => 'Buat Pembelian',     'sort' => 2],
            ['code' => 'purchase.edit',    'label' => 'Edit Pembelian',     'sort' => 3],
            ['code' => 'purchase.delete',  'label' => 'Hapus Pembelian',    'sort' => 4],
        ],

        // ── Retur Pembelian ─────────────────────────────────────────────
        'purchase_return' => [
            ['code' => 'preturn.view',     'label' => 'Lihat Retur Beli',   'sort' => 1],
            ['code' => 'preturn.create',   'label' => 'Buat Retur Beli',    'sort' => 2],
        ],

        // ── Retur Penjualan ─────────────────────────────────────────────
        'sale_return' => [
            ['code' => 'sreturn.view',     'label' => 'Lihat Retur Jual',   'sort' => 1],
            ['code' => 'sreturn.create',   'label' => 'Buat Retur Jual',    'sort' => 2],
        ],

        // ── Pengeluaran ─────────────────────────────────────────────────
        'expense' => [
            ['code' => 'expense.view',     'label' => 'Lihat Pengeluaran',  'sort' => 1],
            ['code' => 'expense.create',   'label' => 'Tambah Pengeluaran', 'sort' => 2],
            ['code' => 'expense.edit',     'label' => 'Edit Pengeluaran',   'sort' => 3],
            ['code' => 'expense.delete',   'label' => 'Hapus Pengeluaran',  'sort' => 4],
            ['code' => 'expense.category', 'label' => 'Kategori Pengeluaran','sort' => 5],
        ],

        // ── Promosi ─────────────────────────────────────────────────────
        'promo' => [
            ['code' => 'promo.view',       'label' => 'Lihat Promo',        'sort' => 1],
            ['code' => 'promo.create',     'label' => 'Buat Promo',         'sort' => 2],
            ['code' => 'promo.edit',       'label' => 'Edit Promo',         'sort' => 3],
            ['code' => 'promo.delete',     'label' => 'Hapus Promo',        'sort' => 4],
        ],

        // ── Manajemen Meja ──────────────────────────────────────────────
        'table' => [
            ['code' => 'table.view',       'label' => 'Lihat Denah Meja',   'sort' => 1],
            ['code' => 'table.manage',     'label' => 'Atur Meja',          'sort' => 2],
            ['code' => 'table.assign',     'label' => 'Assign Pesanan',     'sort' => 3],
        ],

        // ── Kitchen Display ─────────────────────────────────────────────
        'kitchen' => [
            ['code' => 'kitchen.display',  'label' => 'Display Pesanan',    'sort' => 1],
            ['code' => 'kitchen.update',   'label' => 'Update Status',      'sort' => 2],
        ],

        // ── Antrian ─────────────────────────────────────────────────────
        'queue' => [
            ['code' => 'queue.view',       'label' => 'Lihat Antrian',      'sort' => 1],
            ['code' => 'queue.manage',     'label' => 'Kelola Antrian',     'sort' => 2],
            ['code' => 'queue.call',       'label' => 'Panggil Antrian',    'sort' => 3],
        ],

        // ── Booking ─────────────────────────────────────────────────────
        'booking' => [
            ['code' => 'booking.view',     'label' => 'Lihat Booking',      'sort' => 1],
            ['code' => 'booking.create',   'label' => 'Buat Booking',       'sort' => 2],
            ['code' => 'booking.edit',     'label' => 'Edit Booking',       'sort' => 3],
            ['code' => 'booking.cancel',   'label' => 'Batalkan Booking',   'sort' => 4],
        ],

        // ── Membership ──────────────────────────────────────────────────
        'membership' => [
            ['code' => 'membership.view',  'label' => 'Lihat Membership',   'sort' => 1],
            ['code' => 'membership.create','label' => 'Buat Membership',    'sort' => 2],
            ['code' => 'membership.edit',  'label' => 'Edit Membership',    'sort' => 3],
        ],

        // ── Komisi ──────────────────────────────────────────────────────
        'commission' => [
            ['code' => 'commission.view',  'label' => 'Lihat Komisi',       'sort' => 1],
            ['code' => 'commission.approve','label' => 'Approve Komisi',    'sort' => 2],
        ],

        // ── Modifier ────────────────────────────────────────────────────
        'modifier' => [
            ['code' => 'modifier.view',    'label' => 'Lihat Modifier',     'sort' => 1],
            ['code' => 'modifier.create',  'label' => 'Tambah Modifier',    'sort' => 2],
            ['code' => 'modifier.edit',    'label' => 'Edit Modifier',      'sort' => 3],
            ['code' => 'modifier.delete',  'label' => 'Hapus Modifier',     'sort' => 4],
        ],

        // ── Resep ───────────────────────────────────────────────────────
        'recipe' => [
            ['code' => 'recipe.view',      'label' => 'Lihat Resep',        'sort' => 1],
            ['code' => 'recipe.create',    'label' => 'Tambah Resep',       'sort' => 2],
            ['code' => 'recipe.edit',      'label' => 'Edit Resep',         'sort' => 3],
            ['code' => 'recipe.delete',    'label' => 'Hapus Resep',        'sort' => 4],
        ],

        // ── Waste ───────────────────────────────────────────────────────
        'waste' => [
            ['code' => 'waste.view',       'label' => 'Lihat Waste',        'sort' => 1],
            ['code' => 'waste.create',     'label' => 'Catat Waste',        'sort' => 2],
        ],

        // ── Laporan ─────────────────────────────────────────────────────
        'report' => [
            ['code' => 'report.sales',     'label' => 'Laporan Penjualan',  'sort' => 1],
            ['code' => 'report.stock',     'label' => 'Laporan Stok',       'sort' => 2],
            ['code' => 'report.purchase',  'label' => 'Laporan Pembelian',  'sort' => 3],
            ['code' => 'report.expense',   'label' => 'Laporan Pengeluaran','sort' => 4],
            ['code' => 'report.shift',     'label' => 'Laporan Shift',      'sort' => 5],
            ['code' => 'report.commission','label' => 'Laporan Komisi',     'sort' => 6],
        ],

        // ── Payment Gateway ─────────────────────────────────────────────
        'payment_gateway' => [
            ['code' => 'pg.setup',         'label' => 'Setup Gateway',      'sort' => 1],
            ['code' => 'pg.transaction',   'label' => 'Transaksi PG',       'sort' => 2],
        ],

        // ── Metode Pembayaran ───────────────────────────────────────────
        'payment_method' => [
            ['code' => 'paymethod.view',   'label' => 'Lihat Metode Bayar', 'sort' => 1],
            ['code' => 'paymethod.edit',   'label' => 'Atur Metode Bayar',  'sort' => 2],
        ],

        // ── Pengaturan ──────────────────────────────────────────────────
        'settings' => [
            ['code' => 'setting.general',  'label' => 'Pengaturan Umum',    'sort' => 1],
            ['code' => 'setting.receipt',  'label' => 'Pengaturan Nota',    'sort' => 2],
            ['code' => 'setting.tax',      'label' => 'Pengaturan Pajak',   'sort' => 3],
        ],

        // ── Pengguna & Akses ────────────────────────────────────────────
        'user_management' => [
            ['code' => 'user.invite',      'label' => 'Undang Pengguna',    'sort' => 1],
            ['code' => 'user.assign_role', 'label' => 'Assign Role',        'sort' => 2],
            ['code' => 'user.revoke',      'label' => 'Cabut Akses',        'sort' => 3],
        ],

        // ── Role & Permission ───────────────────────────────────────────
        'role_management' => [
            ['code' => 'role.view',        'label' => 'Lihat Role',         'sort' => 1],
            ['code' => 'role.create',      'label' => 'Buat Role',          'sort' => 2],
            ['code' => 'role.edit',        'label' => 'Edit Role',          'sort' => 3],
            ['code' => 'role.delete',      'label' => 'Hapus Role',         'sort' => 4],
        ],

        // ── Log Aktivitas ───────────────────────────────────────────────
        'activity_log' => [
            ['code' => 'log.view',         'label' => 'Lihat Log',          'sort' => 1],
        ],
    ];

    public function run(): void
    {
        DB::table('feature_details')->delete();

        $features = Feature::where('is_active', true)->pluck('id', 'code');
        $total = 0;

        foreach (self::DETAILS as $featureCode => $details) {
            $featureId = $features[$featureCode] ?? null;
            if (!$featureId) continue;

            foreach ($details as $d) {
                DB::table('feature_details')->updateOrInsert(
                    ['code' => $d['code']],
                    [
                        'feature_id'  => $featureId,
                        'label'       => $d['label'],
                        'sort_order'  => $d['sort'],
                        'is_active'   => true,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ],
                );
                $total++;
            }
        }

        if (method_exists($this->command, 'info')) {
            $this->command->info("🔍 {$total} feature details untuk " . count(self::DETAILS) . " fitur");
        }
    }
}
