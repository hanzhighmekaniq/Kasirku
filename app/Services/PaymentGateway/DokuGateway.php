<?php

namespace App\Services\PaymentGateway;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * DOKU Payment Gateway
 *
 * Auth:        Basic Auth (Client ID as username, Shared Key as password)
 * Sandbox:     https://api-sandbox.doku.com
 * Production:  https://api.doku.com
 * Methods:     QRIS, VA Bank (BCA, Mandiri, BRI, BNI, Permata)
 */
class DokuGateway extends BasePaymentGateway
{
    protected function sandboxBaseUrl(): string
    {
        return 'https://api-sandbox.doku.com';
    }

    protected function productionBaseUrl(): string
    {
        return 'https://api.doku.com';
    }

    /**
     * DOKU pakai Basic Auth: Client ID (client_key) : Shared Key (server_key)
     */
    protected function http(): PendingRequest
    {
        return Http::withBasicAuth($this->clientKey, $this->serverKey)
            ->acceptJson()
            ->asJson()
            ->timeout(30);
    }

    /**
     * Buat transaksi pembayaran via DOKU.
     * Support: qris, bca_va, mandiri_va, bri_va, bni_va, permata_va
     */
    public function createTransaction(array $params): array
    {
        $paymentType = $params['payment_type'] ?? 'qris';
        $orderId = $params['order_id'] ?? 'DOKU-'.time();
        $amount = (int) round($params['amount']);

        $body = [
            'order' => [
                'invoice_number' => $orderId,
                'amount' => $amount,
                'currency' => 'IDR',
                'callback_url' => config('app.url').'/webhooks/doku',
                'line_items' => $params['items'] ?? [[
                    'name' => 'Pembelian',
                    'price' => $amount,
                    'quantity' => 1,
                ]],
            ],
            'payment' => [
                'payment_due_date' => 60,
            ],
            'customer' => [
                'name' => $params['customer']['name'] ?? 'Customer',
                'email' => $params['customer']['email'] ?? 'customer@example.com',
                'phone' => $params['customer']['phone'] ?? '08123456789',
            ],
        ];

        // Tentukan channel pembayaran
        if ($paymentType === 'qris') {
            $body['payment']['payment_method_types'] = ['QRIS'];
        } elseif (str_contains($paymentType, 'va')) {
            $bank = strtoupper(str_replace('_va', '', $paymentType));
            $body['payment']['payment_method_types'] = ['VIRTUAL_ACCOUNT_BANK_TRANSFER'];
            $body['payment']['payment_options'] = [
                'virtual_account' => ['bank' => $bank],
            ];
        }

        $this->log('debug', 'DOKU request', $body);

        $response = $this->http()
            ->post("{$this->baseUrl()}/checkout/v1/payment", $body);

        if ($response->failed()) {
            $this->log('error', 'DOKU charge failed', $response->json() ?? []);
            throw new \RuntimeException('DOKU charge failed: '.$response->body());
        }

        $data = $response->json();
        $this->log('debug', 'DOKU response', $data ?? []);

        $paymentUrl = $data['response']['payment_url'] ?? null;
        $vaNumber = $data['response']['virtual_account_info']['virtual_account_number'] ?? null;
        $qrImageUrl = $data['response']['qr_code_url'] ?? null;
        $qrCode = $data['response']['qr_string'] ?? null;

        return [
            'external_id' => $orderId,
            'payment_type' => $paymentType,
            'amount' => $amount,
            'payment_url' => $paymentUrl,
            'qr_code' => $qrCode,
            'qr_image_url' => $qrImageUrl,
            'va_number' => $vaNumber,
            'va_bank' => $body['payment']['payment_options']['virtual_account']['bank'] ?? null,
            'raw' => $data,
        ];
    }

    // ── getStatus ─────────────────────────────────

    public function getStatus(string $externalId): array
    {
        $response = $this->http()
            ->get("{$this->baseUrl()}/orders/{$externalId}/status");

        if ($response->failed()) {
            throw new \RuntimeException('DOKU status check failed: '.$response->body());
        }

        $data = $response->json();

        return [
            'status' => $this->mapStatus($data['transaction']['status'] ?? 'pending'),
            'payment_type' => $data['transaction']['payment_method_type'] ?? '',
            'amount' => (float) ($data['order']['amount'] ?? 0),
            'raw' => $data,
        ];
    }

    // ── handleCallback ────────────────────────────

    public function handleCallback(array $payload): array
    {
        return [
            'external_id' => $payload['order']['invoice_number'] ?? '',
            'status' => $this->mapStatus($payload['transaction']['status'] ?? ''),
            'payment_type' => $payload['transaction']['payment_method_type'] ?? '',
            'amount' => (float) ($payload['order']['amount'] ?? 0),
            'raw' => $payload,
        ];
    }

    // ── verifySignature ───────────────────────────

    public function verifySignature(array $payload, string $rawBody = ''): bool
    {
        // DOKU callback verification: hmac SHA-256
        // Signature = base64(HMAC-SHA256(clientKey, rawBody))
        $callbackSignature = request()->header('Signature');
        if (! $callbackSignature) {
            return false;
        }

        $expected = base64_encode(hash_hmac('sha256', $rawBody, $this->clientKey, true));

        return hash_equals($expected, $callbackSignature);
    }
}
