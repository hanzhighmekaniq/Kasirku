<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Store;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $store1 = Store::where('code', 'STORE001')->firstOrFail();
        $store2 = Store::where('code', 'STORE002')->firstOrFail();
        $store3 = Store::where('code', 'STORE003')->firstOrFail();
        $store4 = Store::where('code', 'STORE004')->firstOrFail();

        // Store 1 — Kopi Senja
        Branch::firstOrCreate(['store_id' => $store1->id, 'code' => 'BR001'], [
            'name'      => 'Kopi Senja - Pusat',
            'phone'     => '081234567890',
            'address'   => 'Jl. Malioboro No. 88, Yogyakarta',
            'is_active' => true,
        ]);
        Branch::firstOrCreate(['store_id' => $store1->id, 'code' => 'BR002'], [
            'name'      => 'Kopi Senja - Cabang UGM',
            'phone'     => '081234567891',
            'address'   => 'Jl. Kaliurang Km 5, Sleman',
            'is_active' => true,
        ]);

        // Store 2 — Minimarket Sejahtera
        Branch::firstOrCreate(['store_id' => $store2->id, 'code' => 'BR003'], [
            'name'      => 'Minimarket Sejahtera - Pusat',
            'phone'     => '085678901234',
            'address'   => 'Jl. Solo No. 15, Sleman',
            'is_active' => true,
        ]);
        Branch::firstOrCreate(['store_id' => $store2->id, 'code' => 'BR004'], [
            'name'      => 'Minimarket Sejahtera - Babarsari',
            'phone'     => '085678901235',
            'address'   => 'Jl. Babarsari No. 10, Depok, Sleman',
            'is_active' => true,
        ]);

        // Store 3 — Barbershop Rapi
        Branch::firstOrCreate(['store_id' => $store3->id, 'code' => 'BR005'], [
            'name'      => 'Barbershop Rapi - Pusat',
            'phone'     => '082112345678',
            'address'   => 'Jl. Sudirman No. 12, Yogyakarta',
            'is_active' => true,
        ]);

        // Store 4 — Laundry Bersih
        Branch::firstOrCreate(['store_id' => $store4->id, 'code' => 'BR006'], [
            'name'      => 'Laundry Bersih - Pusat',
            'phone'     => '083198765432',
            'address'   => 'Jl. Kaliurang Km 7, Sleman',
            'is_active' => true,
        ]);
    }
}
