<?php

/*
|--------------------------------------------------------------------------
| Gate fitur Hutang / Kasbon
|--------------------------------------------------------------------------
|
| Menjaga dua batas di sekitar halaman hutang:
|   1. Toko yang tipenya tidak mendukung fitur `debt` tidak boleh membukanya
|   2. Pelunasan hutang milik toko lain harus ditolak
|
| Poin kedua menangkap regresi nyata: DebtController membandingkan
| `$customer->store_id !== $storeId` secara strict, padahal session
| menyimpan store_id sebagai string. Perbandingan itu selalu bernilai
| benar sehingga SEMUA pelunasan ditolak, termasuk yang sah.
|
*/

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Toko + user dengan permission debt.
 *
 * @param  bool  $withDebtFeature  Pasang fitur `debt` ke tipe toko atau tidak.
 * @return array{user: User, store: Store, branch: Branch, customer: Customer}
 */
function createDebtContext(bool $withDebtFeature = true): array
{
    $storeType = StoreType::create([
        'code' => 'retail-'.uniqid(),
        'label' => 'Retail',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );

    // Fitur customer selalu ada; fitur debt hanya kalau diminta.
    $codes = $withDebtFeature ? ['customer', 'debt'] : ['customer'];
    foreach ($codes as $code) {
        $feature = Feature::firstOrCreate(
            ['code' => $code],
            ['label' => ucfirst($code), 'is_active' => true, 'sort_order' => 0],
        );
        $storeType->features()->syncWithoutDetaching([$feature->id]);
        $plan->features()->syncWithoutDetaching([$feature->id]);
    }

    // Plan harus mengizinkan debt walau tipe toko tidak mendukungnya, supaya
    // penolakan yang diuji benar-benar datang dari gate tipe toko.
    $debtFeature = Feature::firstOrCreate(
        ['code' => 'debt'],
        ['label' => 'Debt', 'is_active' => true, 'sort_order' => 0],
    );
    $plan->features()->syncWithoutDetaching([$debtFeature->id]);

    $store = Store::create([
        'user_id' => null,
        'code' => 'TESTDEBT'.uniqid(),
        'name' => 'Test Store Debt',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main',
        'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id,
        'code' => 'CUST001',
        'name' => 'Budi',
        'debt_balance' => 50000,
        'credit_limit' => 100000,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->forgetCachedPermissions();
    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);

    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_name' => 'web']);
    foreach (['debt.view', 'debt.pay', 'customer.view', 'customer.edit'] as $permName) {
        $role->givePermissionTo(Permission::findOrCreate($permName, 'web'));
    }
    $user->assignRole($role);

    return compact('user', 'store', 'branch', 'customer');
}

/** Session seperti request HTTP asli — store_id tersimpan sebagai string. */
function debtSession(array $ctx): array
{
    return [
        'current_store_id' => (string) $ctx['store']->id,
        'current_branch_id' => (string) $ctx['branch']->id,
    ];
}

test('toko dengan fitur debt bisa membuka halaman hutang', function () {
    $ctx = createDebtContext();

    $this->actingAs($ctx['user'])
        ->withSession(debtSession($ctx))
        ->get('/app/debts')
        ->assertStatus(200);
});

test('toko tanpa fitur debt ditolak membuka halaman hutang', function () {
    $ctx = createDebtContext(withDebtFeature: false);

    $this->actingAs($ctx['user'])
        ->withSession(debtSession($ctx))
        ->get('/app/debts')
        ->assertRedirect(route('admin.dashboard'));
});

test('pelunasan hutang yang sah diterima meski store_id di session berupa string', function () {
    $ctx = createDebtContext();

    $this->actingAs($ctx['user'])
        ->withSession(debtSession($ctx))
        ->post("/app/debts/{$ctx['customer']->id}/pay", ['amount' => 20000])
        ->assertSessionHasNoErrors();

    expect((float) $ctx['customer']->fresh()->debt_balance)->toBe(30000.0)
        ->and(CustomerDebtLog::where('customer_id', $ctx['customer']->id)->count())->toBe(1);
});

test('pelunasan melebihi sisa hutang ditolak sebagai error validasi', function () {
    $ctx = createDebtContext();

    $this->actingAs($ctx['user'])
        ->withSession(debtSession($ctx))
        ->postJson("/app/debts/{$ctx['customer']->id}/pay", ['amount' => 90000])
        ->assertStatus(422)
        ->assertJsonValidationErrors('amount');

    expect((float) $ctx['customer']->fresh()->debt_balance)->toBe(50000.0);
});

test('hutang pelanggan toko lain tidak bisa dilunasi', function () {
    $korban = createDebtContext();
    $penyerang = createDebtContext();

    $this->actingAs($penyerang['user'])
        ->withSession(debtSession($penyerang))
        ->post("/app/debts/{$korban['customer']->id}/pay", ['amount' => 10000])
        ->assertStatus(403);

    expect((float) $korban['customer']->fresh()->debt_balance)->toBe(50000.0);
});
