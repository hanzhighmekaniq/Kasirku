<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\CustomerTier;
use App\Models\Membership;
use App\Models\Store;
use Illuminate\Database\Seeder;

class MembershipSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();

        // Pastikan tier bawaan sudah ada. Kalau DatabaseSeeder menjalankan
        // MembershipSeeder sebelum data tier terbentuk, tier akan dibuat di sini.
        CustomerTier::seedDefaultsForStore($store->id);

        // Ambil tier per nama agar benefit bisa menyertakan tier_id.
        $tierByName = CustomerTier::forStore($store->id)
            ->get()
            ->keyBy(fn ($t) => strtolower($t->name));

        $tier = fn (string $name): array => [
            'type' => 'maps_to_tier',
            'label' => 'Setara tier '.$name,
            'tier' => strtolower($name),
            'tier_id' => $tierByName[strtolower($name)]?->id,
        ];

        // ── Paket Membership ─────────────────────────────────────────────

        $bronze = Membership::firstOrCreate(
            ['store_id' => $store->id, 'code' => 'BRONZE'],
            [
                'name' => 'Bronze Member',
                'description' => 'Paket awal untuk pelanggan setia.',
                'duration_type' => 'month',
                'duration_value' => 1,
                'price' => 0,
                'discount_percent' => 0,
                'point_multiplier' => 1,
                'maps_to_tier' => 'bronze',
                'maps_to_tier_id' => $tierByName['bronze']?->id,
                'sort_order' => 1,
                'is_sellable_at_pos' => false,
                'auto_tier_min_spend' => 100000,
                'auto_tier_window_type' => 'month',
                'auto_tier_window_value' => 1,
                'benefits' => [
                    $tier('Bronze'),
                    ['type' => 'custom_text', 'label' => 'Akumulasi poin setiap transaksi'],
                    ['type' => 'custom_text', 'label' => 'Informasi promo lebih awal'],
                ],
                'is_active' => true,
            ],
        );

        $silver = Membership::firstOrCreate(
            ['store_id' => $store->id, 'code' => 'SILVER'],
            [
                'name' => 'Silver Member',
                'description' => 'Nikmati diskon 5% setiap transaksi.',
                'duration_type' => 'month',
                'duration_value' => 3,
                'price' => 50000,
                'discount_percent' => 5,
                'point_multiplier' => 2,
                'maps_to_tier' => 'silver',
                'maps_to_tier_id' => $tierByName['silver']?->id,
                'sort_order' => 2,
                'is_sellable_at_pos' => true,
                'auto_tier_min_spend' => 500000,
                'auto_tier_window_type' => 'month',
                'auto_tier_window_value' => 3,
                'benefits' => [
                    ['type' => 'discount_percent', 'label' => 'Diskon 5% setiap transaksi', 'value' => 5],
                    ['type' => 'point_multiplier', 'label' => 'Poin 2x lipat', 'value' => 2],
                    $tier('Silver'),
                    ['type' => 'priority_queue', 'label' => 'Prioritas layanan pelanggan'],
                ],
                'is_active' => true,
            ],
        );

        $gold = Membership::firstOrCreate(
            ['store_id' => $store->id, 'code' => 'GOLD'],
            [
                'name' => 'Gold Member',
                'description' => 'Diskon 10% + poin 3x lipat untuk pelanggan terbaik.',
                'duration_type' => 'month',
                'duration_value' => 6,
                'price' => 100000,
                'discount_percent' => 10,
                'point_multiplier' => 3,
                'maps_to_tier' => 'gold',
                'maps_to_tier_id' => $tierByName['gold']?->id,
                'sort_order' => 3,
                'is_sellable_at_pos' => true,
                'auto_tier_min_spend' => 2000000,
                'auto_tier_window_type' => 'month',
                'auto_tier_window_value' => 3,
                'benefits' => [
                    ['type' => 'discount_percent', 'label' => 'Diskon 10% (maks. Rp 50.000)', 'value' => 10, 'max_amount' => 50000],
                    ['type' => 'point_multiplier', 'label' => 'Poin 3x lipat', 'value' => 3],
                    $tier('Gold'),
                    ['type' => 'free_shipping', 'label' => 'Gratis ongkir min. belanja Rp 100.000', 'min_purchase' => 100000],
                    ['type' => 'custom_text', 'label' => 'Free gift ulang tahun'],
                ],
                'is_active' => true,
            ],
        );

        $platinum = Membership::firstOrCreate(
            ['store_id' => $store->id, 'code' => 'PLATINUM'],
            [
                'name' => 'Platinum Member',
                'description' => 'Paket premium — diskon 15% + semua benefit.',
                'duration_type' => 'year',
                'duration_value' => 1,
                'price' => 300000,
                'discount_percent' => 15,
                'point_multiplier' => 5,
                'maps_to_tier' => 'platinum',
                'maps_to_tier_id' => $tierByName['platinum']?->id,
                'sort_order' => 4,
                'is_sellable_at_pos' => true,
                'auto_tier_min_spend' => null,
                'auto_tier_window_type' => null,
                'auto_tier_window_value' => null,
                'benefits' => [
                    ['type' => 'discount_percent', 'label' => 'Diskon 15% setiap transaksi', 'value' => 15],
                    ['type' => 'point_multiplier', 'label' => 'Poin 5x lipat', 'value' => 5],
                    $tier('Platinum'),
                    ['type' => 'free_shipping', 'label' => 'Gratis ongkir tanpa syarat'],
                    ['type' => 'priority_queue', 'label' => 'Layanan antrean prioritas'],
                    ['type' => 'custom_text', 'label' => 'Akses semua promo'],
                ],
                'is_active' => true,
            ],
        );

        // ── Assign contoh CustomerMembership ─────────────────────────────

        $cst001 = Customer::where('store_id', $store->id)->where('code', 'CST001')->first();
        if ($cst001 && ! CustomerMembership::where('customer_id', $cst001->id)->where('membership_id', $silver->id)->exists()) {
            CustomerMembership::create([
                'customer_id' => $cst001->id,
                'membership_id' => $silver->id,
                'start_date' => now()->subDays(30),
                'expired_date' => now()->addDays(60),
                'status' => 'active',
                'source' => 'manual',
            ]);
            $cst001->syncTierFromMembership();
        }

        $cst003 = Customer::where('store_id', $store->id)->where('code', 'CST003')->first();
        if ($cst003 && ! CustomerMembership::where('customer_id', $cst003->id)->where('membership_id', $gold->id)->exists()) {
            CustomerMembership::create([
                'customer_id' => $cst003->id,
                'membership_id' => $gold->id,
                'start_date' => now()->subDays(15),
                'expired_date' => now()->addMonths(5),
                'status' => 'active',
                'source' => 'purchase',
            ]);
            $cst003->syncTierFromMembership();
        }
    }
}
