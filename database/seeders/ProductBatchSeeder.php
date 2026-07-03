<?php

namespace Database\Seeders;

use App\Models\ProductBatch;
use Illuminate\Database\Seeder;

class ProductBatchSeeder extends Seeder
{
    public function run(): void
    {
        // Batch untuk produk minimarket yang track_stock = true
        $batches = [
            // Indomie
            ['product_id' => 25, 'batch_no' => 'B-INDO-001', 'purchase_date' => '2026-06-01', 'expiry_date' => '2027-03-01', 'quantity' => 50, 'cost_price' => 2500],
            ['product_id' => 25, 'batch_no' => 'B-INDO-002', 'purchase_date' => '2026-06-15', 'expiry_date' => '2027-06-15', 'quantity' => 100, 'cost_price' => 2500],
            // Teh Botol
            ['product_id' => 26, 'batch_no' => 'B-TB-001', 'purchase_date' => '2026-06-01', 'expiry_date' => '2026-12-01', 'quantity' => 48, 'cost_price' => 3500],
            // Aqua
            ['product_id' => 27, 'batch_no' => 'B-AQ-001', 'purchase_date' => '2026-06-05', 'expiry_date' => '2027-06-05', 'quantity' => 60, 'cost_price' => 3000],
            // Beras
            ['product_id' => 28, 'batch_no' => 'B-BRS-001', 'purchase_date' => '2026-06-10', 'expiry_date' => null, 'quantity' => 15, 'cost_price' => 55000],
            // Minyak Goreng
            ['product_id' => 29, 'batch_no' => 'B-MNYK-001', 'purchase_date' => '2026-06-10', 'expiry_date' => '2027-01-10', 'quantity' => 20, 'cost_price' => 14000],
            // Gula Pasir 1kg
            ['product_id' => 30, 'batch_no' => 'B-GLP-001', 'purchase_date' => '2026-06-12', 'expiry_date' => null, 'quantity' => 25, 'cost_price' => 12000],
            // Susu Kental Manis
            ['product_id' => 31, 'batch_no' => 'B-SKM-001', 'purchase_date' => '2026-06-10', 'expiry_date' => '2027-06-10', 'quantity' => 24, 'cost_price' => 8000],
            // Kopi Torabika
            ['product_id' => 32, 'batch_no' => 'B-KT-001', 'purchase_date' => '2026-06-05', 'expiry_date' => '2027-06-05', 'quantity' => 60, 'cost_price' => 2000],
        ];

        foreach ($batches as $b) {
            ProductBatch::create(array_merge($b, ['store_id' => 2, 'branch_id' => 3]));
        }
    }
}
