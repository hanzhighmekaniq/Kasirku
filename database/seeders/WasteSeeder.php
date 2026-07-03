<?php

namespace Database\Seeders;

use App\Models\Waste;
use App\Models\WasteItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class WasteSeeder extends Seeder
{
    public function run(): void
    {
        $owner2 = User::where('email', 'owner2@gmail.com')->value('id');

        // Store 2 = Minimarket Sejahtera
        $waste1 = Waste::create([
            'waste_no' => 'WST-20260619-001',
            'waste_date' => '2026-06-19',
            'store_id' => 2,
            'branch_id' => 3,
            'user_id' => $owner2,
            'status' => 'approved',
            'notes' => 'Teh Botol kedaluwarsa dari batch B-TB-001',
        ]);

        WasteItem::create([
            'waste_id' => $waste1->id,
            'product_id' => 26, // Teh Botol
            'product_batch_id' => 3, // B-TB-001
            'quantity' => 2,
            'unit_cost' => 3500,
            'total_cost' => 7000,
            'waste_category' => 'kedaluwarsa',
            'notes' => 'Kedaluwarsa 15 Juni 2026',
        ]);

        $waste2 = Waste::create([
            'waste_no' => 'WST-20260620-001',
            'waste_date' => '2026-06-20',
            'store_id' => 2,
            'branch_id' => 3,
            'user_id' => $owner2,
            'status' => 'draft',
            'notes' => 'Indomie kemasan sobek/rusak',
        ]);

        WasteItem::create([
            'waste_id' => $waste2->id,
            'product_id' => 25, // Indomie
            'product_batch_id' => null,
            'quantity' => 3,
            'unit_cost' => 2500,
            'total_cost' => 7500,
            'waste_category' => 'rusak',
            'notes' => 'Kemasan sobek akibat tertindih',
        ]);

        WasteItem::create([
            'waste_id' => $waste2->id,
            'product_id' => 27, // Aqua
            'product_batch_id' => null,
            'quantity' => 1,
            'unit_cost' => 3000,
            'total_cost' => 3000,
            'waste_category' => 'tumpahan',
            'notes' => 'Tumpah di gudang',
        ]);

        $waste3 = Waste::create([
            'waste_no' => 'WST-20260621-001',
            'waste_date' => '2026-06-21',
            'store_id' => 2,
            'branch_id' => 3,
            'user_id' => $owner2,
            'status' => 'approved',
            'notes' => 'Beras kualitas buruk dari supplier',
        ]);

        WasteItem::create([
            'waste_id' => $waste3->id,
            'product_id' => 28, // Beras
            'product_batch_id' => 5, // B-BRS-001
            'quantity' => 1,
            'unit_cost' => 55000,
            'total_cost' => 55000,
            'waste_category' => 'lainnya',
            'notes' => 'Beras berubah warna, tidak layak jual',
        ]);
    }
}
