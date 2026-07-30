<?php

/*
|--------------------------------------------------------------------------
| Struk kasir mengikuti pengaturan toko
|--------------------------------------------------------------------------
|
| Sebelumnya halaman kasir hanya mengirim storeName dan receiptFooter, jadi
| logo, alamat, telepon, dan receipt_header yang sudah diisi di Pengaturan
| Toko tidak pernah sampai ke struk. Test ini mengunci semua field itu
| ikut terkirim sebagai prop Inertia.
|
*/

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

uses(RefreshDatabase::class);

/**
 * @return array{0: Store, 1: Branch, 2: User}
 */
function setupReceiptSettingStore(array $storeAttributes = []): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'product', 'category', 'payment_method', 'customer'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create(array_merge([
        'user_id' => null,
        'code' => 'RCPT'.uniqid(),
        'name' => 'Toko Struk',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ], $storeAttributes));

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang 1', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'sale.create'], ['guard_id' => 1]));
    $user->assignRole($role);

    return [$store, $branch, $user];
}

function visitKasirIndex($test, User $user, Store $store, Branch $branch)
{
    $test->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'branch_id' => $branch->id,
        'current_branch_id' => $branch->id,
    ]);

    return $test->get(route('admin.kasir.index'));
}

test('halaman kasir mengirim semua pengaturan struk dari toko', function () {
    [$store, $branch, $user] = setupReceiptSettingStore([
        'name' => 'Kopi Senja',
        'address' => "Jl. Melati No. 12\nBandung",
        'phone' => '08123456789',
        'receipt_header' => 'Selamat menikmati kopi Anda',
        'receipt_footer' => 'Sampai jumpa lagi!',
        'logo' => 'stores/logo-senja.webp',
    ]);

    $response = visitKasirIndex($this, $user, $store, $branch);
    $response->assertSuccessful();

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];

        expect($props['storeName'])->toBe('Kopi Senja');
        expect($props['storeAddress'])->toBe("Jl. Melati No. 12\nBandung");
        expect($props['storePhone'])->toBe('08123456789');
        expect($props['receiptHeader'])->toBe('Selamat menikmati kopi Anda');
        expect($props['receiptFooter'])->toBe('Sampai jumpa lagi!');
        expect($props['storeLogo'])->toBe('/storage/stores/logo-senja.webp');
    });
});

test('pengaturan struk yang kosong dikirim sebagai string kosong dan logo null', function () {
    [$store, $branch, $user] = setupReceiptSettingStore();

    $response = visitKasirIndex($this, $user, $store, $branch);
    $response->assertSuccessful();

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];

        expect($props['storeAddress'])->toBe('');
        expect($props['storePhone'])->toBe('');
        expect($props['receiptHeader'])->toBe('');
        expect($props['receiptFooter'])->toBe('');
        expect($props['storeLogo'])->toBeNull();
    });
});

test('pajak dan format mata uang dikirim dari pengaturan toko', function () {
    [$store, $branch, $user] = setupReceiptSettingStore([
        'default_tax_rate' => 11,
        'tax_inclusive' => true,
        'currency' => 'USD',
        'decimal_places' => 2,
    ]);

    $response = visitKasirIndex($this, $user, $store, $branch);
    $response->assertSuccessful();

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];

        // Props dibaca setelah JSON decode, jadi 11.0 kembali sebagai int 11.
        expect((float) $props['defaultTaxRate'])->toBe(11.0);
        expect($props['taxInclusive'])->toBeTrue();
        expect($props['currency'])->toBe('USD');
        expect((int) $props['decimalPlaces'])->toBe(2);
    });
});

test('toko tanpa pengaturan pajak mengirim nilai default yang aman', function () {
    [$store, $branch, $user] = setupReceiptSettingStore();

    $response = visitKasirIndex($this, $user, $store, $branch);

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];

        expect((float) $props['defaultTaxRate'])->toBe(0.0);
        expect($props['taxInclusive'])->toBeFalse();
        expect($props['currency'])->toBe('IDR');
        expect((int) $props['decimalPlaces'])->toBe(0);
    });
});

test('logo toko dikirim sebagai url storage yang bisa diakses browser', function () {
    [$store, $branch, $user] = setupReceiptSettingStore([
        'logo' => 'stores/abc-123.webp',
    ]);

    $response = visitKasirIndex($this, $user, $store, $branch);

    $response->assertInertia(function ($page) {
        expect($page->toArray()['props']['storeLogo'])->toBe('/storage/stores/abc-123.webp');
    });
});
