<?php

/*
|--------------------------------------------------------------------------
| Batas waktu ganti metode pembayaran
|--------------------------------------------------------------------------
|
| Sebelumnya metode pembayaran transaksi selesai bisa diganti kapan saja,
| tanpa batas waktu. Sekarang batasnya diatur per toko di Pengaturan Toko
| lewat payment_edit_limit_value + payment_edit_limit_unit. Kalau keduanya
| kosong, perilaku lama dipertahankan: boleh diganti kapan saja.
|
*/

use App\Models\Branch;
use App\Models\Feature;
use App\Models\PaymentMethod;
use App\Models\Plan;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/**
 * @return array{0: Store, 1: Branch, 2: User, 3: PaymentMethod, 4: PaymentMethod}
 */
function setupPaymentLimitStore(array $storeAttributes = []): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['basic_pos', 'product', 'category', 'payment_method', 'customer', 'settings'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create(array_merge([
        'user_id' => null,
        'code' => 'PEL'.uniqid(),
        'name' => 'Toko Batas Bayar',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ], $storeAttributes));

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang 1', 'is_active' => true,
    ]);

    $cash = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'cash', 'name' => 'Tunai',
        'type' => 'cash', 'is_active' => true,
    ]);

    $transfer = PaymentMethod::create([
        'store_id' => $store->id, 'code' => 'transfer', 'name' => 'Transfer Bank',
        'type' => 'transfer', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'sale.create'], ['guard_id' => 1]));
    $user->assignRole($role);

    return [$store, $branch, $user, $cash, $transfer];
}

/** Buat transaksi selesai dengan waktu pembuatan tertentu. */
function makeCompletedSale(Store $store, Branch $branch, User $user, PaymentMethod $method, string $createdAt): Sale
{
    $sale = Sale::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'user_id' => $user->id,
        'sale_no' => 'INV-'.uniqid(),
        'sale_date' => $createdAt,
        'order_type' => 'takeaway',
        'subtotal' => 50000,
        'grand_total' => 50000,
        'paid_amount' => 50000,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    // created_at diisi manual karena inilah field yang divalidasi controller.
    $sale->forceFill(['created_at' => $createdAt])->save();

    SalePayment::create([
        'sale_id' => $sale->id,
        'payment_method_id' => $method->id,
        'amount' => 50000,
        'paid_at' => $createdAt,
    ]);

    return $sale->refresh();
}

function actingAsPaymentLimitUser($test, User $user, Store $store, Branch $branch): void
{
    $test->actingAs($user);
    session([
        'current_store_id' => $store->id,
        'branch_id' => $branch->id,
        'current_branch_id' => $branch->id,
    ]);
}

test('toko tanpa batas waktu tetap boleh mengganti pembayaran transaksi lama', function () {
    [$store, $branch, $user, $cash, $transfer] = setupPaymentLimitStore();

    $sale = makeCompletedSale($store, $branch, $user, $cash, now()->subMonths(6)->toDateTimeString());

    actingAsPaymentLimitUser($this, $user, $store, $branch);

    $response = $this->putJson(route('admin.kasir.update-payment', $sale->id), [
        'payment_method_id' => $transfer->id,
    ]);

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);

    expect($sale->payments()->first()->payment_method_id)->toBe($transfer->id);
});

test('pembayaran masih bisa diganti selama masih dalam batas waktu', function () {
    [$store, $branch, $user, $cash, $transfer] = setupPaymentLimitStore([
        'payment_edit_limit_value' => 2,
        'payment_edit_limit_unit' => 'hours',
    ]);

    $sale = makeCompletedSale($store, $branch, $user, $cash, now()->subMinutes(30)->toDateTimeString());

    actingAsPaymentLimitUser($this, $user, $store, $branch);

    $response = $this->putJson(route('admin.kasir.update-payment', $sale->id), [
        'payment_method_id' => $transfer->id,
    ]);

    $response->assertSuccessful();
    expect($sale->payments()->first()->payment_method_id)->toBe($transfer->id);
});

test('pembayaran ditolak setelah batas waktu terlewat', function () {
    [$store, $branch, $user, $cash, $transfer] = setupPaymentLimitStore([
        'payment_edit_limit_value' => 2,
        'payment_edit_limit_unit' => 'hours',
    ]);

    $sale = makeCompletedSale($store, $branch, $user, $cash, now()->subHours(3)->toDateTimeString());

    actingAsPaymentLimitUser($this, $user, $store, $branch);

    $response = $this->putJson(route('admin.kasir.update-payment', $sale->id), [
        'payment_method_id' => $transfer->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('success', false);
    expect($response->json('message'))->toContain('2 jam');

    // Metode pembayaran tidak boleh ikut berubah saat permintaan ditolak.
    expect($sale->payments()->first()->payment_method_id)->toBe($cash->id);
});

test('batas waktu dalam menit dihitung dengan benar', function () {
    [$store, $branch, $user, $cash, $transfer] = setupPaymentLimitStore([
        'payment_edit_limit_value' => 15,
        'payment_edit_limit_unit' => 'minutes',
    ]);

    $sale = makeCompletedSale($store, $branch, $user, $cash, now()->subMinutes(20)->toDateTimeString());

    actingAsPaymentLimitUser($this, $user, $store, $branch);

    $this->putJson(route('admin.kasir.update-payment', $sale->id), [
        'payment_method_id' => $transfer->id,
    ])->assertStatus(422);
});

test('batas waktu dalam hari dihitung dengan benar', function () {
    [$store, $branch, $user, $cash, $transfer] = setupPaymentLimitStore([
        'payment_edit_limit_value' => 3,
        'payment_edit_limit_unit' => 'days',
    ]);

    $sale = makeCompletedSale($store, $branch, $user, $cash, now()->subDays(2)->toDateTimeString());

    actingAsPaymentLimitUser($this, $user, $store, $branch);

    $this->putJson(route('admin.kasir.update-payment', $sale->id), [
        'payment_method_id' => $transfer->id,
    ])->assertSuccessful();
});

test('konversi batas waktu ke menit sesuai unitnya', function () {
    expect((new Store(['payment_edit_limit_value' => 45, 'payment_edit_limit_unit' => 'minutes']))->paymentEditLimitMinutes())->toBe(45);
    expect((new Store(['payment_edit_limit_value' => 2, 'payment_edit_limit_unit' => 'hours']))->paymentEditLimitMinutes())->toBe(120);
    expect((new Store(['payment_edit_limit_value' => 3, 'payment_edit_limit_unit' => 'days']))->paymentEditLimitMinutes())->toBe(4320);
    expect((new Store)->paymentEditLimitMinutes())->toBeNull();
});

test('label batas waktu memakai bahasa yang mudah dibaca', function () {
    expect((new Store(['payment_edit_limit_value' => 30, 'payment_edit_limit_unit' => 'minutes']))->paymentEditLimitLabel())->toBe('30 menit');
    expect((new Store(['payment_edit_limit_value' => 2, 'payment_edit_limit_unit' => 'hours']))->paymentEditLimitLabel())->toBe('2 jam');
    expect((new Store(['payment_edit_limit_value' => 1, 'payment_edit_limit_unit' => 'days']))->paymentEditLimitLabel())->toBe('1 hari');
    expect((new Store)->paymentEditLimitLabel())->toBeNull();
});

test('pengaturan toko menyimpan batas waktu ganti pembayaran', function () {
    [$store, $branch, $user] = setupPaymentLimitStore();

    $role = Role::where('name', 'like', 'owner-%')->first();
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'setting.edit'], ['guard_id' => 1]));

    actingAsPaymentLimitUser($this, $user, $store, $branch);

    $response = $this->post(route('admin.settings.update'), [
        'name' => $store->name,
        'code' => $store->code,
        'store_type' => 'retail',
        'payment_edit_limit_value' => 45,
        'payment_edit_limit_unit' => 'minutes',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $store->refresh();
    expect($store->payment_edit_limit_value)->toBe(45);
    expect($store->payment_edit_limit_unit)->toBe('minutes');
    expect($store->paymentEditLimitMinutes())->toBe(45);
});

test('mengosongkan nilai batas waktu ikut mengosongkan unitnya', function () {
    [$store, $branch, $user] = setupPaymentLimitStore([
        'payment_edit_limit_value' => 30,
        'payment_edit_limit_unit' => 'hours',
    ]);

    $role = Role::where('name', 'like', 'owner-%')->first();
    $role->givePermissionTo(Permission::firstOrCreate(['name' => 'setting.edit'], ['guard_id' => 1]));

    actingAsPaymentLimitUser($this, $user, $store, $branch);

    $this->post(route('admin.settings.update'), [
        'name' => $store->name,
        'code' => $store->code,
        'store_type' => 'retail',
        'payment_edit_limit_value' => '',
        'payment_edit_limit_unit' => 'hours',
    ])->assertRedirect();

    $store->refresh();
    expect($store->payment_edit_limit_value)->toBeNull();
    expect($store->payment_edit_limit_unit)->toBeNull();
    expect($store->paymentEditLimitMinutes())->toBeNull();
});
