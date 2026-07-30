<?php

use App\Models\RoleTemplate;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use App\Services\StoreRoleService;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * Assign role user per toko (halaman Developer > Users).
 *
 * Satu form bisa menugaskan user ke banyak toko dengan tipe berbeda, jadi role
 * yang ditawarkan harus mengikuti tipe toko masing-masing — role kitchen tidak
 * boleh bisa dipasang di toko retail.
 */
function devUser(): User
{
    return User::factory()->create(['is_developer' => true]);
}

function storeOfType(string $typeCode): Store
{
    $type = StoreType::firstOrCreate(
        ['code' => $typeCode],
        ['label' => strtoupper($typeCode), 'is_active' => true, 'sort_order' => 0],
    );

    return Store::create([
        'code' => strtoupper($typeCode).'-'.uniqid(),
        'name' => 'Toko '.strtoupper($typeCode),
        'store_type_id' => $type->id,
        'is_active' => true,
    ]);
}

function seedRoleTemplates(): void
{
    Permission::findOrCreate('sale.view', 'web');
    Permission::findOrCreate('kitchen.view', 'web');

    RoleTemplate::factory()->create([
        'key' => 'kasir', 'name' => 'Kasir', 'sort_order' => 1,
        'store_type_codes' => ['*'], 'permissions' => ['sale.view'],
    ]);
    RoleTemplate::factory()->create([
        'key' => 'kitchen', 'name' => 'Kitchen', 'sort_order' => 2,
        'store_type_codes' => ['fnb'], 'permissions' => ['kitchen.view'],
    ]);
}

/** Role yang dipegang user di sebuah store. */
function rolesOfUserInStore(User $user, Store $store): array
{
    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $names = $user->fresh()->getRoleNames()->sort()->values()->all();
    app(PermissionRegistrar::class)->setPermissionsTeamId(null);

    return $names;
}

it('offers only roles that apply to each store type', function () {
    seedRoleTemplates();
    storeOfType('retail');
    storeOfType('fnb');

    $response = $this->actingAs(devUser())->get('/developer/users/create');

    $response->assertOk();
    $rolesByType = $response->viewData('page')['props']['rolesByStoreType'];

    expect(collect($rolesByType['retail'])->pluck('value')->all())->toBe(['kasir'])
        ->and(collect($rolesByType['fnb'])->pluck('value')->all())->toBe(['kasir', 'kitchen']);
});

it('rejects a role that does not exist in the target store', function () {
    seedRoleTemplates();
    $retail = storeOfType('retail');
    StoreRoleService::createRolesForStore($retail->id);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs(devUser())
        ->post('/developer/users', [
            'name' => 'Budi',
            'email' => 'budi@example.test',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'store_roles' => [
                ['store_id' => $retail->id, 'role' => 'kitchen'],
            ],
        ]);

    $response->assertSessionHasErrors('store_roles.0.role');
    $this->assertDatabaseMissing('users', ['email' => 'budi@example.test']);
});

it('assigns a role that is valid for the store', function () {
    seedRoleTemplates();
    $fnb = storeOfType('fnb');
    StoreRoleService::createRolesForStore($fnb->id);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs(devUser())
        ->post('/developer/users', [
            'name' => 'Sari',
            'email' => 'sari@example.test',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'store_roles' => [
                ['store_id' => $fnb->id, 'role' => 'kitchen'],
            ],
        ])
        ->assertRedirect(route('developer.users.index'));

    $user = User::where('email', 'sari@example.test')->firstOrFail();

    expect(rolesOfUserInStore($user, $fnb))->toBe(['kitchen']);
});

it('creates a developer user without touching spatie roles', function () {
    seedRoleTemplates();
    $store = storeOfType('retail');
    StoreRoleService::createRolesForStore($store->id);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs(devUser())
        ->post('/developer/users', [
            'name' => 'Dev',
            'email' => 'dev@example.test',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'is_developer' => true,
        ])
        ->assertRedirect(route('developer.users.index'));

    $user = User::where('email', 'dev@example.test')->firstOrFail();

    expect($user->is_developer)->toBeTrue()
        ->and($user->isDeveloper())->toBeTrue();
});

it('rejects an invalid role when updating a user', function () {
    seedRoleTemplates();
    $retail = storeOfType('retail');
    StoreRoleService::createRolesForStore($retail->id);

    $target = User::factory()->create();

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs(devUser())
        ->put("/developer/users/{$target->id}", [
            'name' => $target->name,
            'email' => $target->email,
            'store_roles' => [
                ['store_id' => $retail->id, 'role' => 'kitchen'],
            ],
        ])
        ->assertSessionHasErrors('store_roles.0.role');
});

it('keeps existing access when an update is rejected', function () {
    seedRoleTemplates();
    $retail = storeOfType('retail');
    StoreRoleService::createRolesForStore($retail->id);

    $target = User::factory()->create();
    $retail->users()->attach($target->id);
    app(PermissionRegistrar::class)->setPermissionsTeamId($retail->id);
    $target->assignRole('kasir');
    app(PermissionRegistrar::class)->setPermissionsTeamId(null);

    $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs(devUser())
        ->put("/developer/users/{$target->id}", [
            'name' => $target->name,
            'email' => $target->email,
            'store_roles' => [
                ['store_id' => $retail->id, 'role' => 'kitchen'],
            ],
        ])
        ->assertSessionHasErrors('store_roles.0.role');

    // Validasi gagal sebelum transaksi, jadi role lama tidak boleh terhapus
    expect(rolesOfUserInStore($target, $retail))->toBe(['kasir']);
});
