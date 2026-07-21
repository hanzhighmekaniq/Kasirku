<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\Store;
use Illuminate\Database\Seeder;

class FnbRecipeSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->value('id');

        // Format: [finished_goods_sku, raw_material_sku, quantity, unit, notes]
        $recipes = [
            // ── Espresso (F2-001) ─────────────────────────────────────
            ['F2-001', 'F2-RM-001', 18,   'gram', 'Biji kopi arabika'],
            ['F2-001', 'F2-RM-019', 5,    'gram', 'Gula (opsional)'],
            ['F2-001', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Americano (F2-002) ────────────────────────────────────
            ['F2-002', 'F2-RM-001', 18,   'gram', 'Biji kopi arabika'],
            ['F2-002', 'F2-RM-012', 150,  'ml',   'Air panas'],
            ['F2-002', 'F2-RM-011', 100,  'gram', 'Es batu'],
            ['F2-002', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Cappuccino (F2-003) ───────────────────────────────────
            ['F2-003', 'F2-RM-001', 18,   'gram', 'Biji kopi arabika'],
            ['F2-003', 'F2-RM-004', 120,  'ml',   'Susu segar full cream'],
            ['F2-003', 'F2-RM-011', 80,   'gram', 'Es batu'],
            ['F2-003', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Cafe Latte (F2-004) ───────────────────────────────────
            ['F2-004', 'F2-RM-001', 18,   'gram', 'Biji kopi arabika'],
            ['F2-004', 'F2-RM-004', 180,  'ml',   'Susu segar full cream'],
            ['F2-004', 'F2-RM-011', 100,  'gram', 'Es batu'],
            ['F2-004', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Caramel Macchiato (F2-005) ────────────────────────────
            ['F2-005', 'F2-RM-001', 18,   'gram', 'Biji kopi arabika'],
            ['F2-005', 'F2-RM-004', 150,  'ml',   'Susu segar full cream'],
            ['F2-005', 'F2-RM-008', 20,   'ml',   'Sirup caramel'],
            ['F2-005', 'F2-RM-006', 30,   'ml',   'Krim kental whipped'],
            ['F2-005', 'F2-RM-011', 100,  'gram', 'Es batu'],
            ['F2-005', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Cold Brew (F2-006) ────────────────────────────────────
            ['F2-006', 'F2-RM-002', 25,   'gram', 'Biji kopi robusta'],
            ['F2-006', 'F2-RM-012', 200,  'ml',   'Air mineral dingin'],
            ['F2-006', 'F2-RM-011', 150,  'gram', 'Es batu'],
            ['F2-006', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Kopi Susu Gula Aren (F2-007) ─────────────────────────
            ['F2-007', 'F2-RM-002', 18,   'gram', 'Biji kopi robusta'],
            ['F2-007', 'F2-RM-004', 150,  'ml',   'Susu segar full cream'],
            ['F2-007', 'F2-RM-019', 15,   'gram', 'Gula aren / gula pasir'],
            ['F2-007', 'F2-RM-011', 100,  'gram', 'Es batu'],
            ['F2-007', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Matcha Latte (F2-008) ─────────────────────────────────
            ['F2-008', 'F2-RM-010', 8,    'gram', 'Bubuk matcha'],
            ['F2-008', 'F2-RM-004', 180,  'ml',   'Susu segar full cream'],
            ['F2-008', 'F2-RM-007', 15,   'ml',   'Sirup vanila'],
            ['F2-008', 'F2-RM-011', 100,  'gram', 'Es batu'],
            ['F2-008', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Affogato (F2-009) ─────────────────────────────────────
            ['F2-009', 'F2-RM-001', 18,   'gram', 'Biji kopi arabika'],
            ['F2-009', 'F2-RM-004', 60,   'ml',   'Susu segar (untuk ice cream base)'],
            ['F2-009', 'F2-RM-006', 50,   'ml',   'Krim kental whipped'],
            ['F2-009', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Teh Tarik (F2-010) ────────────────────────────────────
            ['F2-010', 'F2-RM-004', 150,  'ml',   'Susu segar full cream'],
            ['F2-010', 'F2-RM-019', 10,   'gram', 'Gula pasir'],
            ['F2-010', 'F2-RM-012', 100,  'ml',   'Air teh'],
            ['F2-010', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Matcha Boba (F2-011) ──────────────────────────────────
            ['F2-011', 'F2-RM-010', 10,   'gram', 'Bubuk matcha'],
            ['F2-011', 'F2-RM-005', 200,  'ml',   'Susu oat'],
            ['F2-011', 'F2-RM-017', 50,   'gram', 'Boba pearl'],
            ['F2-011', 'F2-RM-011', 120,  'gram', 'Es batu'],
            ['F2-011', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Coklat Panas (F2-012) ─────────────────────────────────
            ['F2-012', 'F2-RM-009', 20,   'gram', 'Bubuk coklat'],
            ['F2-012', 'F2-RM-004', 200,  'ml',   'Susu segar full cream'],
            ['F2-012', 'F2-RM-019', 10,   'gram', 'Gula pasir'],
            ['F2-012', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Lemon Tea (F2-013) ────────────────────────────────────
            ['F2-013', 'F2-RM-012', 200,  'ml',   'Air teh'],
            ['F2-013', 'F2-RM-019', 8,    'gram', 'Gula pasir'],
            ['F2-013', 'F2-RM-011', 100,  'gram', 'Es batu'],
            ['F2-013', 'F2-RM-020', 1,    'pcs',  'Cup & sedotan'],

            // ── Roti Bakar Keju (F2-020) ──────────────────────────────
            ['F2-020', 'F2-RM-013', 2,    'lembar', 'Roti tawar'],
            ['F2-020', 'F2-RM-015', 2,    'lembar', 'Keju cheddar slice'],

            // ── Roti Bakar Coklat (F2-021) ────────────────────────────
            ['F2-021', 'F2-RM-013', 2,    'lembar', 'Roti tawar'],
            ['F2-021', 'F2-RM-009', 15,   'gram', 'Bubuk coklat'],
            ['F2-021', 'F2-RM-019', 5,    'gram', 'Gula pasir'],

            // ── Sandwich Ayam (F2-022) ────────────────────────────────
            ['F2-022', 'F2-RM-013', 2,    'lembar', 'Roti tawar'],
            ['F2-022', 'F2-RM-016', 100,  'gram', 'Daging ayam fillet'],
            ['F2-022', 'F2-RM-015', 1,    'lembar', 'Keju cheddar slice'],

            // ── Telur Dadar Gulung (F2-023) ───────────────────────────
            ['F2-023', 'F2-RM-014', 2,    'butir', 'Telur ayam'],
            ['F2-023', 'F2-RM-019', 3,    'gram', 'Gula pasir / garam'],

            // ── Nasi Goreng Kampung (F2-024) ──────────────────────────
            ['F2-024', 'F2-RM-014', 1,    'butir', 'Telur ayam'],
            ['F2-024', 'F2-RM-016', 50,   'gram', 'Ayam fillet'],
        ];

        foreach ($recipes as [$finishedSku, $rawSku, $qty, $unit, $notes]) {
            $finishedId = $pid($finishedSku);
            $rawId = $pid($rawSku);

            if (! $finishedId || ! $rawId) {
                continue;
            }

            ProductRecipe::firstOrCreate(
                ['product_id' => $finishedId, 'raw_material_id' => $rawId],
                [
                    'quantity' => $qty,
                    'unit' => $unit,
                    'is_nullable' => false,
                    'notes' => $notes,
                ],
            );
        }
    }
}
