<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\Membership;
use App\Services\AutoTierService;
use Illuminate\Console\Command;

class SweepAutoTier extends Command
{
    protected $signature = 'membership:sweep-auto-tier';

    protected $description = 'Re-evaluasi auto-tier semua customer di toko yang punya plan auto-tier aktif';

    public function handle(AutoTierService $service): int
    {
        $storeIds = Membership::whereNotNull('auto_tier_min_spend')->distinct()->pluck('store_id');
        $count = 0;

        Customer::whereIn('store_id', $storeIds)->each(function ($customer) use ($service, &$count) {
            $service->evaluate($customer);
            $count++;
        });

        $this->info("Done: {$count} customer dievaluasi ulang.");

        return self::SUCCESS;
    }
}
