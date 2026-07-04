<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use App\Models\Store;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Set metode pembayaran default untuk setiap store.
     * Semua store mendapat: Tunai (wajib) + metode umum.
     * Store tertentu mendapat metode tambahan sesuai tipe.
     */
    public function run(): void
    {
        $stores = Store::all();

        foreach ($stores as $store) {
            $this->seedForStore($store->id, $store->store_type);
        }
    }

    private function seedForStore(int $storeId, string $storeType): void
    {
        // Skip jika sudah ada (idempotent)
        if (PaymentMethod::where('store_id', $storeId)->exists()) {
            $this->command?->line("  [skip] store_id={$storeId} sudah punya payment methods");
            return;
        }

        $methods = $this->methodsForType($storeType);

        foreach ($methods as $i => $m) {
            PaymentMethod::create(array_merge($m, [
                'code'       => $m['code'] . '_' . $storeId,  // unique per store
                'store_id'   => $storeId,
                'sort_order' => $i + 1,
                'is_active'  => true,
            ]));
        }

        $this->command?->line("  ✔ store_id={$storeId} ({$storeType}): " . count($methods) . " methods");
    }

    /**
     * Daftar metode pembayaran default per store type.
     * Semua tipe mendapat Tunai + QRIS sebagai minimum.
     */
    private function methodsForType(string $storeType): array
    {
        // Base methods — semua store
        $base = [
            ['code' => 'CASH',     'name' => 'Tunai',            'type' => 'cash',     'provider' => null],
            ['code' => 'QRIS',     'name' => 'QRIS',             'type' => 'digital',  'provider' => 'QRIS'],
            ['code' => 'TRANSFER', 'name' => 'Transfer Bank',    'type' => 'transfer', 'provider' => null],
        ];

        // Tambahan per tipe
        $extra = match ($storeType) {
            'retail' => [
                ['code' => 'DEBIT',    'name' => 'Kartu Debit',  'type' => 'card',    'provider' => null],
                ['code' => 'CREDIT',   'name' => 'Kartu Kredit', 'type' => 'card',    'provider' => null],
                ['code' => 'GOPAY',    'name' => 'GoPay',        'type' => 'ewallet', 'provider' => 'Gojek'],
                ['code' => 'OVO',      'name' => 'OVO',          'type' => 'ewallet', 'provider' => 'OVO'],
            ],
            'fnb' => [
                ['code' => 'DEBIT',    'name' => 'Kartu Debit',  'type' => 'card',    'provider' => null],
                ['code' => 'GOPAY',    'name' => 'GoPay',        'type' => 'ewallet', 'provider' => 'Gojek'],
                ['code' => 'OVO',      'name' => 'OVO',          'type' => 'ewallet', 'provider' => 'OVO'],
                ['code' => 'DANA',     'name' => 'DANA',         'type' => 'ewallet', 'provider' => 'DANA'],
            ],
            'service' => [
                ['code' => 'DEBIT',    'name' => 'Kartu Debit',  'type' => 'card',    'provider' => null],
                ['code' => 'GOPAY',    'name' => 'GoPay',        'type' => 'ewallet', 'provider' => 'Gojek'],
            ],
            'laundry' => [
                ['code' => 'DEBIT',    'name' => 'Kartu Debit',  'type' => 'card',    'provider' => null],
            ],
            'rental', 'ticket', 'hospitality', 'session', 'parking' => [
                ['code' => 'DEBIT',    'name' => 'Kartu Debit',  'type' => 'card',    'provider' => null],
                ['code' => 'GOPAY',    'name' => 'GoPay',        'type' => 'ewallet', 'provider' => 'Gojek'],
            ],
            default => [],
        };

        return array_merge($base, $extra);
    }
}
