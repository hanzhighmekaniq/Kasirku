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
        $store = Store::where('code', 'STORE001')->firstOrFail();

        // Buat roles untuk store ini
        StoreRoleService::createRolesForStore($store->id);
        $this->command?->line("  ✔ Roles created for store: {$store->name}");

        // Assign owner role
        $owner = User::where('email', 'owner1@gmail.com')->first();
        if ($owner) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            $owner->assignRole('owner');
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        }
    }
}
