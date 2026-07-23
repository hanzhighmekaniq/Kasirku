<?php

namespace App\Services\PaymentGateway;

use App\Services\PaymentGateway\Exceptions\PaymentClientException;
use App\Services\PaymentGateway\Exceptions\PaymentServerException;
use App\Services\PaymentGateway\Exceptions\PaymentTimeoutException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
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

    private const VA_METHODS = ['bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'permata_va'];

    // ── createTransaction ─────────────────────────

    /**
     * @throws PaymentClientException HTTP 4xx — definitive failure, do not retry blindly
     * @throws PaymentServerException HTTP 5xx — ambiguous, must reconcile before retrying
     * @throws PaymentTimeoutException Connection/timeout — ambiguous, must reconcile before retrying
     */
    public function createTransaction(array $params): array
    {
        $paymentType = $params['payment_type'] ?? 'qris';
        $orderId = $params['order_id'] ?? 'ORD-'.Str::uuid();
        $amount = (int) round($params['amount']);
        $idempotencyKey = $params['idempotency_key'] ?? null;

        $body = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $params['customer']['name'] ?? 'Customer',
                'email' => $params['customer']['email'] ?? null,
                'phone' => $params['customer']['phone'] ?? null,
            ],
            'item_details' => $this->resolveItemDetails($params['items'] ?? null, $amount),
        ];

        if (in_array($paymentType, self::EWALLET_METHODS)) {
            $result = $this->createEwalletCharge($paymentType, $orderId, $amount, $body, $idempotencyKey);
        } elseif (in_array($paymentType, self::VA_METHODS)) {
            $result = $this->createVaCharge($paymentType, $orderId, $amount, $body, $idempotencyKey);
        } else {
            throw new \InvalidArgumentException("Unsupported payment type: {$paymentType}");
        }

        $this->logGatewayEvent('info', 'charge.success', [
            'order_id' => $orderId,
            'payment_type' => $paymentType,
            'http_status' => $result['http_status'] ?? null,
        ]);

        return array_merge($result, [
            'external_id' => $orderId,
            'payment_type' => $paymentType,
            'amount' => $amount,
        ]);
    }

    /**
     * Midtrans mewajibkan sum(item_details.price * quantity) === gross_amount.
     * Kalau item detail yang dikirim caller tidak sum-nya tidak cocok
     * (karena ada diskon/pajak/ongkir/pembulatan di level transaksi yang
     * tidak tercermin di harga per-item), Midtrans akan reject request
     * dengan error 500 generik yang membingungkan. Fallback ke satu item
     * generik yang selalu valid, alih-alih membiarkan request gagal.
     */
    private function resolveItemDetails(?array $items, int $amount): array
    {
        $fallback = [[
            'id' => 'ITEM01',
            'price' => $amount,
            'quantity' => 1,
            'name' => 'Pembelian',
        ]];

        if (empty($items)) {
            return $fallback;
        }

        $sum = 0;
        foreach ($items as $item) {
            $sum += ((int) round($item['price'] ?? 0)) * ((int) ($item['quantity'] ?? 1));
        }

        if ($sum !== $amount) {
            $this->log('info', 'Item details sum mismatch, falling back to generic item', [
                'items_sum' => $sum,
                'gross_amount' => $amount,
            ]);

            return $fallback;
        }

        return $items;
    }

    private function createEwalletCharge(string $method, string $orderId, int $amount, array $body, ?string $idempotencyKey): array
    {
        // QRIS uses charge endpoint
        if ($method === 'qris') {
            $body['payment_type'] = 'qris';
            $body['qris'] = ['acquirer' => 'gopay'];
        } else {
            $body['payment_type'] = $method;
            $body[$method] = ['enable_callback' => true];
        }

        $response = $this->sendCharge($orderId, $body, $idempotencyKey);
        $data = $response->json();

        // Extract QR image URL from Midtrans actions
        $qrImageUrl = null;
        if (! empty($data['actions'])) {
            $genQr = collect($data['actions'])->firstWhere('name', 'generate-qr-code');
            $qrImageUrl = $genQr['url'] ?? $data['actions'][0]['url'] ?? null;
        }

        return [
            'payment_url' => $data['redirect_url'] ?? null,
            'qr_code' => $data['qr_code'] ?? $data['qr_string'] ?? null,
            'qr_image_url' => $qrImageUrl,
            'va_number' => null,
            'http_status' => $response->status(),
            'raw' => $data,
        ];
    }

    private function createVaCharge(string $method, string $orderId, int $amount, array $body, ?string $idempotencyKey): array
    {
        $bank = str_replace('_va', '', $method);

        $body['payment_type'] = 'bank_transfer';
        $body['bank_transfer'] = ['bank' => $bank];

        $response = $this->sendCharge($orderId, $body, $idempotencyKey);
        $data = $response->json();
        $vaNumber = $data['va_numbers'][0]['va_number'] ?? $data['permata_va_number'] ?? null;

        return [
            'payment_url' => null,
            'qr_code' => null,
            'va_number' => $vaNumber,
            'va_bank' => $bank,
            'http_status' => $response->status(),
            'raw' => $data,
        ];
    }

    /**
     * Send a /v2/charge request and categorize the outcome.
     *
     * - 2xx        → success, return the response for the caller to parse.
     * - 4xx        → PaymentClientException. Definitive failure (bad params,
     *                auth, business rule). Retrying the same payload won't help.
     * - 5xx        → PaymentServerException. Midtrans' own docs say this is
     *                temporary — the charge may have actually gone through.
     *                Caller MUST reconcile via getStatus()/reconcile() before
     *                deciding to retry.
     * - timeout    → PaymentTimeoutException. Same ambiguity as 5xx.
     *
     * @throws PaymentClientException
     * @throws PaymentServerException
     * @throws PaymentTimeoutException
     */
    private function sendCharge(string $orderId, array $body, ?string $idempotencyKey): Response
    {
        $startedAt = microtime(true);

        $this->logGatewayEvent('info', 'charge.request', [
            'order_id' => $orderId,
            'amount' => $body['transaction_details']['gross_amount'] ?? null,
            'payment_type' => $body['payment_type'] ?? null,
            'idempotency_key' => $idempotencyKey,
            'url' => "{$this->baseUrl()}/v2/charge",
        ]);

        try {
            $response = $this->http()
                ->withHeaders($idempotencyKey ? ['Idempotency-Key' => $idempotencyKey] : [])
                ->post("{$this->baseUrl()}/v2/charge", $body);
        } catch (ConnectionException $e) {
            $this->logGatewayEvent('warning', 'charge.timeout', [
                'order_id' => $orderId,
                'idempotency_key' => $idempotencyKey,
                'duration_ms' => (int) ((microtime(true) - $startedAt) * 1000),
                'error' => $e->getMessage(),
            ]);

            throw new PaymentTimeoutException("Midtrans connection failed: {$e->getMessage()}");
        }

        $httpStatus = $response->status();
        $durationMs = (int) ((microtime(true) - $startedAt) * 1000);
        $json = rescue(fn () => $response->json(), null, false);

        $this->log('debug', 'Charge response', $json ?? ['raw_body' => $response->body()]);

        if ($httpStatus >= 200 && $httpStatus < 300) {
            $this->logGatewayEvent('info', 'charge.success', [
                'order_id' => $orderId,
                'http_status' => $httpStatus,
                'duration_ms' => $durationMs,
                'has_qr_string' => ! empty($json['qr_string']),
                'has_va_numbers' => ! empty($json['va_numbers']),
                'transaction_status' => $json['transaction_status'] ?? null,
                'midtrans_id' => $json['transaction_id'] ?? null,
            ]);

            return $response;
        }

        $errorMessage = $json['status_message']
            ?? (isset($json['error_messages']) ? implode('; ', (array) $json['error_messages']) : null)
            ?? $response->body();

        if ($httpStatus >= 400 && $httpStatus < 500) {
            $this->logGatewayEvent('warning', 'charge.client_error', [
                'order_id' => $orderId,
                'idempotency_key' => $idempotencyKey,
                'http_status' => $httpStatus,
                'duration_ms' => $durationMs,
                'error_message' => $errorMessage,
            ]);

            throw new PaymentClientException($httpStatus, $json, "Midtrans charge rejected: {$errorMessage}");
        }

        // 5xx or any other unexpected status — treat as ambiguous/temporary.
        $this->logGatewayEvent('error', 'charge.server_error', [
            'order_id' => $orderId,
            'idempotency_key' => $idempotencyKey,
            'http_status' => $httpStatus,
            'duration_ms' => $durationMs,
            'error_message' => $errorMessage,
            'midtrans_id' => $json['id'] ?? null,
        ]);

        throw new PaymentServerException($httpStatus, $json, "Midtrans internal error: {$errorMessage}");
    }

    // ── handleCallback ────────────────────────────

    public function handleCallback(array $payload): array
    {
        return [
            'external_id' => $payload['order_id'] ?? '',
            'status' => $this->mapStatus($payload['transaction_status'] ?? ''),
            'payment_type' => $payload['payment_type'] ?? '',
            'amount' => (float) ($payload['gross_amount'] ?? 0),
            'raw' => $payload,
        ];
    }

    // ── getStatus ─────────────────────────────────

    public function getStatus(string $externalId): array
    {
        $response = $this->http()
            ->get("{$this->baseUrl()}/v2/{$externalId}/status");

        if ($response->failed()) {
            throw new \RuntimeException('Midtrans status check failed: '.$response->body());
        }

        $data = $response->json();

        return [
            'status' => $this->mapStatus($data['transaction_status'] ?? 'pending'),
            'payment_type' => $data['payment_type'] ?? '',
            'amount' => (float) ($data['gross_amount'] ?? 0),
            'raw' => $data,
        ];
    }

    /**
     * Reconcile a transaction's real status against Midtrans, used after a
     * 5xx/timeout to determine whether the charge actually went through
     * before deciding to mark it failed (and allow retry) or paid/pending.
     * Never throws — unexpected errors resolve to "not found" so the
     * caller can safely offer a retry.
     */
    public function reconcile(string $externalId): array
    {
        try {
            $response = $this->http()->get("{$this->baseUrl()}/v2/{$externalId}/status");

            if ($response->status() === 404) {
                $this->logGatewayEvent('info', 'reconcile.not_found', ['order_id' => $externalId]);

                return ['found' => false, 'status' => 'not_found', 'raw' => null];
            }

            if ($response->failed()) {
                $this->logGatewayEvent('warning', 'reconcile.error', [
                    'order_id' => $externalId,
                    'http_status' => $response->status(),
                ]);

                return ['found' => false, 'status' => 'not_found', 'raw' => rescue(fn () => $response->json(), null, false)];
            }

            $data = $response->json();
            $status = $this->mapStatus($data['transaction_status'] ?? 'pending');

            $this->logGatewayEvent('info', 'reconcile.found', [
                'order_id' => $externalId,
                'transaction_status' => $data['transaction_status'] ?? null,
                'resolved_status' => $status,
            ]);

            return ['found' => true, 'status' => $status, 'raw' => $data];
        } catch (\Throwable $e) {
            $this->logGatewayEvent('warning', 'reconcile.exception', [
                'order_id' => $externalId,
                'error' => $e->getMessage(),
            ]);

            return ['found' => false, 'status' => 'not_found', 'raw' => null];
        }
    }

    /**
     * Re-charge with the SAME order_id + idempotency_key to retrieve the
     * ORIGINAL charge response (including the qr_string / VA number).
     *
     * Midtrans' Status API (/v2/{id}/status) only returns transaction
     * status — it never includes the qr_string, which lives solely in the
     * original 201 /v2/charge response. When a 5xx forces us to reconcile
     * via Status API, we lose the QR payload. Replaying the charge with the
     * same Idempotency-Key makes Midtrans return the original response
     * verbatim WITHOUT creating a duplicate transaction — safe, no double
     * charge.
     *
     * MUST only be called after reconcile() confirmed the transaction
     * exists at Midtrans, and only with a non-empty idempotency key.
     *
     * @throws \RuntimeException when the gateway is still unreachable (5xx/timeout).
     */
    public function safeRecharge(string $orderId, string $idempotencyKey, int $amount, string $paymentType): array
    {
        $body = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => 'Customer',
            ],
            'item_details' => [[
                'id' => 'ITEM01',
                'price' => $amount,
                'quantity' => 1,
                'name' => 'Pembelian',
            ]],
        ];

        if ($paymentType === 'qris') {
            $body['payment_type'] = 'qris';
            $body['qris'] = ['acquirer' => 'gopay'];
        } elseif (in_array($paymentType, self::VA_METHODS, true)) {
            $bank = str_replace('_va', '', $paymentType);
            $body['payment_type'] = 'bank_transfer';
            $body['bank_transfer'] = ['bank' => $bank];
        } else {
            $body['payment_type'] = $paymentType;
            $body[$paymentType] = ['enable_callback' => true];
        }

        $this->logGatewayEvent('info', 'safe_recharge.request', [
            'order_id' => $orderId,
            'idempotency_key' => $idempotencyKey,
            'payment_type' => $paymentType,
        ]);

        $response = $this->http()
            ->withHeaders(['Idempotency-Key' => $idempotencyKey])
            ->post("{$this->baseUrl()}/v2/charge", $body);

        if ($response->failed()) {
            $this->logGatewayEvent('warning', 'safe_recharge.failed', [
                'order_id' => $orderId,
                'http_status' => $response->status(),
            ]);

            throw new \RuntimeException("Midtrans safe recharge failed: {$response->body()}");
        }

        $data = $response->json();

        $this->logGatewayEvent('info', 'safe_recharge.success', [
            'order_id' => $orderId,
            'has_qr_string' => ! empty($data['qr_string']),
            'has_va_numbers' => ! empty($data['va_numbers']),
        ]);

        return $data;
    }

    // ── verifySignature ───────────────────────────

    public function verifySignature(array $payload, string $rawBody = ''): bool
    {
        // Midtrans: SHA-512(order_id + status_code + gross_amount + server_key)
        $expected = hash('sha512',
            ($payload['order_id'] ?? '').
            ($payload['status_code'] ?? '').
            ($payload['gross_amount'] ?? '').
            $this->serverKey
        );

        return hash_equals($expected, $payload['signature_key'] ?? '');
    }
}
