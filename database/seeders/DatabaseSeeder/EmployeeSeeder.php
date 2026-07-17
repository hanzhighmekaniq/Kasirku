<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();

        $employees = [
            ['BR1A', 'EMP-S1-01', 'Rizki Firmansyah', 'kasir.pusat@gmail.com', 'Kasir', 'kasir'],
            ['BR1A', 'EMP-S1-02', 'Rina Wati', 'gudang.pusat@gmail.com', 'Staff Gudang', 'gudang'],
            ['BR1B', 'EMP-S1-03', 'Andi Prasetyo', 'kasir.babarsari@gmail.com', 'Kasir', 'kasir'],
            ['BR1B', 'EMP-S1-04', 'Dewi Lestari', 'gudang.babarsari@gmail.com', 'Staff Gudang', 'gudang'],
        ];

        foreach ($employees as [$branchCode, $empCode, $name, $email, $position, $role]) {
            $branch = Branch::where('store_id', $store->id)
                ->where('code', $branchCode)
                ->firstOrFail();

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'is_developer' => false,
                ],
            );

            DB::table('user_store')->updateOrInsert(
                ['user_id' => $user->id, 'store_id' => $store->id],
                ['created_at' => now(), 'updated_at' => now()],
            );

            // Assign role
            $registrar = app(PermissionRegistrar::class);
            $registrar->setPermissionsTeamId($store->id);
            $roleObj = Role::where('name', $role)
                ->where('store_id', $store->id)
                ->first();
            if ($roleObj && ! $user->hasRole($roleObj)) {
                $user->assignRole($roleObj);
            }
            $registrar->setPermissionsTeamId(null);

            Employee::updateOrCreate(
                ['store_id' => $store->id, 'employee_code' => $empCode],
                [
                    'branch_id' => $branch->id,
                    'user_id' => $user->id,
                    'name' => $name,
                    'email' => $email,
                    'position' => $position,
                    'commission_type' => 'none',
                    'commission_value' => 0,
                    'status' => 'active',
                ],
            );
        }
    }
}
