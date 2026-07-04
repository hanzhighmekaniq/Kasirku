<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerDepositLog;
use App\Models\CustomerMembership;
use App\Models\Membership;
use App\Models\Store;
use Illuminate\Database\Seeder;

class MembershipSeeder extends Seeder
{
    public function run(): void
    {
        $store3 = Store::where("code", "STORE003")->firstOrFail(); // Barbershop
        $store4 = Store::where("code", "STORE004")->firstOrFail(); // Sewa Alat Jaya

        // ── Master Membership: Barbershop ─────────────────────────────
        $memberBarber = Membership::create([
            "store_id" => $store3->id,
            "code" => "MB-BARBER-01",
            "name" => "Member Bulanan Barber",
            "description" =>
                "Potong rambut unlimited 1 bulan + diskon 10% layanan",
            "duration_type" => "month",
            "duration_value" => 1,
            "price" => 150000,
            "discount_percent" => 10,
            "point_multiplier" => 2,
            "benefits" => ["free_haircut" => 4, "discount_service" => 10],
            "is_active" => true,
        ]);

        $memberBarberYear = Membership::create([
            "store_id" => $store3->id,
            "code" => "MB-BARBER-02",
            "name" => "Member Tahunan Barber",
            "description" => "Hemat 20% semua layanan selama 1 tahun",
            "duration_type" => "year",
            "duration_value" => 1,
            "price" => 1200000,
            "discount_percent" => 20,
            "point_multiplier" => 3,
            "benefits" => ["discount_all" => 20, "priority_queue" => true],
            "is_active" => true,
        ]);

        // ── Master Membership: Sewa Alat ─────────────────────────────
        $memberRental = Membership::create([
            "store_id" => $store4->id,
            "code" => "MB-RENTAL-01",
            "name" => "Langganan Sewa Bulanan",
            "description" => "Sewa alat unlimited 1 bulan, diskon 15%",
            "duration_type" => "month",
            "duration_value" => 1,
            "price" => 250000,
            "discount_percent" => 15,
            "point_multiplier" => 2,
            "benefits" => ["unlimited_rental" => true, "discount" => 15],
            "is_active" => true,
        ]);

        $memberRentalVisit = Membership::create([
            "store_id" => $store4->id,
            "code" => "MB-RENTAL-02",
            "name" => "Paket 10 Kali Sewa",
            "description" => "Bayar 10x sewa alat, hemat 20%",
            "duration_type" => "visit",
            "duration_value" => 10,
            "price" => 800000,
            "discount_percent" => 20,
            "point_multiplier" => 2,
            "benefits" => ["visits" => 10, "discount" => 20],
            "is_active" => true,
        ]);

        // ── Assign membership ke customer ─────────────────────────────
        // Hendra (barber) → member bulanan aktif
        $hendra = Customer::where("store_id", $store3->id)
            ->where("code", "CST001")
            ->first();
        if ($hendra) {
            CustomerMembership::create([
                "customer_id" => $hendra->id,
                "membership_id" => $memberBarber->id,
                "start_date" => "2026-06-01",
                "expired_date" => "2026-06-30",
                "remaining_visits" => null,
                "status" => "active",
                "notes" => "Pembelian bulan Juni",
            ]);
        }

        // Rini (sewa alat) → member bulanan aktif + deposit
        $rini = Customer::where("store_id", $store4->id)
            ->where("code", "CST001")
            ->first();
        if ($rini) {
            CustomerMembership::create([
                "customer_id" => $rini->id,
                "membership_id" => $memberRental->id,
                "start_date" => "2026-06-01",
                "expired_date" => "2026-06-30",
                "remaining_visits" => null,
                "status" => "active",
                "notes" => "Langganan Juni 2026",
            ]);

            // Deposit log untuk Rini (sudah punya saldo 100k)
            CustomerDepositLog::create([
                "customer_id" => $rini->id,
                "store_id" => $store4->id,
                "type" => "topup",
                "amount" => 100000,
                "balance_before" => 0,
                "balance_after" => 100000,
                "notes" => "Top-up deposit awal",
            ]);
        }
    }
}
