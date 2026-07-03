<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\PaymentMethod;
use App\Models\CafeTable;
use App\Models\PaymentGatewayTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Http\Controllers\Concerns\HasStoreScope;

class SaleController extends Controller
{
    use HasStoreScope;

    public function index(Request $request)
    {
        $storeId = session("current_store_id");

        // Branch filter: query param > session > kasir fixed
        $branchId =
            $request->input("branch_id") ?:
            session("current_branch_id") ??
                (session("branch_id") ??
                    (Auth::user()->isKasir() ? Auth::user()->branch_id : null));

        $branches = Branch::where("store_id", $storeId)
            ->where("is_active", true)
            ->get(["id", "code", "name"]);

        $query = Sale::where("store_id", $storeId)
            ->with(["customer", "user", "branch"])
            ->latest();

        if ($branchId) {
            $query->where("branch_id", $branchId);
        }

        // Kasir hanya melihat transaksi yang dibuat oleh akun kasir itu sendiri.
        // Role selain kasir tetap melihat semua transaksi sesuai filter toko/cabang.
        if (Auth::user()->isKasir()) {
            $query->where("user_id", Auth::id());
        }

        // Filter: date range
        if ($request->filled("date_from")) {
            $query->whereDate("sale_date", ">=", $request->input("date_from"));
        }
        if ($request->filled("date_to")) {
            $query->whereDate("sale_date", "<=", $request->input("date_to"));
        }

        // Filter: payment status
        if (
            $request->filled("payment_status") &&
            $request->input("payment_status") !== "all"
        ) {
            $query->where("payment_status", $request->input("payment_status"));
        }

        $sales = $query->get();

        $stats = [
            "total" => $sales->count(),
            "completed" => $sales->where("status", "completed")->count(),
            "draft" => $sales->where("status", "draft")->count(),
            "cancelled" => $sales->where("status", "cancelled")->count(),
            "totalRevenue" => $sales
                ->where("status", "completed")
                ->sum("grand_total"),
        ];

        $activeFilters = [
            "branch_id" => $request->input("branch_id", ""),
            "date_from" => $request->input("date_from", ""),
            "date_to" => $request->input("date_to", ""),
            "payment_status" => $request->input("payment_status", "all"),
        ];

        return Inertia::render("Admin/Sales/Index", [
            "sales" => $sales,
            "stats" => $stats,
            "branches" => $branches,
            "currentBranchId" => $branchId ? (string) $branchId : "",
            "activeFilters" => $activeFilters,
        ]);
    }

    public function create()
    {
        $storeId = session("current_store_id");

        return Inertia::render("Admin/Sales/Create", [
            "products" => Product::forStore($storeId)
                ->where("is_active", true)
                ->where("is_sellable", true)
                ->with("stocks")
                ->orderBy("name")
                ->get(),
            "customers" => Customer::where("store_id", $storeId)
                ->orderBy("name")
                ->get(),
            "paymentMethods" => PaymentMethod::forStore($storeId)
                ->where("is_active", true)
                ->get(),
            "tables" => CafeTable::where("store_id", $storeId)
                ->orderBy("table_number")
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "customer_id" => "nullable|exists:customers,id",
            "table_id" => "nullable|integer",
            "sale_date" => "required|date",
            "order_type" => "required|in:dine_in,takeaway,delivery",
            "discount_amount" => "nullable|numeric|min:0",
            "tax_amount" => "nullable|numeric|min:0",
            "shipping_amount" => "nullable|numeric|min:0",
            "payment_method_id" => "nullable|exists:payment_methods,id",
            "paid_amount" => "required|numeric|min:0",
            "notes" => "nullable|string|max:500",
            "items" => "required|array|min:1",
            "items.*.product_id" => "required|exists:products,id",
            "items.*.quantity" => "required|integer|min:1",
            "items.*.price" => "required|numeric|min:0",
            "items.*.discount_amount" => "nullable|numeric|min:0",
        ]);

        DB::beginTransaction();

        try {
            // Generate sale number: SL-YYYYMMDD-NNN
            $date = \Carbon\Carbon::parse($validated["sale_date"]);
            $prefix = "SL-" . $date->format("Ymd") . "-";
            $lastSale = Sale::where("sale_no", "like", $prefix . "%")
                ->orderByDesc("sale_no")
                ->first();
            $seq = 1;
            if ($lastSale) {
                $seq = (int) substr($lastSale->sale_no, -3) + 1;
            }
            $saleNo = $prefix . str_pad($seq, 3, "0", STR_PAD_LEFT);

            // Calculate subtotal from items
            $subtotal = 0;
            foreach ($validated["items"] as $item) {
                $itemDiscount = $item["discount_amount"] ?? 0;
                $itemSubtotal =
                    $item["quantity"] * $item["price"] - $itemDiscount;
                $subtotal += $itemSubtotal;
            }

            $discount = $validated["discount_amount"] ?? 0;
            $tax = $validated["tax_amount"] ?? 0;
            $shipping = $validated["shipping_amount"] ?? 0;
            $grandTotal = $subtotal - $discount + $tax + $shipping;
            $paidAmount = $validated["paid_amount"];
            $changeAmount = max(0, $paidAmount - $grandTotal);

            // Determine statuses
            $paymentStatus = "unpaid";
            if ($paidAmount >= $grandTotal && $grandTotal > 0) {
                $paymentStatus = "paid";
            } elseif ($paidAmount > 0) {
                $paymentStatus = "partial";
            }

            $sale = Sale::create([
                "store_id" =>
                    session("current_store_id") ?? $request->user()?->store_id,
                "branch_id" =>
                    session("current_branch_id") ?? session("branch_id"),
                "table_id" => $validated["table_id"] ?? null,
                "customer_id" => $validated["customer_id"] ?? null,
                "user_id" => $request->user()?->id,
                "sale_no" => $saleNo,
                "sale_date" => $validated["sale_date"],
                "subtotal" => $subtotal,
                "discount_amount" => $discount,
                "tax_amount" => $tax,
                "shipping_amount" => $shipping,
                "grand_total" => $grandTotal,
                "paid_amount" => $paidAmount,
                "change_amount" => $changeAmount,
                "status" => "completed",
                "payment_status" => $paymentStatus,
                "order_type" => $validated["order_type"],
                "notes" => $validated["notes"] ?? null,
            ]);

            // Create sale items and deduct stock
            foreach ($validated["items"] as $item) {
                $itemDiscount = $item["discount_amount"] ?? 0;
                $itemSubtotal =
                    $item["quantity"] * $item["price"] - $itemDiscount;

                SaleItem::create([
                    "sale_id" => $sale->id,
                    "product_id" => $item["product_id"],
                    "quantity" => $item["quantity"],
                    "price" => $item["price"],
                    "discount_amount" => $itemDiscount,
                    "subtotal" => $itemSubtotal,
                ]);

                // Deduct stock
                $product = Product::find($item["product_id"]);
                if ($product && $product->track_stock) {
                    $stock = ProductStock::firstOrCreate(
                        [
                            "product_id" => $item["product_id"],
                            "store_id" =>
                                session("current_store_id") ??
                                $request->user()?->store_id,
                            "branch_id" =>
                                session("current_branch_id") ??
                                session("branch_id"),
                        ],
                        ["quantity" => 0, "reserved_quantity" => 0],
                    );
                    $stock->decrement("quantity", $item["quantity"]);
                }
            }

            // Create payment record if paid
            if ($paidAmount > 0 && ($validated["payment_method_id"] ?? false)) {
                SalePayment::create([
                    "sale_id" => $sale->id,
                    "payment_method_id" => $validated["payment_method_id"],
                    "paid_at" => $validated["sale_date"],
                    "amount" => $paidAmount,
                ]);
            }

            DB::commit();

            return redirect()
                ->route("admin.sales.show", $sale->id)
                ->with("success", "Penjualan berhasil disimpan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with(
                    "error",
                    "Gagal menyimpan penjualan: " . $e->getMessage(),
                );
        }
    }

    public function show(Sale $sale)
    {
        $sale->load([
            "customer",
            "user",
            "items.product",
            "payments.paymentMethod",
            "table",
        ]);
        $sale->load([
            "pgTransactions" => function ($q) {
                $q->orderByDesc("created_at");
            },
        ]);

        // Load payment methods & PG config for switch payment feature
        $paymentMethods = PaymentMethod::forStore($sale->store_id)
            ->where("is_active", true)
            ->get();
        $pgConfigs = \App\Models\StorePaymentGateway::where(
            "store_id",
            $sale->store_id,
        )
            ->where("is_active", true)
            ->get()
            ->map(
                fn($c) => [
                    "provider" => $c->provider,
                    "enabled_methods" => $c->enabled_methods,
                ],
            );

        return Inertia::render("Admin/Sales/Show", [
            "sale" => $sale,
            "paymentMethods" => $paymentMethods,
            "pgConfigs" => $pgConfigs,
        ]);
    }

    public function print(Sale $sale)
    {
        $storeId = session("current_store_id");
        if ($storeId && (int) $sale->store_id !== (int) $storeId) {
            abort(
                403,
                "Akses ditolak. Transaksi ini bukan dari toko aktif kamu.",
            );
        }

        if (
            Auth::user()->isKasir() &&
            (int) $sale->user_id !== (int) Auth::id()
        ) {
            abort(
                403,
                "Akses ditolak. Struk ini bukan transaksi milik akun kasir kamu.",
            );
        }

        $sale->load([
            "customer",
            "user",
            "items.product",
            "payments.paymentMethod",
            "table",
        ]);

        $store = \App\Models\Store::find($sale->store_id);

        // JSON response untuk modal di Index (Accept: application/json)
        if (request()->expectsJson()) {
            return response()->json([
                "sale" => $sale,
                "storeName" => $store?->name ?? "Toko",
            ]);
        }

        return Inertia::render("Admin/Sales/Print", [
            "sale" => $sale,
            "storeName" => $store?->name ?? "Toko",
        ]);
    }

    public function destroy(Sale $sale)
    {
        if ($sale->status === "completed") {
            // Reverse stock for completed sales
            foreach ($sale->items as $item) {
                $product = $item->product;
                if ($product && $product->track_stock) {
                    $stock = ProductStock::where([
                        "product_id" => $item->product_id,
                        "store_id" => $sale->store_id,
                        "branch_id" => $sale->branch_id,
                    ])->first();
                    if ($stock) {
                        $stock->increment("quantity", $item->quantity);
                    }
                }
            }
        }

        $sale->delete();

        return redirect()
            ->route("admin.sales.index")
            ->with("success", "Penjualan berhasil dihapus.");
    }

    public function updateStatus(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            "status" => "required|in:completed,cancelled",
        ]);

        $oldStatus = $sale->status;
        $newStatus = $validated["status"];

        DB::beginTransaction();

        try {
            if ($oldStatus !== "completed" && $newStatus === "completed") {
                // Mark as completed — deduct stock
                foreach ($sale->items as $item) {
                    $product = $item->product;
                    if ($product && $product->track_stock) {
                        $stock = ProductStock::firstOrCreate(
                            [
                                "product_id" => $item->product_id,
                                "store_id" => $sale->store_id,
                                "branch_id" => $sale->branch_id,
                            ],
                            ["quantity" => 0, "reserved_quantity" => 0],
                        );
                        $stock->decrement("quantity", $item->quantity);
                    }
                }
            } elseif (
                $oldStatus === "completed" &&
                $newStatus === "cancelled"
            ) {
                // Cancel completed — reverse stock
                foreach ($sale->items as $item) {
                    $product = $item->product;
                    if ($product && $product->track_stock) {
                        $stock = ProductStock::where([
                            "product_id" => $item->product_id,
                            "store_id" => $sale->store_id,
                            "branch_id" => $sale->branch_id,
                        ])->first();
                        if ($stock) {
                            $stock->increment("quantity", $item->quantity);
                        }
                    }
                }
            }

            $paymentStatus = $sale->payment_status;
            if ($newStatus === "cancelled") {
                $paymentStatus = "unpaid";
            }

            $sale->update([
                "status" => $newStatus,
                "payment_status" => $paymentStatus,
            ]);

            // Free the table only if sale is cancelled (customer left)
            // For completed: staff manually frees via "Kosongkan" button
            if ($sale->table_id && $newStatus === "cancelled") {
                \App\Models\CafeTable::where("id", $sale->table_id)->update([
                    "status" => "available",
                ]);
            }

            DB::commit();

            return back()->with(
                "success",
                "Status penjualan berhasil diperbarui.",
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with(
                "error",
                "Gagal memperbarui status: " . $e->getMessage(),
            );
        }
    }

    /**
     * Ganti metode bayar penjualan.
     *
     * Scenarios:
     * 1. Completed (tunai) → PG: reverse stock, delete payment, set pending
     * 2. Pending (PG) → Tunai: cancel PG, create payment, complete sale + deduct stock
     * 3. Pending (PG) → PG lain: cancel old PG, return info for frontend to create new PG
     */
    public function switchPayment(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            "payment_method_id" =>
                "required_if:is_pg,false|nullable|exists:payment_methods,id",
            "is_pg" => "nullable|boolean",
            "pg_provider" => "required_if:is_pg,true|nullable|string",
            "pg_method" => "required_if:is_pg,true|nullable|string",
        ]);

        $oldStatus = $sale->status;
        $isPgPayment = $validated["is_pg"] ?? false;

        DB::beginTransaction();
        try {
            // ── Step 1: Handle current state ──

            // If current sale has pending PG transactions → cancel them
            $pendingPg = $sale
                ->pgTransactions()
                ->where("status", "pending")
                ->get();
            $oldPgType = $pendingPg->first()?->payment_type;
            $pendingPg->each(fn($pg) => $pg->update(["status" => "cancelled"]));

            // If current sale was completed → reverse stock
            if ($oldStatus === "completed") {
                foreach ($sale->items as $item) {
                    $product = $item->product;
                    if (!$product) {
                        continue;
                    }

                    if ($product->recipes && $product->recipes->isNotEmpty()) {
                        $product->load("recipes.rawMaterial.stocks");
                        foreach ($product->recipes as $recipe) {
                            $needed = $recipe->quantity * $item->quantity;
                            $stock = ProductStock::where([
                                "product_id" => $recipe->raw_material_id,
                                "store_id" => $sale->store_id,
                                "branch_id" => null,
                            ])->first();
                            if ($stock) {
                                $stock->increment("quantity", $needed);
                            }
                        }
                    } elseif ($product->track_stock) {
                        $stock = ProductStock::where([
                            "product_id" => $item->product_id,
                            "store_id" => $sale->store_id,
                            "branch_id" => null,
                        ])->first();
                        if ($stock) {
                            $stock->increment("quantity", $item->quantity);
                        }
                    }
                }
            }

            // Delete old payment records
            $sale->payments()->delete();

            // ── Step 2: Apply new state ──

            if ($isPgPayment) {
                // ── New payment is PG → set to pending, frontend will create PG transaction ──
                $sale->update([
                    "status" => "pending",
                    "payment_status" => "pending",
                    "paid_amount" => 0,
                    "change_amount" => 0,
                ]);

                DB::commit();

                return response()->json([
                    "success" => true,
                    "need_pg" => true,
                    "sale_id" => $sale->id,
                    "message" =>
                        "Penjualan diubah ke pembayaran online. Silakan buat transaksi PG baru.",
                ]);
            } else {
                // ── New payment is non-PG (tunai/card) → complete the sale ──
                $grandTotal = $sale->grand_total;

                $sale->update([
                    "status" => "completed",
                    "payment_status" => "paid",
                    "paid_amount" => $grandTotal,
                    "change_amount" => 0,
                ]);

                // Create payment record
                SalePayment::create([
                    "sale_id" => $sale->id,
                    "payment_method_id" => $validated["payment_method_id"],
                    "paid_at" => now(),
                    "amount" => $grandTotal,
                    "reference_no" => null,
                    "note" =>
                        "Ganti metode bayar dari " .
                        ($oldPgType
                            ? strtoupper(
                                str_replace("_va", " VA", $oldPgType ?? ""),
                            )
                            : "metode sebelumnya"),
                ]);

                // Deduct stock
                foreach ($sale->items as $item) {
                    $product = $item->product;
                    if (!$product) {
                        continue;
                    }

                    if ($product->recipes && $product->recipes->isNotEmpty()) {
                        $product->load("recipes.rawMaterial.stocks");
                        foreach ($product->recipes as $recipe) {
                            $needed = $recipe->quantity * $item->quantity;
                            if ($recipe->is_nullable) {
                                $avail = $recipe->rawMaterial->stocks
                                    ->where("store_id", $sale->store_id)
                                    ->sum("quantity");
                                if ($avail <= 0) {
                                    continue;
                                }
                            }
                            $stock = ProductStock::firstOrCreate(
                                [
                                    "product_id" => $recipe->raw_material_id,
                                    "store_id" => $sale->store_id,
                                ],
                                ["quantity" => 0, "reserved_quantity" => 0],
                            );
                            $stock->decrement("quantity", $needed);
                        }
                    } elseif ($product->track_stock) {
                        $stock = ProductStock::firstOrCreate(
                            [
                                "product_id" => $item->product_id,
                                "store_id" => $sale->store_id,
                            ],
                            ["quantity" => 0, "reserved_quantity" => 0],
                        );
                        $stock->decrement("quantity", $item->quantity);
                    }
                }

                DB::commit();

                return response()->json([
                    "success" => true,
                    "need_pg" => false,
                    "message" => "Metode bayar berhasil diubah.",
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(
                [
                    "success" => false,
                    "message" =>
                        "Gagal mengganti metode bayar: " . $e->getMessage(),
                ],
                500,
            );
        }
    }
}
