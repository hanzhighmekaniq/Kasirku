<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\RoleTemplate;
use Illuminate\Database\Seeder;

/**
 * Seed template role platform dari definisi yang sebelumnya di-hardcode di
 * StoreRoleService::systemRolePermissions().
 *
 * `store_type_codes` sengaja diisi ["*"] (semua tipe toko) supaya perilaku
 * identik dengan sebelum ada tabel ini — semua store dapat 6 role. Penyempitan
 * cakupan (mis. kitchen hanya F&B) diatur developer lewat halaman Template
 * Role, bukan ditebak di seeder.
 *
 * `owner` dan `kasir` ditandai is_core karena namanya dipakai langsung di
 * kode: middleware `role:owner` (routes/web.php), RoleMiddleware::handle,
 * dan redirect login AuthenticatedSessionController (hasRole('kasir')).
 * Rename/hapus keduanya akan merusak otorisasi.
 */
class RoleTemplateSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->templates() as $template) {
            RoleTemplate::updateOrCreate(
                ['key' => $template['key']],
                $template,
            );
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function templates(): array
    {
        return [
            [
                'key' => 'owner',
                'name' => 'Owner',
                'description' => 'Pemilik toko, akses penuh + kelola role & user',
                'icon' => 'Crown',
                'color' => 'amber',
                'is_core' => true,
                'sort_order' => 1,
                'store_type_codes' => ['*'],
                'permissions' => ['*'],
            ],
            [
                'key' => 'admin',
                'name' => 'Admin',
                'description' => 'Manager operasional harian',
                'icon' => 'ShieldCheck',
                'color' => 'violet',
                'is_core' => false,
                'sort_order' => 2,
                'store_type_codes' => ['*'],
                'permissions' => [
                    'dashboard.view',
                    'sale.create', 'sale.view', 'sale.void', 'sale.discount', 'sale.return',
                    'product.view', 'product.create', 'product.edit', 'product.delete', 'product.import',
                    'stock.view', 'stock.adjustment', 'stock.opname', 'stock.transfer', 'stock.waste',
                    'batch.view',
                    'purchase.view', 'purchase.create', 'purchase.edit', 'purchase.delete', 'purchase.return',
                    'customer.view', 'customer.create', 'customer.edit', 'customer.delete', 'customer.deposit',
                    'employee.view', 'employee.create', 'employee.edit', 'employee.delete',
                    'report.sales', 'report.purchase', 'report.stock', 'report.expense', 'report.shift', 'report.commission',
                    'shift.open', 'shift.close', 'shift.view', 'shift.manage',
                    'promotion.view', 'promotion.create', 'promotion.edit', 'promotion.delete',
                    'table.view', 'table.manage',
                    'kitchen.view', 'kitchen.update',
                    'queue.view', 'queue.manage',
                    'booking.view', 'booking.create', 'booking.edit', 'booking.cancel',
                    'membership.view', 'membership.create', 'membership.edit',
                    'commission.view', 'commission.approve',
                    'setting.view', 'setting.edit', 'setting.payment_method', 'setting.payment_gateway', 'setting.module',
                    'supplier.view', 'supplier.create', 'supplier.edit', 'supplier.delete',
                    'debt.view', 'debt.create', 'debt.pay',
                ],
            ],
            [
                'key' => 'supervisor',
                'name' => 'Supervisor',
                'description' => 'Pengawas shift, bisa void & approve komisi',
                'icon' => 'Eye',
                'color' => 'blue',
                'is_core' => false,
                'sort_order' => 3,
                'store_type_codes' => ['*'],
                'permissions' => [
                    'dashboard.view',
                    'sale.view', 'sale.void', 'sale.return',
                    'product.view',
                    'stock.view',
                    'batch.view',
                    'purchase.view',
                    'customer.view', 'customer.deposit',
                    'employee.view',
                    'report.sales', 'report.stock', 'report.expense', 'report.shift', 'report.commission',
                    'shift.open', 'shift.close', 'shift.view', 'shift.manage',
                    'expense.view', 'expense.create',
                    'promotion.view',
                    'table.view', 'table.manage',
                    'kitchen.view', 'kitchen.update',
                    'queue.view', 'queue.manage',
                    'booking.view', 'booking.create', 'booking.edit', 'booking.cancel',
                    'commission.view', 'commission.approve',
                ],
            ],
            [
                'key' => 'kasir',
                'name' => 'Kasir',
                'description' => 'Operator POS harian',
                'icon' => 'Monitor',
                'color' => 'sky',
                'is_core' => true,
                'sort_order' => 4,
                'store_type_codes' => ['*'],
                'permissions' => [
                    'dashboard.view',
                    'sale.create', 'sale.view', 'sale.discount',
                    'product.view',
                    'stock.view',
                    'customer.view', 'customer.create',
                    'shift.open', 'shift.close', 'shift.view',
                    'expense.create',
                    'table.view', 'table.manage',
                    'kitchen.view',
                    'queue.view', 'queue.manage',
                    'booking.view', 'booking.create',
                    'debt.create',
                ],
            ],
            [
                'key' => 'gudang',
                'name' => 'Gudang',
                'description' => 'Operator gudang, kelola stok & pembelian',
                'icon' => 'Package',
                'color' => 'teal',
                'is_core' => false,
                'sort_order' => 5,
                'store_type_codes' => ['*'],
                'permissions' => [
                    'dashboard.view',
                    'product.view', 'product.create', 'product.edit', 'product.import',
                    'stock.view', 'stock.adjustment', 'stock.opname', 'stock.transfer', 'stock.waste',
                    'batch.view',
                    'purchase.view', 'purchase.create', 'purchase.edit', 'purchase.return',
                    'report.stock', 'report.purchase',
                    'supplier.view', 'supplier.create', 'supplier.edit',
                ],
            ],
            [
                'key' => 'kitchen',
                'name' => 'Kitchen',
                'description' => 'Staff dapur, update status masak',
                'icon' => 'ChefHat',
                'color' => 'orange',
                'is_core' => false,
                'sort_order' => 6,
                'store_type_codes' => ['*'],
                'permissions' => ['kitchen.view', 'kitchen.update'],
            ],
        ];
    }
}
