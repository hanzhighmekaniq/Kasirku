<?php

namespace App\Services\PaymentGateway;

use Illuminate\Support\Str;

class MidtransGateway extends BasePaymentGateway
{
    protected function sandboxBaseUrl(): string
    {
        return 'https://api.sandbox.midtrans.com';
    }

    protected function productionBaseUrl(): string
    {
        return 'https://api.midtrans.com';
    }

    // ── E-wallet & QRIS methods ──────────────────

    private const EWALLET_METHODS = ['qris', 'gopay', 'shopeepay', 'dana', 'ovo'];
    private const VA_METHODS      = ['bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'permata_va'];

    // ── createTransaction ─────────────────────────

    public function createTransaction(array $params): array
    {
        $paymentType = $params['payment_type'] ?? 'qris';
        $orderId     = $params['order_id']     ?? 'ORD-' . Str::uuid();
        $amount      = (int) round($params['amount']);

        $body = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $params['customer']['name'] ?? 'Customer',
                'email'      => $params['customer']['email'] ?? null,
                'phone'      => $params['customer']['phone'] ?? null,
            ],
            'item_details' => $params['items'] ?? [[
                'id'       => 'ITEM01',
                'price'    => $amount,
                'quantity' => 1,
                'name'     => 'Pembelian',
            ]],
        ];

        if (in_array($paymentType, self::EWALLET_METHODS)) {
            $result = $this->createEwalletCharge($paymentType, $orderId, $amount, $body);
        } elseif (in_array($paymentType, self::VA_METHODS)) {
            $result = $this->createVaCharge($paymentType, $orderId, $amount, $body);
        } else {
            throw new \InvalidArgumentException("Unsupported payment type: {$paymentType}");
        }

        $this->log('info', 'Transaction created', ['order_id' => $orderId, 'type' => $paymentType]);

        return array_merge($result, [
            'external_id'  => $orderId,
            'payment_type' => $paymentType,
            'amount'       => $amount,
        ]);
    }

    private function createEwalletCharge(string $method, string $orderId, int $amount, array $body): array
    {
        // QRIS uses charge endpoint
        if ($method === 'qris') {
            $body['payment_type'] = 'qris';
            $body['qris']         = ['acquirer' => 'gopay'];
        } else {
            $body['payment_type'] = $method;
            $body[$method]        = ['enable_callback' => true];
        }

        $response = $this->http()
            ->post("{$this->baseUrl()}/v2/charge", $body);

        $this->log('debug', 'Ewallet charge response', $response->json() ?? []);

        if ($response->failed()) {
            throw new \RuntimeException('Midtrans charge failed: ' . $response->body());
        }

        $data = $response->json();

        // Extract QR image URL from Midtrans actions
        $qrImageUrl = null;
        if (!empty($data['actions'])) {
            $genQr = collect($data['actions'])->firstWhere('name', 'generate-qr-code');
            $qrImageUrl = $genQr['url'] ?? $data['actions'][0]['url'] ?? null;
        }

        return [
            'payment_url' => $data['redirect_url']  ?? null,
            'qr_code'     => $data['qr_code']        ?? $data['qr_string'] ?? null,
            'qr_image_url' => $qrImageUrl,
            'va_number'   => null,
            'raw'         => $data,
        ];
    }

    private function createVaCharge(string $method, string $orderId, int $amount, array $body): array
    {
        $bank = str_replace('_va', '', $method);

        $body['payment_type'] = 'bank_transfer';
        $body['bank_transfer'] = ['bank' => $bank];

        $response = $this->http()
            ->post("{$this->baseUrl()}/v2/charge", $body);

        $this->log('debug', 'VA charge response', $response->json() ?? []);

        if ($response->failed()) {
            throw new \RuntimeException('Midtrans VA charge failed: ' . $response->body());
        }

        $data     = $response->json();
        $vaNumber = $data['va_numbers'][0]['va_number']  ?? $data['permata_va_number'] ?? null;

        return [
            'payment_url' => null,
            'qr_code'     => null,
            'va_number'   => $vaNumber,
            'va_bank'     => $bank,
            'raw'         => $data,
        ];
    }

    // ── handleCallback ────────────────────────────

    public function handleCallback(array $payload): array
    {
        return [
            'external_id'  => $payload['order_id']      ?? '',
            'status'       => $this->mapStatus($payload['transaction_status'] ?? ''),
            'payment_type' => $payload['payment_type']   ?? '',
            'amount'       => (float) ($payload['gross_amount'] ?? 0),
            'raw'          => $payload,
        ];
    }

    // ── getStatus ─────────────────────────────────

    public function getStatus(string $externalId): array
    {
        $response = $this->http()
            ->get("{$this->baseUrl()}/v2/{$externalId}/status");

        if ($response->failed()) {
            throw new \RuntimeException('Midtrans status check failed: ' . $response->body());
        }

        $data = $response->json();

        return [
            'status'       => $this->mapStatus($data['transaction_status'] ?? 'pending'),
            'payment_type' => $data['payment_type'] ?? '',
            'amount'       => (float) ($data['gross_amount'] ?? 0),
            'raw'          => $data,
        ];
    }

    // ── verifySignature ───────────────────────────

    public function verifySignature(array $payload, string $rawBody = ''): bool
    {
        // Midtrans: SHA-512(order_id + status_code + gross_amount + server_key)
        $expected = hash('sha512',
            ($payload['order_id']      ?? '') .
            ($payload['status_code']   ?? '') .
            ($payload['gross_amount']  ?? '') .
            $this->serverKey
        );

        return hash_equals($expected, $payload['signature_key'] ?? '');
    }
}
