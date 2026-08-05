<?php

namespace App\Console\Commands;

use App\Models\PaymentGatewayTransaction;
use App\Models\PlanOrder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpirePendingPlanOrders extends Command
{
    protected $signature = 'plan:expire-pending';

    protected $description = 'Auto-expire plan orders yang sudah lewat batas waktu pembayaran';

    public function handle(): int
    {
        // 1. Expire plan orders yang sudah lewat expires_at
        $expiredOrders = PlanOrder::where('status', PlanOrder::STATUS_PENDING)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        $expiredCount = 0;

        foreach ($expiredOrders as $order) {
            $order->update(['status' => PlanOrder::STATUS_EXPIRED]);
            $expiredCount++;
        }

        // 2. Expire plan orders yang pending lebih dari 24 jam (fallback untuk order tanpa expires_at)
        $staleCount = PlanOrder::where('status', PlanOrder::STATUS_PENDING)
            ->whereNull('expires_at')
            ->where('created_at', '<', now()->subHours(24))
            ->update(['status' => PlanOrder::STATUS_EXPIRED]);

        $totalExpired = $expiredCount + $staleCount;

        // 3. Cascade cancel PG transactions yang terkait
        $expiredOrderIds = PlanOrder::where('status', PlanOrder::STATUS_EXPIRED)
            ->where('created_at', '>=', now()->subHours(48))
            ->pluck('id');

        if ($expiredOrderIds->isNotEmpty()) {
            $cancelledPgTrx = PaymentGatewayTransaction::where('plan_order_id', $expiredOrderIds)
                ->whereIn('status', ['pending', 'initiating', 'unknown', 'checking'])
                ->update(['status' => 'expired']);

            if ($cancelledPgTrx > 0) {
                $this->info("Cancelled {$cancelledPgTrx} pending PG transactions.");
                Log::channel('daily')->info("[plan:expire-pending] Cancelled {$cancelledPgTrx} PG transactions for expired orders.");
            }
        }

        if ($totalExpired > 0) {
            $this->info("Done: {$totalExpired} pending plan orders expired.");
            Log::channel('daily')->info("[plan:expire-pending] {$totalExpired} pending plan orders expired.");
        } else {
            $this->info('No pending plan orders to expire.');
        }

        return self::SUCCESS;
    }
}
