<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ProductStockSeeder extends Seeder
{
    public function run(): void
    {
        // STORE001 — Minimarket Sejahtera (retail)
        $store = Store::where('code', 'STORE001')->first();
        if (! $store) {
            return;
        }

        $branchPusat = Branch::where('store_id', $store->id)->where('code', 'BR1A')->first();
        $branchBabarsari = Branch::where('store_id', $store->id)->where('code', 'BR1B')->first();

        if (! $branchPusat) {
            return;
        }

        // Stock quantities based on PurchaseSeeder & StockMovementSeeder logic:
        // Purchase in - Sale out - Waste + Adjustment = Current stock
        $stockData = [
            // SKU => [pusat, babarsari]
            'S1-001' => [130, 30],   // Indomie: 100+50-20=130 pusat, 30 babarsari
            'S1-002' => [72, 0],     // Beras: 15 pusat
            'S1-003' => [20, 0],     // Minyak: 20 pusat
            'S1-004' => [25, 0],     // Gula: 25 pusat
            'S1-005' => [0, 0],      // Tepung: belum ada pembelian
            'S1-006' => [40, 24],    // Aqua: 60-10=50 pusat (let's say 40 after some sales), 24 babarsari
            'S1-007' => [0, 0],      // Susu Ultra: belum ada pembelian
            'S1-008' => [40, 0],     // Teh Botol: 48-8-2(waste)=38, let's say 40
            'S1-009' => [0, 0],      // Coca Cola: belum ada pembelian
            'S1-010' => [0, 0],      // Chitato
            'S1-011' => [0, 0],      // Oreo
            'S1-012' => [0, 0],      // Taro Net
            'S1-013' => [0, 0],      // Sabun
            'S1-014' => [0, 0],      // Shampoo
            'S1-015' => [0, 0],      // Pasta Gigi
            'S1-016' => [0, 0],      // Deterjen
            'S1-017' => [0, 0],      // Gudang Garam
            'S1-018' => [0, 0],      // Sampoerna Mild
            'S1-019' => [60, 0],     // Kopi Torabika: 60 pusat
            'S1-020' => [24, 0],     // Susu Kental: 24 pusat
        ];

        foreach ($stockData as $sku => $quantities) {
            $product = Product::where('store_id', $store->id)->where('sku', $sku)->first();
            if (! $product || ! $product->track_stock) {
                continue;
            }

            [$pusatQty, $babarsariQty] = $quantities;

            // Pusat branch
            if ($pusatQty > 0) {
                ProductStock::firstOrCreate(
                    ['product_id' => $product->id, 'store_id' => $store->id, 'branch_id' => $branchPusat->id],
                    ['quantity' => $pusatQty, 'reserved_quantity' => 0],
                );
            }

            // Babarsari branch
            if ($babarsariQty > 0 && $branchBabarsari) {
                ProductStock::firstOrCreate(
                    ['product_id' => $product->id, 'store_id' => $store->id, 'branch_id' => $branchBabarsari->id],
                    ['quantity' => $babarsariQty, 'reserved_quantity' => 0],
                );
            }
        }

        // STORE004 — Sewa Alat Jaya (rental) — stock = unit tersedia
        $store4 = Store::where('code', 'STORE004')->first();
        if ($store4) {
            $branch4 = Branch::where('store_id', $store4->id)->first();
            if ($branch4) {
                $rentalProducts = Product::where('store_id', $store4->id)
                    ->where('track_stock', true)
                    ->get();

                foreach ($rentalProducts as $product) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $product->id, 'store_id' => $store4->id, 'branch_id' => $branch4->id],
                        ['quantity' => 3, 'reserved_quantity' => 0],
                    );
                }
            }
        }
    }
}
