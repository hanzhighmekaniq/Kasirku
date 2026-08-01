<?php

use Illuminate\Support\Facades\Route as RouteFacade;

/**
 * Penjaga sinkronisasi antara daftar route dan pola `current` di sidebar.
 *
 * Highlight sidebar ditentukan oleh pola Ziggy pada `current` di
 * resources/js/Config/navConfig.js. Dua arah yang gampang melenceng:
 *
 *  1. Pola ditulis salah / route-nya berubah nama → item tidak pernah menyala
 *     (dulu terjadi pada "admin.themes", padahal route-nya admin.themes.index).
 *  2. Route/halaman baru ditambahkan tapi lupa didaftarkan ke `current` → di
 *     halaman itu sidebar mati semua (dulu terjadi pada admin.expense-categories.*).
 *
 * Test ini menutup keduanya tanpa perlu menjalankan React.
 */

/** Route admin GET yang memang BUKAN tujuan sidebar. */
const NON_SIDEBAR_ROUTES = [
    'admin.master-data',   // endpoint JSON untuk cache offline, bukan halaman
    'admin.profile.edit',  // diakses dari menu user, bukan sidebar
    'admin.branch.select',  // switcher cabang → redirect
    'admin.store.select',  // switcher toko → redirect
    'admin.theme.picker',  // redirect lama ke admin.themes.index
    'admin.plan.index',    // halaman billing/upgrade plan — diakses dari banner/notifikasi, bukan sidebar
    'admin.plan.confirm',  // halaman konfirmasi order upgrade — flow billing, bukan sidebar
    'admin.stores.create', // form tambah toko baru — diakses dari banner/plan, bukan sidebar
];

/**
 * Ambil semua literal pola `current` dari navConfig.js.
 *
 * @return list<string>
 */
function navCurrentPatterns(): array
{
    $source = file_get_contents(resource_path('js/Config/navConfig.js'));

    preg_match_all('/current:\s*(\[[^\]]*\]|"[^"]*"|null)/', $source, $matches);

    $patterns = [];
    foreach ($matches[1] as $raw) {
        preg_match_all('/"([^"]*)"/', $raw, $literals);
        foreach ($literals[1] as $literal) {
            if ($literal !== '') {
                $patterns[] = $literal;
            }
        }
    }

    return array_values(array_unique($patterns));
}

/** Nama semua route admin GET yang terdaftar. */
function adminGetRouteNames(): array
{
    return collect(RouteFacade::getRoutes())
        ->filter(fn ($route) => in_array('GET', $route->methods(), true))
        ->map(fn ($route) => $route->getName())
        ->filter(fn (?string $name) => $name !== null && str_starts_with($name, 'admin.'))
        ->unique()
        ->values()
        ->all();
}

/**
 * Terjemahkan pola Ziggy ke regex — harus identik dengan implementasi
 * `route().current()`: titik di-escape, bintang jadi `.*`, lalu di-anchor.
 */
function ziggyPatternToRegex(string $pattern): string
{
    return '/^'.str_replace('\*', '.*', preg_quote($pattern, '/')).'$/';
}

test('setiap pola current di navConfig cocok dengan minimal satu route admin', function () {
    $routeNames = adminGetRouteNames();

    $deadPatterns = collect(navCurrentPatterns())
        ->reject(function (string $pattern) use ($routeNames) {
            $regex = ziggyPatternToRegex($pattern);

            return collect($routeNames)->contains(
                fn (string $name) => preg_match($regex, $name) === 1,
            );
        })
        ->values()
        ->all();

    expect($deadPatterns)->toBe(
        [],
        'Pola `current` ini tidak cocok dengan route mana pun, jadi item sidebar-nya '
        .'tidak akan pernah aktif. Perbaiki polanya di navConfig.js.',
    );
});

test('setiap halaman admin punya minimal satu item sidebar yang aktif', function () {
    $patterns = navCurrentPatterns();

    $uncovered = collect(adminGetRouteNames())
        ->reject(fn (string $name) => in_array($name, NON_SIDEBAR_ROUTES, true))
        ->reject(function (string $name) use ($patterns) {
            return collect($patterns)->contains(
                fn (string $pattern) => preg_match(ziggyPatternToRegex($pattern), $name) === 1,
            );
        })
        ->values()
        ->all();

    expect($uncovered)->toBe(
        [],
        'Route admin ini tidak tercakup pola `current` mana pun, jadi sidebar mati '
        .'total saat halamannya dibuka. Tambahkan polanya di navConfig.js, atau '
        .'daftarkan ke NON_SIDEBAR_ROUTES kalau memang bukan tujuan sidebar.',
    );
});
