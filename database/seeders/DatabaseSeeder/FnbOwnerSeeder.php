<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class FnbOwnerSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        // Buat owner2 khusus STORE002
        $owner2 = User::updateOrCreate(
            ['email' => 'owner2@gmail.com'],
            [
                'name' => 'Sari Dewanti',
                'password' => Hash::make('password'),
                'is_developer' => false,
            ],
        );

        DB::table('user_store')->updateOrInsert(
            ['user_id' => $owner2->id, 'store_id' => $store->id],
            ['created_at' => now(), 'updated_at' => now()],
        );

        app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
        $ownerRole = Role::where('name', 'owner')->where('store_id', $store->id)->first();
        if ($ownerRole && ! $owner2->hasRole($ownerRole)) {
            $owner2->assignRole($ownerRole);
        }
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        // Cabut owner1 dari STORE002 (biar terpisah)
        $owner1 = User::where('email', 'owner1@gmail.com')->first();
        if ($owner1) {
            DB::table('user_store')
                ->where('user_id', $owner1->id)
                ->where('store_id', $store->id)
                ->delete();

            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            if ($ownerRole && $owner1->hasRole($ownerRole)) {
                $owner1->removeRole($ownerRole);
            }
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        }
    }
}
