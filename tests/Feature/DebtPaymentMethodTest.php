<?php

/*
|--------------------------------------------------------------------------
| Metode pembayaran pada pelunasan hutang
|--------------------------------------------------------------------------
|
| Pelunasan hutang sebelumnya hanya mencatat nominal, sehingga kasir tidak
| bisa membedakan pelunasan tunai dari transfer saat rekonsiliasi kas.
| Sekarang metode pembayaran wajib dipilih dan tersimpan di log hutang.
|
*/

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\Feature;
use App\Models\PaymentMethod;
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
 * @return array{0: Store, 1: Branch, 2: User, 3: Customer, 4: PaymentMethod, 5: PaymentMethod}
 */
function setupDebtPaymentContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['customer', 'debt', 'payment_method'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $user = User::factory()->create(['plan_id' => $plan->id]);
    $store = Store::create([
        'user_id' => $user->id,
        'code' => 'DBT'.uniqid(),
        'name' => 'Toko Kasbon',
        'store_type_id' => $storeType->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR1', 'name' => 'Pusat', 'is_active' => true,
    ]);

    $customer = Customer::create([
        'store_id' => $store->id, 'code' => 'CUST-'.uniqid(), 'name' => 'Budi',
        'debt_balance' => 50000, 'credit_limit' => 200000,
    ]);

    $cash = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'cash', 'name' => 'Tunai',
        'type' => 'cash', 'is_active' => true,
    ]);

    $debtMethod = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'debt', 'name' => 'Hutang',
        'type' => 'debt', 'is_active' => true,
    ]);

    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'debt.view'], ['guard_id' => 1]));
    $user->assignRole($role);

    return [$store, $branch, $user, $customer, $cash, $debtMethod];
}

function actingAsDebtUser($test, User $user, Store $store, Branch $branch): void
{
    $test->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'branch_id' => $branch->id,
        'current_branch_id' => $branch->id,
    ]);
}

test('halaman kasbon mengirim metode pembayaran non-hutang', function () {
    [$store, $branch, $user, $customer, $cash, $debtMethod] = setupDebtPaymentContext();

    actingAsDebtUser($this, $user, $store, $branch);

    $response = $this->get(route('admin.debts.index'));
    $response->assertSuccessful();

    $response->assertInertia(function ($page) use ($cash, $debtMethod) {
        $methods = collect($page->toArray()['props']['paymentMethods']);

        expect($methods->pluck('id'))->toContain($cash->id);
        // Melunasi hutang dengan metode hutang hanya memindahkan saldo,
        // jadi tipe debt tidak boleh ditawarkan.
        expect($methods->pluck('id'))->not->toContain($debtMethod->id);
    });
});

test('pelunasan menyimpan metode pembayaran di log hutang', function () {
    [$store, $branch, $user, $customer, $cash] = setupDebtPaymentContext();

    actingAsDebtUser($this, $user, $store, $branch);

    $this->post(route('admin.debts.pay', $customer->id), [
        'amount' => 20000,
        'payment_method_id' => $cash->id,
    ])->assertRedirect();

    $log = CustomerDebtLog::where('customer_id', $customer->id)
        ->where('type', 'payment')
        ->firstOrFail();

    expect($log->payment_method_id)->toBe($cash->id);
    expect((float) $log->amount)->toBe(20000.0);
    expect((float) $log->balance_after)->toBe(30000.0);
    expect((float) $customer->fresh()->debt_balance)->toBe(30000.0);
});

test('pelunasan tanpa metode pembayaran ditolak', function () {
    [$store, $branch, $user, $customer] = setupDebtPaymentContext();

    actingAsDebtUser($this, $user, $store, $branch);

    $this->post(route('admin.debts.pay', $customer->id), [
        'amount' => 20000,
    ])->assertSessionHasErrors('payment_method_id');

    // Saldo tidak boleh berubah saat permintaan ditolak.
    expect((float) $customer->fresh()->debt_balance)->toBe(50000.0);
    expect(CustomerDebtLog::where('customer_id', $customer->id)->count())->toBe(0);
});

test('metode bertipe hutang ditolak untuk pelunasan', function () {
    [$store, $branch, $user, $customer, $cash, $debtMethod] = setupDebtPaymentContext();

    actingAsDebtUser($this, $user, $store, $branch);

    $this->post(route('admin.debts.pay', $customer->id), [
        'amount' => 20000,
        'payment_method_id' => $debtMethod->id,
    ])->assertSessionHasErrors('payment_method_id');

    expect((float) $customer->fresh()->debt_balance)->toBe(50000.0);
});

test('metode pembayaran milik toko lain ditolak', function () {
    [$store, $branch, $user, $customer] = setupDebtPaymentContext();

    // Toko kedua dibuat langsung, bukan lewat helper: store_types.code unik
    // sehingga helper tidak bisa dipanggil dua kali dalam satu test.
    $otherStore = Store::create([
        'user_id' => null,
        'code' => 'OTHER'.uniqid(),
        'name' => 'Toko Lain',
        'store_type_id' => $store->store_type_id,
    ]);

    $foreignMethod = PaymentMethod::create([
        'store_id' => $otherStore->id, 'code' => 'tf', 'name' => 'Transfer',
        'type' => 'transfer', 'is_active' => true,
    ]);

    actingAsDebtUser($this, $user, $store, $branch);

    $this->post(route('admin.debts.pay', $customer->id), [
        'amount' => 20000,
        'payment_method_id' => $foreignMethod->id,
    ])->assertSessionHasErrors('payment_method_id');

    expect((float) $customer->fresh()->debt_balance)->toBe(50000.0);
});

test('pelunasan melebihi hutang tetap ditolak', function () {
    [$store, $branch, $user, $customer, $cash] = setupDebtPaymentContext();

    actingAsDebtUser($this, $user, $store, $branch);

    $this->post(route('admin.debts.pay', $customer->id), [
        'amount' => 80000,
        'payment_method_id' => $cash->id,
    ])->assertSessionHasErrors('amount');

    expect((float) $customer->fresh()->debt_balance)->toBe(50000.0);
});

test('pelunasan penuh menolkan saldo hutang', function () {
    [$store, $branch, $user, $customer, $cash] = setupDebtPaymentContext();

    actingAsDebtUser($this, $user, $store, $branch);

    $this->post(route('admin.debts.pay', $customer->id), [
        'amount' => 50000,
        'payment_method_id' => $cash->id,
    ])->assertRedirect();

    expect((float) $customer->fresh()->debt_balance)->toBe(0.0);
});
