<?php

namespace Database\Seeders\DevSeeder;

use App\Models\PlatformPaymentGateway;
use Illuminate\Database\Seeder;

class PlatformPaymentGatewaySeeder extends Seeder
{
    /**
     * Seed konfigurasi Payment Gateway platform (untuk transaksi plan order + kasir).
     *
     * Semua pembayaran masuk ke rekening platform, lalu di-credit ke wallet
     * store masing-masing via StoreWallet::credit().
     */
    public function run(): void
    {
        PlatformPaymentGateway::updateOrCreate(
            ['provider' => 'midtrans'],
            [
                'is_active' => true,
                'environment' => 'sandbox',
                'server_key' => 'YOUR_MIDTRANS_SERVER_KEY',
                'client_key' => 'YOUR_MIDTRANS_CLIENT_KEY',
                'merchant_id' => 'YOUR_MIDTRANS_MERCHANT_ID',
                'enabled_methods' => [
                    'qris',
                    'gopay',
                    'shopeepay',
                    'dana',
                    'ovo',
                    'bca_va',
                    'mandiri_va',
                    'bri_va',
                    'bni_va',
                    'permata_va',
                ],
                'plan_order_mode' => 'auto',
            ],
        );

        $this->command?->info('  ✔ Platform Payment Gateway (Midtrans) configured.');
    }
}
