<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Models\PaymentGatewayTransaction;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckPendingPgPayments extends Command
{
    protected $signature = 'pg:check-pending';

    protected $description = 'Check pending PG transactions with payment providers and finalize if paid';

    public function handle(): int
    {
        $pendingTrxs = PaymentGatewayTransaction::with('sale.store')
            ->where('status', 'pending')
            ->where('created_at', '>=', now()->subHours(2))
            ->get();

        if ($pendingTrxs->isEmpty()) {
            $this->info('No pending PG transactions.');
            return self::SUCCESS;
        }

        $this->info("Checking {$pendingTrxs->count()} pending transaction(s)...");

        $finalized = 0;

        foreach ($pendingTrxs as $pgTrx) {
            $sale = $pgTrx->sale;
            if (!$sale || !$sale->store_id) {
                $this->warn("  Skip pg_trx #{$pgTrx->id}: no sale/store found");
                continue;
            }

            try {
                $gateway = PaymentGatewayFactory::make($pgTrx->provider, $sale->store_id);
                $result  = $gateway->getStatus($pgTrx->external_id);

                $pgTrx->update([
                    'status'       => $result['status'],
                    'raw_response' => $result['raw'],
                ]);

                if ($result['status'] === 'paid') {
                    $pgController = new PaymentGatewayController();
                    $pgController->finalizeSale($sale, $pgTrx);
                    $finalized++;
                    $this->info("  ✓ #{$pgTrx->id} ({$pgTrx->external_id}) → PAID & finalized");
                } else {
                    $this->line("  → #{$pgTrx->id} ({$pgTrx->external_id}) → {$result['status']}");
                }
            } catch (\Throwable $e) {
                $this->error("  ✗ #{$pgTrx->id}: {$e->getMessage()}");
                Log::channel('daily')->error("[pg:check-pending] Error checking #{$pgTrx->id}: {$e->getMessage()}");
            }
        }

        $this->info("Done. {$finalized} transaction(s) finalized.");
        return self::SUCCESS;
    }
}
