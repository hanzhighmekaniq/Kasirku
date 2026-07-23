<?php

namespace App\Console\Commands;

use App\Models\PaymentMethod;
use App\Models\Store;
use Illuminate\Console\Command;

class EnsureCashPaymentMethod extends Command
{
    protected $signature = 'payment-methods:ensure-cash';

    protected $description = 'Pastikan setiap toko punya metode wajib (Tunai & Hutang/Kasbon). Jalankan sekali setelah deploy.';

    /**
     * Metode wajib yang harus ada di setiap toko.
     *
     * @var array<string, array{code_prefix: string, name: string, sort_order: int}>
     */
    private const REQUIRED_TYPES = [
        'cash' => ['code_prefix' => 'CASH', 'name' => 'Tunai', 'sort_order' => 0],
        'debt' => ['code_prefix' => 'DEBT', 'name' => 'Hutang / Kasbon', 'sort_order' => 1],
    ];

    public function handle(): int
    {
        $stores = Store::all();
        $created = 0;

        foreach ($stores as $store) {
            foreach (self::REQUIRED_TYPES as $type => $meta) {
                $exists = PaymentMethod::where('store_id', $store->id)
                    ->where('type', $type)
                    ->exists();

                if (! $exists) {
                    PaymentMethod::create([
                        'store_id' => $store->id,
                        'code' => $meta['code_prefix'].'_'.$store->id,
                        'name' => $meta['name'],
                        'type' => $type,
                        'is_active' => true,
                        'sort_order' => $meta['sort_order'],
                    ]);
                    $created++;
                    $this->line("  + Toko #{$store->id} ({$store->name}): {$meta['name']} dibuat.");
                }
            }
        }

        if ($created === 0) {
            $this->info('Semua toko sudah punya metode wajib (Tunai & Hutang/Kasbon).');
        } else {
            $this->info("Selesai: {$created} metode wajib dibuat.");
        }

        return self::SUCCESS;
    }
}
