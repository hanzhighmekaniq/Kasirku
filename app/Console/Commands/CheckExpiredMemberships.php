<?php

namespace App\Console\Commands;

use App\Models\CustomerMembership;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckExpiredMemberships extends Command
{
    protected $signature = 'membership:check-expired';

    protected $description = 'Tandai customer_memberships yang sudah lewat expired_date jadi status expired';

    public function handle(): int
    {
        $count = CustomerMembership::where('status', 'active')
            ->whereNotNull('expired_date')
            ->where('expired_date', '<', now())
            ->update(['status' => 'expired']);

        $this->info("Done: {$count} membership ditandai expired.");
        Log::channel('daily')->info("[membership:check-expired] Expired={$count}");

        return self::SUCCESS;
    }
}
