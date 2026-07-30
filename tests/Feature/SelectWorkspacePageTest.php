<?php

/*
|--------------------------------------------------------------------------
| Halaman Pilih Toko & Pilih Cabang
|--------------------------------------------------------------------------
|
| Dua langkah setelah login ini sekarang memakai bahasa visual yang sama
| dengan halaman login: surface paten `.dv-auth` (band gelap + kartu
| hairline), BUKAN token theme engine user. Test ini menjaga dua hal:
|
|  1. Kontrak data ke komponen tidak berubah (props yang dipakai tampilan
|     baru benar-benar dikirim controller).
|  2. Komponennya tetap di surface `.dv-auth` dan tidak menyelipkan utility
|     yang terikat tema user — kalau itu terjadi, warnanya akan ikut berubah
|     saat user ganti tema/mode sementara login tetap paten.
|
*/

use App\Models\Branch;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;

uses(RefreshDatabase::class);

/**
 * Toko retail sederhana beserta cabangnya.
 *
 * @param  array<int, string>  $branchNames
 * @return array{0: Store, 1: Collection<int, Branch>}
 */
function makeSelectPageStore(string $name, array $branchNames): array
{
    $storeType = StoreType::firstOrCreate(
        ['code' => 'retail'],
        ['label' => 'Retail', 'is_active' => true, 'sort_order' => 0],
    );

    $feature = Feature::firstOrCreate(
        ['code' => 'dashboard'],
        ['label' => 'dashboard', 'is_active' => true, 'sort_order' => 0],
    );
    $storeType->features()->syncWithoutDetaching([$feature->id]);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching([$feature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'SEL'.uniqid(),
        'name' => $name,
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branches = collect($branchNames)->map(
        fn (string $branchName, int $i) => Branch::create([
            'store_id' => $store->id,
            'code' => 'BR'.($i + 1).uniqid(),
            'name' => $branchName,
            'address' => "Jl. {$branchName} No. ".($i + 1),
            'is_active' => true,
        ]),
    );

    return [$store, $branches];
}

/** Isi file komponen halaman select. */
function selectPageSource(string $component): string
{
    return file_get_contents(
        resource_path("js/Pages/Admin/{$component}.jsx"),
    );
}

/**
 * Isi file tanpa komentar — komentar dokumentasi memang menyebut nama utility
 * yang dilarang, jadi harus dibuang sebelum dicek.
 */
function selectPageCode(string $component): string
{
    return preg_replace(
        ['/\/\*.*?\*\//s', '/^\s*\/\/.*$/m'],
        '',
        selectPageSource($component),
    );
}

test('halaman pilih cabang mengirim nama toko dan cabang aktif saja', function () {
    [$store, $branches] = makeSelectPageStore('Toko Sinkron', ['Pusat', 'Timur']);

    Branch::create([
        'store_id' => $store->id,
        'code' => 'TUTUP',
        'name' => 'Cabang Tutup',
        'is_active' => false,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    $this->actingAs($user);
    session(['current_store_id' => $store->id]);

    $response = $this->get(route('admin.branch.select'));
    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($branches) {
        $props = $page->toArray()['props'];

        expect($page->toArray()['component'])->toBe('Admin/SelectBranch');
        expect($props['storeName'])->toBe('Toko Sinkron');
        expect(collect($props['branches'])->pluck('name')->all())
            ->toBe($branches->pluck('name')->all());
        // Alamat dipakai sebagai meta di baris pilihan & target pencarian.
        expect($props['branches'][0])->toHaveKeys(['id', 'code', 'name', 'address']);
    });
});

test('halaman pilih toko mengirim tipe dan jumlah cabang tiap toko', function () {
    [$storeA] = makeSelectPageStore('Toko A', ['Pusat A']);
    [$storeB] = makeSelectPageStore('Toko B', ['Pusat B', 'Timur B']);

    $user = User::factory()->create();
    $storeA->users()->attach($user->id);
    $storeB->users()->attach($user->id);

    $this->actingAs($user);

    $response = $this->get(route('admin.store.select'));
    $response->assertSuccessful();

    $response->assertInertia(function ($page) {
        $props = $page->toArray()['props'];

        expect($page->toArray()['component'])->toBe('Admin/SelectStore');

        $stores = collect($props['stores']);
        expect($stores)->toHaveCount(2);
        expect($stores->firstWhere('name', 'Toko B')['branches_count'])->toBe(2);
        // Kode tipe dipakai untuk memilih ikon & label di baris pilihan.
        expect($stores->firstWhere('name', 'Toko A')['store_type'])->toBe('retail');
    });
});

test('halaman select memakai surface dv-auth seperti login', function (string $component) {
    $source = selectPageSource($component);

    expect($source)->toContain('dv-auth');
    expect($source)->toContain('dv-card');
    expect($source)->toContain('dv-option');
})->with(['SelectStore', 'SelectBranch']);

test('halaman select tidak memakai utility yang terikat tema user', function (string $component) {
    $source = selectPageCode($component);

    // Token theme engine (bg-primary, text-foreground, dst) tidak boleh dipakai
    // di surface auth — paletnya paten, lihat komentar di app.css `.dv-auth`.
    foreach ([
        'bg-primary',
        'bg-card',
        'bg-muted',
        'text-foreground',
        'text-muted-foreground',
        'border-border',
    ] as $themeUtility) {
        expect($source)->not->toContain($themeUtility);
    }
})->with(['SelectStore', 'SelectBranch']);
