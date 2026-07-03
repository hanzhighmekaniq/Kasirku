<?php

namespace App\Console\Commands;

use App\Models\Store;
use App\Services\StoreRoleService;
use Illuminate\Console\Command;
use Spatie\Permission\PermissionRegistrar;

class SyncStoreRoles extends Command
{
    protected $signature = 'roles:sync {--store= : ID store tertentu (opsional, default semua store)}';

    protected $description = 'Buat/sync roles dan permissions untuk semua store (atau store tertentu). Aman dijalankan berulang kali (idempotent).';

    public function handle(): int
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $storeId = $this->option('store');

        if ($storeId) {
            $stores = Store::where('id', $storeId)->get();
            if ($stores->isEmpty()) {
                $this->error("Store dengan ID {$storeId} tidak ditemukan.");
                return self::FAILURE;
            }
        } else {
            $stores = Store::all();
        }

        if ($stores->isEmpty()) {
            $this->warn('Tidak ada store yang ditemukan. Jalankan StoreSeeder terlebih dahulu.');
            return self::FAILURE;
        }

        $this->info("Syncing roles untuk {$stores->count()} store...");

        foreach ($stores as $store) {
            StoreRoleService::createRolesForStore($store->id);
            $this->line("  ✔ [{$store->store_type}] {$store->name} (ID: {$store->id})");
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->info('');
        $this->info('✅ Roles berhasil disync untuk semua store.');
        $this->info('   Owner dan semua role sistem sudah punya permission yang benar.');

        return self::SUCCESS;
    }
}
