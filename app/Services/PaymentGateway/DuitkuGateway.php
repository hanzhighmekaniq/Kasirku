<?php

namespace App\Services\PaymentGateway;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Duitku Payment Gateway
 *
 * Auth:        API Key (server_key) di header x-api-key + SHA-256 signature
 * Sandbox:     https://sandbox.duitku.com/api
 * Production:  https://passport.duitku.com/webapi
 * Methods:     QRIS, VA Bank, GoPay, OVO, ShopeePay
 */
class DuitkuGateway extends BasePaymentGateway
{
    protected function sandboxBaseUrl(): string
    {
        return 'https://sandbox.duitku.com/api';
    }

    protected function productionBaseUrl(): string
    {
        return 'https://passport.duitku.com/webapi';
    }

    /**
     * Duitku pakai API key di header + SHA-256 signature, bukan Basic Auth.
     */
    protected function http(): PendingRequest
    {
        return Http::acceptJson()
            ->asJson()
            ->timeout(30);
    }

    /**
     * Buat SHA-256 signature: md5(merchantCode + timestamp + apiKey)
     */
    private function makeSignature(string $timestamp): string
    {
        return md5($this->merchantId.$timestamp.$this->serverKey);
    }

    /**
     * Buat transaksi pembayaran via Duitku.
     * Support: qris, bca_va, mandiri_va, bri_va, bni_va, gopay, ovo, shopeepay
     */
    public function createTransaction(array $params): array
    {
        $paymentType = $params['payment_type'] ?? 'qris';
        $orderId = $params['order_id'] ?? 'DTK-'.time();
        $amount = (int) round($params['amount']);
        $timestamp = (string) now()->timestamp;
        $signature = $this->makeSignature($timestamp);

        // Map payment type to Duitku payment method code
        $methodMap = [
            'qris' => 'VC',
            'bca_va' => 'BC',
            'mandiri_va' => 'M2',
            'bri_va' => 'BR',
            'bni_va' => 'B1',
            'gopay' => 'GQ',
            'ovo' => 'OV',
            'shopeepay' => 'SP',
        ];

        $paymentMethod = $methodMap[$paymentType] ?? 'VC';

        $body = [
            'merchantCode' => $this->merchantId,
            'paymentAmount' => $amount,
            'paymentMethod' => $paymentMethod,
            'merchantOrderId' => $orderId,
            'productDetails' => $params['items'][0]['name'] ?? 'Pembelian',
            'email' => $params['customer']['email'] ?? 'customer@example.com',
            'phoneNumber' => $params['customer']['phone'] ?? '08123456789',
            'customerVaName' => $params['customer']['name'] ?? 'Customer',
            'callbackUrl' => config('app.url').'/webhooks/duitku',
            'returnUrl' => config('app.url').'/payment/return',
            'signature' => $signature,
            'timestamp' => $timestamp,
            'expiryPeriod' => 1440, // 24 jam
        ];

        $this->log('debug', 'Duitku request', $body);

        $response = $this->http()
            ->withHeaders(['x-api-key' => $this->serverKey])
            ->post("{$this->baseUrl()}/merchant/v2/inquiry", $body);

        if ($response->failed()) {
            $this->log('error', 'Duitku charge failed', $response->json() ?? []);
            throw new \RuntimeException('Duitku charge failed: '.$response->body());
        }

        $data = $response->json();
        $this->log('debug', 'Duitku response', $data ?? []);

        // Periksa statusCode dari response
        if (($data['statusCode'] ?? '00') !== '00') {
            throw new \RuntimeException('Duitku error: '.($data['statusMessage'] ?? 'Unknown error'));
        }

        return [
            'external_id' => $orderId,
            'payment_type' => $paymentType,
            'amount' => $amount,
            'payment_url' => $data['paymentUrl'] ?? null,
            'qr_code' => $data['qrString'] ?? null,
            'qr_image_url' => $data['qrUrl'] ?? null,
            'va_number' => $data['vaNumber'] ?? null,
            'va_bank' => $paymentType,
            'raw' => $data,
        ];
    }

    // ── getStatus ─────────────────────────────────

    public function getStatus(string $externalId): array
    {
        $timestamp = (string) now()->timestamp;
        $signature = $this->makeSignature($timestamp);

        $response = $this->http()
            ->withHeaders(['x-api-key' => $this->serverKey])
            ->post("{$this->baseUrl()}/merchant/transactionStatus", [
                'merchantCode' => $this->merchantId,
                'merchantOrderId' => $externalId,
                'signature' => $signature,
                'timestamp' => $timestamp,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Duitku status check failed: '.$response->body());
        }

        $data = $response->json();

        // Map Duitku status to our status
        $statusMap = [
            '00' => 'paid',      // Success
            '01' => 'pending',   // Pending
            '02' => 'failed',    // Failed
        ];

        return [
            'status' => $statusMap[$data['statusCode'] ?? '01'] ?? 'pending',
            'payment_type' => $data['paymentMethod'] ?? '',
            'amount' => (float) ($data['amount'] ?? 0),
            'raw' => $data,
        ];
    }

    // ── handleCallback ────────────────────────────

    public function handleCallback(array $payload): array
    {
        $statusMap = [
            '00' => 'paid',
            '01' => 'pending',
            '02' => 'failed',
        ];

        return [
            'external_id' => $payload['merchantOrderId'] ?? '',
            'status' => $statusMap[$payload['resultCode'] ?? '01'] ?? 'pending',
            'payment_type' => $payload['paymentChannel'] ?? '',
            'amount' => (float) ($payload['amount'] ?? 0),
            'raw' => $payload,
        ];
    }

    // ── verifySignature ───────────────────────────

    public function verifySignature(array $payload, string $rawBody = ''): bool
    {
        // Duitku callback: verify MD5(merchantCode + amount + merchantOrderId + apiKey)
        $expected = md5(
            ($payload['merchantCode'] ?? '').
            ($payload['amount'] ?? '').
            ($payload['merchantOrderId'] ?? '').
            $this->serverKey
        );

        return hash_equals($expected, $payload['signature'] ?? '');
    }
}
