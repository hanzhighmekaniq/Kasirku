<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * PlanSeeder — buat 3 plan (free, basic, pro) dan attach fitur.
 *
 * PENTING: Harus dijalankan SETELAH FeatureSeeder agar feature codes sudah ada.
 * Feature codes di sini harus sinkron dengan FeatureSeeder.php.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        // ── Buat plan ─────────────────────────────────────────────────
        Plan::updateOrCreate(
            ["code" => "free"],
            [
                "label" => "Free",
                "description" => "Paket gratis untuk pemula. Fitur dasar POS.",
                "max_users" => 1,
                "max_branches" => 1,
                "price" => 0,
                "trial_days" => 0,
                "sort_order" => 1,
                "is_active" => true,
            ],
        );

        Plan::updateOrCreate(
            ["code" => "basic"],
            [
                "label" => "Basic",
                "description" => "Paket standar untuk bisnis berkembang.",
                "max_users" => 5,
                "max_branches" => 3,
                "price" => 199000,
                "trial_days" => 14,
                "sort_order" => 2,
                "is_active" => true,
            ],
        );

        Plan::updateOrCreate(
            ["code" => "pro"],
            [
                "label" => "Pro",
                "description" =>
                    "Paket premium tanpa batasan. Semua fitur unlocked.",
                "max_users" => 999,
                "max_branches" => 999,
                "price" => 499000,
                "trial_days" => 7,
                "sort_order" => 3,
                "is_active" => true,
            ],
        );

        Plan::updateOrCreate(
            ["code" => "unlimited"],
            [
                "label" => "Unlimited",
                "description" =>
                    "Paket tanpa batas. Semua fitur + prioritas support.",
                "max_users" => 999,
                "max_branches" => 999,
                "price" => 999000,
                "trial_days" => 0,
                "sort_order" => 4,
                "is_active" => true,
            ],
        );

        // ── Attach fitur ke plan ──────────────────────────────────────
        // NOTE: Feature codes ini harus sinkron dengan FeatureSeeder.php

        $free = Plan::where("code", "free")->first();
        $basic = Plan::where("code", "basic")->first();
        $pro = Plan::where("code", "pro")->first();
        $unlimited = Plan::where("code", "unlimited")->first();

        // Free: hanya fitur dasar
        if ($free) {
            $free
                ->features()
                ->sync(
                    Feature::whereIn("code", [
                        "dashboard",
                        "basic_pos",
                        "shift",
                        "product",
                        "category",
                        "customer",
                        "employee",
                        "expense",
                    ])->pluck("id"),
                );
        }

        // Basic: semua fitur kecuali deposit (legacy)
        if ($basic) {
            $basic
                ->features()
                ->sync(
                    Feature::whereIn("code", [
                        "dashboard",
                        "basic_pos",
                        "shift",
                        "sale_return",
                        "promo",
                        "expense",
                        "table",
                        "kitchen",
                        "queue",
                        "booking",
                        "product",
                        "category",
                        "modifier",
                        "customer",
                        "membership",
                        "supplier",
                        "employee",
                        "commission",
                        "purchase",
                        "purchase_return",
                        "stock",
                        "batch_expired",
                        "stock_adjustment",
                        "stock_opname",
                        "stock_transfer",
                        "waste",
                        "recipe",
                        "report",
                        "payment_gateway",
                        "payment_method",
                        "settings",
                        "user_management",
                        "role_management",
                        "activity_log",
                    ])->pluck("id"),
                );
        }

        // Pro: semua fitur (termasuk deposit legacy)
        if ($pro) {
            $pro->features()->sync(Feature::pluck("id"));
        }

        // Unlimited: semua fitur (sama seperti Pro)
        if ($unlimited) {
            $unlimited->features()->sync(Feature::pluck("id"));
        }
    }
}
