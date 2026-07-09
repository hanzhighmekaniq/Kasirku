<?php

namespace Database\Seeders\DevSeeder;

use App\Models\Store;
use App\Models\User;
use App\Services\StoreRoleService;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // ── Create roles for each store ──────────────────────────────────────
        $stores = Store::all();

        foreach ($stores as $store) {
            StoreRoleService::createRolesForStore($store->id);
            $this->command?->line("  ✔ Roles created for store: {$store->name} (ID: {$store->id})");
        }

        // ── Assign owner role to each owner for their stores ─────────────────
        $ownerStoreMap = [
            'owner1@gmail.com' => ['STORE001', 'STORE002'],
            'owner2@gmail.com' => ['STORE003', 'STORE004'],
            'owner3@gmail.com' => ['STORE005', 'STORE006'],
            'owner4@gmail.com' => ['STORE007', 'STORE008'],
        ];

        foreach ($ownerStoreMap as $email => $storeCodes) {
            $user = User::where('email', $email)->first();
            if (!$user) {
                continue;
            }

            foreach ($storeCodes as $storeCode) {
                $store = Store::where('code', $storeCode)->first();
                if (!$store) {
                    continue;
                }

                app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
                $user->assignRole('owner');
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        }
    }
}
