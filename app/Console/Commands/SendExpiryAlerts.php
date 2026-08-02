<?php

namespace App\Console\Commands;

use App\Models\ProductBatch;
use App\Models\Store;
use App\Models\User;
use App\Notifications\ExpiringProductAlert;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendExpiryAlerts extends Command
{
    protected $signature = 'alerts:expiry';

    protected $description = 'Kirim notifikasi produk yang akan kadaluarsa';

    public function handle(): int
    {
        $stores = Store::where('is_active', true)->get();
        $threshold = Carbon::now()->addDays(30);

        foreach ($stores as $store) {
            $batches = ProductBatch::where('store_id', $store->id)
                ->where('expiry_date', '<=', $threshold)
                ->where('expiry_date', '>', Carbon::now())
                ->where('quantity', '>', 0)
                ->with('product:id,name')
                ->orderBy('expiry_date')
                ->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'product_name' => $b->product?->name ?? 'Unknown',
                    'batch_number' => $b->batch_number,
                    'expiry_date' => $b->expiry_date->toDateString(),
                    'quantity' => (int) $b->quantity,
                ])
                ->toArray();

            if (empty($batches)) {
                continue;
            }

            $owners = User::whereHas('stores', fn ($q) => $q->where('stores.id', $store->id))
                ->whereHas('roles', fn ($q) => $q->where('name', 'owner'))
                ->get();

            foreach ($owners as $owner) {
                $owner->notify(new ExpiringProductAlert($batches, $store->id));
            }

            $this->info("Store {$store->name}: sent expiry alert for ".count($batches).' batches.');
        }

        return self::SUCCESS;
    }
}
