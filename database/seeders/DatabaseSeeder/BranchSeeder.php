<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Store;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        // ── STORE001 — Retail ──────────────────────────────────────────
        $store1 = Store::where('code', 'STORE001')->firstOrFail();

        $branches1 = [
            ['code' => 'BR1A', 'name' => 'Minimarket Sejahtera — Pusat'],
            ['code' => 'BR1B', 'name' => 'Minimarket Sejahtera — Babarsari'],
        ];

        foreach ($branches1 as $b) {
            Branch::firstOrCreate(
                ['store_id' => $store1->id, 'code' => $b['code']],
                ['name' => $b['name'], 'is_active' => true],
            );
        }

        // ── STORE002 — FnB ─────────────────────────────────────────────
        $store2 = Store::where('code', 'STORE002')->firstOrFail();

        $branches2 = [
            ['code' => 'BR2A', 'name' => 'Kopi Senja — Malioboro'],
            ['code' => 'BR2B', 'name' => 'Kopi Senja — Cabang UGM'],
        ];

        foreach ($branches2 as $b) {
            Branch::firstOrCreate(
                ['store_id' => $store2->id, 'code' => $b['code']],
                ['name' => $b['name'], 'is_active' => true],
            );
        }
    }
}
