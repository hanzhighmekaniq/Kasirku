<?php

namespace Tests\Feature;

use App\Models\RoleTemplate;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use App\Services\StoreRoleService;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Template role level platform: CRUD, guard is_core, filter per tipe toko saat
 * store baru dibuat, dan perilaku sinkronisasi (tambah/update saja, tidak
 * pernah menghapus role yang sudah ada).
 */
class DeveloperRoleTemplateTest extends TestCase
{
    use RefreshDatabase;

    private function developer(): User
    {
        return User::factory()->create(['is_developer' => true]);
    }

    private function permissions(string ...$names): void
    {
        foreach ($names as $name) {
            Permission::findOrCreate($name, 'web');
        }
    }

    /**
     * Buat store dengan tipe tertentu. Store & StoreType belum punya factory,
     * jadi record dibuat langsung dengan kolom minimum yang wajib.
     */
    private function storeOfType(string $code): Store
    {
        $type = StoreType::firstOrCreate(
            ['code' => $code],
            ['label' => strtoupper($code), 'is_active' => true],
        );

        static $seq = 0;
        $seq++;

        return Store::create([
            'code' => strtoupper($code).'-'.$seq,
            'name' => 'Toko '.strtoupper($code),
            'store_type_id' => $type->id,
            'is_active' => true,
        ]);
    }

    private function rolesOf(Store $store): array
    {
        return Role::where('store_id', $store->id)->pluck('name')->sort()->values()->all();
    }

    // ── Akses ────────────────────────────────────────────────────────────

    public function test_non_developer_cannot_access(): void
    {
        $user = User::factory()->create(['is_developer' => false]);

        $this->actingAs($user)->get('/developer/role-templates')->assertStatus(403);
    }

    public function test_index_lists_templates(): void
    {
        RoleTemplate::factory()->create(['key' => 'kasir', 'name' => 'Kasir']);

        $response = $this->actingAs($this->developer())->get('/developer/role-templates');

        $response->assertOk();
        $keys = collect($response->viewData('page')['props']['templates'])->pluck('key');
        $this->assertTrue($keys->contains('kasir'));
    }

    // ── CRUD ─────────────────────────────────────────────────────────────

    public function test_developer_can_create_template(): void
    {
        $this->permissions('sale.view', 'sale.create');

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/role-templates', [
                'name' => 'Supervisor Gudang',
                'key' => 'supervisor_gudang',
                'description' => 'Pengawas gudang',
                'store_type_codes' => ['retail'],
                'permissions' => ['sale.view'],
            ]);

        $response->assertRedirect(route('developer.role-templates.index'));

        $template = RoleTemplate::where('key', 'supervisor_gudang')->first();
        $this->assertNotNull($template);
        $this->assertFalse($template->is_core);
        $this->assertSame(['retail'], $template->store_type_codes);
        $this->assertSame(['sale.view'], $template->permissions);
    }

    public function test_key_is_generated_from_name_when_omitted(): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/role-templates', [
                'name' => 'Kepala Toko',
                'store_type_codes' => ['*'],
            ]);

        $this->assertDatabaseHas('role_templates', ['key' => 'kepala_toko']);
    }

    public function test_duplicate_key_is_rejected(): void
    {
        RoleTemplate::factory()->create(['key' => 'kasir']);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/role-templates', [
                'name' => 'Kasir Lain',
                'key' => 'kasir',
                'store_type_codes' => ['*'],
            ]);

        $response->assertSessionHasErrors('key');
        $this->assertSame(1, RoleTemplate::where('key', 'kasir')->count());
    }

    public function test_developer_can_update_scope_and_name(): void
    {
        $template = RoleTemplate::factory()->create([
            'key' => 'kitchen',
            'name' => 'Kitchen',
            'store_type_codes' => ['*'],
        ]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->put("/developer/role-templates/{$template->id}", [
                'name' => 'Dapur',
                'description' => 'Staff dapur',
                'store_type_codes' => ['fnb'],
            ]);

        $response->assertRedirect(route('developer.role-templates.index'));

        $template->refresh();
        $this->assertSame('Dapur', $template->name);
        $this->assertSame(['fnb'], $template->store_type_codes);
        // key tidak boleh berubah — nama role di store bergantung padanya
        $this->assertSame('kitchen', $template->key);
    }

    public function test_developer_can_update_permissions(): void
    {
        $this->permissions('stock.view', 'stock.opname');
        $template = RoleTemplate::factory()->create(['key' => 'gudang']);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->put("/developer/role-templates/{$template->id}/permissions", [
                'permissions' => ['stock.view', 'stock.opname'],
            ])
            ->assertRedirect(route('developer.role-templates.index'));

        $this->assertSame(['stock.view', 'stock.opname'], $template->fresh()->permissions);
    }

    public function test_grants_all_stores_wildcard(): void
    {
        $this->permissions('sale.view');
        $template = RoleTemplate::factory()->create(['key' => 'owner']);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->put("/developer/role-templates/{$template->id}/permissions", [
                'grants_all' => true,
                'permissions' => [],
            ]);

        $this->assertSame(['*'], $template->fresh()->permissions);
        $this->assertTrue($template->fresh()->grantsAllPermissions());
    }

    public function test_developer_can_delete_non_core_template(): void
    {
        $template = RoleTemplate::factory()->create(['key' => 'kitchen']);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/role-templates/{$template->id}")
            ->assertRedirect(route('developer.role-templates.index'));

        $this->assertDatabaseMissing('role_templates', ['id' => $template->id]);
    }

    public function test_core_template_cannot_be_deleted(): void
    {
        $template = RoleTemplate::factory()->core()->create(['key' => 'owner']);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/role-templates/{$template->id}")
            ->assertSessionHasErrors('template');

        $this->assertDatabaseHas('role_templates', ['id' => $template->id]);
    }

    // ── Filter per tipe toko ─────────────────────────────────────────────

    public function test_store_only_gets_roles_matching_its_type(): void
    {
        $this->permissions('kitchen.view', 'sale.view');

        RoleTemplate::factory()->create([
            'key' => 'kasir',
            'store_type_codes' => ['*'],
            'permissions' => ['sale.view'],
        ]);
        RoleTemplate::factory()->create([
            'key' => 'kitchen',
            'store_type_codes' => ['fnb'],
            'permissions' => ['kitchen.view'],
        ]);

        $retail = $this->storeOfType('retail');
        $fnb = $this->storeOfType('fnb');

        StoreRoleService::createRolesForStore($retail->id);
        StoreRoleService::createRolesForStore($fnb->id);

        // retail: hanya kasir (wildcard). kitchen tidak relevan → tidak dibuat
        $this->assertSame(['kasir'], $this->rolesOf($retail));
        $this->assertSame(['kasir', 'kitchen'], $this->rolesOf($fnb));
    }

    public function test_permissions_from_template_are_applied_to_role(): void
    {
        $this->permissions('stock.view', 'stock.opname', 'sale.view');

        RoleTemplate::factory()->create([
            'key' => 'gudang',
            'store_type_codes' => ['*'],
            'permissions' => ['stock.view', 'stock.opname'],
        ]);

        $store = $this->storeOfType('retail');
        StoreRoleService::createRolesForStore($store->id);

        app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
        $role = Role::where('store_id', $store->id)->where('name', 'gudang')->first();
        $names = $role->permissions->pluck('name')->sort()->values()->all();
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        $this->assertSame(['stock.opname', 'stock.view'], $names);
    }

    public function test_wildcard_template_grants_every_permission(): void
    {
        $this->permissions('sale.view', 'stock.view', 'setting.edit');

        RoleTemplate::factory()->grantsAll()->create([
            'key' => 'owner',
            'store_type_codes' => ['*'],
        ]);

        $store = $this->storeOfType('retail');
        StoreRoleService::createRolesForStore($store->id);

        app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
        $count = Role::where('store_id', $store->id)->where('name', 'owner')->first()->permissions->count();
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        $this->assertSame(Permission::count(), $count);
    }

    public function test_falls_back_to_static_definition_when_table_empty(): void
    {
        $this->permissions('kitchen.view', 'kitchen.update');
        $this->assertSame(0, RoleTemplate::count());

        $store = $this->storeOfType('retail');
        StoreRoleService::createRolesForStore($store->id);

        // Fallback = 6 role sistem dari array statis StoreRoleService
        $this->assertSame(
            ['admin', 'gudang', 'kasir', 'kitchen', 'owner', 'supervisor'],
            $this->rolesOf($store),
        );
    }

    // ── Sinkronisasi ─────────────────────────────────────────────────────

    public function test_sync_updates_permissions_across_all_matching_stores(): void
    {
        $this->permissions('stock.view', 'stock.opname');

        $template = RoleTemplate::factory()->create([
            'key' => 'gudang',
            'store_type_codes' => ['*'],
            'permissions' => ['stock.view'],
        ]);

        $storeA = $this->storeOfType('retail');
        $storeB = $this->storeOfType('fnb');
        StoreRoleService::createRolesForStore($storeA->id);
        StoreRoleService::createRolesForStore($storeB->id);

        $template->update(['permissions' => ['stock.view', 'stock.opname']]);
        $touched = StoreRoleService::syncTemplateToStores($template);

        $this->assertSame(2, $touched);

        foreach ([$storeA, $storeB] as $store) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            $count = Role::where('store_id', $store->id)->where('name', 'gudang')->first()->permissions->count();
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);

            $this->assertSame(2, $count, "Store {$store->id} permission tidak tersinkron");
        }
    }

    public function test_sync_skips_stores_outside_template_scope(): void
    {
        $this->permissions('kitchen.view');

        $template = RoleTemplate::factory()->create([
            'key' => 'kitchen',
            'store_type_codes' => ['fnb'],
            'permissions' => ['kitchen.view'],
        ]);

        $this->storeOfType('retail');
        $this->storeOfType('fnb');

        $this->assertSame(1, StoreRoleService::syncTemplateToStores($template));
    }

    public function test_sync_never_deletes_existing_roles(): void
    {
        $this->permissions('kitchen.view', 'sale.view');

        $template = RoleTemplate::factory()->create([
            'key' => 'kitchen',
            'store_type_codes' => ['*'],
            'permissions' => ['kitchen.view'],
        ]);

        $store = $this->storeOfType('retail');
        StoreRoleService::createRolesForStore($store->id);
        $this->assertContains('kitchen', $this->rolesOf($store));

        // Cakupan disempitkan supaya role ini tidak lagi relevan untuk retail
        $template->update(['store_type_codes' => ['fnb']]);
        StoreRoleService::syncTemplateToStores($template);
        StoreRoleService::createRolesForStore($store->id);

        // Role lama tetap ada — user yang memakainya tidak kehilangan akses
        $this->assertContains('kitchen', $this->rolesOf($store));
    }
}
