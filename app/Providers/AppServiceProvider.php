<?php

namespace App\Providers;

use App\Services\Stock\StockService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\PermissionRegistrar;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // StockService sebagai singleton — satu instance per request,
        // tidak ada state yang perlu direset antar panggilan.
        $this->app->singleton(StockService::class);
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Auto-set Spatie team ID dari session saat request masuk.
        // Ini memastikan semua $user->can() / $user->hasRole() sudah
        // pakai context store yang aktif tanpa perlu set manual di tiap controller.
        $this->app->booted(function () {
            if (app()->runningInConsole()) {
                return;
            }

            $storeId = session('current_store_id');
            if ($storeId) {
                app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
            }
        });
    }
}
