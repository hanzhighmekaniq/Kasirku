<?php

namespace Database\Seeders;

use App\Models\StockMovement;
use Illuminate\Database\Seeder;

class StockMovementSeeder extends Seeder
{
    public function run(): void
    {
        // Store 2 = Minimarket (stock movements untuk produk yang track_stock = true)
        // product_ids: 25=indomie, 26=teh botol, 27=aqua, 28=beras, 29=minyak, 30=gula1kg, 31=susu kental, 32=kopi torabika

        $movements = [
            // === Pembelian masuk ===
            [
                'product_id' => 25, 'movement_type' => 'purchase_in', 'quantity' => 100,
                'unit_cost' => 2500, 'reference_no' => 'PO-20260608-004',
                'notes' => 'Pembelian Indomie dari supplier', 'moved_at' => '2026-06-08 14:00:00',
            ],
            [
                'product_id' => 26, 'movement_type' => 'purchase_in', 'quantity' => 48,
                'unit_cost' => 3500, 'reference_no' => 'PO-20260608-004',
                'notes' => 'Pembelian Teh Botol dari supplier', 'moved_at' => '2026-06-08 14:00:00',
            ],
            [
                'product_id' => 27, 'movement_type' => 'purchase_in', 'quantity' => 60,
                'unit_cost' => 3000, 'reference_no' => 'PO-20260608-004',
                'notes' => 'Pembelian Aqua dari supplier', 'moved_at' => '2026-06-08 14:00:00',
            ],
            [
                'product_id' => 28, 'movement_type' => 'purchase_in', 'quantity' => 15,
                'unit_cost' => 55000, 'reference_no' => 'PO-20260605-005',
                'notes' => 'Pembelian Beras dari supplier', 'moved_at' => '2026-06-05 11:00:00',
            ],
            [
                'product_id' => 29, 'movement_type' => 'purchase_in', 'quantity' => 20,
                'unit_cost' => 14000, 'reference_no' => 'PO-20260605-005',
                'notes' => 'Pembelian Minyak dari supplier', 'moved_at' => '2026-06-05 11:00:00',
            ],
            [
                'product_id' => 30, 'movement_type' => 'purchase_in', 'quantity' => 25,
                'unit_cost' => 12000, 'reference_no' => 'PO-20260605-005',
                'notes' => 'Pembelian Gula Pasir dari supplier', 'moved_at' => '2026-06-05 11:00:00',
            ],
            [
                'product_id' => 31, 'movement_type' => 'purchase_in', 'quantity' => 24,
                'unit_cost' => 8000, 'reference_no' => 'PO-20260605-005',
                'notes' => 'Pembelian Susu Kental dari supplier', 'moved_at' => '2026-06-05 11:00:00',
            ],
            [
                'product_id' => 32, 'movement_type' => 'purchase_in', 'quantity' => 60,
                'unit_cost' => 2000, 'reference_no' => 'PO-20260608-004',
                'notes' => 'Pembelian Kopi Torabika dari supplier', 'moved_at' => '2026-06-08 14:00:00',
            ],

            // === Penjualan keluar (sale_out) — beberapa transaksi ===
            [
                'product_id' => 25, 'movement_type' => 'sale_out', 'quantity' => -20,
                'unit_cost' => 2500, 'reference_no' => 'SJ-20260620-001',
                'notes' => 'Penjualan Indomie', 'moved_at' => '2026-06-20 08:00:00',
            ],
            [
                'product_id' => 26, 'movement_type' => 'sale_out', 'quantity' => -8,
                'unit_cost' => 3500, 'reference_no' => 'SJ-20260620-002',
                'notes' => 'Penjualan Teh Botol', 'moved_at' => '2026-06-20 10:30:00',
            ],
            [
                'product_id' => 27, 'movement_type' => 'sale_out', 'quantity' => -10,
                'unit_cost' => 3000, 'reference_no' => 'SJ-20260621-001',
                'notes' => 'Penjualan Aqua', 'moved_at' => '2026-06-21 08:15:00',
            ],

            // === Adjustment (koreksi stok) ===
            [
                'product_id' => 25, 'movement_type' => 'adjustment_in', 'quantity' => 50,
                'unit_cost' => 2500, 'reference_no' => 'ADJ-20260618-001',
                'notes' => 'Koreksi stok Indomie karena selisih fisik', 'moved_at' => '2026-06-18 09:00:00',
            ],

            // === Transfer antar cabang ===
            [
                'product_id' => 25, 'movement_type' => 'transfer_out', 'quantity' => -20,
                'unit_cost' => 2500, 'store_id' => 2, 'branch_id' => 3,
                'reference_no' => 'TRF-20260610-001',
                'notes' => 'Transfer 20 Indomie ke Cabang Babarsari', 'moved_at' => '2026-06-10 10:00:00',
            ],
            [
                'product_id' => 25, 'movement_type' => 'transfer_in', 'quantity' => 20,
                'unit_cost' => 2500, 'store_id' => 2, 'branch_id' => 4,
                'reference_no' => 'TRF-20260610-001',
                'notes' => 'Penerimaan 20 Indomie dari Pusat', 'moved_at' => '2026-06-10 11:00:00',
            ],

            // === Waste ===
            [
                'product_id' => 26, 'movement_type' => 'waste', 'quantity' => -2,
                'unit_cost' => 3500, 'reference_no' => 'WST-20260619-001',
                'notes' => 'Teh BotolExpired / rusak', 'moved_at' => '2026-06-19 10:00:00',
            ],
        ];

        foreach ($movements as $m) {
            if (!isset($m['store_id'])) $m['store_id'] = 2;
            if (!isset($m['branch_id'])) $m['branch_id'] = 3;
            StockMovement::create($m);
        }
    }
}
