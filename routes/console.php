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
