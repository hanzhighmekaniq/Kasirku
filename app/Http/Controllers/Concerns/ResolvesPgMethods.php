<?php

namespace App\Http\Controllers\Concerns;

use App\Models\PlatformPaymentGateway;

/**
 * Shared helper untuk resolve metode Payment Gateway aktif dari config platform.
 *
 * Digunakan oleh KasirController dan KasirPaymentController.
 */
trait ResolvesPgMethods
{
    /**
     * Ambil daftar metode PG aktif dari config platform (dikelola developer).
     *
     * @return array<int, array{provider: string, payment_type: string}>
     */
    protected function getActivePgMethods(int $storeId): array
    {
        $gateways = PlatformPaymentGateway::where('is_active', true)->get();

        $methods = [];
        foreach ($gateways as $gw) {
            foreach ($gw->enabled_methods ?? [] as $method) {
                $methods[] = [
                    'provider' => $gw->provider,
                    'payment_type' => $method,
                ];
            }
        }

        return $methods;
    }
}
