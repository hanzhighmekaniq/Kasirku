<?php

namespace App\Services;

use App\Models\RoleTemplate;
use App\Models\Store;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Service untuk mengelola roles per store.
 *
 * Dengan Spatie teams (store_id), setiap store butuh copy roles-nya sendiri.
 * Role sistem dibuat otomatis saat store dibuat, bersumber dari tabel
 * `role_templates` (dikelola developer lewat halaman Template Role) dan
 * difilter sesuai tipe toko — role yang tidak relevan (mis. kitchen di toko
 * retail) tidak lagi ikut terbuat.
 *
 * Definisi array statis di systemRolePermissions() dipertahankan sebagai
 * fallback bila tabel role_templates masih kosong (seeder belum jalan), supaya
 * store baru tidak pernah lahir tanpa role sama sekali.
 */
class StoreRoleService
{
    /**
     * Feature yang mengunci sebuah permission spesifik.
     * Menang atas GROUP_FEATURES karena satu grup bisa dipecah ke beberapa fitur.
     *
     * @var array<string, string>
     */
    private const PERMISSION_FEATURE_OVERRIDES = [
        'sale.return' => 'sale_return',
        'stock.adjustment' => 'stock_adjustment',
        'stock.opname' => 'stock_opname',
        'stock.transfer' => 'stock_transfer',
        'stock.waste' => 'waste',
        'purchase.return' => 'purchase_return',
        'customer.deposit' => 'deposit',
        'setting.payment_method' => 'payment_method',
        'setting.payment_gateway' => 'payment_gateway',
    ];

    /**
     * Feature yang mengunci seluruh permission dalam satu grup (prefix).
     *
     * @var array<string, string>
     */
    private const GROUP_FEATURES = [
        'dashboard' => 'dashboard',
        'sale' => 'basic_pos',
        'shift' => 'shift',
        'product' => 'product',
        'stock' => 'stock',
        'batch' => 'batch_expired',
        'purchase' => 'purchase',
        'supplier' => 'supplier',
        'customer' => 'customer',
        'membership' => 'membership',
        'debt' => 'debt',
        'employee' => 'employee',
        'commission' => 'commission',
        'expense' => 'expense',
        'promotion' => 'promo',
        'table' => 'table',
        'kitchen' => 'kitchen',
        'queue' => 'queue',
        'booking' => 'booking',
        'report' => 'report',
        'setting' => 'settings',
    ];

    /**
     * Definisi permission per role sistem — FALLBACK saja.
     *
     * Sumber kebenaran sekarang tabel `role_templates`. Array ini hanya
     * dipakai kalau tabel itu kosong.
     */
    public static function systemRolePermissions(): array
    {
        return [
            'owner' => [
                'is_system' => true,
                'description' => 'Pemilik toko, akses penuh + kelola role & user',
                'permissions' => '*', // semua permission kecuali setting.module
                'except' => [],
            ],
            'admin' => [
                'is_system' => true,
                'description' => 'Manager operasional harian',
                'permissions' => [
                    'dashboard.view',
                    'sale.create',
                    'sale.view',
                    'sale.void',
                    'sale.discount',
                    'sale.return',
                    'product.view',
                    'product.create',
                    'product.edit',
                    'product.delete',
                    'product.import',
                    'stock.view',
                    'stock.adjustment',
                    'stock.opname',
                    'stock.transfer',
                    'stock.waste',
                    'batch.view',
                    'purchase.view',
                    'purchase.create',
                    'purchase.edit',
                    'purchase.delete',
                    'purchase.return',
                    'customer.view',
                    'customer.create',
                    'customer.edit',
                    'customer.delete',
                    'customer.deposit',
                    'employee.view',
                    'employee.create',
                    'employee.edit',
                    'employee.delete',
                    'report.sales',
                    'report.purchase',
                    'report.stock',
                    'report.expense',
                    'report.shift',
                    'report.commission',
                    'shift.open',
                    'shift.close',
                    'shift.view',
                    'shift.manage',
                    'promotion.view',
                    'promotion.create',
                    'promotion.edit',
                    'promotion.delete',
                    'table.view',
                    'table.manage',
                    'kitchen.view',
                    'kitchen.update',
                    'queue.view',
                    'queue.manage',
                    'booking.view',
                    'booking.create',
                    'booking.edit',
                    'booking.cancel',
                    'membership.view',
                    'membership.create',
                    'membership.edit',
                    'commission.view',
                    'commission.approve',
                    'setting.view',
                    'setting.edit',
                    'setting.payment_method',
                    'setting.payment_gateway',
                    'setting.module',
                    'supplier.view',
                    'supplier.create',
                    'supplier.edit',
                    'supplier.delete',
                    'debt.view',
                    'debt.create',
                    'debt.pay',
                ],
            ],
            'supervisor' => [
                'is_system' => true,
                'description' => 'Pengawas shift, bisa void & approve komisi',
                'permissions' => [
                    'dashboard.view',
                    'sale.view',
                    'sale.void',
                    'sale.return',
                    'product.view',
                    'stock.view',
                    'batch.view',
                    'purchase.view',
                    'customer.view',
                    'customer.deposit',
                    'employee.view',
                    'report.sales',
                    'report.stock',
                    'report.expense',
                    'report.shift',
                    'report.commission',
                    'shift.open',
                    'shift.close',
                    'shift.view',
                    'shift.manage',
                    'expense.view',
                    'expense.create',
                    'promotion.view',
                    'table.view',
                    'table.manage',
                    'kitchen.view',
                    'kitchen.update',
                    'queue.view',
                    'queue.manage',
                    'booking.view',
                    'booking.create',
                    'booking.edit',
                    'booking.cancel',
                    'commission.view',
                    'commission.approve',
                ],
            ],
            'kasir' => [
                'is_system' => true,
                'description' => 'Operator POS harian',
                'permissions' => [
                    'dashboard.view',
                    'sale.create',
                    'sale.view',
                    'sale.discount',
                    'product.view',
                    'stock.view',
                    'customer.view',
                    'customer.create',
                    'shift.open',
                    'shift.close',
                    'shift.view',
                    'expense.create',
                    'table.view',
                    'table.manage',
                    'kitchen.view',
                    'queue.view',
                    'queue.manage',
                    'booking.view',
                    'booking.create',
                    'debt.create',
                ],
            ],
            'gudang' => [
                'is_system' => true,
                'description' => 'Operator gudang, kelola stok & pembelian',
                'permissions' => [
                    'dashboard.view',
                    'product.view',
                    'product.create',
                    'product.edit',
                    'product.import',
                    'stock.view',
                    'stock.adjustment',
                    'stock.opname',
                    'stock.transfer',
                    'stock.waste',
                    'batch.view',
                    'purchase.view',
                    'purchase.create',
                    'purchase.edit',
                    'purchase.return',
                    'report.stock',
                    'report.purchase',
                    'supplier.view',
                    'supplier.create',
                    'supplier.edit',
                ],
            ],
            'kitchen' => [
                'is_system' => true,
                'description' => 'Staff dapur, update status masak',
                'permissions' => ['kitchen.view', 'kitchen.update'],
            ],
        ];
    }

    /**
     * Buat/sync semua role sistem untuk store tertentu.
     *
     * Role yang dibuat = template yang cakupan `store_type_codes`-nya mencakup
     * tipe toko ini. Bersifat idempotent: aman dipanggil berulang.
     *
     * Role yang sudah ada TIDAK pernah dihapus di sini — kalau cakupan template
     * berubah sehingga sebuah role jadi tidak relevan, role lamanya dibiarkan
     * supaya user yang memakainya tidak kehilangan akses diam-diam.
     */
    public static function createRolesForStore(int $storeId): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $allPerms = Permission::all();
        $storeTypeCode = self::storeTypeCodeFor($storeId);

        foreach (self::resolveTemplates($storeTypeCode) as $definition) {
            self::upsertRole($storeId, $definition, $allPerms);
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Terapkan satu template ke SEMUA store yang tipenya cocok.
     * Dipakai halaman Template Role setelah permission/cakupan diubah.
     *
     * Hanya menambah dan memperbarui, tidak pernah menghapus role.
     *
     * @return int jumlah store yang tersentuh
     */
    public static function syncTemplateToStores(RoleTemplate $template): int
    {
        $allPerms = Permission::all();
        $definition = self::definitionFromTemplate($template);
        $touched = 0;

        $stores = Store::query()
            ->with('storeType:id,code')
            ->get(['id', 'store_type_id']);

        foreach ($stores as $store) {
            $storeTypeCode = $store->getRelationValue('storeType')?->code;

            if (! $template->appliesTo($storeTypeCode)) {
                continue;
            }

            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            self::upsertRole($store->id, $definition, $allPerms);
            $touched++;
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $touched;
    }

    /**
     * Buat role bila belum ada, lalu sync deskripsi & permission-nya.
     *
     * @param  array{name: string, description: ?string, permissions: array<int, string>|string}  $definition
     * @param  Collection<int, Permission>  $allPerms
     */
    private static function upsertRole(int $storeId, array $definition, Collection $allPerms): void
    {
        $role = Role::firstOrCreate([
            'name' => $definition['name'],
            'guard_name' => 'web',
            'store_id' => $storeId,
        ]);

        $role->update([
            'is_system' => true,
            'description' => $definition['description'],
        ]);

        $perms = $definition['permissions'] === '*'
            ? $allPerms
            : $allPerms->whereIn('name', $definition['permissions']);

        $role->syncPermissions($perms);
    }

    /** Kode tipe toko sebuah store, null bila tidak diset. */
    private static function storeTypeCodeFor(int $storeId): ?string
    {
        return Store::query()
            ->with('storeType:id,code')
            ->find($storeId)
            ?->getRelationValue('storeType')
            ?->code;
    }

    /**
     * Definisi role yang berlaku untuk tipe toko tertentu.
     *
     * Sumber utama tabel `role_templates`. Kalau tabel kosong (seeder belum
     * dijalankan), jatuh ke array statis systemRolePermissions() supaya store
     * baru tetap punya role lengkap.
     *
     * @return array<int, array{name: string, description: ?string, permissions: array<int, string>|string}>
     */
    private static function resolveTemplates(?string $storeTypeCode): array
    {
        $templates = RoleTemplate::query()->ordered()->get();

        if ($templates->isEmpty()) {
            return collect(self::systemRolePermissions())
                ->map(fn (array $config, string $roleName) => [
                    'name' => $roleName,
                    'description' => $config['description'],
                    'permissions' => $config['permissions'],
                ])
                ->values()
                ->all();
        }

        return $templates
            ->filter(fn (RoleTemplate $t) => $t->appliesTo($storeTypeCode))
            ->map(fn (RoleTemplate $t) => self::definitionFromTemplate($t))
            ->values()
            ->all();
    }

    /**
     * @return array{name: string, description: ?string, permissions: array<int, string>|string}
     */
    private static function definitionFromTemplate(RoleTemplate $template): array
    {
        return [
            'name' => $template->key,
            'description' => $template->description,
            'permissions' => $template->grantsAllPermissions()
                ? '*'
                : ($template->permissions ?? []),
        ];
    }

    /**
     * Ambil semua roles untuk store tertentu (sistem + custom).
     *
     * Role sistem dilengkapi metadata template (ikon, warna, urutan) supaya
     * halaman Role & Permission tidak perlu lagi meng-hardcode daftar role.
     *
     * Role sistem yang templatenya sudah tidak berlaku untuk tipe toko ini
     * (mis. kitchen di toko retail) ditandai `out_of_scope` — bukan dihapus,
     * karena sync memang tidak pernah menghapus role. UI yang memutuskan
     * menyembunyikannya bila belum dipakai user.
     */
    public static function getRolesForStore(
        int $storeId,
    ): Collection {
        $storeTypeCode = self::storeTypeCodeFor($storeId);
        $templates = RoleTemplate::query()->ordered()->get()->keyBy('key');

        return Role::where('store_id', $storeId)
            ->with('permissions:id,name')
            ->get()
            ->map(function ($role) use ($storeId, $storeTypeCode, $templates) {
                $template = $role->is_system ? $templates->get($role->name) : null;

                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => $template?->name ?? $role->name,
                    'description' => $role->description ?? $template?->description,
                    'is_system' => (bool) $role->is_system,
                    'icon' => $template?->icon,
                    'color' => $template?->color,
                    'sort_order' => $template?->sort_order ?? 999,
                    // Template hilang dianggap di luar cakupan juga — rolenya
                    // sudah tidak lagi dikelola dari halaman Template Role.
                    'out_of_scope' => $role->is_system
                        && ! ($template?->appliesTo($storeTypeCode) ?? false),
                    'permissions' => $role->permissions->pluck('name'),
                    'users_count' => DB::table(
                        'model_has_roles',
                    )
                        ->where('role_id', $role->id)
                        ->where('store_id', $storeId)
                        ->count(),
                ];
            })
            ->sortBy([['is_system', 'desc'], ['sort_order', 'asc'], ['name', 'asc']])
            ->values();
    }

    /**
     * Permission yang relevan untuk sebuah store: hanya yang fiturnya didukung
     * tipe toko. Tanpa filter ini halaman Role & Permission menawarkan akses
     * seperti kitchen atau meja di toko retail — menu yang tidak pernah ada.
     *
     * Permission yang tidak terpetakan ke fitur apa pun (mis. employee.*)
     * selalu dianggap relevan.
     *
     * @return Collection<int, string>
     */
    public static function relevantPermissionsForStore(int $storeId): Collection
    {
        $store = Store::with('storeType.features')->find($storeId);
        $storeType = $store?->getRelationValue('storeType');

        $permissions = Permission::orderBy('name')->pluck('name');

        // Tipe toko tidak diset / tanpa fitur → jangan sembunyikan apa pun,
        // lebih baik menampilkan lebih daripada mengunci owner dari aksesnya.
        if (! $storeType || $storeType->features->isEmpty()) {
            return $permissions->values();
        }

        $featureCodes = $storeType->features
            ->where('is_active', true)
            ->pluck('code')
            ->all();

        return $permissions
            ->filter(function (string $name) use ($featureCodes) {
                $feature = self::featureForPermission($name);

                return $feature === null || in_array($feature, $featureCodes, true);
            })
            ->values();
    }

    /** Feature yang mengunci sebuah permission, null bila tidak terikat fitur. */
    private static function featureForPermission(string $permission): ?string
    {
        if (isset(self::PERMISSION_FEATURE_OVERRIDES[$permission])) {
            return self::PERMISSION_FEATURE_OVERRIDES[$permission];
        }

        return self::GROUP_FEATURES[explode('.', $permission)[0]] ?? null;
    }
}
