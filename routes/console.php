<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Check pending PG transactions every 30 seconds
Schedule::command('pg:check-pending')->everyThirtySeconds();

// Auto-expire stale split bills every 5 minutes
Schedule::command('split:check-expired')->everyFiveMinutes();

// Membership: tandai expired & sweep auto-tier harian
Schedule::command('membership:check-expired')->daily();
Schedule::command('membership:sweep-auto-tier')->dailyAt('01:00');

// Plan: downgrade toko yang trial/plan-nya sudah habis ke plan free,
// lalu kirim reminder H-3/H-1 untuk toko yang belum expired hari ini.
Schedule::command('plan:check-expired')->dailyAt('00:30');
Schedule::command('plan:notify-trial-ending')->dailyAt('08:00');

// Plan: expire pending plan orders setiap jam
Schedule::command('plan:expire-pending')->hourly();

// Alerts: stok menipis & produk kadaluarsa
Schedule::command('alerts:low-stock')->dailyAt('07:00');
Schedule::command('alerts:expiry')->dailyAt('07:00');
