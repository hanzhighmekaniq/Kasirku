<?php

namespace Database\Seeders\DevSeeder;

use App\Models\Store;
use App\Models\StorePaymentGateway;
use Illuminate\Database\Seeder;

class PaymentGatewaySeeder extends Seeder
{
    public function run(): void
    {
        // ─────────────────────────────────────────────────────────────
        //  GANTI NILAI DI BAWAH INI DENGAN KREDENTIAL ASLI MIDTRANS
        //  Setiap toko punya config sendiri (independen).
        //
        //  Environment:
        //    'sandbox'    = uji coba (test credentials)
        //    'production' = uang asli (live credentials)
        //
        //  enabled_methods: array tipe pembayaran yang diaktifkan.
        //    Pilihan: qris, gopay, shopeepay, dana, ovo,
        //             bca_va, mandiri_va, bri_va, bni_va, permata_va
        // ─────────────────────────────────────────────────────────────

        $gateways = [
            // ── STORE001 (Minimarket Sejahtera — Retail) ──
            'STORE001' => [
                'environment' => 'sandbox',
                'server_key' => 'YOUR_MIDTRANS_SERVER_KEY_STORE001',
                'client_key' => 'YOUR_MIDTRANS_CLIENT_KEY_STORE001',
                'merchant_id' => 'YOUR_MIDTRANS_MERCHANT_ID_STORE001',
                'enabled_methods' => [
                    'qris',
                    'gopay',
                    'shopeepay',
                    'dana',
                    'bca_va',
                    'mandiri_va',
                ],
            ],

            // ── STORE002 (Warung Kopi Senja — FnB) ──
            'STORE002' => [
                'environment' => 'sandbox',
                'server_key' => 'YOUR_MIDTRANS_SERVER_KEY_STORE002',
                'client_key' => 'YOUR_MIDTRANS_CLIENT_KEY_STORE002',
                'merchant_id' => 'YOUR_MIDTRANS_MERCHANT_ID_STORE002',
                'enabled_methods' => [
                    'qris',
                    'gopay',
                    'shopeepay',
                    'bca_va',
                ],
            ],
        ];

        foreach ($gateways as $storeCode => $config) {
            $store = Store::where('code', $storeCode)->first();
            if (! $store) {
                $this->command?->warn("Store {$storeCode} not found, skipping.");

                continue;
            }

            StorePaymentGateway::updateOrCreate(
                ['store_id' => $store->id, 'provider' => 'midtrans'],
                [
                    'is_active' => true,
                    'environment' => $config['environment'],
                    'server_key' => $config['server_key'],
                    'client_key' => $config['client_key'],
                    'merchant_id' => $config['merchant_id'],
                    'enabled_methods' => $config['enabled_methods'],
                ],
            );

            $this->command?->info("  + {$storeCode}: Midtrans gateway configured.");
        }
    }
}
