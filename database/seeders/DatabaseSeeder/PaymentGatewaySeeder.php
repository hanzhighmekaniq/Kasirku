<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Store;
use App\Models\StorePaymentGateway;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Database\Seeder;

/**
 * Seed konfigurasi payment gateway per toko.
 *
 * Cara pakai:
 *   1. Isi kredensial di array $config di bawah.
 *   2. Jalankan: php artisan db:seed --class="Database\Seeders\DatabaseSeeder\PaymentGatewaySeeder"
 *   3. Cache di-flush otomatis setelah seeder selesai.
 *
 * Provider yang didukung: midtrans, xendit, doku, duitku
 *
 * Xendit — cara mendapatkan API key:
 *   - Daftar di https://dashboard.xendit.co/register (tidak perlu verifikasi bisnis)
 *   - Login → Settings → API Keys → copy Secret Key
 *   - Test key format : xnd_development_XXXXXXXXXXXXXXXXXXXXXXXXXX
 *   - Production key  : xnd_production_XXXXXXXXXXXXXXXXXXXXXXXXXX
 *   - Xendit TIDAK pakai client_key dan merchant_id
 *
 * Midtrans — cara mendapatkan API key:
 *   - Login ke https://dashboard.sandbox.midtrans.com
 *   - Settings → Access Keys → copy Server Key & Client Key
 *   - Sandbox key format: SB-Mid-server-XXXX / SB-Mid-client-XXXX
 */
class PaymentGatewaySeeder extends Seeder
{
    public function run(): void
    {
        // ─────────────────────────────────────────────────────────────────
        //  Konfigurasi per toko.
        //
        //  Format:
        //    'KODE_TOKO' => [
        //        'provider'        => 'xendit' | 'midtrans' | 'doku' | 'duitku'
        //        'environment'     => 'sandbox' | 'production'
        //        'server_key'      => '...'   ← API key / Server key
        //        'client_key'      => '...'   ← Client key (Midtrans) / kosong untuk Xendit
        //        'merchant_id'     => '...'   ← Merchant ID (Midtrans) / kosong untuk Xendit
        //        'enabled_methods' => [...]   ← Daftar metode pembayaran aktif
        //    ]
        //
        //  Metode Xendit yang didukung:
        //    qris, bca_va, mandiri_va, bri_va, bni_va, gopay, ovo, dana
        //
        //  Metode Midtrans yang didukung:
        //    qris, gopay, shopeepay, dana, ovo, bca_va, mandiri_va, bri_va, bni_va, permata_va
        // ─────────────────────────────────────────────────────────────────

        $config = [
            // ── STORE001 ──────────────────────────────────────────────────
            'STORE001' => [
                'provider' => 'xendit',
                'environment' => 'sandbox',
                'server_key' => 'xnd_development_GANTI_DENGAN_KEY_XENDIT_KAMU',
                'client_key' => '',
                'merchant_id' => '',
                'enabled_methods' => ['qris', 'bca_va', 'bni_va', 'gopay', 'ovo', 'dana'],
            ],

            // ── STORE002 ──────────────────────────────────────────────────
            'STORE002' => [
                'provider' => 'xendit',
                'environment' => 'sandbox',
                'server_key' => 'xnd_development_GANTI_DENGAN_KEY_XENDIT_KAMU',
                'client_key' => '',
                'merchant_id' => '',
                'enabled_methods' => ['qris', 'bca_va', 'gopay', 'dana'],
            ],
        ];

        foreach ($config as $storeCode => $cfg) {
            $store = Store::where('code', $storeCode)->first();

            if (! $store) {
                $this->command?->warn("  ! Store {$storeCode} tidak ditemukan, dilewati.");

                continue;
            }

            // Nonaktifkan semua gateway lain untuk toko ini terlebih dulu
            // supaya hanya 1 gateway aktif (sesuai constraint bisnis).
            StorePaymentGateway::where('store_id', $store->id)
                ->where('provider', '!=', $cfg['provider'])
                ->update(['is_active' => false]);

            StorePaymentGateway::updateOrCreate(
                [
                    'store_id' => $store->id,
                    'provider' => $cfg['provider'],
                ],
                [
                    'is_active' => true,
                    'environment' => $cfg['environment'],
                    'server_key' => $cfg['server_key'],
                    'client_key' => $cfg['client_key'] ?: null,
                    'merchant_id' => $cfg['merchant_id'] ?: null,
                    'enabled_methods' => $cfg['enabled_methods'],
                ],
            );

            // Flush cache supaya perubahan langsung efektif
            PaymentGatewayFactory::flushCache($store->id, $cfg['provider']);

            $this->command?->info("  + {$storeCode}: {$cfg['provider']} ({$cfg['environment']}) dikonfigurasi.");
        }
    }
}
