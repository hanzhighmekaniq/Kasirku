<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Store;
use App\Models\User;
use App\Services\StoreRoleService;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner1@gmail.com')->first();

        $stores = Store::whereIn('code', ['STORE001', 'STORE002'])->get();

        foreach ($stores as $store) {
            StoreRoleService::createRolesForStore($store->id);
            $this->command?->line("  ✔ Roles created for store: {$store->name}");

            if ($owner) {
                app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
                if (! $owner->hasRole('owner')) {
                    $owner->assignRole('owner');
                }
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        }
    }
}
