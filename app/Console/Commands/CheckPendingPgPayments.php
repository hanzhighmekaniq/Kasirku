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

    protected $description = 'Check pending/unknown PG transactions with payment providers and finalize if paid';

    public function handle(): int
    {
        $trxs = PaymentGatewayTransaction::with('sale.store')
            ->whereIn('status', ['pending', 'unknown'])
            ->where('created_at', '>=', now()->subHours(2))
            ->get();

        if ($trxs->isEmpty()) {
            $this->info('No pending/unknown PG transactions.');

            return self::SUCCESS;
        }

        $this->info("Checking {$trxs->count()} transaction(s)...");

        $finalized = 0;

        foreach ($trxs as $pgTrx) {
            $sale = $pgTrx->sale;
            if (! $sale || ! $sale->store_id) {
                $this->warn("  Skip pg_trx #{$pgTrx->id}: no sale/store found");

                continue;
            }

            try {
                $gateway = PaymentGatewayFactory::make($pgTrx->provider);

                if ($pgTrx->status === 'unknown') {
                    // Ambiguous after a 5xx/timeout — reconcile before touching anything.
                    $result = $gateway->reconcile($pgTrx->external_id);

                    if (! $result['found']) {
                        // Still not found after reconciliation attempts — safe to mark
                        // failed so the cashier can retry with a fresh attempt.
                        $pgTrx->update(['status' => 'failed']);
                        $this->line("  → #{$pgTrx->id} ({$pgTrx->external_id}) → not found at provider, marked failed");

                        continue;
                    }

                    $pgTrx->markReconciled($result['status']);
                } else {
                    $result = $gateway->getStatus($pgTrx->external_id);
                    $pgTrx->update([
                        'status' => $result['status'],
                        'status_checked_at' => now(),
                        'raw_response' => $result['raw'],
                    ]);
                }

                if ($result['status'] === 'paid') {
                    $pgController = new PaymentGatewayController;
                    if ($pgTrx->sale_split_payer_id) {
                        $pgController->finalizeSplitPayerPayment($pgTrx);
                    } else {
                        $pgController->finalizeSale($sale, $pgTrx);
                    }
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
