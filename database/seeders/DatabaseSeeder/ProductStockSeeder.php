<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductPackagingUnit;
use App\Models\ProductStock;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ProductStockSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->first();
        if (! $store) {
            return;
        }

        $branchPusat = Branch::where('store_id', $store->id)->where('code', 'BR1A')->first();
        $branchBabarsari = Branch::where('store_id', $store->id)->where('code', 'BR1B')->first();
        if (! $branchPusat) {
            return;
        }

        // Helper: product by SKU
        $prod = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->first();

        // ══════════════════════════════════════════════════════════════
        // PRODUK DENGAN VARIANT — stok per variant
        // ══════════════════════════════════════════════════════════════

        // Indomie Goreng — variant Original, Rendang, Soto
        $p1 = $prod('S1-001');
        if ($p1) {
            $variants = ProductVariant::where('product_id', $p1->id)->get();
            $stockPerVariant = ['Original' => [80, 20], 'Rendang' => [50, 15], 'Soto' => [40, 10]];

            foreach ($variants as $v) {
                [$pusat, $babarsari] = $stockPerVariant[$v->name] ?? [0, 0];

                // Bucket: product + variant + no unit
                if ($pusat > 0) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $p1->id, 'variant_id' => $v->id, 'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branchPusat->id],
                        ['quantity' => $pusat, 'reserved_quantity' => 0, 'average_cost' => $v->cost_price],
                    );
                }
                if ($babarsari > 0 && $branchBabarsari) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $p1->id, 'variant_id' => $v->id, 'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branchBabarsari->id],
                        ['quantity' => $babarsari, 'reserved_quantity' => 0, 'average_cost' => $v->cost_price],
                    );
                }

                // Bucket: product + variant + Dus
                $dus = ProductPackagingUnit::where('product_id', $p1->id)->where('variant_id', $v->id)->where('name', 'Dus')->first();
                if ($dus) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $p1->id, 'variant_id' => $v->id, 'packaging_unit_id' => $dus->id, 'store_id' => $store->id, 'branch_id' => $branchPusat->id],
                        ['quantity' => 5, 'reserved_quantity' => 0, 'average_cost' => $v->cost_price * $dus->conversion_qty],
                    );
                }
            }
        }

        // Susu Ultra — variant Full Cream, Coklat, Strawberry
        $p2 = $prod('S1-007');
        if ($p2) {
            $variants = ProductVariant::where('product_id', $p2->id)->get();
            $stockPerVariant = ['Full Cream' => [30, 12], 'Coklat' => [24, 12], 'Strawberry' => [18, 6]];

            foreach ($variants as $v) {
                [$pusat, $babarsari] = $stockPerVariant[$v->name] ?? [0, 0];
                if ($pusat > 0) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $p2->id, 'variant_id' => $v->id, 'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branchPusat->id],
                        ['quantity' => $pusat, 'reserved_quantity' => 0, 'average_cost' => $v->cost_price],
                    );
                }
                if ($babarsari > 0 && $branchBabarsari) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $p2->id, 'variant_id' => $v->id, 'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branchBabarsari->id],
                        ['quantity' => $babarsari, 'reserved_quantity' => 0, 'average_cost' => $v->cost_price],
                    );
                }
            }
        }

        // Teh Botol — variant Original, Less Sugar
        $p3 = $prod('S1-008');
        if ($p3) {
            $variants = ProductVariant::where('product_id', $p3->id)->get();
            $stockPerVariant = ['Original' => [40, 12], 'Less Sugar' => [20, 6]];

            foreach ($variants as $v) {
                [$pusat, $babarsari] = $stockPerVariant[$v->name] ?? [0, 0];
                if ($pusat > 0) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $p3->id, 'variant_id' => $v->id, 'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branchPusat->id],
                        ['quantity' => $pusat, 'reserved_quantity' => 0, 'average_cost' => $v->cost_price],
                    );
                }
                if ($babarsari > 0 && $branchBabarsari) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $p3->id, 'variant_id' => $v->id, 'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branchBabarsari->id],
                        ['quantity' => $babarsari, 'reserved_quantity' => 0, 'average_cost' => $v->cost_price],
                    );
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // PRODUK TANPA VARIANT — stok langsung
        // ══════════════════════════════════════════════════════════════

        $simpleProducts = [
            'S1-002' => [72, 0],   // Beras
            'S1-003' => [20, 0],   // Minyak
            'S1-004' => [25, 0],   // Gula
            'S1-005' => [0, 0],    // Tepung
            'S1-006' => [40, 24],  // Aqua
            'S1-009' => [24, 12],  // Coca Cola
            'S1-010' => [20, 0],   // Chitato
            'S1-011' => [15, 0],   // Oreo
            'S1-012' => [30, 0],   // Taro Net
            'S1-013' => [12, 0],   // Sabun
            'S1-014' => [10, 0],   // Shampoo
            'S1-015' => [10, 0],   // Pasta Gigi
            'S1-016' => [8, 0],    // Deterjen
            'S1-017' => [20, 0],   // Gudang Garam
            'S1-018' => [15, 0],   // Sampoerna Mild
            'S1-019' => [60, 0],   // Kopi Torabika
            'S1-020' => [24, 0],   // Susu Kental
        ];

        foreach ($simpleProducts as $sku => [$pusat, $babarsari]) {
            $product = $prod($sku);
            if (! $product || ! $product->track_stock) {
                continue;
            }

            if ($pusat > 0) {
                ProductStock::firstOrCreate(
                    ['product_id' => $product->id, 'variant_id' => null, 'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branchPusat->id],
                    ['quantity' => $pusat, 'reserved_quantity' => 0, 'average_cost' => $product->cost_price],
                );
            }
            if ($babarsari > 0 && $branchBabarsari) {
                ProductStock::firstOrCreate(
                    ['product_id' => $product->id, 'variant_id' => null, 'packaging_unit_id' => null, 'store_id' => $store->id, 'branch_id' => $branchBabarsari->id],
                    ['quantity' => $babarsari, 'reserved_quantity' => 0, 'average_cost' => $product->cost_price],
                );
            }

            // Multi-satuan: buat bucket Dus untuk Aqua
            if ($sku === 'S1-006') {
                $dus = ProductPackagingUnit::where('product_id', $product->id)->where('name', 'Dus')->first();
                if ($dus) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $product->id, 'variant_id' => null, 'packaging_unit_id' => $dus->id, 'store_id' => $store->id, 'branch_id' => $branchPusat->id],
                        ['quantity' => 5, 'reserved_quantity' => 0, 'average_cost' => $product->cost_price * $dus->conversion_qty],
                    );
                }
            }

            // Multi-satuan: buat bucket Sak untuk Beras
            if ($sku === 'S1-002') {
                $sak = ProductPackagingUnit::where('product_id', $product->id)->where('name', 'Sak')->first();
                if ($sak) {
                    ProductStock::firstOrCreate(
                        ['product_id' => $product->id, 'variant_id' => null, 'packaging_unit_id' => $sak->id, 'store_id' => $store->id, 'branch_id' => $branchPusat->id],
                        ['quantity' => 3, 'reserved_quantity' => 0, 'average_cost' => $product->cost_price * $sak->conversion_qty],
                    );
                }
            }
        }
    }
}
