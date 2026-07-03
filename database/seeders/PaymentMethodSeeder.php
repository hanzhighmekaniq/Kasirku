<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        PaymentMethod::create([
            "code" => "CASH",
            "name" => "Tunai",
            "type" => "cash",
            "provider" => null,
            "sort_order" => 1,
        ]);

        PaymentMethod::create([
            "code" => "QRIS",
            "name" => "QRIS",
            "type" => "digital",
            "provider" => "QRIS",
            "sort_order" => 2,
        ]);

        PaymentMethod::create([
            "code" => "DEBIT_BCA",
            "name" => "Kartu Debit BCA",
            "type" => "card",
            "provider" => "BCA",
            "sort_order" => 3,
        ]);

        PaymentMethod::create([
            "code" => "GOPAY",
            "name" => "GoPay",
            "type" => "ewallet",
            "provider" => "Gojek",
            "sort_order" => 4,
        ]);

        PaymentMethod::create([
            "code" => "OVO",
            "name" => "OVO",
            "type" => "ewallet",
            "provider" => "OVO",
            "sort_order" => 5,
        ]);

        PaymentMethod::create([
            "code" => "BCA",
            "name" => "BCA Transfer",
            "type" => "transfer",
            "provider" => "BCA",
            "sort_order" => 6,
        ]);

        PaymentMethod::create([
            "code" => "MANDIRI",
            "name" => "Mandiri Transfer",
            "type" => "transfer",
            "provider" => "Mandiri",
            "sort_order" => 7,
        ]);

        PaymentMethod::create([
            "code" => "CREDIT_BCA",
            "name" => "Kartu Kredit BCA",
            "type" => "card",
            "provider" => "BCA",
            "sort_order" => 8,
        ]);
    }
}
