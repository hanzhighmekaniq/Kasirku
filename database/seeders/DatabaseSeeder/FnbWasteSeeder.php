<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Models\Waste;
use App\Models\WasteItem;
use Illuminate\Database\Seeder;

class FnbWasteSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();
        $owner = User::where('email', 'owner1@gmail.com')->value('id');
        $br2a = Branch::where('store_id', $store->id)->where('code', 'BR2A')->firstOrFail();
        $br2b = Branch::where('store_id', $store->id)->where('code', 'BR2B')->firstOrFail();

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->value('id');

        $wastes = [
            // Waste 1 — BR2A, susu & boba kadaluarsa
            [
                'waste_no' => 'WST-20260716-001',
                'waste_date' => '2026-07-16',
                'branch_id' => $br2a->id,
                'status' => 'confirmed',
                'notes' => 'Bahan baku kadaluarsa akhir pekan',
                'items' => [
                    ['sku' => 'F2-RM-004', 'qty' => 500,  'unit_cost' => 0.015, 'category' => 'expired', 'notes' => 'Susu segar tidak terpakai'],
                    ['sku' => 'F2-RM-017', 'qty' => 200,  'unit_cost' => 0.05,  'category' => 'expired', 'notes' => 'Boba pearl mengeras'],
                ],
            ],
            // Waste 2 — BR2A, tumpahan sirup
            [
                'waste_no' => 'WST-20260717-002',
                'waste_date' => '2026-07-17',
                'branch_id' => $br2a->id,
                'status' => 'confirmed',
                'notes' => 'Tumpahan saat operasional',
                'items' => [
                    ['sku' => 'F2-RM-007', 'qty' => 100,  'unit_cost' => 0.040, 'category' => 'spilled', 'notes' => 'Botol sirup vanila jatuh'],
                    ['sku' => 'F2-RM-008', 'qty' => 50,   'unit_cost' => 0.040, 'category' => 'spilled', 'notes' => 'Tumpahan sirup caramel'],
                ],
            ],
            // Waste 3 — BR2A, bahan makanan rusak
            [
                'waste_no' => 'WST-20260718-003',
                'waste_date' => '2026-07-18',
                'branch_id' => $br2a->id,
                'status' => 'confirmed',
                'notes' => 'Bahan makanan rusak / tidak layak',
                'items' => [
                    ['sku' => 'F2-RM-013', 'qty' => 10,   'unit_cost' => 1500,  'category' => 'expired', 'notes' => 'Roti tawar berjamur'],
                    ['sku' => 'F2-RM-016', 'qty' => 150,  'unit_cost' => 0.035, 'category' => 'damaged', 'notes' => 'Ayam fillet tidak segar'],
                ],
            ],
            // Waste 4 — BR2B, susu & es batu terbuang
            [
                'waste_no' => 'WST-20260719-004',
                'waste_date' => '2026-07-19',
                'branch_id' => $br2b->id,
                'status' => 'confirmed',
                'notes' => 'Sisa bahan tidak terpakai saat tutup',
                'items' => [
                    ['sku' => 'F2-RM-004', 'qty' => 300,  'unit_cost' => 0.015, 'category' => 'expired', 'notes' => 'Susu segar sisa tutup malam'],
                    ['sku' => 'F2-RM-005', 'qty' => 200,  'unit_cost' => 0.025, 'category' => 'expired', 'notes' => 'Susu oat sisa tutup malam'],
                ],
            ],
            // Waste 5 — BR2B, kopi tumpah
            [
                'waste_no' => 'WST-20260720-005',
                'waste_date' => '2026-07-20',
                'branch_id' => $br2b->id,
                'status' => 'confirmed',
                'notes' => 'Kecelakaan kerja saat brew',
                'items' => [
                    ['sku' => 'F2-RM-001', 'qty' => 50,   'unit_cost' => 0.35,  'category' => 'spilled', 'notes' => 'Kopi arabika tumpah saat grind'],
                    ['sku' => 'F2-RM-010', 'qty' => 20,   'unit_cost' => 0.18,  'category' => 'spilled', 'notes' => 'Bubuk matcha tumpah'],
                ],
            ],
        ];

        foreach ($wastes as $wasteData) {
            $items = $wasteData['items'];
            unset($wasteData['items']);

            $waste = Waste::create([
                'store_id' => $store->id,
                'branch_id' => $wasteData['branch_id'],
                'user_id' => $owner,
                'waste_no' => $wasteData['waste_no'],
                'waste_date' => $wasteData['waste_date'],
                'status' => $wasteData['status'],
                'notes' => $wasteData['notes'],
            ]);

            foreach ($items as $item) {
                $productId = $pid($item['sku']);
                if (! $productId) {
                    continue;
                }

                WasteItem::create([
                    'waste_id' => $waste->id,
                    'product_id' => $productId,
                    'product_batch_id' => null,
                    'quantity' => $item['qty'],
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $item['unit_cost'] * $item['qty'],
                    'waste_category' => $item['category'],
                    'notes' => $item['notes'],
                ]);
            }
        }
    }
}
