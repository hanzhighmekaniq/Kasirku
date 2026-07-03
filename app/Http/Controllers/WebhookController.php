<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Models\PaymentGatewayTransaction;
use App\Models\Sale;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handle(Request $request, string $provider): \Illuminate\Http\JsonResponse
    {
        $payload = $request->all();
        $rawBody = $request->getContent();

        Log::channel('daily')->info("[Webhook:{$provider}] received", ['payload' => $payload]);

        // Cari PG transaction berdasarkan external_id / order_id
        $externalId = $payload['order_id'] ?? $payload['external_id'] ?? null;
        if (!$externalId) {
            return response()->json(['message' => 'Missing order_id'], 400);
        }

        $pgTrx = PaymentGatewayTransaction::with('sale.store')
            ->where('external_id', $externalId)
            ->first();

        if (!$pgTrx) {
            Log::channel('daily')->warning("[Webhook:{$provider}] PG transaction not found", ['external_id' => $externalId]);
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        $sale    = $pgTrx->sale;
        $storeId = $sale?->store_id;

        if (!$storeId) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        try {
            $gateway = PaymentGatewayFactory::make($provider, $storeId);

            // Verify signature
            if (!$gateway->verifySignature($payload, $rawBody)) {
                Log::channel('daily')->warning("[Webhook:{$provider}] Invalid signature", ['order_id' => $externalId]);
                return response()->json(['message' => 'Invalid signature'], 403);
            }

            $result = $gateway->handleCallback($payload);

            $pgTrx->update([
                'status'       => $result['status'],
                'payment_type' => $result['payment_type'] ?: $pgTrx->payment_type,
                'raw_response' => $result['raw'],
            ]);

            // Finalize jika paid
            if ($result['status'] === 'paid' && $sale) {
                $pgController = new PaymentGatewayController();
                $pgController->finalizeSale($sale, $pgTrx);
            }

            return response()->json(['message' => 'OK']);

        } catch (\Throwable $e) {
            Log::channel('daily')->error("[Webhook:{$provider}] Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Internal error'], 500);
        }
    }
}
