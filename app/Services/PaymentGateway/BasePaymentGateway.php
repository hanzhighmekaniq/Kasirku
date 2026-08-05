<?php

namespace App\Services\PaymentGateway;

use App\Models\PaymentGatewayTransaction;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class BasePaymentGateway implements PaymentGatewayInterface
{
    protected string $provider;

    protected string $serverKey;

    protected string $clientKey;

    protected string $merchantId;

    protected string $environment; // sandbox | production

    protected array $enabledMethods;

    public function __construct(array $config)
    {
        $this->provider = $config['provider'];
        $this->serverKey = $config['server_key'] ?? '';
        $this->clientKey = $config['client_key'] ?? '';
        $this->merchantId = $config['merchant_id'] ?? '';
        $this->environment = $config['environment'] ?? 'sandbox';
        $this->enabledMethods = $config['enabled_methods'] ?? [];
    }

    // ── HTTP helpers ───────────────────────────────

    protected function http(): PendingRequest
    {
        return Http::withBasicAuth($this->serverKey, '')
            ->acceptJson()
            ->asJson()
            ->timeout(30);
    }

    protected function baseUrl(): string
    {
        return $this->environment === 'production'
            ? $this->productionBaseUrl()
            : $this->sandboxBaseUrl();
    }

    abstract protected function sandboxBaseUrl(): string;

    abstract protected function productionBaseUrl(): string;

    // ── Persistence helpers ────────────────────────

    protected function saveTransaction(?int $saleId, string $externalId, string $paymentType, float $amount, string $status, array $raw, ?int $planOrderId = null): PaymentGatewayTransaction
    {
        return PaymentGatewayTransaction::updateOrCreate(
            ['external_id' => $externalId],
            [
                'sale_id' => $saleId,
                'plan_order_id' => $planOrderId,
                'provider' => $this->provider,
                'payment_type' => $paymentType,
                'status' => $status,
                'amount' => $amount,
                'raw_response' => $raw,
            ]
        );
    }

    protected function mapStatus(string $providerStatus): string
    {
        return match (strtolower($providerStatus)) {
            'capture', 'settlement', 'paid', 'success' => 'paid',
            'pending', 'authorize' => 'pending',
            'deny', 'cancel', 'failure', 'failed' => 'failed',
            'expire', 'expired' => 'expired',
            default => 'pending',
        };
    }

    /**
     * Default reconcile: gunakan getStatus sebagai fallback.
     * Gateway yang punya API reconcile khusus (seperti Midtrans) sebaiknya override method ini.
     */
    public function reconcile(string $externalId): array
    {
        try {
            $result = $this->getStatus($externalId);

            return ['found' => true, 'status' => $result['status'], 'raw' => $result['raw'] ?? null];
        } catch (\Throwable) {
            return ['found' => false, 'status' => 'not_found', 'raw' => null];
        }
    }

    protected function log(string $level, string $message, array $context = []): void
    {
        Log::channel('daily')->{$level}("[{$this->provider}] {$message}", $context);
    }

    /**
     * Structured logging for gateway charge attempts/errors. Never pass
     * server_key/client_key or other credentials in $context — only
     * order/transaction identifiers, HTTP status, timing, and error
     * codes/messages.
     */
    protected function logGatewayEvent(string $level, string $event, array $context = []): void
    {
        Log::channel('daily')->{$level}("[PG:{$this->provider}] {$event}", array_merge($context, [
            'provider' => $this->provider,
            'environment' => $this->environment,
            'timestamp' => now()->toISOString(),
        ]));
    }
}
