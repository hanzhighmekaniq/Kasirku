<?php

namespace Database\Seeders;

use App\Models\Promotion;
use Illuminate\Database\Seeder;

class PromotionSeeder extends Seeder
{
    public function run(): void
    {
        Promotion::create([
            'code' => 'PROMO-001',
            'name' => 'Happy Hour Diskon 20%',
            'type' => 'percentage',
            'discount_value' => 20,
            'min_purchase_amount' => 25000,
            'max_discount_amount' => 10000,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);

        Promotion::create([
            'code' => 'PROMO-002',
            'name' => 'Diskon Rp 5.000 Min. Belanja Rp 30.000',
            'type' => 'fixed',
            'discount_value' => 5000,
            'min_purchase_amount' => 30000,
            'max_discount_amount' => null,
            'start_date' => '2026-06-15',
            'end_date' => '2026-07-15',
            'is_active' => true,
        ]);

        Promotion::create([
            'code' => 'PROMO-003',
            'name' => 'Cashback 10% via GoPay',
            'type' => 'cashback',
            'discount_value' => 10,
            'min_purchase_amount' => 50000,
            'max_discount_amount' => 15000,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
        ]);

        Promotion::create([
            'code' => 'PROMO-004',
            'name' => 'Promo Lebaran (Expired)',
            'type' => 'percentage',
            'discount_value' => 15,
            'min_purchase_amount' => 20000,
            'max_discount_amount' => 7500,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
            'is_active' => false,
        ]);
    }
}
