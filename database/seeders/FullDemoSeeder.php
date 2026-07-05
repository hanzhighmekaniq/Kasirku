<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FullDemoSeeder extends Seeder
{
    private array $columns = [];

    public function run(): void
    {
        $stores = [
            "STORE001" => [
                "type" => "retail",
                "customer" => ["Rina Marlina", "081300000001"],
                "categories" => ["Sembako", "Minuman Kemasan", "Snack Kemasan"],
                "products" => [
                    [
                        "Beras Premium 5kg",
                        "finished_goods",
                        "pcs",
                        56000,
                        48500,
                        true,
                    ],
                    [
                        "Air Mineral 600ml",
                        "finished_goods",
                        "botol",
                        4000,
                        2500,
                        true,
                    ],
                    [
                        "Indomie Goreng",
                        "finished_goods",
                        "pcs",
                        3500,
                        2600,
                        true,
                    ],
                ],
            ],
            "STORE002" => [
                "type" => "fnb",
                "customer" => ["Fajar Nugroho", "081300000002"],
                "categories" => ["Coffee", "Food", "Raw Material"],
                "products" => [
                    [
                        "Kopi Susu Senja",
                        "finished_goods",
                        "cup",
                        28000,
                        9000,
                        false,
                    ],
                    [
                        "Nasi Goreng Kampung",
                        "finished_goods",
                        "plate",
                        32000,
                        14000,
                        false,
                    ],
                    [
                        "Biji Kopi Arabica 1kg",
                        "raw_material",
                        "gram",
                        150000,
                        150000,
                        true,
                    ],
                ],
            ],
            "STORE003" => [
                "type" => "service",
                "customer" => ["Hendra Wijaya", "081300000003"],
                "categories" => ["Haircut", "Treatment", "Laundry Service"],
                "products" => [
                    [
                        "Potong Rambut Premium",
                        "service",
                        "layanan",
                        35000,
                        0,
                        false,
                    ],
                    [
                        "Hair Wash & Styling",
                        "service",
                        "layanan",
                        25000,
                        0,
                        false,
                    ],
                    ["Laundry Kiloan", "service", "kg", 8000, 3000, false],
                ],
            ],
            "STORE004" => [
                "type" => "rental",
                "customer" => ["Rini Suryani", "081300000004"],
                "categories" => [
                    "Heavy Equipment",
                    "Camera & Audio",
                    "Event Equipment",
                ],
                "products" => [
                    [
                        "Sewa Molen Beton / Hari",
                        "rental_item",
                        "hari",
                        80000,
                        40000,
                        false,
                    ],
                    [
                        "Sewa Kamera DSLR / Hari",
                        "rental_item",
                        "hari",
                        100000,
                        50000,
                        false,
                    ],
                    [
                        "Sewa Tenda Roder / Hari",
                        "rental_item",
                        "hari",
                        200000,
                        100000,
                        false,
                    ],
                ],
            ],
            "STORE005" => [
                "type" => "ticket",
                "customer" => ["Anton Wijaya", "081300000005"],
                "categories" => ["Movie Ticket", "Event Ticket", "Sport Slot"],
                "products" => [
                    ["Tiket Reguler", "service", "ticket", 45000, 0, false],
                    ["Tiket VIP", "service", "ticket", 75000, 0, false],
                    [
                        "Booking Studio Mini",
                        "service",
                        "slot",
                        150000,
                        0,
                        false,
                    ],
                ],
            ],
            "STORE006" => [
                "type" => "hospitality",
                "customer" => ["Mega Putri", "081300000006"],
                "categories" => ["Room", "Villa", "Add-on"],
                "products" => [
                    [
                        "Deluxe Room / Night",
                        "service",
                        "malam",
                        450000,
                        150000,
                        false,
                    ],
                    [
                        "Family Villa / Night",
                        "service",
                        "malam",
                        1250000,
                        450000,
                        false,
                    ],
                    ["Extra Bed", "service", "pcs", 150000, 50000, false],
                ],
            ],
            "STORE007" => [
                "type" => "parking",
                "customer" => ["Bayu Setiawan", "081300000007"],
                "categories" => ["Parking Rate", "Penalty", "Subscription"],
                "products" => [
                    ["Parkir Motor / Jam", "time_based", "jam", 2000, 0, false],
                    ["Parkir Mobil / Jam", "time_based", "jam", 5000, 0, false],
                    [
                        "Denda Tiket Hilang",
                        "service",
                        "ticket",
                        50000,
                        0,
                        false,
                    ],
                ],
            ],
            "STORE008" => [
                "type" => "session",
                "customer" => ["Rama Putra", "081300000008"],
                "categories" => ["PC Gaming", "Console Room", "Karaoke Room"],
                "products" => [
                    ["PC Gaming 1 Jam", "time_based", "jam", 12000, 0, false],
                    ["PS Room 2 Jam", "time_based", "paket", 35000, 0, false],
                    [
                        "Karaoke Room 1 Jam",
                        "time_based",
                        "jam",
                        75000,
                        0,
                        false,
                    ],
                ],
            ],
        ];

        foreach ($stores as $code => $config) {
            $this->seedStore($code, $config);
        }
    }

    private function seedStore(string $storeCode, array $config): void
    {
        $store = DB::table("stores")->where("code", $storeCode)->first();
        if (!$store) {
            return;
        }

        $branches = DB::table("branches")
            ->where("store_id", $store->id)
            ->orderBy("id")
            ->get();
        $branch = $branches->first();
        if (!$branch) {
            return;
        }

        $type = $config["type"];
        $ownerNo = (int) substr($storeCode, -3);
        $ownerEmail = "owner{$ownerNo}@gmail.com";
        $ownerId = DB::table("users")->where("email", $ownerEmail)->value("id");
        // Kasir: ambil dari employee pertama di branch pertama (sudah dibuat EmployeeSeeder)
        $cashierId = DB::table("employees")
            ->where("store_id", $store->id)
            ->where("branch_id", $branch->id)
            ->orderBy("id")
            ->value("user_id") ?? $ownerId;

        $cashId = $this->upsert(
            "payment_methods",
            ["code" => "{$storeCode}-CASH"],
            [
                "store_id" => $store->id,
                "name" => "Cash",
                "type" => "cash",
                "provider" => null,
                "sort_order" => 1,
                "is_active" => true,
            ],
        );
        $qrisId = $this->upsert(
            "payment_methods",
            ["code" => "{$storeCode}-QRIS"],
            [
                "store_id" => $store->id,
                "name" => "QRIS",
                "type" => "qris",
                "provider" => "midtrans",
                "sort_order" => 2,
                "is_active" => true,
            ],
        );

        $expenseCategoryId = $this->upsert(
            "expense_categories",
            ["store_id" => $store->id, "code" => "UTIL"],
            [
                "name" => "Utilities",
                "description" =>
                    "Listrik, air, internet, dan operasional rutin",
            ],
        );

        $supplierId = $this->upsert(
            "suppliers",
            ["store_id" => $store->id, "code" => "SUP001"],
            [
                "name" => $this->supplierName($type),
                "contact_person" => "Supplier Demo",
                "phone" => "081200000000",
                "email" => strtolower($storeCode) . "@supplier.test",
                "address" => "Gudang Supplier Demo",
                "notes" => "Supplier demo sesuai tipe toko",
                "is_active" => true,
            ],
        );

        $customerId = $this->upsert(
            "customers",
            ["store_id" => $store->id, "code" => "CST001"],
            [
                "name" => $config["customer"][0],
                "phone" => $config["customer"][1],
                "email" =>
                    strtolower(str_replace(" ", ".", $config["customer"][0])) .
                    "@demo.test",
                "address" => "Alamat pelanggan demo",
                "birth_date" => "1994-01-15",
                "gender" => "male",
                "points" => 100,
                "tier" => "silver",
                "total_spent" => 0,
                "deposit_balance" => in_array(
                    $type,
                    ["service", "rental", "hospitality"],
                    true,
                )
                    ? 100000
                    : 0,
                "notes" => "Customer demo " . $type,
                "is_active" => true,
            ],
        );

        $ownerEmployeeId = null; // Owner bukan karyawan — tidak ada di employees
        // Ambil employee kasir pertama di branch pertama store ini (sudah dibuat EmployeeSeeder)
        $cashierEmployeeId = DB::table("employees")
            ->where("store_id", $store->id)
            ->where("branch_id", $branch->id)
            ->orderBy("id")
            ->value("id");

        $categoryIds = [];
        foreach ($config["categories"] as $idx => $categoryName) {
            $slug = strtolower(
                $storeCode .
                    "-" .
                    preg_replace("/[^a-z0-9]+/i", "-", $categoryName),
            );
            $categoryIds[] = $this->upsert(
                "categories",
                ["store_id" => $store->id, "slug" => $slug],
                [
                    "parent_id" => null,
                    "name" => $categoryName,
                    "image" => null,
                    "sort_order" => $idx + 1,
                    "is_active" => true,
                ],
            );
        }

        $productIds = [];
        foreach ($config["products"] as $idx => $product) {
            [
                $name,
                $productType,
                $unit,
                $sellPrice,
                $costPrice,
                $trackStock,
            ] = $product;
            $sku = sprintf("%s-P%03d", $storeCode, $idx + 1);
            $productIds[] = $this->upsert(
                "products",
                ["sku" => $sku],
                [
                    "store_id" => $store->id,
                    "category_id" =>
                        $categoryIds[$idx % max(count($categoryIds), 1)] ??
                        null,
                    "supplier_id" => $supplierId,
                    "barcode" => $trackStock
                        ? sprintf("899%s%03d", substr($storeCode, -3), $idx + 1)
                        : null,
                    "name" => $name,
                    "description" => "Produk demo {$type}: {$name}",
                    "type" => $productType,
                    "image" => null,
                    "is_composable" => $type === "fnb" && $idx === 0,
                    "preparation_time" => $type === "fnb" ? 10 : null,
                    "is_sellable" => true,
                    "unit" => $unit,
                    "base_unit" => $unit,
                    "cost_price" => $costPrice,
                    "sell_price" => $sellPrice,
                    "price_per_hour" => in_array(
                        $type,
                        ["parking", "session"],
                        true,
                    )
                        ? $sellPrice
                        : null,
                    "min_duration_minutes" => in_array(
                        $type,
                        ["parking", "session", "rental"],
                        true,
                    )
                        ? 60
                        : null,
                    "capacity" => $type === "ticket" ? 120 : null,
                    "max_guests" => $type === "hospitality" ? 4 : null,
                    "valid_duration_minutes" => $type === "ticket" ? 180 : null,
                    "session_duration_minutes" =>
                        $type === "session" ? 60 : null,
                    "deposit_amount" => $type === "rental" ? 50000 : null,
                    "stock_minimum" => $trackStock ? 10 : 0,
                    "track_stock" => $trackStock,
                    "is_active" => true,
                ],
            );
        }

        $firstProductId = $productIds[0] ?? null;
        $secondProductId = $productIds[1] ?? $firstProductId;
        if (!$firstProductId) {
            return;
        }

        $this->upsert(
            "product_variants",
            ["sku" => "{$storeCode}-VAR-001"],
            [
                "product_id" => $firstProductId,
                "name" => "Default",
                "barcode" => null,
                "price" => $config["products"][0][3],
                "cost_price" => $config["products"][0][4],
                "is_active" => true,
            ],
        );

        if ($config["products"][0][5]) {
            $batchId = $this->upsert(
                "product_batches",
                [
                    "product_id" => $firstProductId,
                    "batch_no" => "{$storeCode}-BATCH-001",
                ],
                [
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "purchase_date" => "2026-07-01",
                    "expiry_date" => "2027-07-01",
                    "quantity" => 100,
                    "cost_price" => $config["products"][0][4],
                ],
            );
            $this->upsert(
                "product_stocks",
                ["product_id" => $firstProductId, "branch_id" => $branch->id],
                [
                    "store_id" => $store->id,
                    "quantity" => 100,
                    "reserved_quantity" => 0,
                ],
            );
            $this->upsert(
                "stock_movements",
                ["reference_no" => "{$storeCode}-OPENING-STOCK"],
                [
                    "product_id" => $firstProductId,
                    "product_batch_id" => $batchId,
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "movement_type" => "opening_balance",
                    "quantity" => 100,
                    "unit_cost" => $config["products"][0][4],
                    "reference_type" => "seed",
                    "notes" => "Saldo awal demo",
                    "moved_at" => Carbon::now(),
                ],
            );
        }

        if ($type === "fnb") {
            $tableId = $this->upsert(
                "cafe_tables",
                [
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "table_number" => "T01",
                ],
                [
                    "zone" => "Indoor",
                    "capacity" => 4,
                    "status" => "available",
                    "is_active" => true,
                ],
            );
            $modifierGroupId = $this->upsert(
                "product_modifier_groups",
                ["store_id" => $store->id, "name" => "Sugar Level"],
                [
                    "description" => "Pilihan gula",
                    "is_required" => false,
                    "selection_type" => "single",
                    "max_selection" => 1,
                    "sort_order" => 1,
                    "is_active" => true,
                ],
            );
            $modifierId = $this->upsert(
                "product_modifiers",
                [
                    "modifier_group_id" => $modifierGroupId,
                    "name" => "Less Sugar",
                ],
                [
                    "price_addition" => 0,
                    "is_active" => true,
                    "sort_order" => 1,
                ],
            );
            $this->upsert(
                "product_modifier_products",
                [
                    "product_id" => $firstProductId,
                    "modifier_group_id" => $modifierGroupId,
                ],
                [],
            );
            $this->upsert(
                "product_recipes",
                [
                    "product_id" => $firstProductId,
                    "raw_material_id" => $productIds[2] ?? $firstProductId,
                ],
                [
                    "quantity" => 18,
                    "unit" => "gram",
                    "is_nullable" => false,
                    "notes" => "Resep demo kopi susu",
                ],
            );
        } else {
            $tableId = null;
        }

        $promotionId = $this->upsert(
            "promotions",
            ["code" => "{$storeCode}-PROMO10"],
            [
                "store_id" => $store->id,
                "name" => "Promo Demo 10%",
                "type" => "percent",
                "scope" => "cart",
                "discount_value" => 10,
                "min_purchase_amount" => 0,
                "max_discount_amount" => 25000,
                "start_date" => "2026-07-01",
                "end_date" => "2026-12-31",
                "is_active" => true,
            ],
        );
        $this->upsert(
            "promotion_products",
            ["promotion_id" => $promotionId, "product_id" => $firstProductId],
            [],
        );

        $membershipId = $this->upsert(
            "memberships",
            ["store_id" => $store->id, "code" => "MEMBER-DEMO"],
            [
                "name" => "Demo Membership",
                "description" => "Membership demo per tipe toko",
                "duration_type" => "month",
                "duration_value" => 1,
                "price" => 100000,
                "discount_percent" => 10,
                "point_multiplier" => 2,
                "benefits" => json_encode(["demo" => true, "type" => $type]),
                "is_active" => true,
            ],
        );
        $this->upsert(
            "customer_memberships",
            ["customer_id" => $customerId, "membership_id" => $membershipId],
            [
                "sale_id" => null,
                "start_date" => "2026-07-01",
                "expired_date" => "2026-08-01",
                "remaining_visits" => null,
                "status" => "active",
                "notes" => "Membership demo",
            ],
        );
        $this->upsert(
            "customer_deposit_logs",
            [
                "customer_id" => $customerId,
                "store_id" => $store->id,
                "type" => "topup",
            ],
            [
                "sale_id" => null,
                "amount" => 100000,
                "balance_before" => 0,
                "balance_after" => 100000,
                "notes" => "Top-up deposit demo",
            ],
        );

        $shiftId = $this->upsert(
            "cashier_shifts",
            ["shift_no" => "SHIFT-{$storeCode}-001"],
            [
                "store_id" => $store->id,
                "branch_id" => $branch->id,
                "user_id" => $cashierId,
                "opened_at" => "2026-07-04 08:00:00",
                "closed_at" => "2026-07-04 17:00:00",
                "opening_cash" => 250000,
                "expected_cash" => 250000 + $config["products"][0][3],
                "actual_cash" => 250000 + $config["products"][0][3],
                "cash_difference" => 0,
                "total_sales" => $config["products"][0][3],
                "total_refunds" => 0,
                "total_expenses" => 25000,
                "status" => "closed",
                "opening_note" => "Shift demo dibuka",
                "closing_note" => "Shift demo ditutup balance",
            ],
        );
        $this->upsert(
            "cashier_shift_payments",
            ["cashier_shift_id" => $shiftId, "payment_method_id" => $cashId],
            [
                "system_amount" => $config["products"][0][3],
                "actual_amount" => $config["products"][0][3],
                "difference_amount" => 0,
            ],
        );

        $saleData = $this->modeSaleData(
            $type,
            $tableId,
            $cashierEmployeeId,
            $config["products"][0][3],
        );
        $saleId = $this->upsert(
            "sales",
            ["sale_no" => "SALE-{$storeCode}-001"],
            array_merge(
                [
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "customer_id" => $customerId,
                    "user_id" => $cashierId,
                    "cashier_shift_id" => $shiftId,
                    "sale_date" => "2026-07-04 10:00:00",
                    "pos_mode" => $type,
                    "order_type" => $this->defaultOrderType($type),
                    "subtotal" => $config["products"][0][3],
                    "discount_amount" => 0,
                    "tax_amount" => 0,
                    "shipping_amount" => 0,
                    "grand_total" => $config["products"][0][3],
                    "paid_amount" => $config["products"][0][3],
                    "change_amount" => 0,
                    "status" => "completed",
                    "payment_status" => "paid",
                    "customer_name" => $config["customer"][0],
                    "customer_phone" => $config["customer"][1],
                    "notes" => "Transaksi demo " . $type,
                    "idempotency_key" => "SEED-{$storeCode}-SALE-001",
                ],
                $saleData,
            ),
        );

        $saleItemId = $this->upsert(
            "sale_items",
            ["sale_id" => $saleId, "product_id" => $firstProductId],
            [
                "variant_id" => null,
                "product_batch_id" => null,
                "promotion_id" => $promotionId,
                "employee_id" => in_array($type, ["service", "ticket"], true)
                    ? $cashierEmployeeId
                    : null,
                "quantity" => 1,
                "price" => $config["products"][0][3],
                "discount_amount" => 0,
                "promo_discount" => 0,
                "subtotal" => $config["products"][0][3],
                "item_status" => in_array($type, ["fnb", "service"], true)
                    ? "served"
                    : "completed",
                "modifiers" =>
                    $type === "fnb"
                        ? json_encode([
                            ["name" => "Less Sugar", "price_addition" => 0],
                        ])
                        : null,
                "recipe_snapshot" =>
                    $type === "fnb" ? json_encode(["coffee_gram" => 18]) : null,
                "ingredient_cost" => $type === "fnb" ? 5000 : 0,
                "notes" => "Item demo",
            ],
        );
        $this->upsert(
            "sale_payments",
            ["sale_id" => $saleId, "payment_method_id" => $cashId],
            [
                "paid_at" => "2026-07-04 10:00:00",
                "amount" => $config["products"][0][3],
                "reference_no" => "PAY-{$storeCode}-001",
                "note" => "Pembayaran demo",
            ],
        );

        $this->upsert(
            "payment_gateway_transactions",
            ["external_id" => "PG-{$storeCode}-001"],
            [
                "sale_id" => $saleId,
                "provider" => "midtrans",
                "payment_type" => "qris",
                "status" => "settlement",
                "amount" => $config["products"][0][3],
                "raw_response" => json_encode(["seed" => true]),
            ],
        );
        $this->upsert(
            "store_payment_gateways",
            ["store_id" => $store->id, "provider" => "midtrans"],
            [
                "is_active" => true,
                "environment" => "sandbox",
                "server_key" => "SB-Mid-server-demo",
                "client_key" => "SB-Mid-client-demo",
                "merchant_id" => "MID-{$storeCode}",
                "enabled_methods" => json_encode([
                    "qris",
                    "gopay",
                    "bank_transfer",
                ]),
                "config_json" => json_encode(["demo" => true]),
            ],
        );

        if ($type === "retail") {
            $returnId = $this->upsert(
                "sale_returns",
                ["return_no" => "RET-{$storeCode}-001"],
                [
                    "sale_id" => $saleId,
                    "customer_id" => $customerId,
                    "user_id" => $cashierId,
                    "return_date" => "2026-07-04 11:00:00",
                    "subtotal" => $config["products"][0][3],
                    "total_amount" => $config["products"][0][3],
                    "notes" => "Retur demo retail",
                    "status" => "approved",
                ],
            );
            $this->upsert(
                "sale_return_items",
                ["sale_return_id" => $returnId, "sale_item_id" => $saleItemId],
                [
                    "product_id" => $firstProductId,
                    "quantity" => 1,
                    "unit_price" => $config["products"][0][3],
                    "subtotal" => $config["products"][0][3],
                    "reason" => "Barang rusak demo",
                ],
            );
        }

        if ($type === "service") {
            $this->upsert(
                "queue_tickets",
                [
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "queue_no" => "A001",
                ],
                [
                    "customer_id" => $customerId,
                    "employee_id" => $cashierEmployeeId,
                    "sale_id" => $saleId,
                    "category" => "Haircut",
                    "customer_name" => $config["customer"][0],
                    "customer_phone" => $config["customer"][1],
                    "status" => "done",
                    "called_at" => "2026-07-04 09:55:00",
                    "started_at" => "2026-07-04 10:00:00",
                    "finished_at" => "2026-07-04 10:30:00",
                    "queue_date" => "2026-07-04",
                    "notes" => "Antrian demo service",
                ],
            );
            $this->upsert(
                "employee_commissions",
                [
                    "employee_id" => $cashierEmployeeId,
                    "sale_item_id" => $saleItemId,
                ],
                [
                    "store_id" => $store->id,
                    "sale_id" => $saleId,
                    "type" => "percent",
                    "commission_rate" => 10,
                    "base_amount" => $config["products"][0][3],
                    "commission_amount" => $config["products"][0][3] * 0.1,
                    "status" => "approved",
                    "commission_date" => "2026-07-04",
                    "notes" => "Komisi demo service",
                ],
            );
        }

        if (
            in_array(
                $type,
                ["service", "rental", "ticket", "hospitality", "session"],
                true,
            )
        ) {
            $this->upsert(
                "bookings",
                ["booking_no" => "BOOK-{$storeCode}-001"],
                [
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "customer_id" => $customerId,
                    "employee_id" => $cashierEmployeeId,
                    "sale_id" => $saleId,
                    "resource_type" => $type,
                    "resource_id" => $firstProductId,
                    "customer_name" => $config["customer"][0],
                    "customer_phone" => $config["customer"][1],
                    "booking_start_at" => "2026-07-05 10:00:00",
                    "booking_end_at" => "2026-07-05 12:00:00",
                    "guest_count" => $type === "hospitality" ? 2 : 1,
                    "deposit_amount" => in_array(
                        $type,
                        ["rental", "hospitality"],
                        true,
                    )
                        ? 100000
                        : 0,
                    "deposit_paid" => in_array(
                        $type,
                        ["rental", "hospitality"],
                        true,
                    )
                        ? 100000
                        : 0,
                    "status" => "confirmed",
                    "notes" => "Booking demo " . $type,
                ],
            );
        }

        $purchaseId = $this->upsert(
            "purchases",
            ["purchase_no" => "PO-{$storeCode}-001"],
            [
                "store_id" => $store->id,
                "branch_id" => $branch->id,
                "supplier_id" => $supplierId,
                "user_id" => $ownerId,
                "purchase_date" => "2026-07-03 09:00:00",
                "subtotal" => $config["products"][0][4] * 10,
                "discount_amount" => 0,
                "tax_amount" => 0,
                "shipping_amount" => 0,
                "grand_total" => $config["products"][0][4] * 10,
                "paid_amount" => $config["products"][0][4] * 10,
                "status" => "received",
                "payment_status" => "paid",
                "notes" => "Purchase demo",
            ],
        );
        $purchaseItemId = $this->upsert(
            "purchase_items",
            ["purchase_id" => $purchaseId, "product_id" => $firstProductId],
            [
                "product_batch_id" => null,
                "quantity" => 10,
                "cost_price" => $config["products"][0][4],
                "subtotal" => $config["products"][0][4] * 10,
            ],
        );
        $this->upsert(
            "purchase_payments",
            ["purchase_id" => $purchaseId, "payment_method_id" => $cashId],
            [
                "paid_at" => "2026-07-03 09:30:00",
                "amount" => $config["products"][0][4] * 10,
                "reference_no" => "POPAY-{$storeCode}-001",
                "note" => "Pembayaran purchase demo",
            ],
        );
        if ($type === "retail") {
            $purchaseReturnId = $this->upsert(
                "purchase_returns",
                ["return_no" => "PR-{$storeCode}-001"],
                [
                    "purchase_id" => $purchaseId,
                    "supplier_id" => $supplierId,
                    "user_id" => $ownerId,
                    "return_date" => "2026-07-03 10:00:00",
                    "subtotal" => $config["products"][0][4],
                    "total_amount" => $config["products"][0][4],
                    "notes" => "Retur pembelian demo",
                    "status" => "approved",
                ],
            );
            $this->upsert(
                "purchase_return_items",
                [
                    "purchase_return_id" => $purchaseReturnId,
                    "product_id" => $firstProductId,
                ],
                [
                    "purchase_item_id" => $purchaseItemId,
                    "quantity" => 1,
                    "cost_price" => $config["products"][0][4],
                    "subtotal" => $config["products"][0][4],
                    "reason" => "Barang cacat demo",
                ],
            );
        }

        $this->upsert(
            "expenses",
            ["expense_no" => "EXP-{$storeCode}-001"],
            [
                "expense_category_id" => $expenseCategoryId,
                "store_id" => $store->id,
                "branch_id" => $branch->id,
                "user_id" => $ownerId,
                "cashier_shift_id" => $shiftId,
                "expense_date" => "2026-07-04 12:00:00",
                "amount" => 25000,
                "notes" => "Biaya operasional demo",
                "status" => "posted",
            ],
        );

        if (in_array($type, ["retail", "fnb"], true)) {
            $wasteId = $this->upsert(
                "wastes",
                ["waste_no" => "WST-{$storeCode}-001"],
                [
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "user_id" => $ownerId,
                    "waste_date" => "2026-07-04",
                    "status" => "approved",
                    "notes" => "Waste demo",
                ],
            );
            $this->upsert(
                "waste_items",
                ["waste_id" => $wasteId, "product_id" => $firstProductId],
                [
                    "product_batch_id" => null,
                    "quantity" => 1,
                    "unit_cost" => $config["products"][0][4],
                    "total_cost" => $config["products"][0][4],
                    "waste_category" => "expired",
                    "notes" => "Waste item demo",
                ],
            );
        }

        if ($config["products"][0][5]) {
            $stockAdjustmentId = $this->upsert(
                "stock_adjustments",
                ["adjustment_no" => "ADJ-{$storeCode}-001"],
                [
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "user_id" => $ownerId,
                    "adjustment_date" => "2026-07-04",
                    "reason" => "increase",
                    "status" => "posted",
                    "notes" => "Adjustment demo",
                ],
            );
            $this->upsert(
                "stock_adjustment_items",
                [
                    "stock_adjustment_id" => $stockAdjustmentId,
                    "product_id" => $firstProductId,
                ],
                [
                    "product_batch_id" => null,
                    "system_qty" => 100,
                    "actual_qty" => 105,
                    "difference_qty" => 5,
                    "unit_cost" => $config["products"][0][4],
                    "total_cost" => $config["products"][0][4] * 5,
                    "notes" => "Tambah stok demo",
                ],
            );
            $stockOpnameId = $this->upsert(
                "stock_opnames",
                ["opname_no" => "OPN-{$storeCode}-001"],
                [
                    "store_id" => $store->id,
                    "branch_id" => $branch->id,
                    "user_id" => $ownerId,
                    "opname_date" => "2026-07-04",
                    "status" => "approved",
                    "notes" => "Opname demo",
                ],
            );
            $this->upsert(
                "stock_opname_items",
                [
                    "stock_opname_id" => $stockOpnameId,
                    "product_id" => $firstProductId,
                ],
                [
                    "product_batch_id" => null,
                    "system_qty" => 105,
                    "counted_qty" => 105,
                    "difference_qty" => 0,
                    "unit_cost" => $config["products"][0][4],
                    "total_cost" => 0,
                    "notes" => "Opname demo sesuai sistem",
                ],
            );
        }
    }

    private function upsert(string $table, array $unique, array $data): int
    {
        $id = DB::table($table)->updateOrInsert(
            $unique,
            $data + ["updated_at" => Carbon::now()],
        );
        return DB::table($table)->where($unique)->value("id");
    }

    private function supplierName(string $type): string
    {
        return match ($type) {
            "retail" => "Supplier Sembako",
            "fnb" => "Supplier Bahan Baku",
            "service" => "Supplier Perlengkapan Servis",
            "rental" => "Supplier Peralatan Sewa",
            "ticket" => "Supplier Tiket",
            "hospitality" => "Supplier Hotel",
            "parking" => "Supplier Parkir",
            "session" => "Supplier Gaming",
            default => "Supplier Umum",
        };
    }

    private function defaultOrderType(string $type): string
    {
        return match ($type) {
            "retail" => "takeaway",
            "fnb" => "dine_in",
            "service" => "service",
            "rental" => "rental",
            "ticket" => "ticket",
            "hospitality" => "room",
            "parking" => "parking",
            "session" => "session",
            default => "takeaway",
        };
    }

    private function modeSaleData(
        string $type,
        ?int $tableId,
        int $cashierEmployeeId,
        int $price,
    ): array {
        return match ($type) {
            "fnb" => [
                "table_id" => $tableId,
                "queue_number" => "Q-001",
                "kitchen_status" => "served",
                "kitchen_printed_at" => "2026-07-04 10:01:00",
                "served_at" => "2026-07-04 10:15:00",
                "guest_count" => 2,
            ],
            "service" => [
                "employee_id" => $cashierEmployeeId,
                "service_status" => "done",
                "service_started_at" => "2026-07-04 10:00:00",
                "service_finished_at" => "2026-07-04 10:30:00",
            ],
            "rental" => [
                "rental_status" => "active",
                "rent_start_at" => "2026-07-04 10:00:00",
                "rent_end_at" => "2026-07-05 10:00:00",
                "deposit_amount" => 50000,
                "deposit_paid" => 50000,
            ],
            "ticket" => [
                "employee_id" => $cashierEmployeeId,
                "service_status" => "checked_in",
                "queue_number" => "TCK-001",
                "extra_data" => json_encode([
                    "seat" => "A1",
                    "studio" => "Studio 1",
                ]),
            ],
            "hospitality" => [
                "rental_status" => "checked_in",
                "rent_start_at" => "2026-07-04 14:00:00",
                "rent_end_at" => "2026-07-05 12:00:00",
                "deposit_amount" => 100000,
                "deposit_paid" => 100000,
                "guest_count" => 2,
                "unit_name" => "Room 101",
            ],
            "parking" => [
                "plate_number" => "AB1234CD",
                "vehicle_type" => "car",
                "parking_ticket_no" => "PK-001",
                "entry_at" => "2026-07-04 09:00:00",
                "exit_at" => "2026-07-04 11:00:00",
            ],
            "session" => [
                "session_status" => "ended",
                "unit_name" => "PC-01",
                "session_started_at" => "2026-07-04 10:00:00",
                "session_ended_at" => "2026-07-04 11:00:00",
                "rate_per_hour" => $price,
            ],
            default => [],
        };
    }
}
