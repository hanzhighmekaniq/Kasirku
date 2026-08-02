<?php

namespace App\Console\Commands;

use App\Models\Store;
use App\Models\User;
use App\Notifications\LowStockAlert;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendLowStockAlerts extends Command
{
    protected $signature = 'alerts:low-stock';

    protected $description = 'Kirim notifikasi stok menipis ke owner setiap toko';

    public function handle(): int
    {
        $stores = Store::where('is_active', true)->get();

        foreach ($stores as $store) {
            $lowStockProducts = DB::table('product_stocks')
                ->join('products', 'product_stocks.product_id', '=', 'products.id')
                ->where('product_stocks.store_id', $store->id)
                ->where('products.is_active', true)
                ->where('products.track_stock', true)
                ->whereRaw('(product_stocks.quantity - product_stocks.reserved_quantity) <= products.stock_minimum')
                ->select(
                    'products.id',
                    'products.name',
                    'products.stock_minimum',
                    DB::raw('SUM(product_stocks.quantity - product_stocks.reserved_quantity) as current_stock'),
                )
                ->groupBy('products.id', 'products.name', 'products.stock_minimum')
                ->having('current_stock', '>', 0)
                ->get()
                ->toArray();

            if (empty($lowStockProducts)) {
                continue;
            }

            $products = array_map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'current_stock' => (int) $p->current_stock,
                'stock_minimum' => (int) $p->stock_minimum,
            ], $lowStockProducts);

            $owners = User::whereHas('stores', fn ($q) => $q->where('stores.id', $store->id))
                ->whereHas('roles', fn ($q) => $q->where('name', 'owner'))
                ->get();

            foreach ($owners as $owner) {
                $owner->notify(new LowStockAlert($products, $store->id));
            }

            $this->info("Store {$store->name}: sent low stock alert for ".count($products).' products.');
        }

        return self::SUCCESS;
    }
}
