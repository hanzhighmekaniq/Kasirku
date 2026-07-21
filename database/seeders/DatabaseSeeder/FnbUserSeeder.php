<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class FnbUserSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        $users = [
            ['email' => 'kasir.malioboro@gmail.com',  'name' => 'Siti Rahayu',       'role' => 'kasir'],
            ['email' => 'kasir.ugm@gmail.com',        'name' => 'Agus Purnomo',      'role' => 'kasir'],
            ['email' => 'gudang.kopi@gmail.com',      'name' => 'Lina Sulistyowati', 'role' => 'gudang'],
        ];

        foreach ($users as $u) {
            $user = User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => Hash::make('password'),
                    'is_developer' => false,
                ],
            );

            DB::table('user_store')->updateOrInsert(
                ['user_id' => $user->id, 'store_id' => $store->id],
                ['created_at' => now(), 'updated_at' => now()],
            );

            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            $roleObj = Role::where('name', $u['role'])->where('store_id', $store->id)->first();
            if ($roleObj && ! $user->hasRole($roleObj)) {
                $user->assignRole($roleObj);
            }
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        }
    }
}
