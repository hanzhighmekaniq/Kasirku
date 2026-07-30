<?php

/*
|--------------------------------------------------------------------------
| Workspace switcher (toko + cabang) di sidebar
|--------------------------------------------------------------------------
|
| Modal pemilih workspace memilih toko dan cabang dalam satu langkah, jadi
| `admin.store.switch` menerima `branch_id` opsional. Daftar toko + cabangnya
| dikirim lewat prop optional `storeBranchOptions` yang hanya ikut saat
| partial reload memintanya, supaya payload halaman biasa tetap ringan.
|
*/

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Branch;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * Bikin satu toko retail lengkap dengan plan & cabang.
 *
 * @param  array<int, string>  $branchNames
 * @return array{0: Store, 1: Collection<int, Branch>}
 */
function makeWorkspaceStore(string $name, array $branchNames): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'settings'],
        ['label' => 'settings', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'WS'.uniqid(),
        'name' => $name,
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branches = collect($branchNames)->map(
        fn (string $branchName, int $i) => Branch::create([
            'store_id' => $store->id,
            'code' => 'BR'.($i + 1).uniqid(),
            'name' => $branchName,
            'is_active' => true,
        ]),
    );

    return [$store, $branches];
}

/** User yang boleh ganti toko/cabang (punya permission setting.view). */
function makeWorkspaceUser(Store ...$stores): User
{
    $user = User::factory()->create();

    foreach ($stores as $store) {
        $store->users()->attach($user->id);

        app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
        $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
        $role->givePermissionTo(
            Permission::firstOrCreate(['name' => 'setting.view'], ['guard_id' => 1]),
        );
        $user->assignRole($role);
    }

    app(PermissionRegistrar::class)->setPermissionsTeamId($stores[0]->id);

    return $user;
}

test('switch toko memakai cabang yang dipilih user', function () {
    [$storeA, $branchesA] = makeWorkspaceStore('Toko A', ['Cabang A1']);
    [$storeB, $branchesB] = makeWorkspaceStore('Toko B', ['Pusat', 'Timur', 'Barat']);
    $user = makeWorkspaceUser($storeA, $storeB);

    $target = $branchesB->firstWhere('name', 'Barat');

    $this->actingAs($user);
    session([
        'current_store_id' => $storeA->id,
        'current_branch_id' => $branchesA->first()->id,
        'branch_id' => $branchesA->first()->id,
    ]);

    $this->post(route('admin.store.switch'), [
        'store_id' => $storeB->id,
        'branch_id' => $target->id,
    ])->assertRedirect(route('admin.dashboard'));

    expect(session('current_store_id'))->toBe($storeB->id);
    expect(session('current_branch_id'))->toBe($target->id);
    expect(session('branch_id'))->toBe($target->id);
});

test('cabang milik toko lain diabaikan dan jatuh ke cabang pertama toko tujuan', function () {
    [$storeA, $branchesA] = makeWorkspaceStore('Toko A', ['Cabang A1']);
    [$storeB, $branchesB] = makeWorkspaceStore('Toko B', ['Pusat', 'Timur']);
    $user = makeWorkspaceUser($storeA, $storeB);

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id]);

    $this->post(route('admin.store.switch'), [
        'store_id' => $storeB->id,
        // Cabang ini milik Toko A, bukan tujuan switch.
        'branch_id' => $branchesA->first()->id,
    ])->assertRedirect(route('admin.dashboard'));

    expect(session('current_store_id'))->toBe($storeB->id);
    expect(session('current_branch_id'))->toBe($branchesB->first()->id);
});

test('switch toko tanpa branch_id tetap auto-pick cabang pertama', function () {
    [$storeA] = makeWorkspaceStore('Toko A', ['Cabang A1']);
    [$storeB, $branchesB] = makeWorkspaceStore('Toko B', ['Pusat', 'Timur']);
    $user = makeWorkspaceUser($storeA, $storeB);

    $this->actingAs($user);
    session(['current_store_id' => $storeA->id]);

    $this->post(route('admin.store.switch'), ['store_id' => $storeB->id])
        ->assertRedirect(route('admin.dashboard'));

    expect(session('current_branch_id'))->toBe($branchesB->first()->id);
});

test('storeBranchOptions tidak dikirim di request biasa', function () {
    [$store, $branches] = makeWorkspaceStore('Toko A', ['Pusat', 'Timur']);
    $user = makeWorkspaceUser($store);

    $this->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'current_branch_id' => $branches->first()->id,
    ]);

    $this->get(route('admin.profile.edit'))->assertInertia(
        fn ($page) => expect($page->toArray()['props'])
            ->not->toHaveKey('storeBranchOptions'),
    );
});

test('storeBranchOptions berisi semua toko user beserta cabang aktifnya saat diminta', function () {
    [$storeA, $branchesA] = makeWorkspaceStore('Toko A', ['Pusat A']);
    [$storeB] = makeWorkspaceStore('Toko B', ['Pusat B', 'Timur B']);
    $user = makeWorkspaceUser($storeA, $storeB);

    Branch::create([
        'store_id' => $storeB->id,
        'code' => 'NONAKTIF',
        'name' => 'Cabang Tutup',
        'is_active' => false,
    ]);

    $this->actingAs($user);
    session([
        'current_store_id' => $storeA->id,
        'current_branch_id' => $branchesA->first()->id,
    ]);

    // Simulasikan partial reload seperti yang dilakukan modal pemilih:
    // router.reload({ only: ['storeBranchOptions'] })
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)
            ->version(request()),
        'X-Inertia-Partial-Component' => 'Profile/Edit',
        'X-Inertia-Partial-Data' => 'storeBranchOptions',
    ])->get(route('admin.profile.edit'));

    $response->assertSuccessful();

    $options = collect($response->json('props.storeBranchOptions'));

    expect($options->pluck('name')->all())->toBe(['Toko A', 'Toko B']);
    expect($options->firstWhere('name', 'Toko A')['store_type'])->toBe('retail');
    expect(
        collect($options->firstWhere('name', 'Toko B')['branches'])
            ->pluck('name')
            ->all(),
    )->toBe(['Pusat B', 'Timur B']);
});
