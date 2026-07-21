<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Store;
use Illuminate\Database\Seeder;

class FnbProductStockSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();
        $br2a = Branch::where('store_id', $store->id)->where('code', 'BR2A')->firstOrFail();
        $br2b = Branch::where('store_id', $store->id)->where('code', 'BR2B')->firstOrFail();

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->first();

        // [sku, qty_br2a, qty_br2b]
        $stocks = [
            ['F2-RM-001', 2000,  800],   // Biji Kopi Arabika (gram)
            ['F2-RM-002', 1500,  600],   // Biji Kopi Robusta (gram)
            ['F2-RM-003', 500,   200],   // Espresso Shot (ml)
            ['F2-RM-004', 8000,  4000],  // Susu Segar Full Cream (ml)
            ['F2-RM-005', 3000,  1500],  // Susu Oat (ml)
            ['F2-RM-006', 1000,  500],   // Krim Kental Whipped (ml)
            ['F2-RM-007', 600,   300],   // Sirup Vanila (ml)
            ['F2-RM-008', 600,   300],   // Sirup Caramel (ml)
            ['F2-RM-009', 500,   200],   // Bubuk Coklat (gram)
            ['F2-RM-010', 400,   200],   // Bubuk Matcha (gram)
            ['F2-RM-011', 10000, 5000],  // Es Batu (gram)
            ['F2-RM-012', 20000, 10000], // Air Mineral (ml)
            ['F2-RM-013', 60,    30],    // Roti Tawar (lembar)
            ['F2-RM-014', 50,    20],    // Telur Ayam (butir)
            ['F2-RM-015', 40,    20],    // Keju Cheddar Slice (lembar)
            ['F2-RM-016', 1000,  500],   // Daging Ayam Fillet (gram)
            ['F2-RM-017', 1500,  500],   // Boba Pearl (gram)
            ['F2-RM-018', 1000,  400],   // Jelly Cincau (gram)
            ['F2-RM-019', 3000,  1500],  // Gula Pasir (gram)
            ['F2-RM-020', 200,   100],   // Cup & Sedotan (pcs)
        ];

        foreach ($stocks as [$sku, $qtyBr2a, $qtyBr2b]) {
            $product = $pid($sku);
            if (! $product || ! $product->track_stock) {
                continue;
            }

            if ($qtyBr2a > 0) {
                ProductStock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'variant_id' => null,
                        'packaging_unit_id' => null,
                        'store_id' => $store->id,
                        'branch_id' => $br2a->id,
                    ],
                    [
                        'quantity' => $qtyBr2a,
                        'reserved_quantity' => 0,
                        'average_cost' => $product->cost_price,
                    ],
                );
            }

            if ($qtyBr2b > 0) {
                ProductStock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'variant_id' => null,
                        'packaging_unit_id' => null,
                        'store_id' => $store->id,
                        'branch_id' => $br2b->id,
                    ],
                    [
                        'quantity' => $qtyBr2b,
                        'reserved_quantity' => 0,
                        'average_cost' => $product->cost_price,
                    ],
                );
            }
        }
    }
}
