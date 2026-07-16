<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Store;
use Illuminate\Database\Seeder;

class StockMovementSeeder extends Seeder
{
    public function run(): void
    {
        $storeId = Store::where('code', 'STORE001')->value('id');
        $branchPusat = Branch::where('store_id', $storeId)->where('code', 'BR1A')->value('id');
        $branchBabarsari = Branch::where('store_id', $storeId)->where('code', 'BR1B')->value('id');

        // Helper: product_id by SKU
        $pid = fn ($sku) => Product::where('store_id', $storeId)->where('sku', $sku)->value('id');

        $movements = [
            // === Pembelian masuk ===
            [
                'product_id' => $pid('S1-001'), 'movement_type' => 'purchase_in',
                'quantity' => 100, 'unit_cost' => 2800, 'reference_no' => 'PO-20260608-004',
                'notes' => 'Pembelian Indomie dari supplier', 'moved_at' => '2026-06-08 14:00:00',
            ],
            [
                'product_id' => $pid('S1-008'), 'movement_type' => 'purchase_in',
                'quantity' => 48, 'unit_cost' => 3500, 'reference_no' => 'PO-20260608-004',
                'notes' => 'Pembelian Teh Botol dari supplier', 'moved_at' => '2026-06-08 14:00:00',
            ],
            [
                'product_id' => $pid('S1-006'), 'movement_type' => 'purchase_in',
                'quantity' => 60, 'unit_cost' => 2500, 'reference_no' => 'PO-20260608-004',
                'notes' => 'Pembelian Aqua dari supplier', 'moved_at' => '2026-06-08 14:00:00',
            ],
            [
                'product_id' => $pid('S1-002'), 'movement_type' => 'purchase_in',
                'quantity' => 15, 'unit_cost' => 60000, 'reference_no' => 'PO-20260605-005',
                'notes' => 'Pembelian Beras dari supplier', 'moved_at' => '2026-06-05 11:00:00',
            ],
            [
                'product_id' => $pid('S1-003'), 'movement_type' => 'purchase_in',
                'quantity' => 20, 'unit_cost' => 15000, 'reference_no' => 'PO-20260605-005',
                'notes' => 'Pembelian Minyak dari supplier', 'moved_at' => '2026-06-05 11:00:00',
            ],
            [
                'product_id' => $pid('S1-004'), 'movement_type' => 'purchase_in',
                'quantity' => 25, 'unit_cost' => 12000, 'reference_no' => 'PO-20260605-005',
                'notes' => 'Pembelian Gula Pasir dari supplier', 'moved_at' => '2026-06-05 11:00:00',
            ],
            [
                'product_id' => $pid('S1-020'), 'movement_type' => 'purchase_in',
                'quantity' => 24, 'unit_cost' => 8000, 'reference_no' => 'PO-20260605-005',
                'notes' => 'Pembelian Susu Kental dari supplier', 'moved_at' => '2026-06-05 11:00:00',
            ],
            [
                'product_id' => $pid('S1-019'), 'movement_type' => 'purchase_in',
                'quantity' => 60, 'unit_cost' => 2000, 'reference_no' => 'PO-20260608-004',
                'notes' => 'Pembelian Kopi Torabika dari supplier', 'moved_at' => '2026-06-08 14:00:00',
            ],

            // === Penjualan keluar ===
            [
                'product_id' => $pid('S1-001'), 'movement_type' => 'sale_out',
                'quantity' => -20, 'unit_cost' => 2800, 'reference_no' => 'SJ-20260620-001',
                'notes' => 'Penjualan Indomie', 'moved_at' => '2026-06-20 08:00:00',
            ],
            [
                'product_id' => $pid('S1-008'), 'movement_type' => 'sale_out',
                'quantity' => -8, 'unit_cost' => 3500, 'reference_no' => 'SJ-20260620-002',
                'notes' => 'Penjualan Teh Botol', 'moved_at' => '2026-06-20 10:30:00',
            ],
            [
                'product_id' => $pid('S1-006'), 'movement_type' => 'sale_out',
                'quantity' => -10, 'unit_cost' => 2500, 'reference_no' => 'SJ-20260621-001',
                'notes' => 'Penjualan Aqua', 'moved_at' => '2026-06-21 08:15:00',
            ],

            // === Adjustment ===
            [
                'product_id' => $pid('S1-001'), 'movement_type' => 'adjustment_in',
                'quantity' => 50, 'unit_cost' => 2800, 'reference_no' => 'ADJ-20260618-001',
                'notes' => 'Koreksi stok Indomie karena selisih fisik', 'moved_at' => '2026-06-18 09:00:00',
            ],

            // === Transfer antar cabang ===
            [
                'product_id' => $pid('S1-001'), 'movement_type' => 'transfer_out',
                'quantity' => -20, 'unit_cost' => 2800, 'store_id' => $storeId,
                'branch_id' => $branchPusat, 'reference_no' => 'TRF-20260610-001',
                'notes' => 'Transfer 20 Indomie ke Cabang Babarsari', 'moved_at' => '2026-06-10 10:00:00',
            ],
            [
                'product_id' => $pid('S1-001'), 'movement_type' => 'transfer_in',
                'quantity' => 20, 'unit_cost' => 2800, 'store_id' => $storeId,
                'branch_id' => $branchBabarsari, 'reference_no' => 'TRF-20260610-001',
                'notes' => 'Penerimaan 20 Indomie dari Pusat', 'moved_at' => '2026-06-10 11:00:00',
            ],

            // === Waste ===
            [
                'product_id' => $pid('S1-008'), 'movement_type' => 'waste',
                'quantity' => -2, 'unit_cost' => 3500, 'reference_no' => 'WST-20260619-001',
                'notes' => 'Teh Botol expired / rusak', 'moved_at' => '2026-06-19 10:00:00',
            ],
        ];

        foreach ($movements as $m) {
            if (! isset($m['store_id'])) {
                $m['store_id'] = $storeId;
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
