<?php

/*
|--------------------------------------------------------------------------
| Booking / Reservasi
|--------------------------------------------------------------------------
|
| Menutup temuan pada BookingController:
|   1. index() query kolom employees.is_active yang tidak ada -> halaman 500
|   2. update()/destroy() tanpa cek kepemilikan toko -> IDOR lintas tenant
|   3. keempat route hanya butuh booking.view -> user read-only bisa hapus
|   4. tidak ada deteksi bentrok jadwal
|   5. deposit_paid bisa melebihi deposit_amount
|   6. booking_no jebol setelah nomor 999 (substr -3 membaca "000")
|   7. resource meja tidak divalidasi kepemilikannya
|
*/

use App\Models\Booking;
use App\Models\Branch;
use App\Models\CafeTable;
use App\Models\Employee;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Toko FnB + user dengan permission booking tertentu.
 *
 * @return array{user: User, store: Store, branch: Branch, table: CafeTable}
 */
function createBookingContext(
    array $permissions = ['booking.view', 'booking.create', 'booking.edit', 'booking.cancel'],
    ?StoreType $storeType = null,
): array {
    $storeType ??= StoreType::firstOrCreate(
        ['code' => 'fnb'],
        ['label' => 'Food & Beverage', 'is_active' => true, 'sort_order' => 0],
    );

    foreach (['booking', 'basic_pos', 'product', 'category', 'payment_method', 'customer'] as $code) {
        $f = Feature::firstOrCreate(
            ['code' => $code],
            ['label' => $code, 'is_active' => true, 'sort_order' => 0],
        );
        $storeType->features()->syncWithoutDetaching([$f->id]);
    }

    $plan = Plan::firstOrCreate(
        ['code' => 'basic'],
        ['label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0],
    );
    $plan->features()->syncWithoutDetaching(Feature::pluck('id')->all());

    $user = User::factory()->create();

    $store = Store::create([
        'user_id' => $user->id,
        'code' => 'TESTBK'.uniqid(),
        'name' => 'Test Warung Booking',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);
    $user->stores()->attach($store->id);

    $branch = Branch::create([
        'store_id' => $store->id,
        'code' => 'BR001',
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $table = CafeTable::create([
        'store_id' => $store->id,
        'branch_id' => $branch->id,
        'table_number' => 'A-01',
        'capacity' => 4,
        'status' => 'available',
        'is_active' => true,
    ]);

    app(PermissionRegistrar::class)->forgetCachedPermissions();
    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);

    // Semua permission harus ADA di database seperti di produksi (dibuat oleh
    // PermissionSeeder), lalu role hanya diberi sebagiannya. Kalau permission
    // yang dicek middleware sama sekali tidak ada barisnya, Spatie berperilaku
    // berbeda dan hasil test jadi tidak konsisten.
    $allPermissions = [
        'booking.view', 'booking.create', 'booking.edit', 'booking.cancel',
        'sale.create',
    ];

    $role = Role::create(['name' => 'role-'.uniqid(), 'guard_id' => 1]);
    foreach ($allPermissions as $permName) {
        // WHERE hanya boleh memakai kolom yang benar-benar ada — tabel
        // permissions punya guard_name, bukan guard_id.
        $perm = Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]);
        if (in_array($permName, $permissions, true)) {
            $role->givePermissionTo($perm);
        }
    }
    $user->assignRole($role);

    return compact('user', 'store', 'branch', 'table');
}

function bookingSession(array $ctx): array
{
    return [
        'current_store_id' => $ctx['store']->id,
        'current_branch_id' => $ctx['branch']->id,
        'branch_id' => $ctx['branch']->id,
    ];
}

function bookingPayload(array $ctx, array $overrides = []): array
{
    return array_merge([
        'customer_name' => 'Budi',
        'booking_start_at' => '2026-08-01 19:00:00',
        'status' => 'pending',
        'resource_type' => 'table',
        'resource_id' => $ctx['table']->id,
    ], $overrides);
}

test('halaman daftar booking terbuka', function () {
    $ctx = createBookingContext();

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->get('/app/bookings')
        ->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Bookings/Index'));
});

test('halaman tambah booking memuat karyawan aktif dan meja', function () {
    $ctx = createBookingContext();

    // Kolom penanda karyawan aktif adalah `status`, bukan `is_active`.
    // Query lama membuat halaman ini selalu 500.
    Employee::create([
        'store_id' => $ctx['store']->id,
        'employee_code' => 'EMP-001',
        'name' => 'Siti',
        'status' => 'active',
    ]);
    Employee::create([
        'store_id' => $ctx['store']->id,
        'employee_code' => 'EMP-002',
        'name' => 'Mantan Karyawan',
        'status' => 'resigned',
    ]);

    $response = $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->get('/app/bookings/create');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Bookings/Create')
        ->count('employees', 1)
        ->where('employees.0.name', 'Siti')
        ->count('tables', 1)
        ->where('tables.0.table_number', 'A-01')
    );
});

test('halaman edit dan detail booking terbuka', function () {
    $ctx = createBookingContext();

    $booking = Booking::create([
        'store_id' => $ctx['store']->id,
        'branch_id' => $ctx['branch']->id,
        'booking_no' => 'BK-DETAIL-001',
        'resource_type' => 'table',
        'resource_id' => $ctx['table']->id,
        'customer_name' => 'Budi',
        'booking_start_at' => '2026-08-01 19:00:00',
        'status' => 'confirmed',
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->get("/app/bookings/{$booking->id}/edit")
        ->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Bookings/Edit')
            ->where('booking.booking_no', 'BK-DETAIL-001')
            ->count('tables', 1)
        );

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->get("/app/bookings/{$booking->id}")
        ->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Bookings/Show')
            ->where('booking.booking_no', 'BK-DETAIL-001')
            // Nama meja diresolusi terpisah karena resource_id polimorfik.
            ->where('table', 'A-01')
        );
});

test('halaman edit dan detail booking toko lain ditolak', function () {
    $korban = createBookingContext();
    $penyerang = createBookingContext();

    $booking = Booking::create([
        'store_id' => $korban['store']->id,
        'branch_id' => $korban['branch']->id,
        'booking_no' => 'BK-KORBAN-002',
        'customer_name' => 'Budi',
        'booking_start_at' => '2026-08-01 19:00:00',
        'status' => 'confirmed',
    ]);

    $this->actingAs($penyerang['user'])
        ->withSession(bookingSession($penyerang))
        ->get("/app/bookings/{$booking->id}/edit")
        ->assertStatus(403);

    $this->actingAs($penyerang['user'])
        ->withSession(bookingSession($penyerang))
        ->get("/app/bookings/{$booking->id}")
        ->assertStatus(403);
});

test('booking dapat dibuat lengkap dengan meja dan nomor urut', function () {
    $ctx = createBookingContext();

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, ['guest_count' => 4]))
        ->assertSessionHasNoErrors();

    $booking = Booking::first();

    expect($booking->resource_type)->toBe('table')
        ->and($booking->resource_id)->toBe($ctx['table']->id)
        ->and($booking->guest_count)->toBe(4)
        ->and($booking->booking_no)->toStartWith('BK-')
        ->and($booking->store_id)->toBe($ctx['store']->id);
});

test('booking bentrok di meja yang sama ditolak', function () {
    $ctx = createBookingContext();

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, [
            'booking_start_at' => '2026-08-01 19:00:00',
            'booking_end_at' => '2026-08-01 21:00:00',
        ]))
        ->assertSessionHasNoErrors();

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, [
            'customer_name' => 'Andi',
            'booking_start_at' => '2026-08-01 20:00:00',
            'booking_end_at' => '2026-08-01 22:00:00',
        ]))
        ->assertSessionHasErrors('booking_start_at');

    expect(Booking::count())->toBe(1);
});

test('booking tanpa jam selesai dianggap berdurasi dua jam saat cek bentrok', function () {
    $ctx = createBookingContext();

    // 19:00 tanpa jam selesai -> dianggap 19:00-21:00
    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, ['booking_start_at' => '2026-08-01 19:00:00']))
        ->assertSessionHasNoErrors();

    // 20:00 masih di dalam rentang itu -> bentrok
    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, [
            'customer_name' => 'Andi',
            'booking_start_at' => '2026-08-01 20:00:00',
        ]))
        ->assertSessionHasErrors('booking_start_at');

    // 21:30 sudah di luar rentang -> boleh
    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, [
            'customer_name' => 'Cici',
            'booking_start_at' => '2026-08-01 21:30:00',
        ]))
        ->assertSessionHasNoErrors();

    expect(Booking::count())->toBe(2);
});

test('booking yang sudah dibatalkan tidak lagi menahan mejanya', function () {
    $ctx = createBookingContext();

    Booking::create([
        'store_id' => $ctx['store']->id,
        'branch_id' => $ctx['branch']->id,
        'booking_no' => 'BK-LAMA-001',
        'resource_type' => 'table',
        'resource_id' => $ctx['table']->id,
        'customer_name' => 'Budi',
        'booking_start_at' => '2026-08-01 19:00:00',
        'booking_end_at' => '2026-08-01 21:00:00',
        'status' => 'cancelled',
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, ['booking_start_at' => '2026-08-01 19:30:00']))
        ->assertSessionHasNoErrors();
});

test('booking di meja berbeda pada jam yang sama tidak dianggap bentrok', function () {
    $ctx = createBookingContext();

    $lain = CafeTable::create([
        'store_id' => $ctx['store']->id,
        'branch_id' => $ctx['branch']->id,
        'table_number' => 'A-02',
        'capacity' => 2,
        'status' => 'available',
        'is_active' => true,
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx))
        ->assertSessionHasNoErrors();

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, [
            'customer_name' => 'Andi',
            'resource_id' => $lain->id,
        ]))
        ->assertSessionHasNoErrors();

    expect(Booking::count())->toBe(2);
});

test('deposit dibayar tidak boleh melebihi deposit ditagih', function () {
    $ctx = createBookingContext();

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, [
            'deposit_amount' => 50000,
            'deposit_paid' => 75000,
        ]))
        ->assertSessionHasErrors('deposit_paid');

    expect(Booking::count())->toBe(0);
});

test('meja milik toko lain ditolak', function () {
    $ctx = createBookingContext();
    $lain = createBookingContext();

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, [
            'resource_id' => $lain['table']->id,
        ]))
        ->assertSessionHasErrors('resource_id');

    expect(Booking::count())->toBe(0);
});

test('booking toko lain tidak bisa diubah maupun dihapus', function () {
    $korban = createBookingContext();
    $penyerang = createBookingContext();

    $booking = Booking::create([
        'store_id' => $korban['store']->id,
        'branch_id' => $korban['branch']->id,
        'booking_no' => 'BK-KORBAN-001',
        'customer_name' => 'Budi',
        'booking_start_at' => '2026-08-01 19:00:00',
        'status' => 'confirmed',
    ]);

    $this->actingAs($penyerang['user'])
        ->withSession(bookingSession($penyerang))
        ->patch("/app/bookings/{$booking->id}", [
            'customer_name' => 'Diretas',
            'booking_start_at' => '2026-08-01 19:00:00',
            'status' => 'cancelled',
        ])
        ->assertStatus(403);

    $this->actingAs($penyerang['user'])
        ->withSession(bookingSession($penyerang))
        ->delete("/app/bookings/{$booking->id}")
        ->assertStatus(403);

    expect($booking->fresh())->not->toBeNull()
        ->and($booking->fresh()->customer_name)->toBe('Budi');
});

test('user yang hanya boleh melihat tidak bisa membuat atau menghapus booking', function () {
    $ctx = createBookingContext(['booking.view']);

    $booking = Booking::create([
        'store_id' => $ctx['store']->id,
        'branch_id' => $ctx['branch']->id,
        'booking_no' => 'BK-ADA-001',
        'customer_name' => 'Budi',
        'booking_start_at' => '2026-08-01 19:00:00',
        'status' => 'confirmed',
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->get('/app/bookings')
        ->assertStatus(200);

    // Lewat JSON supaya penolakan permission terbaca sebagai 403; pada
    // request web biasa middleware-nya membalas redirect.
    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->postJson('/app/bookings', bookingPayload($ctx))
        ->assertStatus(403);

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->deleteJson("/app/bookings/{$booking->id}")
        ->assertStatus(403);

    expect(Booking::count())->toBe(1);
});

test('nomor booking tetap berurutan setelah melewati 999', function () {
    $ctx = createBookingContext();

    $prefix = 'BK-'.now()->format('Ymd').'-';
    Booking::create([
        'store_id' => $ctx['store']->id,
        'branch_id' => $ctx['branch']->id,
        'booking_no' => $prefix.'999',
        'customer_name' => 'Ke-999',
        'booking_start_at' => '2026-08-01 10:00:00',
        'status' => 'confirmed',
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx))
        ->assertSessionHasNoErrors();

    expect(Booking::latest('id')->first()->booking_no)->toBe($prefix.'1000');

    // Yang ke-1001 harus lanjut, bukan mengulang dari 001 karena membaca
    // tiga karakter terakhir dari "1000".
    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->post('/app/bookings', bookingPayload($ctx, [
            'customer_name' => 'Andi',
            'booking_start_at' => '2026-08-02 19:00:00',
        ]))
        ->assertSessionHasNoErrors();

    expect(Booking::latest('id')->first()->booking_no)->toBe($prefix.'1001');
});

test('floor map kasir menampilkan reservasi hari ini tanpa mengubah status meja', function () {
    // Halaman kasir butuh permission-nya sendiri.
    $ctx = createBookingContext(['booking.view', 'sale.create']);

    Booking::create([
        'store_id' => $ctx['store']->id,
        'branch_id' => $ctx['branch']->id,
        'booking_no' => 'BK-HARIINI-001',
        'resource_type' => 'table',
        'resource_id' => $ctx['table']->id,
        'customer_name' => 'Budi',
        'guest_count' => 4,
        'booking_start_at' => now()->setTime(19, 0),
        'booking_end_at' => now()->setTime(21, 0),
        'status' => 'confirmed',
    ]);

    $response = $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->get('/app/kasir');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->where('tables.0.upcoming_booking.customer_name', 'Budi')
        ->where('tables.0.upcoming_booking.guest_count', 4)
        ->where('tables.0.upcoming_booking.time', '19:00')
        // Kolom status meja tidak boleh ikut berubah — penulisnya tetap
        // hanya syncTableStatus yang menurunkannya dari order.
        ->where('tables.0.status', 'available')
    );

    expect($ctx['table']->fresh()->status)->toBe('available');
});

test('reservasi untuk besok tidak muncul di floor map hari ini', function () {
    $ctx = createBookingContext(['booking.view', 'sale.create']);

    Booking::create([
        'store_id' => $ctx['store']->id,
        'branch_id' => $ctx['branch']->id,
        'booking_no' => 'BK-BESOK-001',
        'resource_type' => 'table',
        'resource_id' => $ctx['table']->id,
        'customer_name' => 'Budi',
        'booking_start_at' => now()->addDay()->setTime(19, 0),
        'status' => 'confirmed',
    ]);

    $this->actingAs($ctx['user'])
        ->withSession(bookingSession($ctx))
        ->get('/app/kasir')
        ->assertInertia(fn (Assert $page) => $page
            ->where('tables.0.upcoming_booking', null)
        );
});
