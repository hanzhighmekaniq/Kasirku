<?php

namespace App\Services\PaymentGateway;

use App\Models\PlatformPaymentGateway;
use Illuminate\Support\Facades\Cache;

class PaymentGatewayFactory
{
    /** Map provider slug → concrete class */
    private static array $map = [
        'midtrans' => MidtransGateway::class,
        'xendit' => XenditGateway::class,
        'doku' => DokuGateway::class,
        'duitku' => DuitkuGateway::class,
    ];

    /**
     * Buat instance gateway berdasarkan provider.
     * Config diambil dari akun PG platform (bukan per-store) — semua
     * pembayaran masuk ke rekening developer, lalu di-credit ke wallet
     * store masing-masing.
     * Config di-cache 10 menit agar tidak query DB setiap request.
     */
    public static function make(string $provider): PaymentGatewayInterface
    {
        $class = self::$map[$provider] ?? null;
        if (! $class) {
            throw new \InvalidArgumentException("Payment gateway provider '{$provider}' not supported.");
        }

        $config = Cache::remember(
            "platform_pg_config:{$provider}",
            600,
            fn () => PlatformPaymentGateway::where('provider', $provider)
                ->where('is_active', true)
                ->first()
        );

        if (! $config) {
            throw new \RuntimeException("Payment gateway '{$provider}' not configured or inactive.");
        }

        return new $class([
            'provider' => $provider,
            'server_key' => $config->server_key,
            'client_key' => $config->client_key,
            'merchant_id' => $config->merchant_id,
            'environment' => $config->environment,
            'enabled_methods' => $config->enabled_methods ?? [],
        ]);
    }

    /**
     * Flush cache saat config diupdate.
     */
    public static function flushCache(string $provider): void
    {
        Cache::forget("platform_pg_config:{$provider}");
    }

    /**
     * Daftar provider yang tersedia.
     */
    public static function availableProviders(): array
    {
        return array_keys(self::$map);
    }
}
