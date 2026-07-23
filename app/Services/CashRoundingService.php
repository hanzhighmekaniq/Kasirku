<?php

namespace App\Services;

class CashRoundingService
{
    /**
     * Hitung pembulatan.
     *
     * @param  float  $amount  Nominal asli
     * @param  int  $nearest  Kelipatan pembulatan (misal 100, 500, 1000)
     * @param  string  $mode  nearest | up | down | custom
     * @param  float|null  $customValue  Nominal custom (hanya untuk mode 'custom')
     * @return array{rounded: float, adjustment: float}
     */
    public function round(
        float $amount,
        int $nearest,
        string $mode = 'nearest',
        ?float $customValue = null,
    ): array {
        $nearest = max(1, $nearest);

        switch ($mode) {
            case 'up':
                $rounded = (float) ceil($amount / $nearest) * $nearest;
                break;

            case 'down':
                $rounded = (float) floor($amount / $nearest) * $nearest;
                break;

            case 'custom':
                if ($customValue !== null) {
                    $rounded = $customValue;
                } else {
                    $rounded = round($amount / $nearest) * $nearest;
                }
                break;

            default: // 'nearest'
                $rounded = (float) round($amount / $nearest) * $nearest;
                break;
        }

        return [
            'rounded' => $rounded,
            'adjustment' => $rounded - $amount,
        ];
    }

    /**
     * Validasi nilai custom berada dalam batas wajar.
     * Batas: selisih absolut dari nominal asli tidak boleh melebihi $nearest.
     */
    public function validateCustom(
        float $customValue,
        float $originalAmount,
        int $nearest,
    ): bool {
        return abs($customValue - $originalAmount) <= $nearest;
    }

    /**
     * Hitung ulang pembulatan dari data transaksi.
     * Dipakai server-side untuk tidak percaya kiriman client.
     *
     * @param  float  $amount  Nominal asli (grand total sebelum pembulatan)
     * @param  string  $paymentType  Tipe metode bayar (cash, digital, card, dll)
     * @param  int  $nearest  Kelipatan dari setting toko
     * @param  string  $mode  nearest | up | down | custom
     * @param  float|null  $customValue  Nilai custom dari kasir
     * @return array{rounded: float, adjustment: float, mode: string, nearest: int}
     */
    public function calculateForPayment(
        float $amount,
        string $paymentType,
        int $nearest,
        string $mode = 'nearest',
        ?float $customValue = null,
    ): array {
        // Pembulatan HANYA berlaku untuk tunai
        if ($paymentType !== 'cash') {
            return [
                'rounded' => $amount,
                'adjustment' => 0.0,
                'mode' => null,
                'nearest' => null,
            ];
        }

        // Validasi mode
        $validModes = ['nearest', 'up', 'down', 'custom'];
        if (! in_array($mode, $validModes, true)) {
            $mode = 'nearest';
        }

        // Validasi custom value
        if ($mode === 'custom' && $customValue !== null) {
            if (! $this->validateCustom($customValue, $amount, $nearest)) {
                // Custom di luar batas — fallback ke nearest
                $mode = 'nearest';
                $customValue = null;
            }
        }

        $result = $this->round($amount, $nearest, $mode, $customValue);

        return [
            'rounded' => $result['rounded'],
            'adjustment' => $result['adjustment'],
            'mode' => $mode,
            'nearest' => $nearest,
        ];
    }
}
