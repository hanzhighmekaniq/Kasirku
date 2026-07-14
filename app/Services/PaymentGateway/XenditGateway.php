<?php

namespace App\Services\PaymentGateway;

/**
 * Xendit Payment Gateway
 *
 * Auth:        Basic Auth (API key as username, empty password)
 * Base URL:    https://api.xendit.co (sama untuk sandbox & production)
 * Methods:     QRIS, VA Bank, E-Wallet (GoPay, OVO, DANA), Kartu Kredit
 */
class XenditGateway extends BasePaymentGateway
{
    protected function sandboxBaseUrl(): string
    {
        return 'https://api.xendit.co';
    }

    protected function productionBaseUrl(): string
    {
        return 'https://api.xendit.co';
    }

    /**
     * Buat transaksi pembayaran via Xendit.
     * Support: qris, bca_va, mandiri_va, bri_va, bni_va, gopay, ovo, dana
     */
    public function createTransaction(array $params): array
    {
        $paymentType = $params['payment_type'] ?? 'qris';
        $orderId = $params['order_id'] ?? 'XDT-'.time();
        $amount = (int) round($params['amount']);

        if ($paymentType === 'qris') {
            $result = $this->createQris($orderId, $amount);
        } elseif (str_contains($paymentType, 'va')) {
            $result = $this->createVirtualAccount($paymentType, $orderId, $amount, $params['customer'] ?? []);
        } else {
            $result = $this->createEwallet($paymentType, $orderId, $amount, $params['customer'] ?? []);
        }

        $this->log('info', 'Transaction created', ['order_id' => $orderId, 'type' => $paymentType]);

        return array_merge($result, [
            'external_id' => $orderId,
            'payment_type' => $paymentType,
            'amount' => $amount,
        ]);
    }

    private function createQris(string $orderId, int $amount): array
    {
        $body = [
            'reference_id' => $orderId,
            'type' => 'DYNAMIC',
            'currency' => 'IDR',
            'amount' => $amount,
        ];

        $response = $this->http()
            ->post("{$this->baseUrl()}/qr_codes", $body);

        if ($response->failed()) {
            $this->log('error', 'Xendit QRIS failed', $response->json() ?? []);
            throw new \RuntimeException('Xendit QRIS charge failed: '.$response->body());
        }

        $data = $response->json();

        return [
            'payment_url' => null,
            'qr_code' => $data['qr_string'] ?? null,
            'qr_image_url' => $data['qr_code'] ?? null,
            'va_number' => null,
            'raw' => $data,
        ];
    }

    private function createVirtualAccount(string $method, string $orderId, int $amount, array $customer): array
    {
        $bank = strtoupper(str_replace('_va', '', $method));

        $body = [
            'external_id' => $orderId,
            'bank_code' => $bank,
            'name' => $customer['name'] ?? 'Customer',
            'expected_amount' => $amount,
            'is_closed' => true,
            'expiration_date' => now()->addHours(24)->toISOString(),
        ];

        $response = $this->http()
            ->post("{$this->baseUrl()}/callback_virtual_accounts", $body);

        if ($response->failed()) {
            $this->log('error', 'Xendit VA failed', $response->json() ?? []);
            throw new \RuntimeException('Xendit VA charge failed: '.$response->body());
        }

        $data = $response->json();

        return [
            'payment_url' => null,
            'qr_code' => null,
            'qr_image_url' => null,
            'va_number' => $data['account_number'] ?? null,
            'va_bank' => $bank,
            'raw' => $data,
        ];
    }

    private function createEwallet(string $method, string $orderId, int $amount, array $customer): array
    {
        $ewalletMap = [
            'gopay' => 'GOPAY',
            'ovo' => 'OVO',
            'dana' => 'DANA',
        ];

        $channelCode = $ewalletMap[$method] ?? strtoupper($method);

        $body = [
            'reference_id' => $orderId,
            'currency' => 'IDR',
            'amount' => $amount,
            'checkout_method' => 'ONE_TIME_PAYMENT',
            'channel_code' => $channelCode,
            'channel_properties' => [
                'success_redirect_url' => config('app.url').'/payment/success',
            ],
        ];

        if (! empty($customer['phone'])) {
            $body['channel_properties']['mobile_number'] = $customer['phone'];
        }

        $response = $this->http()
            ->post("{$this->baseUrl()}/ewallets/charges", $body);

        if ($response->failed()) {
            $this->log('error', 'Xendit EWallet failed', $response->json() ?? []);
            throw new \RuntimeException('Xendit EWallet charge failed: '.$response->body());
        }

        $data = $response->json();

        return [
            'payment_url' => $data['actions']['desktop_web_checkout_url']
                           ?? $data['actions']['mobile_web_checkout_url']
                           ?? $data['redirect_url']
                           ?? null,
            'qr_code' => null,
            'qr_image_url' => null,
            'va_number' => null,
            'raw' => $data,
        ];
    }

    // ── getStatus ─────────────────────────────────

    public function getStatus(string $externalId): array
    {
        $response = $this->http()
            ->get("{$this->baseUrl()}/qr_codes/{$externalId}");

        // Jika bukan QRIS, coba sebagai VA
        if ($response->notFound()) {
            $response = $this->http()
                ->get("{$this->baseUrl()}/callback_virtual_accounts/{$externalId}");
        }

        // Jika masih gagal, coba sebagai ewallet
        if ($response->notFound()) {
            $response = $this->http()
                ->get("{$this->baseUrl()}/ewallets/charges/{$externalId}");
        }

        if ($response->failed()) {
            throw new \RuntimeException('Xendit status check failed: '.$response->body());
        }

        $data = $response->json();

        return [
            'status' => $this->mapStatus($data['status'] ?? 'pending'),
            'payment_type' => $data['payment_method'] ?? $data['bank_code'] ?? '',
            'amount' => (float) ($data['amount'] ?? $data['expected_amount'] ?? 0),
            'raw' => $data,
        ];
    }

    // ── handleCallback ────────────────────────────

    public function handleCallback(array $payload): array
    {
        return [
            'external_id' => $payload['external_id']
                           ?? $payload['qr_code']['external_id']
                           ?? $payload['reference_id']
                           ?? '',
            'status' => $this->mapStatus($payload['status'] ?? ''),
            'payment_type' => $payload['payment_method']
                           ?? $payload['bank_code']
                           ?? $payload['payment_channel']
                           ?? '',
            'amount' => (float) ($payload['amount'] ?? $payload['expected_amount'] ?? 0),
            'raw' => $payload,
        ];
    }

    // ── verifySignature ───────────────────────────

    public function verifySignature(array $payload, string $rawBody = ''): bool
    {
        // Xendit callback verification: check via callback token header
        // Verifikasi dilakukan di middleware/webhook route dengan x-callback-token
        $callbackToken = request()->header('x-callback-token');
        $expectedToken = $this->serverKey; // Xendit uses API key as verification token

        return hash_equals($expectedToken, $callbackToken ?? '');
    }
}
