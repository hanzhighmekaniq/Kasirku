<?php

/*
|--------------------------------------------------------------------------
| Store::allPlans() — Kontrak Daftar Plan
|--------------------------------------------------------------------------
|
| Regresi untuk bug "semua plan ter-select bersamaan".
|
| Penyebabnya: Store::allPlans() punya fallback ke planConfig() yang
| memberi 'id' => null pada SETIAP plan. Di frontend perbandingan
| Number(selectedPlanId) === Number(plan.id) jadi 0 === 0 untuk semua
| kartu, sehingga ketiga plan tampak ter-select sekaligus. Plan tanpa id
| juga tidak mungkin lolos validasi `exists:plans,id`, jadi user mentok
| dan tidak bisa menyelesaikan alur yang butuh pilih plan (mis. halaman
| Plan & Billing).
|
| Kontraknya sekarang: allPlans() hanya mengembalikan plan yang punya id
| asli dari tabel `plans`, atau array kosong kalau tidak ada plan aktif.
|
*/

use App\Models\Plan;
use App\Models\Store;
use Database\Seeders\DatabaseSeeder\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function allPlansPrerequisites(): Plan
{
    test()->seed(PermissionSeeder::class);

    return Plan::create([
        'code' => 'free',
        'label' => 'Free',
        'price' => 0,
        'trial_days' => 0,
        'is_active' => true,
        'sort_order' => 0,
    ]);
}

test('allPlans returns an empty array when no active plan exists', function () {
    expect(Plan::count())->toBe(0);

    expect(Store::allPlans())->toBe([]);
});

test('allPlans never returns a plan with a null id', function () {
    allPlansPrerequisites();

    Plan::create([
        'code' => 'pro',
        'label' => 'Pro',
        'price' => 99000,
        'trial_days' => 14,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $plans = Store::allPlans();

    expect($plans)->toHaveCount(2);

    foreach ($plans as $plan) {
        expect($plan['id'])->not->toBeNull();
        expect($plan['id'])->toBeInt();
    }

    // id harus unik supaya tidak ada dua kartu yang cocok dengan satu pilihan
    $ids = array_column($plans, 'id');
    expect($ids)->toBe(array_unique($ids));
});

test('allPlans excludes inactive plans', function () {
    allPlansPrerequisites();

    Plan::create([
        'code' => 'legacy',
        'label' => 'Legacy',
        'price' => 10000,
        'trial_days' => 0,
        'is_active' => false,
        'sort_order' => 9,
    ]);

    $codes = array_column(Store::allPlans(), 'key');

    expect($codes)->toBe(['free']);
});
