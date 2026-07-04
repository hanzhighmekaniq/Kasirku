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
        $kasir6 = User::where("email", "sewa@gmail.com")->firstOrFail();

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

        // Produk rental
        $molen = Product::where("sku", "S4-RT-001")->firstOrFail();
        $kamera = Product::where("sku", "S4-RT-003")->firstOrFail();
        $tenda = Product::where("sku", "S4-RT-005")->firstOrFail();

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
        $q1->update(["sale_id" => $sale1->id]);
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

        // ── RENTAL: Transaksi sewa alat ─────────────────────────────

        // Order 1 — Rini, sewa molen 3 hari, sudah dikembalikan
        $rSale1 = Sale::create([
            "store_id" => $store4->id,
            "branch_id" => $br6->id,
            "customer_id" => $rini?->id,
            "user_id" => $kasir6->id,
            "sale_no" => "RT-20260619-001",
            "sale_date" => "2026-06-19 09:00:00",
            "pos_mode" => "rental",
            "subtotal" => 240000,
            "grand_total" => 240000,
            "paid_amount" => 240000,
            "change_amount" => 0,
            "status" => "completed",
            "payment_status" => "paid",
            "rental_status" => "returned",
            "deposit_amount" => 100000,
            "customer_name" => $rini?->name,
        ]);
        SaleItem::create([
            "sale_id" => $rSale1->id,
            "product_id" => $molen->id,
            "quantity" => 3,
            "price" => 80000,
            "subtotal" => 240000,
            "item_status" => "served",
        ]);
        SalePayment::create([
            "sale_id" => $rSale1->id,
            "payment_method_id" => 1,
            "paid_at" => $rSale1->sale_date,
            "amount" => 240000,
        ]);

        // Order 2 — Yoga, sewa kamera 2 hari, sedang aktif
        $rSale2 = Sale::create([
            "store_id" => $store4->id,
            "branch_id" => $br6->id,
            "customer_id" => $yoga?->id,
            "user_id" => $kasir6->id,
            "sale_no" => "RT-20260621-001",
            "sale_date" => "2026-06-21 08:00:00",
            "pos_mode" => "rental",
            "subtotal" => 200000,
            "grand_total" => 200000,
            "paid_amount" => 200000,
            "change_amount" => 0,
            "status" => "processing",
            "payment_status" => "paid",
            "rental_status" => "active",
            "deposit_amount" => 50000,
            "customer_name" => $yoga?->name,
        ]);
        SaleItem::create([
            "sale_id" => $rSale2->id,
            "product_id" => $kamera->id,
            "quantity" => 2,
            "price" => 100000,
            "subtotal" => 200000,
            "item_status" => "pending",
        ]);
        SalePayment::create([
            "sale_id" => $rSale2->id,
            "payment_method_id" => 2,
            "paid_at" => $rSale2->sale_date,
            "amount" => 200000,
        ]);

        // Order 3 — Walk-in, sewa tenda 1 hari, sudah dipesan
        Sale::create([
            "store_id" => $store4->id,
            "branch_id" => $br6->id,
            "customer_id" => null,
            "user_id" => $kasir6->id,
            "sale_no" => "RT-20260620-001",
            "sale_date" => "2026-06-20 10:00:00",
            "pos_mode" => "rental",
            "subtotal" => 200000,
            "grand_total" => 200000,
            "paid_amount" => 200000,
            "change_amount" => 0,
            "status" => "pending",
            "payment_status" => "paid",
            "rental_status" => "reserved",
            "deposit_amount" => 150000,
            "customer_name" => "Bapak Ahmad",
            "customer_phone" => "081288889999",
        ]);
    }
}
