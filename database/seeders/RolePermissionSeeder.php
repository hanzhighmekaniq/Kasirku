<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Services\StoreRoleService;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * Seed permissions (global) + roles per store.
 *
 * Dengan Spatie teams aktif (store_id), setiap role HARUS punya store_id.
 * Tidak ada lagi "role global" — setiap store punya salinan role sistemnya.
 */
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // ── Permissions — GLOBAL (tidak terikat store) ──────────────
        $permissions = [
            // Supplier
            'supplier.view','supplier.create','supplier.edit','supplier.delete',
            // Dashboard
            'dashboard.view',
            // Transaksi
            'sale.create','sale.view','sale.void','sale.discount','sale.return',
            // Produk
            'product.view','product.create','product.edit','product.delete','product.import',
            // Stok
            'stock.view','stock.adjustment','stock.opname','stock.transfer','stock.waste',
            // Pembelian
            'purchase.view','purchase.create','purchase.edit','purchase.delete','purchase.return',
            // Pelanggan
            'customer.view','customer.create','customer.edit','customer.delete','customer.deposit',
            // Karyawan
            'employee.view','employee.create','employee.edit','employee.delete',
            // Laporan
            'report.sales','report.purchase','report.stock','report.expense','report.shift','report.commission',
            // Shift
            'shift.open','shift.close','shift.view',
            // Pengeluaran
            'expense.view','expense.create','expense.edit','expense.delete',
            // Promosi
            'promotion.view','promotion.create','promotion.edit','promotion.delete',
            // Meja & Kitchen
            'table.view','table.manage','kitchen.view','kitchen.update',
            // Antrian & Booking
            'queue.view','queue.manage','booking.view','booking.create','booking.edit','booking.cancel',
            // Membership & Komisi
            'membership.view','membership.create','membership.edit',
            'commission.view','commission.approve',
            // Setting
            'setting.view','setting.edit','setting.payment_method','setting.payment_gateway','setting.module',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $this->command->info('✅ ' . count($permissions) . ' permissions created.');

        // ── Roles per store ──────────────────────────────────────────
        $stores = Store::all();

        if ($stores->isEmpty()) {
            $this->command->warn('⚠️  No stores found. Run StoreSeeder first, then re-run this seeder.');
            return;
        }

        foreach ($stores as $store) {
            StoreRoleService::createRolesForStore($store->id);
            $this->command->line("  ✔ Roles created for store: {$store->name} (ID: {$store->id})");
        }

        $this->command->info('✅ Roles created for ' . $stores->count() . ' stores.');
    }
}
