<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * User yang di-seed:
 *   - 1 developer (is_developer = true, tidak punya role di toko manapun)
 *   - 8 owner (1 per toko, punya role "owner", masuk pivot user_store)
 *     → Owner BUKAN karyawan, tidak ada di tabel employees
 *
 * Karyawan (employee) di-seed terpisah di EmployeeSeeder.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Developer ────────────────────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'dev@gmail.com'],
            [
                'name'         => 'Dev Admin',
                'password'     => Hash::make('password'),
                'is_developer' => true,
            ],
        );

        // ── Owner per toko ───────────────────────────────────────────────────
        $owners = [
            ['email' => 'owner1@gmail.com', 'name' => 'Budi Santoso',    'store' => 'STORE001'], // Retail
            ['email' => 'owner2@gmail.com', 'name' => 'Siti Rahmawati',  'store' => 'STORE002'], // FnB
            ['email' => 'owner3@gmail.com', 'name' => 'Eko Prasetyo',    'store' => 'STORE003'], // Service
            ['email' => 'owner4@gmail.com', 'name' => 'Linda Wulandari', 'store' => 'STORE004'], // Rental
            ['email' => 'owner5@gmail.com', 'name' => 'Rudi Hartono',    'store' => 'STORE005'], // Ticket
            ['email' => 'owner6@gmail.com', 'name' => 'Mega Putri',      'store' => 'STORE006'], // Hospitality
            ['email' => 'owner7@gmail.com', 'name' => 'Hendra Gunawan',  'store' => 'STORE007'], // Parking
            ['email' => 'owner8@gmail.com', 'name' => 'Dian Permata',    'store' => 'STORE008'], // Session
        ];

        foreach ($owners as $ownerData) {
            $store = Store::where('code', $ownerData['store'])->firstOrFail();

            $user = User::updateOrCreate(
                ['email' => $ownerData['email']],
                [
                    'name'         => $ownerData['name'],
                    'password'     => Hash::make('password'),
                    'is_developer' => false,
                ],
            );

            // Pivot user_store
            DB::table('user_store')->updateOrInsert(
                ['user_id' => $user->id, 'store_id' => $store->id],
                ['created_at' => now(), 'updated_at' => now()],
            );

            // Assign role "owner" di store ini via Spatie
            $this->assignRole($user, 'owner', $store->id);
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
