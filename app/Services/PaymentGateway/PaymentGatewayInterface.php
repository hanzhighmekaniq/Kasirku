<?php

namespace App\Services\PaymentGateway;

interface PaymentGatewayInterface
{
    /**
     * Buat transaksi di provider dan kembalikan data pembayaran.
     *
     * @param  array  $params  ['order_id','amount','customer','items','payment_type',...]
     * @return array ['payment_url','qr_code','va_number','external_id','payment_type']
     */
    public function createTransaction(array $params): array;

    /**
     * Proses callback/webhook dari provider.
     *
     * @param  array  $payload  Raw request data dari provider
     * @return array ['external_id', 'status', 'payment_type', 'amount', 'raw']
     */
    public function handleCallback(array $payload): array;

    /**
     * Cek status transaksi berdasarkan external_id.
     *
     * @return array ['status', 'payment_type', 'amount', 'raw']
     */
    public function getStatus(string $externalId): array;

    /**
     * Verifikasi signature webhook dari provider.
     */
    public function verifySignature(array $payload, string $rawBody = ''): bool;

    /**
     * Reconcile transaksi setelah 5xx/timeout.
     * Cek status aktual di provider untuk menentukan apakah charge berhasil.
     *
     * @return array ['found' => bool, 'status' => string, 'raw' => array|null]
     */
    public function reconcile(string $externalId): array;
}
