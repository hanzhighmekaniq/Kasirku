<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Karyawan (employee) per store:
 *   - Owner TIDAK ada di sini → owner hanya di tabel users + user_store + Spatie role
 *   - Setiap store punya 2 branch, masing-masing branch punya 2 karyawan
 *   - Setiap karyawan punya akun user sendiri (user_id not null)
 *   - Akun karyawan dapat role sesuai jabatan (kasir / gudang / barber / dll)
 *
 * Total: 8 store × 2 branch × 2 karyawan = 32 karyawan
 */
class EmployeeSeeder extends Seeder
{
    /**
     * Data karyawan per store.
     * Format: store_code => [ [branch_code, emp_code, nama, email, jabatan, role, posisi_komisi] ]
     */
    private array $data = [
        // ── STORE001: Minimarket Sejahtera (Retail) ──────────────────────────
        'STORE001' => [
            ['BR1A', 'EMP-S1-01', 'Rizki Firmansyah', 'kasir.s1a@gmail.com',  'Kasir',        'kasir',  'none', 0],
            ['BR1A', 'EMP-S1-02', 'Rina Wati',        'gudang.s1a@gmail.com', 'Staff Gudang', 'gudang', 'none', 0],
            ['BR1B', 'EMP-S1-03', 'Andi Prasetyo',    'kasir.s1b@gmail.com',  'Kasir',        'kasir',  'none', 0],
            ['BR1B', 'EMP-S1-04', 'Dewi Lestari',     'gudang.s1b@gmail.com', 'Staff Gudang', 'gudang', 'none', 0],
        ],
        // ── STORE002: Warung Kopi Senja (FnB) ────────────────────────────────
        'STORE002' => [
            ['BR2A', 'EMP-S2-01', 'Andi Wijaya',   'kasir.s2a@gmail.com',   'Kasir',   'kasir',  'none', 0],
            ['BR2A', 'EMP-S2-02', 'Sari Indah',    'barista.s2a@gmail.com', 'Barista', 'kasir',  'none', 0],
            ['BR2B', 'EMP-S2-03', 'Bimo Nugroho',  'kasir.s2b@gmail.com',   'Kasir',   'kasir',  'none', 0],
            ['BR2B', 'EMP-S2-04', 'Citra Ayu',     'barista.s2b@gmail.com', 'Barista', 'kasir',  'none', 0],
        ],
        // ── STORE003: Barbershop Rapi (Service) ──────────────────────────────
        'STORE003' => [
            ['BR3A', 'EMP-S3-01', 'Fandi Ahmad',   'barber.s3a@gmail.com',   'Barber Senior', 'kasir', 'percent', 15],
            ['BR3A', 'EMP-S3-02', 'Dimas Saputra', 'barber2.s3a@gmail.com',  'Barber',        'kasir', 'percent', 10],
            ['BR3B', 'EMP-S3-03', 'Heru Susanto',  'barber.s3b@gmail.com',   'Barber Senior', 'kasir', 'percent', 15],
            ['BR3B', 'EMP-S3-04', 'Irfan Maulana', 'barber2.s3b@gmail.com',  'Barber',        'kasir', 'percent', 10],
        ],
        // ── STORE004: Sewa Alat Jaya (Rental) ────────────────────────────────
        'STORE004' => [
            ['BR4A', 'EMP-S4-01', 'Yuni Astuti',  'kasir.s4a@gmail.com',    'Kasir / Operator', 'kasir',  'none', 0],
            ['BR4A', 'EMP-S4-02', 'Fajar Purnomo','gudang.s4a@gmail.com',   'Staff Gudang',     'gudang', 'none', 0],
            ['BR4B', 'EMP-S4-03', 'Nita Sari',    'kasir.s4b@gmail.com',    'Kasir / Operator', 'kasir',  'none', 0],
            ['BR4B', 'EMP-S4-04', 'Galih Prakoso', 'gudang.s4b@gmail.com',  'Staff Gudang',     'gudang', 'none', 0],
        ],
        // ── STORE005: Bioskop Nusantara (Ticket) ─────────────────────────────
        'STORE005' => [
            ['BR5A', 'EMP-S5-01', 'Anton Wijaya',  'kasir.s5a@gmail.com',   'Kasir Tiket', 'kasir', 'none', 0],
            ['BR5A', 'EMP-S5-02', 'Lita Permata',  'cs.s5a@gmail.com',      'CS / Loket',  'kasir', 'none', 0],
            ['BR5B', 'EMP-S5-03', 'Rendi Saputra', 'kasir.s5b@gmail.com',   'Kasir Tiket', 'kasir', 'none', 0],
            ['BR5B', 'EMP-S5-04', 'Maya Dewi',     'cs.s5b@gmail.com',      'CS / Loket',  'kasir', 'none', 0],
        ],
        // ── STORE006: Villa Sunrise (Hospitality) ────────────────────────────
        'STORE006' => [
            ['BR6A', 'EMP-S6-01', 'Sari Indah',   'resepsi.s6a@gmail.com',  'Resepsionis',  'kasir',  'none', 0],
            ['BR6A', 'EMP-S6-02', 'Wahyu Tri',    'house.s6a@gmail.com',    'Housekeeping', 'gudang', 'none', 0],
            ['BR6B', 'EMP-S6-03', 'Putri Ayu',    'resepsi.s6b@gmail.com',  'Resepsionis',  'kasir',  'none', 0],
            ['BR6B', 'EMP-S6-04', 'Doni Susilo',  'house.s6b@gmail.com',    'Housekeeping', 'gudang', 'none', 0],
        ],
        // ── STORE007: Parkir Jayabaya (Parking) ──────────────────────────────
        'STORE007' => [
            ['BR7A', 'EMP-S7-01', 'Bayu Setiawan', 'jaga.s7a@gmail.com',   'Penjaga Parkir', 'kasir', 'none', 0],
            ['BR7A', 'EMP-S7-02', 'Sigit Prabowo', 'kasir.s7a@gmail.com',  'Kasir Parkir',   'kasir', 'none', 0],
            ['BR7B', 'EMP-S7-03', 'Ari Wibowo',    'jaga.s7b@gmail.com',   'Penjaga Parkir', 'kasir', 'none', 0],
            ['BR7B', 'EMP-S7-04', 'Tina Marlina',  'kasir.s7b@gmail.com',  'Kasir Parkir',   'kasir', 'none', 0],
        ],
        // ── STORE008: GamerZone (Session) ────────────────────────────────────
        'STORE008' => [
            ['BR8A', 'EMP-S8-01', 'Rama Putra',   'kasir.s8a@gmail.com',   'Kasir / Operator', 'kasir',  'none', 0],
            ['BR8A', 'EMP-S8-02', 'Nanda Rizki',  'teknis.s8a@gmail.com',  'Teknisi',           'gudang', 'none', 0],
            ['BR8B', 'EMP-S8-03', 'Vino Ardianto','kasir.s8b@gmail.com',   'Kasir / Operator', 'kasir',  'none', 0],
            ['BR8B', 'EMP-S8-04', 'Lena Sari',    'teknis.s8b@gmail.com',  'Teknisi',           'gudang', 'none', 0],
        ],
    ];

    public function run(): void
    {
        foreach ($this->data as $storeCode => $employees) {
            $store = Store::where('code', $storeCode)->firstOrFail();

            foreach ($employees as [$branchCode, $empCode, $name, $email, $position, $role, $commType, $commVal]) {
                $branch = Branch::where('store_id', $store->id)
                    ->where('code', $branchCode)
                    ->firstOrFail();

                // Buat atau dapatkan akun user untuk karyawan ini
                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'name'         => $name,
                        'password'     => Hash::make('password'),
                        'is_developer' => false,
                    ],
                );

                // Assign user ke store via pivot
                DB::table('user_store')->updateOrInsert(
                    ['user_id' => $user->id, 'store_id' => $store->id],
                    ['created_at' => now(), 'updated_at' => now()],
                );

                // Assign role Spatie di store ini
                $this->assignRole($user, $role, $store->id);

                // Buat employee record
                Employee::updateOrCreate(
                    ['store_id' => $store->id, 'employee_code' => $empCode],
                    [
                        'branch_id'        => $branch->id,
                        'user_id'          => $user->id,
                        'name'             => $name,
                        'email'            => $email,
                        'position'         => $position,
                        'commission_type'  => $commType,
                        'commission_value' => $commVal,
                        'status'           => 'active',
                    ],
                );
            }
        }
    }

    private function assignRole(User $user, string $roleName, int $storeId): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($storeId);

        $role = Role::where('name', $roleName)
            ->where('store_id', $storeId)
            ->first();

        if ($role && !$user->hasRole($role)) {
            $user->assignRole($role);
        }

        $registrar->setPermissionsTeamId(null);
    }
}
