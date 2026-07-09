<?php

namespace Database\Seeders\DatabaseSeeder;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            // Supplier
            "supplier.view",
            "supplier.create",
            "supplier.edit",
            "supplier.delete",
            // Dashboard
            "dashboard.view",
            // Transaksi
            "sale.create",
            "sale.view",
            "sale.void",
            "sale.discount",
            "sale.return",
            // Produk
            "product.view",
            "product.create",
            "product.edit",
            "product.delete",
            "product.import",
            // Stok
            "stock.view",
            "stock.adjustment",
            "stock.opname",
            "stock.transfer",
            "stock.waste",
            // Pembelian
            "purchase.view",
            "purchase.create",
            "purchase.edit",
            "purchase.delete",
            "purchase.return",
            // Pelanggan
            "customer.view",
            "customer.create",
            "customer.edit",
            "customer.delete",
            "customer.deposit",
            // Karyawan
            "employee.view",
            "employee.create",
            "employee.edit",
            "employee.delete",
            // Laporan
            "report.sales",
            "report.purchase",
            "report.stock",
            "report.expense",
            "report.shift",
            "report.commission",
            // Shift
            "shift.open",
            "shift.close",
            "shift.view",
            "shift.manage",
            // Pengeluaran
            "expense.view",
            "expense.create",
            "expense.edit",
            "expense.delete",
            // Promosi
            "promotion.view",
            "promotion.create",
            "promotion.edit",
            "promotion.delete",
            // Meja & Kitchen
            "table.view",
            "table.manage",
            "kitchen.view",
            "kitchen.update",
            // Antrian & Booking
            "queue.view",
            "queue.manage",
            "booking.view",
            "booking.create",
            "booking.edit",
            "booking.cancel",
            // Membership & Komisi
            "membership.view",
            "membership.create",
            "membership.edit",
            "commission.view",
            "commission.approve",
            // Setting
            "setting.view",
            "setting.edit",
            "setting.payment_method",
            "setting.payment_gateway",
            "setting.module",
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(["name" => $perm, "guard_name" => "web"]);
        }

        if (method_exists($this->command, "info")) {
            $this->command->info(
                "✅ " . count($permissions) . " permissions created.",
            );
        }
    }
}
