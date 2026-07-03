<?php

namespace App\Services\PaymentGateway;

use App\Models\PaymentGatewayTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class BasePaymentGateway implements PaymentGatewayInterface
{
    protected string $provider;
    protected string $serverKey;
    protected string $clientKey;
    protected string $merchantId;
    protected string $environment; // sandbox | production
    protected array  $enabledMethods;

    public function __construct(array $config)
    {
        $this->provider       = $config['provider'];
        $this->serverKey      = $config['server_key']      ?? '';
        $this->clientKey      = $config['client_key']      ?? '';
        $this->merchantId     = $config['merchant_id']     ?? '';
        $this->environment    = $config['environment']     ?? 'sandbox';
        $this->enabledMethods = $config['enabled_methods'] ?? [];
    }

    // ── HTTP helpers ───────────────────────────────

    protected function http(): \Illuminate\Http\Client\PendingRequest
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

    protected function saveTransaction(int $saleId, string $externalId, string $paymentType, float $amount, string $status, array $raw): PaymentGatewayTransaction
    {
        return PaymentGatewayTransaction::updateOrCreate(
            ['external_id' => $externalId],
            [
                'sale_id'      => $saleId,
                'provider'     => $this->provider,
                'payment_type' => $paymentType,
                'status'       => $status,
                'amount'       => $amount,
                'raw_response' => $raw,
            ]
        );
    }

    protected function mapStatus(string $providerStatus): string
    {
        return match (strtolower($providerStatus)) {
            'capture', 'settlement', 'paid', 'success'
                => 'paid',
            'pending', 'authorize'
                => 'pending',
            'deny', 'cancel', 'failure', 'failed'
                => 'failed',
            'expire', 'expired'
                => 'expired',
            default => 'pending',
        };
    }

    protected function log(string $level, string $message, array $context = []): void
    {
        Log::channel('daily')->{$level}("[{$this->provider}] {$message}", $context);
    }
}
