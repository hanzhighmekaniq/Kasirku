<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $store1 = Store::where('code', 'STORE001')->firstOrFail();
        $store2 = Store::where('code', 'STORE002')->firstOrFail();
        $store3 = Store::where('code', 'STORE003')->firstOrFail();

        // Store 1 — Kopi Senja
        Supplier::firstOrCreate(['store_id' => $store1->id, 'code' => 'SUP0001'], ['name' => 'CV Kopi Nusantara', 'contact_person' => 'Budi Santoso', 'phone' => '081200000001', 'email' => 'order@kopinusantara.com', 'address' => 'Jl. Veteran No. 20, Jakarta Selatan']);
        Supplier::firstOrCreate(['store_id' => $store1->id, 'code' => 'SUP0002'], ['name' => 'PT Susu Segar Indonesia', 'contact_person' => 'Andi Wijaya', 'phone' => '081200000002', 'email' => 'sales@sususegar.co.id', 'address' => 'Jl. Raya Bogor Km 30, Bogor']);
        Supplier::firstOrCreate(['store_id' => $store1->id, 'code' => 'SUP0003'], ['name' => 'Toko Bahan Kue Makmur', 'phone' => '081200000003', 'address' => 'Pasar Pusat, Blok D No. 5, Yogyakarta']);

        // Store 2 — Minimarket
        Supplier::firstOrCreate(['store_id' => $store2->id, 'code' => 'SUP0001'], ['name' => 'UD Sembako Jaya', 'contact_person' => 'Hendra Kurniawan', 'phone' => '081200000004', 'email' => 'sembakojaya@gmail.com', 'address' => 'Jl. Magelang Km 8, Sleman']);
        Supplier::firstOrCreate(['store_id' => $store2->id, 'code' => 'SUP0002'], ['name' => 'PT Minuman Nusantara', 'contact_person' => 'Sari Dewi', 'phone' => '081200000005', 'email' => 'order@minumannusantara.com', 'address' => 'Jl. Industri No. 12, Tangerang']);

        // Store 3 — Barbershop
        Supplier::firstOrCreate(['store_id' => $store3->id, 'code' => 'SUP0001'], ['name' => 'Distributor Produk Salon Indo', 'contact_person' => 'Rahmat', 'phone' => '081200000006', 'address' => 'Jl. Tentara Pelajar No. 5, Yogyakarta']);
    }
}
