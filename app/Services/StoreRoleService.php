<?php

namespace App\Services;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Service untuk mengelola roles per store.
 *
 * Dengan Spatie teams (store_id), setiap store butuh copy roles-nya sendiri.
 * Role sistem dibuat otomatis saat store dibuat.
 * Owner bisa tambah role custom di atas role sistem.
 */
class StoreRoleService
{
    /**
     * Definisi permission per role sistem.
     * Dipakai saat create store baru — buat semua role sistem untuk store itu.
     */
    public static function systemRolePermissions(): array
    {
        return [
            "owner" => [
                "is_system" => true,
                "description" =>
                    "Pemilik toko, akses penuh + kelola role & user",
                "permissions" => "*", // semua permission kecuali setting.module
                "except" => [],
            ],
            "admin" => [
                "is_system" => true,
                "description" => "Manager operasional harian",
                "permissions" => [
                    "dashboard.view",
                    "sale.create",
                    "sale.view",
                    "sale.void",
                    "sale.discount",
                    "sale.return",
                    "product.view",
                    "product.create",
                    "product.edit",
                    "product.delete",
                    "product.import",
                    "stock.view",
                    "stock.adjustment",
                    "stock.opname",
                    "stock.transfer",
                    "stock.waste",
                    "purchase.view",
                    "purchase.create",
                    "purchase.edit",
                    "purchase.delete",
                    "purchase.return",
                    "customer.view",
                    "customer.create",
                    "customer.edit",
                    "customer.delete",
                    "customer.deposit",
                    "employee.view",
                    "employee.create",
                    "employee.edit",
                    "employee.delete",
                    "report.sales",
                    "report.purchase",
                    "report.stock",
                    "report.expense",
                    "report.shift",
                    "report.commission",
                    "shift.open",
                    "shift.close",
                    "shift.view",
                    "expense.view",
                    "expense.create",
                    "expense.edit",
                    "expense.delete",
                    "promotion.view",
                    "promotion.create",
                    "promotion.edit",
                    "promotion.delete",
                    "table.view",
                    "table.manage",
                    "kitchen.view",
                    "kitchen.update",
                    "queue.view",
                    "queue.manage",
                    "booking.view",
                    "booking.create",
                    "booking.edit",
                    "booking.cancel",
                    "membership.view",
                    "membership.create",
                    "membership.edit",
                    "commission.view",
                    "commission.approve",
                    "setting.view",
                    "setting.edit",
                    "setting.payment_method",
                    "setting.payment_gateway",
                    "setting.module",
                    "supplier.view",
                    "supplier.create",
                    "supplier.edit",
                    "supplier.delete",
                ],
            ],
            "supervisor" => [
                "is_system" => true,
                "description" => "Pengawas shift, bisa void & approve komisi",
                "permissions" => [
                    "dashboard.view",
                    "sale.view",
                    "sale.void",
                    "sale.return",
                    "product.view",
                    "stock.view",
                    "purchase.view",
                    "customer.view",
                    "customer.deposit",
                    "employee.view",
                    "report.sales",
                    "report.stock",
                    "report.expense",
                    "report.shift",
                    "report.commission",
                    "shift.open",
                    "shift.close",
                    "shift.view",
                    "expense.view",
                    "expense.create",
                    "promotion.view",
                    "table.view",
                    "table.manage",
                    "kitchen.view",
                    "kitchen.update",
                    "queue.view",
                    "queue.manage",
                    "booking.view",
                    "booking.create",
                    "booking.edit",
                    "booking.cancel",
                    "commission.view",
                    "commission.approve",
                ],
            ],
            "kasir" => [
                "is_system" => true,
                "description" => "Operator POS harian",
                "permissions" => [
                    "dashboard.view",
                    "sale.create",
                    "sale.view",
                    "sale.discount",
                    "product.view",
                    "stock.view",
                    "customer.view",
                    "customer.create",
                    "shift.open",
                    "shift.close",
                    "shift.view",
                    "expense.create",
                    "table.view",
                    "table.manage",
                    "kitchen.view",
                    "queue.view",
                    "queue.manage",
                    "booking.view",
                    "booking.create",
                ],
            ],
            "gudang" => [
                "is_system" => true,
                "description" => "Operator gudang, kelola stok & pembelian",
                "permissions" => [
                    "dashboard.view",
                    "product.view",
                    "product.create",
                    "product.edit",
                    "product.import",
                    "stock.view",
                    "stock.adjustment",
                    "stock.opname",
                    "stock.transfer",
                    "stock.waste",
                    "purchase.view",
                    "purchase.create",
                    "purchase.edit",
                    "purchase.return",
                    "report.stock",
                    "report.purchase",
                    "supplier.view",
                    "supplier.create",
                    "supplier.edit",
                ],
            ],
            "kitchen" => [
                "is_system" => true,
                "description" => "Staff dapur, update status masak",
                "permissions" => ["kitchen.view", "kitchen.update"],
            ],
        ];
    }

    /**
     * Buat semua role sistem untuk store tertentu.
     * Dipanggil saat developer buat store baru.
     */
    public static function createRolesForStore(int $storeId): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $allPerms = Permission::all();

        foreach (self::systemRolePermissions() as $roleName => $config) {
            $role = Role::firstOrCreate([
                "name" => $roleName,
                "guard_name" => "web",
                "store_id" => $storeId,
            ]);

            $role->update([
                "is_system" => true,
                "description" => $config["description"],
            ]);

            // Assign permissions
            if ($config["permissions"] === "*") {
                $perms = $allPerms->whereNotIn("name", $config["except"] ?? []);
            } else {
                $perms = $allPerms->whereIn("name", $config["permissions"]);
            }

            $role->syncPermissions($perms);
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Ambil semua roles untuk store tertentu (sistem + custom).
     */
    public static function getRolesForStore(
        int $storeId,
    ): \Illuminate\Support\Collection {
        return Role::where("store_id", $storeId)
            ->with("permissions:id,name")
            ->get()
            ->map(
                fn($role) => [
                    "id" => $role->id,
                    "name" => $role->name,
                    "description" => $role->description,
                    "is_system" => (bool) $role->is_system,
                    "permissions" => $role->permissions->pluck("name"),
                    "users_count" => \Illuminate\Support\Facades\DB::table(
                        "model_has_roles",
                    )
                        ->where("role_id", $role->id)
                        ->where("store_id", $storeId)
                        ->count(),
                ],
            );
    }
}
