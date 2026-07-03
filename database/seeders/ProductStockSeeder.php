<?php

namespace Database\Seeders;

use App\Models\ProductStock;
use Illuminate\Database\Seeder;

class ProductStockSeeder extends Seeder
{
    public function run(): void
    {
        // Stok Kopi Senja (store 1) — bahan baku untuk cafe
        $rawMaterialStocks = [
            ['product_id' => 1, 'quantity' => 8000],   // Biji Kopi Arabika - 8000 gram
            ['product_id' => 2, 'quantity' => 5000],   // Biji Kopi Robusta - 5000 gram
            ['product_id' => 3, 'quantity' => 10000],  // Susu Fresh - 10000 ml
            ['product_id' => 4, 'quantity' => 5000],   // Susu Evaporated - 5000 ml
            ['product_id' => 5, 'quantity' => 3000],   // Gula Pasir - 3000 gram
            ['product_id' => 6, 'quantity' => 2000],   // Gula Aren - 2000 ml
            ['product_id' => 7, 'quantity' => 1500],   // Sirup Vanilla - 1500 ml
            ['product_id' => 8, 'quantity' => 2000],   // Tepung - 2000 gram
            ['product_id' => 9, 'quantity' => 30],     // Telur - 30 pcs
            ['product_id' => 10, 'quantity' => 10000], // Es Batu - 10000 gram
            ['product_id' => 11, 'quantity' => 5000],  // Nasi Putih - 5000 gram
            ['product_id' => 12, 'quantity' => 15],    // Mie Instan - 15 pcs
        ];

        foreach ($rawMaterialStocks as $s) {
            ProductStock::create([
                'product_id' => $s['product_id'],
                'store_id'   => 1,
                'quantity'   => $s['quantity'],
            ]);
        }

        // Stok Minimarket Sejahtera (store 2) — digabung dari semua cabang
        $minimarketStocks = [
            ['product_id' => 25, 'quantity' => 210], // Indomie (130 + 80)
            ['product_id' => 26, 'quantity' => 64],  // Teh Botol (40 + 24)
            ['product_id' => 27, 'quantity' => 86],  // Aqua (50 + 36)
            ['product_id' => 28, 'quantity' => 20],  // Beras (12 + 8)
            ['product_id' => 29, 'quantity' => 30],  // Minyak (18 + 12)
            ['product_id' => 30, 'quantity' => 35],  // Gula Pasir 1kg (20 + 15)
            ['product_id' => 31, 'quantity' => 30],  // Susu Kental Manis (20 + 10)
            ['product_id' => 32, 'quantity' => 90],  // Kopi Torabika (50 + 40)
        ];

        foreach ($minimarketStocks as $s) {
            ProductStock::create([
                'product_id' => $s['product_id'],
                'store_id'   => 2,
                'quantity'   => $s['quantity'],
            ]);
        }
    }
}
