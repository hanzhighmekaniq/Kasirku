<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\EmployeeCommission;
use App\Models\Product;
use App\Models\QueueTicket;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class ServiceSaleSeeder extends Seeder
{
    public function run(): void
    {
        $store3 = Store::where("code", "STORE003")->firstOrFail();
        $store4 = Store::where("code", "STORE004")->firstOrFail();
        $br5 = Branch::where("code", "BR005")->firstOrFail();
        $br6 = Branch::where("code", "BR006")->firstOrFail();

        $kasir5 = User::where("email", "barber@gmail.com")->firstOrFail();
        $kasir6 = User::where("email", "laundry@gmail.com")->firstOrFail();

        $emp8 = Employee::where("employee_code", "EMP008")->firstOrFail(); // Eko
        $emp9 = Employee::where("employee_code", "EMP009")->firstOrFail(); // Fandi
        $emp10 = Employee::where("employee_code", "EMP010")->firstOrFail(); // Dimas

        $hendra = Customer::where("store_id", $store3->id)
            ->where("code", "CST001")
            ->first();
        $bagas = Customer::where("store_id", $store3->id)
            ->where("code", "CST002")
            ->first();
        $rini = Customer::where("store_id", $store4->id)
            ->where("code", "CST001")
            ->first();
        $yoga = Customer::where("store_id", $store4->id)
            ->where("code", "CST002")
            ->first();

        // Produk barbershop
        $potongBiasa = Product::where("sku", "S3-SV-001")->firstOrFail();
        $potongCuci = Product::where("sku", "S3-SV-002")->firstOrFail();
        $undercut = Product::where("sku", "S3-SV-003")->firstOrFail();
        $cukurJenggot = Product::where("sku", "S3-SV-004")->firstOrFail();

        // Produk laundry
        $cuciRegular = Product::where("sku", "S4-LN-001")->firstOrFail();
        $cuciSetrika = Product::where("sku", "S4-LN-002")->firstOrFail();
        $express = Product::where("sku", "S4-LN-003")->firstOrFail();

        // ── BARBERSHOP: Antrian + Transaksi ───────────────────────────

        // Queue 1 — Hendra (done, sudah transaksi)
        $q1 = QueueTicket::create([
            "store_id" => $store3->id,
            "branch_id" => $br5->id,
            "customer_id" => $hendra?->id,
            "employee_id" => $emp9->id,
            "queue_no" => "A001",
            "category" => "Potong + Cuci",
            "customer_name" => $hendra?->name ?? "Hendra",
            "customer_phone" => $hendra?->phone,
            "status" => "done",
            "called_at" => "2026-06-21 09:00:00",
            "started_at" => "2026-06-21 09:05:00",
            "finished_at" => "2026-06-21 09:30:00",
            "queue_date" => "2026-06-21",
        ]);

        $sale1 = Sale::create([
            "store_id" => $store3->id,
            "branch_id" => $br5->id,
            "customer_id" => $hendra?->id,
            "user_id" => $kasir5->id,
            "employee_id" => $emp9->id,
            "sale_no" => "BR-20260621-001",
            "sale_date" => "2026-06-21 09:30:00",
            "pos_mode" => "service",
            "subtotal" => 35000,
            "grand_total" => 35000,
            "paid_amount" => 35000,
            "change_amount" => 0,
            "status" => "completed",
            "payment_status" => "paid",
            "service_status" => "done",
            "service_started_at" => "2026-06-21 09:05:00",
            "service_finished_at" => "2026-06-21 09:30:00",
        ]);
        $item1 = SaleItem::create([
            "sale_id" => $sale1->id,
            "product_id" => $potongCuci->id,
            "employee_id" => $emp9->id,
            "quantity" => 1,
            "price" => 35000,
            "subtotal" => 35000,
            "item_status" => "served",
        ]);
        SalePayment::create([
            "sale_id" => $sale1->id,
            "payment_method_id" => 1,
            "paid_at" => $sale1->sale_date,
            "amount" => 35000,
        ]);
        // Update queue dengan sale_id
        $q1->update(["sale_id" => $sale1->id]);
        // Komisi Fandi 15%
        EmployeeCommission::create([
            "employee_id" => $emp9->id,
            "store_id" => $store3->id,
            "sale_id" => $sale1->id,
            "sale_item_id" => $item1->id,
            "type" => "percent",
            "commission_rate" => 15,
            "base_amount" => 35000,
            "commission_amount" => 5250,
            "status" => "approved",
            "commission_date" => "2026-06-21",
        ]);

        // Queue 2 — Bagas (done)
        $q2 = QueueTicket::create([
            "store_id" => $store3->id,
            "branch_id" => $br5->id,
            "customer_id" => $bagas?->id,
            "employee_id" => $emp10->id,
            "queue_no" => "A002",
            "category" => "Potong Biasa",
            "customer_name" => $bagas?->name ?? "Bagas",
            "status" => "done",
            "called_at" => "2026-06-21 09:35:00",
            "started_at" => "2026-06-21 09:38:00",
            "finished_at" => "2026-06-21 09:55:00",
            "queue_date" => "2026-06-21",
        ]);

        $sale2 = Sale::create([
            "store_id" => $store3->id,
            "branch_id" => $br5->id,
            "customer_id" => $bagas?->id,
            "user_id" => $kasir5->id,
            "employee_id" => $emp10->id,
            "sale_no" => "BR-20260621-002",
            "sale_date" => "2026-06-21 09:55:00",
            "pos_mode" => "service",
            "subtotal" => 20000,
            "grand_total" => 20000,
            "paid_amount" => 20000,
            "change_amount" => 0,
            "status" => "completed",
            "payment_status" => "paid",
            "service_status" => "done",
            "service_started_at" => "2026-06-21 09:38:00",
            "service_finished_at" => "2026-06-21 09:55:00",
        ]);
        $item2 = SaleItem::create([
            "sale_id" => $sale2->id,
            "product_id" => $potongBiasa->id,
            "employee_id" => $emp10->id,
            "quantity" => 1,
            "price" => 20000,
            "subtotal" => 20000,
            "item_status" => "served",
        ]);
        SalePayment::create([
            "sale_id" => $sale2->id,
            "payment_method_id" => 2,
            "paid_at" => $sale2->sale_date,
            "amount" => 20000,
        ]);
        $q2->update(["sale_id" => $sale2->id]);
        EmployeeCommission::create([
            "employee_id" => $emp10->id,
            "store_id" => $store3->id,
            "sale_id" => $sale2->id,
            "sale_item_id" => $item2->id,
            "type" => "percent",
            "commission_rate" => 10,
            "base_amount" => 20000,
            "commission_amount" => 2000,
            "status" => "pending",
            "commission_date" => "2026-06-21",
        ]);

        // Queue 3 — Walk-in (sedang dilayani)
        QueueTicket::create([
            "store_id" => $store3->id,
            "branch_id" => $br5->id,
            "customer_id" => null,
            "employee_id" => $emp8->id,
            "queue_no" => "A003",
            "category" => "Undercut / Fade",
            "customer_name" => "Budi (walk-in)",
            "status" => "in_service",
            "called_at" => "2026-06-21 10:00:00",
            "started_at" => "2026-06-21 10:05:00",
            "queue_date" => "2026-06-21",
        ]);

        // Queue 4 — Menunggu
        QueueTicket::create([
            "store_id" => $store3->id,
            "branch_id" => $br5->id,
            "customer_id" => null,
            "employee_id" => null,
            "queue_no" => "A004",
            "category" => "Potong Biasa",
            "customer_name" => "Agus",
            "customer_phone" => "08119988776",
            "status" => "waiting",
            "queue_date" => "2026-06-21",
        ]);

        // ── LAUNDRY: Transaksi dengan status proses ───────────────────

        // Order 1 — Rini, sudah diambil
        $lSale1 = Sale::create([
            "store_id" => $store4->id,
            "branch_id" => $br6->id,
            "customer_id" => $rini?->id,
            "user_id" => $kasir6->id,
            "sale_no" => "LN-20260619-001",
            "sale_date" => "2026-06-19 09:00:00",
            "pos_mode" => "service",
            "subtotal" => 70000,
            "grand_total" => 70000,
            "paid_amount" => 70000,
            "change_amount" => 0,
            "status" => "completed",
            "payment_status" => "paid",
            "laundry_status" => "picked_up",
            "weight_kg" => 7.0,
            "estimated_done_at" => "2026-06-20 17:00:00",
            "picked_up_at" => "2026-06-20 18:30:00",
            "customer_name" => $rini?->name,
        ]);
        SaleItem::create([
            "sale_id" => $lSale1->id,
            "product_id" => $cuciSetrika->id,
            "quantity" => 7,
            "price" => 10000,
            "subtotal" => 70000,
            "item_status" => "served",
        ]);
        SalePayment::create([
            "sale_id" => $lSale1->id,
            "payment_method_id" => 1,
            "paid_at" => $lSale1->sale_date,
            "amount" => 70000,
        ]);

        // Order 2 — Yoga, sedang diproses
        $lSale2 = Sale::create([
            "store_id" => $store4->id,
            "branch_id" => $br6->id,
            "customer_id" => $yoga?->id,
            "user_id" => $kasir6->id,
            "sale_no" => "LN-20260621-001",
            "sale_date" => "2026-06-21 08:00:00",
            "pos_mode" => "service",
            "subtotal" => 35000,
            "grand_total" => 35000,
            "paid_amount" => 35000,
            "change_amount" => 0,
            "status" => "processing",
            "payment_status" => "paid",
            "laundry_status" => "washing",
            "weight_kg" => 5.0,
            "estimated_done_at" => "2026-06-21 17:00:00",
            "customer_name" => $yoga?->name,
        ]);
        SaleItem::create([
            "sale_id" => $lSale2->id,
            "product_id" => $cuciRegular->id,
            "quantity" => 5,
            "price" => 7000,
            "subtotal" => 35000,
            "item_status" => "pending",
        ]);
        SalePayment::create([
            "sale_id" => $lSale2->id,
            "payment_method_id" => 2,
            "paid_at" => $lSale2->sale_date,
            "amount" => 35000,
        ]);

        // Order 3 — Walk-in, ready diambil
        Sale::create([
            "store_id" => $store4->id,
            "branch_id" => $br6->id,
            "customer_id" => null,
            "user_id" => $kasir6->id,
            "sale_no" => "LN-20260620-001",
            "sale_date" => "2026-06-20 10:00:00",
            "pos_mode" => "service",
            "subtotal" => 45000,
            "grand_total" => 45000,
            "paid_amount" => 45000,
            "change_amount" => 0,
            "status" => "pending",
            "payment_status" => "paid",
            "laundry_status" => "ready",
            "weight_kg" => 3.0,
            "estimated_done_at" => "2026-06-21 09:00:00",
            "customer_name" => "Ahmad (walk-in)",
            "customer_phone" => "081288889999",
        ]);
    }
}
