<?php

namespace App\Providers;

use App\Models\Sale;
use App\Observers\SaleObserver;
use App\Services\Stock\StockService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
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
        Sale::observe(SaleObserver::class);

        Vite::prefetch(concurrency: 3);

        // Aturan password minimum untuk seluruh aplikasi — otomatis berlaku
        // di registrasi, reset password, dan ubah password (ketiganya sudah
        // memakai Password::defaults()).
        //
        // Simbol khusus sengaja TIDAK diwajibkan: mengikuti panduan NIST,
        // syarat simbol wajib cenderung mendorong pola yang mudah diduga
        // (mis. "Password1!") tanpa menambah kekuatan nyata.
        Password::defaults(fn () => Password::min(8)->mixedCase()->numbers());

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
