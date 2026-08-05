<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Models\PaymentGatewayTransaction;
use App\Models\PlanOrder;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use App\Services\PlanOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handle(Request $request, string $provider): JsonResponse
    {
        $payload = $request->all();
        $rawBody = $request->getContent();

        Log::channel('daily')->info("[Webhook:{$provider}] received", ['payload' => $payload]);

        // Cari PG transaction berdasarkan external_id / order_id
        $externalId = $payload['order_id'] ?? $payload['external_id'] ?? null;
        if (! $externalId) {
            return response()->json(['message' => 'Missing order_id'], 400);
        }

        $pgTrx = PaymentGatewayTransaction::with('sale.store', 'planOrder')
            ->where('external_id', $externalId)
            ->first();

        if (! $pgTrx) {
            Log::channel('daily')->warning("[Webhook:{$provider}] PG transaction not found", ['external_id' => $externalId]);

            return response()->json(['message' => 'Transaction not found'], 404);
        }

        try {
            $gateway = PaymentGatewayFactory::make($provider);

            // Verify signature
            if (! $gateway->verifySignature($payload, $rawBody)) {
                Log::channel('daily')->warning("[Webhook:{$provider}] Invalid signature", ['order_id' => $externalId]);

                return response()->json(['message' => 'Invalid signature'], 403);
            }

            $result = $gateway->handleCallback($payload);

            $pgTrx->update([
                'status' => $result['status'],
                'payment_type' => $result['payment_type'] ?: $pgTrx->payment_type,
                'raw_response' => $result['raw'],
            ]);

            // Finalize plan order jika paid
            if ($result['status'] === 'paid' && $pgTrx->plan_order_id) {
                $this->finalizePlanOrder($pgTrx->planOrder, $pgTrx);

                return response()->json(['message' => 'OK']);
            }

            // Finalize sale jika paid
            if ($result['status'] === 'paid' && $pgTrx->sale) {
                $pgController = new PaymentGatewayController;
                $pgController->finalizeSale($pgTrx->sale, $pgTrx);
            }

            return response()->json(['message' => 'OK']);

        } catch (\Throwable $e) {
            Log::channel('daily')->error("[Webhook:{$provider}] Error: ".$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json(['message' => 'Internal error'], 500);
        }
    }

    /**
     * Finalize plan order setelah pembayaran PG berhasil via webhook.
     */
    private function finalizePlanOrder(?PlanOrder $order, PaymentGatewayTransaction $pgTrx): void
    {
        if (! $order) {
            return;
        }

        app(PlanOrderService::class)->finalize($order, $pgTrx->external_id);
    }
}
