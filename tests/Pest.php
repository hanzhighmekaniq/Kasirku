<?php

use App\Models\Branch;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Pengaman: jangan pernah jalankan test di database non-test
|--------------------------------------------------------------------------
|
| RefreshDatabase menjalankan migrate:fresh pada koneksi yang aktif. Kalau
| koneksinya menunjuk ke database dev, SELURUH DATA HILANG. Ini sudah pernah
| terjadi (2026-07-26, database `simkasir` terhapus) karena
| bootstrap/cache/config.php masih ada — config yang di-cache membuat Laravel
| melewati env(), sehingga override <env> di phpunit.xml diabaikan total.
|
| Guard di bawah membuat kondisi itu gagal berisik (exception) alih-alih
| merusak data. Jangan dihapus.
|
*/

pest()->beforeEach(function () {
    $connection = config('database.default');
    $database = config("database.connections.{$connection}.database");

    // sqlite in-memory selalu aman
    if (in_array($database, [':memory:', ''], true)) {
        return;
    }

    if (! str_ends_with((string) $database, '_test')) {
        throw new RuntimeException(
            "STOP: test hendak dijalankan di database '{$database}' yang bukan database test.\n"
            ."RefreshDatabase akan menghapus SEMUA datanya.\n\n"
            ."Kemungkinan penyebab: config sedang di-cache sehingga override di\n"
            ."phpunit.xml diabaikan. Perbaiki dengan:\n"
            ."  php artisan config:clear\n\n"
            ."Nama database test harus berakhiran '_test' (lihat phpunit.xml)."
        );
    }
})->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Setup store + branch + user dengan permission tertentu, siap dipakai test pembelian.
 * Default permission: purchase.create saja. Kirim array custom untuk skenario
 * yang butuh purchase.view/edit/delete juga (mis. lifecycle draft->completed->cancelled).
 *
 * @return array{0: Store, 1: Branch, 2: User}
 */
function setupPurchaseTestContext(array $permissions = ['purchase.create']): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    $featureCodes = ['purchase', 'product'];
    foreach ($featureCodes as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null, 'code' => 'TESTPUR'.uniqid(), 'name' => 'Test Store Purchase',
        'store_type_id' => $storeType->id, 'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR001', 'name' => 'Main Branch', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach ($permissions as $permName) {
        $perm = Permission::create(['name' => $permName, 'guard_id' => 1]);
        $role->givePermissionTo($perm);
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}
