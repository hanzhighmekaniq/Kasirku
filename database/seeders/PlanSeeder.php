<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $free = Plan::firstOrCreate(
            ["code" => "free"],
            [
                "label" => "Free",
                "description" => "Paket gratis untuk pemula. Fitur dasar POS.",
                "max_users" => 1,
                "max_branches" => 1,
                "price" => 0,
                "trial_days" => 0,
                "sort_order" => 1,
            ],
        );

        $basic = Plan::firstOrCreate(
            ["code" => "basic"],
            [
                "label" => "Basic",
                "description" => "Paket standar untuk bisnis berkembang.",
                "max_users" => 5,
                "max_branches" => 3,
                "price" => 199000,
                "trial_days" => 14,
                "sort_order" => 2,
            ],
        );

        $pro = Plan::firstOrCreate(
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
            ],
        );

        // Sync features via pivot
        $free
            ->planFeatures()
            ->sync(
                Feature::whereIn("code", [
                    "basic_pos",
                    "stock",
                    "purchase",
                    "promo",
                ])->pluck("id"),
            );

        $basic
            ->planFeatures()
            ->sync(
                Feature::whereIn("code", [
                    "basic_pos",
                    "stock",
                    "purchase",
                    "batch",
                    "expiry",
                    "promo",
                    "sale_return",
                    "recipe",
                    "modifier",
                    "table",
                    "kitchen",
                    "waste",
                    "queue",
                    "booking",
                    "commission",
                    "membership",
                    "deposit",
                    "report",
                    "payment_gateway",
                    "stock_opname",
                ])->pluck("id"),
            );

        $pro->planFeatures()->sync(
            Feature::pluck("id"), // all features
        );
    }
}
