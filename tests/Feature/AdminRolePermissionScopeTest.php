<?php

use App\Models\Feature;
use App\Models\RoleTemplate;
use App\Models\Store;
use App\Models\StoreType;
use App\Services\StoreRoleService;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Halaman Admin > Role & Permission harus mengikuti tipe toko: permission yang
 * fiturnya tidak didukung (mis. kitchen di retail) tidak boleh ditawarkan, dan
 * role sistem dilengkapi metadata dari template.
 */

/** @param array<int, string> $featureCodes */
function storeWithFeatures(string $typeCode, array $featureCodes): Store
{
    $type = StoreType::firstOrCreate(
        ['code' => $typeCode],
        ['label' => strtoupper($typeCode), 'is_active' => true, 'sort_order' => 0],
    );

    foreach ($featureCodes as $code) {
        $feature = Feature::firstOrCreate(
            ['code' => $code],
            ['label' => $code, 'is_active' => true, 'sort_order' => 0],
        );

        $type->features()->syncWithoutDetaching([$feature->id]);
    }

    return Store::create([
        'code' => strtoupper($typeCode).'-'.uniqid(),
        'name' => 'Toko '.strtoupper($typeCode),
        'store_type_id' => $type->id,
        'is_active' => true,
    ]);
}

function makePermissions(string ...$names): void
{
    foreach ($names as $name) {
        Permission::findOrCreate($name, 'web');
    }
}

it('hides permissions whose feature is unsupported by the store type', function () {
    makePermissions('sale.view', 'kitchen.view', 'kitchen.update', 'table.view');

    $retail = storeWithFeatures('retail', ['basic_pos']);

    $permissions = StoreRoleService::relevantPermissionsForStore($retail->id)->all();

    expect($permissions)->toContain('sale.view')
        ->and($permissions)->not->toContain('kitchen.view')
        ->and($permissions)->not->toContain('kitchen.update')
        ->and($permissions)->not->toContain('table.view');
});

it('keeps kitchen permissions for fnb stores', function () {
    makePermissions('sale.view', 'kitchen.view', 'kitchen.update');

    $fnb = storeWithFeatures('fnb', ['basic_pos', 'kitchen']);

    expect(StoreRoleService::relevantPermissionsForStore($fnb->id)->all())
        ->toContain('kitchen.view', 'kitchen.update', 'sale.view');
});

it('resolves sub-feature permissions independently of their group', function () {
    makePermissions('stock.view', 'stock.opname', 'stock.waste');

    // Toko punya fitur stock tapi tidak stock_opname / waste
    $store = storeWithFeatures('retail', ['stock']);

    $permissions = StoreRoleService::relevantPermissionsForStore($store->id)->all();

    expect($permissions)->toContain('stock.view')
        ->and($permissions)->not->toContain('stock.opname')
        ->and($permissions)->not->toContain('stock.waste');
});

it('keeps permissions that are not tied to any feature', function () {
    makePermissions('employee.view', 'batch.view');

    $store = storeWithFeatures('retail', ['employee']);

    // employee.* terikat fitur employee (didukung), batch.* tidak didukung
    $permissions = StoreRoleService::relevantPermissionsForStore($store->id)->all();

    expect($permissions)->toContain('employee.view')
        ->and($permissions)->not->toContain('batch.view');
});

it('falls back to all permissions when the store type has no features', function () {
    makePermissions('sale.view', 'kitchen.view');

    $store = storeWithFeatures('retail', []);

    expect(StoreRoleService::relevantPermissionsForStore($store->id)->all())
        ->toContain('sale.view', 'kitchen.view');
});

it('marks system roles outside the template scope as out of scope', function () {
    makePermissions('sale.view', 'kitchen.view');

    RoleTemplate::factory()->create([
        'key' => 'kasir',
        'name' => 'Kasir',
        'icon' => 'Monitor',
        'color' => 'sky',
        'sort_order' => 1,
        'store_type_codes' => ['*'],
        'permissions' => ['sale.view'],
    ]);
    $kitchen = RoleTemplate::factory()->create([
        'key' => 'kitchen',
        'name' => 'Kitchen',
        'icon' => 'ChefHat',
        'color' => 'orange',
        'sort_order' => 2,
        'store_type_codes' => ['*'],
        'permissions' => ['kitchen.view'],
    ]);

    $retail = storeWithFeatures('retail', ['basic_pos']);
    StoreRoleService::createRolesForStore($retail->id);

    // Cakupan disempitkan — role kitchen di retail tidak dihapus, hanya ditandai
    $kitchen->update(['store_type_codes' => ['fnb']]);

    $roles = StoreRoleService::getRolesForStore($retail->id)->keyBy('name');

    expect($roles['kasir']['out_of_scope'])->toBeFalse()
        ->and($roles['kasir']['label'])->toBe('Kasir')
        ->and($roles['kasir']['icon'])->toBe('Monitor')
        ->and($roles['kasir']['color'])->toBe('sky')
        ->and($roles['kitchen']['out_of_scope'])->toBeTrue();
});

it('orders system roles by template sort order before custom roles', function () {
    makePermissions('sale.view');

    RoleTemplate::factory()->create([
        'key' => 'owner', 'name' => 'Owner', 'sort_order' => 1, 'store_type_codes' => ['*'],
        'permissions' => ['sale.view'],
    ]);
    RoleTemplate::factory()->create([
        'key' => 'kasir', 'name' => 'Kasir', 'sort_order' => 2, 'store_type_codes' => ['*'],
        'permissions' => ['sale.view'],
    ]);

    $store = storeWithFeatures('retail', ['basic_pos']);
    StoreRoleService::createRolesForStore($store->id);

    Role::create([
        'name' => 'barista', 'guard_name' => 'web',
        'store_id' => $store->id, 'is_system' => false,
    ]);

    expect(StoreRoleService::getRolesForStore($store->id)->pluck('name')->all())
        ->toBe(['owner', 'kasir', 'barista']);
});
