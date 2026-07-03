<?php

namespace Database\Seeders;

use App\Models\StoreType;
use Illuminate\Database\Seeder;

class StoreTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'retail', 'label' => 'Retail', 'icon' => '🏪', 'description' => 'Toko, minimarket, grosir', 'order_types' => [['v'=>'takeaway','l'=>'Ambil'],['v'=>'delivery','l'=>'Antar'],['v'=>'wholesale','l'=>'Grosir']], 'pos_behavior' => 'retail', 'sort_order' => 1],
            ['code' => 'fnb', 'label' => 'F&B', 'icon' => '☕', 'description' => 'Restoran, cafe, bakery, fast food', 'order_types' => [['v'=>'dine_in','l'=>'Dine-in'],['v'=>'takeaway','l'=>'Takeaway'],['v'=>'delivery','l'=>'Delivery']], 'pos_behavior' => 'fnb', 'sort_order' => 2],
            ['code' => 'service', 'label' => 'Service', 'icon' => '✂️', 'description' => 'Salon, laundry, bengkel, jasa', 'order_types' => [['v'=>'walk_in','l'=>'Langsung'],['v'=>'booking','l'=>'Booking'],['v'=>'pickup_delivery','l'=>'Jemput & Antar']], 'pos_behavior' => 'service', 'sort_order' => 3],
            ['code' => 'rental', 'label' => 'Rental', 'icon' => '🔑', 'description' => 'Sewa alat, warnet, PS, karaoke', 'order_types' => [['v'=>'per_hour','l'=>'Per Jam'],['v'=>'per_day','l'=>'Per Hari'],['v'=>'per_week','l'=>'Per Minggu']], 'pos_behavior' => 'rental', 'sort_order' => 4],
            ['code' => 'ticket', 'label' => 'Ticket', 'icon' => '🎟️', 'description' => 'Bioskop, futsal, event, booking slot', 'order_types' => [['v'=>'online','l'=>'Booking Online'],['v'=>'walk_in','l'=>'Walk-in'],['v'=>'group','l'=>'Group']], 'pos_behavior' => 'service', 'sort_order' => 5],
            ['code' => 'hospitality', 'label' => 'Hospitality', 'icon' => '🏨', 'description' => 'Hotel, villa, penginapan, kost', 'order_types' => [['v'=>'check_in','l'=>'Check-in'],['v'=>'reservation','l'=>'Reservasi'],['v'=>'short_stay','l'=>'Short Stay']], 'pos_behavior' => 'rental', 'sort_order' => 6],
        ];

        foreach ($types as $t) {
            StoreType::firstOrCreate(['code' => $t['code']], $t);
        }
    }
}
