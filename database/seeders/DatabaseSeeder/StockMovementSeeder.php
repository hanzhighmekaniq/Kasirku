<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\Store;
use Illuminate\Database\Seeder;

class StockMovementSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->first();
        if (! $store) {
            return;
        }

        $branchPusat = Branch::where('store_id', $store->id)->where('code', 'BR1A')->value('id');
        $branchBabarsari = Branch::where('store_id', $store->id)->where('code', 'BR1B')->value('id');

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->value('id');
        $vid = fn ($sku, $name) => ProductVariant::whereHas('product', fn ($q) => $q->where('store_id', $store->id)->where('sku', $sku))->where('name', $name)->value('id');

        $movements = [
            // Pembelian masuk — Indomie variant Original
            [
                'product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'),
                'movement_type' => 'purchase_in', 'quantity' => 100, 'unit_cost' => 2800,
                'reference_no' => 'PO-20260705-001', 'notes' => 'Pembelian Indomie Original',
                'moved_at' => '2026-07-05 09:00:00',
            ],
            // Pembelian masuk — Indomie variant Rendang
            [
                'product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Rendang'),
                'movement_type' => 'purchase_in', 'quantity' => 50, 'unit_cost' => 3200,
                'reference_no' => 'PO-20260705-001', 'notes' => 'Pembelian Indomie Rendang',
                'moved_at' => '2026-07-05 09:00:00',
            ],
            // Pembelian masuk — Aqua
            [
                'product_id' => $pid('S1-006'), 'variant_id' => null,
                'movement_type' => 'purchase_in', 'quantity' => 60, 'unit_cost' => 2500,
                'reference_no' => 'PO-20260708-002', 'notes' => 'Pembelian Aqua',
                'moved_at' => '2026-07-08 10:00:00',
            ],
            // Pembelian masuk — Susu Ultra variant Full Cream
            [
                'product_id' => $pid('S1-007'), 'variant_id' => $vid('S1-007', 'Full Cream'),
                'movement_type' => 'purchase_in', 'quantity' => 30, 'unit_cost' => 3800,
                'reference_no' => 'PO-20260710-003', 'notes' => 'Pembelian Susu Ultra Full Cream',
                'moved_at' => '2026-07-10 14:00:00',
            ],
            // Pembelian masuk — Teh Botol variant Original
            [
                'product_id' => $pid('S1-008'), 'variant_id' => $vid('S1-008', 'Original'),
                'movement_type' => 'purchase_in', 'quantity' => 48, 'unit_cost' => 3500,
                'reference_no' => 'PO-20260708-002', 'notes' => 'Pembelian Teh Botol Original',
                'moved_at' => '2026-07-08 10:00:00',
            ],
            // Penjualan keluar — Indomie Original
            [
                'product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'),
                'movement_type' => 'sale_out', 'quantity' => -5, 'unit_cost' => 2800,
                'reference_no' => 'SL-20260717-001', 'notes' => 'Penjualan Indomie Original',
                'moved_at' => '2026-07-17 08:30:00',
            ],
            // Penjualan keluar — Aqua
            [
                'product_id' => $pid('S1-006'), 'variant_id' => null,
                'movement_type' => 'sale_out', 'quantity' => -2, 'unit_cost' => 2500,
                'reference_no' => 'SL-20260717-001', 'notes' => 'Penjualan Aqua',
                'moved_at' => '2026-07-17 08:30:00',
            ],
            // Penjualan keluar — Indomie Rendang
            [
                'product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Rendang'),
                'movement_type' => 'sale_out', 'quantity' => -3, 'unit_cost' => 3200,
                'reference_no' => 'SL-20260717-002', 'notes' => 'Penjualan Indomie Rendang',
                'moved_at' => '2026-07-17 09:15:00',
            ],
            // Transfer antar cabang — Indomie Original
            [
                'product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'),
                'movement_type' => 'transfer_out', 'quantity' => -20, 'unit_cost' => 2800,
                'store_id' => $store->id, 'branch_id' => $branchPusat,
                'reference_no' => 'TRF-20260710-001', 'notes' => 'Transfer 20 Indomie Original ke Babarsari',
                'moved_at' => '2026-07-10 10:00:00',
            ],
            [
                'product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'),
                'movement_type' => 'transfer_in', 'quantity' => 20, 'unit_cost' => 2800,
                'store_id' => $store->id, 'branch_id' => $branchBabarsari,
                'reference_no' => 'TRF-20260710-001', 'notes' => 'Penerimaan 20 Indomie Original dari Pusat',
                'moved_at' => '2026-07-10 11:00:00',
            ],
        ];

        foreach ($movements as $m) {
            if (! isset($m['store_id'])) {
                $m['store_id'] = $store->id;
            }
            if (! isset($m['branch_id'])) {
                $m['branch_id'] = $branchPusat;
            }
            if ($m['product_id']) {
                StockMovement::create($m);
            }
        }
    }
}
