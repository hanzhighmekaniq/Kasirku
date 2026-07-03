<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CafeTable;
use App\Services\PromotionService;
use App\Models\Category;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\StorePaymentGateway;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\SalePayment;
use App\Models\Store;

use App\Http\Controllers\Concerns\HasStoreScope;

class KasirController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        [$storeId, $branchId] = $this->storeScope();
        $store = $user->stores()->find($storeId) ?? $user->stores()->first();

        $products = Product::forStore($storeId)
            ->where("is_active", true)
            ->where("is_sellable", true)
            ->with([
                "category:id,name",
                "variants:id,product_id,name,sku,price,cost_price,is_active",
                "modifierGroups.modifiers",
                "recipes.rawMaterial:id,name,unit,base_unit,cost_price",
                "stocks" => fn($q) => $q->where("store_id", $storeId),
            ])
            ->get()
            ->map(function ($p) use ($storeId, $branchId) {
                $p->stock =
                    $p->stocks->sum("quantity") -
                    $p->stocks->sum("reserved_quantity");
                // Sertakan stok bahan baku agar frontend bisa cek kecukupan
                $p->recipes->each(function ($r) use ($storeId) {
                    if ($r->rawMaterial) {
                        $r->rawMaterial->current_stock = $r->rawMaterial
                            ->stocks()
                            ->where("store_id", $storeId)
                            ->sum("quantity");
                    }
                });
                unset($p->stocks);
                return $p;
            });

        $categories = Category::forStore($storeId)
            ->withCount([
                "products" => fn($q) => $q
                    ->where("is_active", true)
                    ->where("is_sellable", true),
            ])
            ->get(["id", "name", "products_count"]);

        $paymentMethods = PaymentMethod::forStore($storeId)
            ->active()
            ->orderBy("sort_order")
            ->orderBy("type")
            ->get(["id", "code", "name", "type", "provider"]);

        // Active promotions with their associated products
        $promotions = \App\Models\Promotion::forStore($storeId)
            ->where("is_active", true)
            ->where(function ($q) {
                $q->whereNull("start_date")->orWhere("start_date", "<=", now());
            })
            ->where(function ($q) {
                $q->whereNull("end_date")->orWhere("end_date", ">=", now());
            })
            ->where(function ($q) {
                $q->whereNull("start_hour")->orWhere(
                    "start_hour",
                    "<=",
                    now()->format("H:i"),
                );
            })
            ->where(function ($q) {
                $q->whereNull("end_hour")->orWhere(
                    "end_hour",
                    ">=",
                    now()->format("H:i"),
                );
            })
            ->with(["products:id", "freeProduct:id,sell_price"])
            ->get([
                "id",
                "code",
                "name",
                "type",
                "scope",
                "discount_value",
                "min_purchase_amount",
                "max_discount_amount",
                "min_quantity",
                "tier_price",
                "customer_tier",
                "start_hour",
                "end_hour",
                "free_product_id",
            ]);

        $customers = Customer::where("store_id", $storeId)
            ->orderBy("name")
            ->get([
                "id",
                "code",
                "name",
                "phone",
                "tier",
                "points",
                "total_spent",
            ]);

        $tables = [];
        if (in_array($store?->store_type, ["fnb", "hospitality"])) {
            $tables = CafeTable::where("store_id", $storeId)
                ->where("branch_id", $branchId)
                ->where("is_active", true)
                ->orderBy("table_number")
                ->get(["id", "table_number", "capacity", "status"]);
        }

        // Today's transactions (last 20) for history panel
        $todaySales = Sale::where("store_id", $storeId)
            ->where("branch_id", $branchId)
            ->whereDate("sale_date", Carbon::today())
            ->with(["customer:id,name", "payments.paymentMethod:id,name"])
            ->orderByDesc("sale_date")
            ->limit(20)
            ->get([
                "id",
                "sale_no",
                "grand_total",
                "paid_amount",
                "payment_status",
                "order_type",
                "sale_date",
                "customer_id",
                "status",
            ]);

        // Check for active shift
        $activeShift = \App\Models\CashierShift::where("store_id", $storeId)
            ->where("user_id", $user->id)
            ->where("status", "open")
            ->first();

        $orderTypes = \App\Models\StoreType::where(
            "code",
            $store?->store_type,
        )->value("order_types");

        return Inertia::render("Admin/Kasir/Kasir", [
            "products" => $products,
            "categories" => $categories,
            "paymentMethods" => $paymentMethods,
            "promotions" => $promotions,
            "initialCustomers" => $customers,
            "tables" => $tables,
            "todaySales" => $todaySales,
            "orderTypes" => $orderTypes,
            "storeType" => $store?->store_type ?? "retail",
            "posMode" => $store?->store_type ?? "retail",
            "storeName" => $store?->name ?? "",
            "receiptFooter" => $store?->receipt_footer ?? "",
            "pgMethods" => $this->getActivePgMethods($storeId),
            "activeShift" => $activeShift,
        ]);
    }

    /** Ambil daftar metode PG aktif per toko, dengan label user-friendly */
    private function getActivePgMethods(int $storeId): array
    {
        $gateways = StorePaymentGateway::where("store_id", $storeId)
            ->where("is_active", true)
            ->get();

        $methods = [];
        foreach ($gateways as $gw) {
            foreach ($gw->enabled_methods ?? [] as $method) {
                $methods[] = [
                    "provider" => $gw->provider,
                    "payment_type" => $method,
                ];
            }
        }

        return $methods;
    }

    /** Dapatkan ID shift aktif user saat ini, atau null */
    private function getActiveShiftId(int $storeId, int $userId): ?int
    {
        return \App\Models\CashierShift::where("store_id", $storeId)
            ->where("user_id", $userId)
            ->where("status", "open")
            ->value("id");
    }

    /**
     * Bangun array extra_data berisi field mode-specific.
     * Hanya isi key yang relevan dengan store_type saat ini.
     */
    private function buildExtraData(
        array $validated,
        ?string $storeType,
    ): ?array {
        $data = [];

        switch ($storeType) {
            case "service":
                if (!empty($validated["service_weight"])) {
                    $data["service_weight"] =
                        (float) $validated["service_weight"];
                }
                break;

            case "rental":
                if (!empty($validated["rental_duration"])) {
                    $data["rental_duration"] =
                        (int) $validated["rental_duration"];
                    $data["rental_unit"] =
                        $validated["rental_unit"] ?? "per_hour";
                }
                break;

            case "ticket":
                if (!empty($validated["ticket_event"])) {
                    $data["ticket_event"] = $validated["ticket_event"];
                }
                if (!empty($validated["ticket_slot"])) {
                    $data["ticket_slot"] = $validated["ticket_slot"];
                }
                break;

            case "hospitality":
                if (!empty($validated["room_number"])) {
                    $data["room_number"] = $validated["room_number"];
                }
                if (!empty($validated["guest_count"])) {
                    $data["guest_count"] = (int) $validated["guest_count"];
                }
                break;
        }

        return empty($data) ? null : $data;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "idempotency_key" => "nullable|string|max:100",
            "customer_id" => "nullable|exists:customers,id",
            "table_id" => "nullable|integer",
            "order_type" => "required|string|max:30",
            "discount_amount" => "nullable|numeric|min:0",
            "tax_amount" => "nullable|numeric|min:0",
            "notes" => "nullable|string|max:500",
            "payments" => "required|array|min:1",
            "payments.*.method_id" => "required|exists:payment_methods,id",
            "payments.*.amount" => "required|numeric|min:0.01",
            "payments.*.is_pg" => "nullable|boolean",
            "payments.*.pg_provider" => "nullable|string",
            "payments.*.pg_method" => "nullable|string",
            "items" => "required|array|min:1",
            "items.*.product_id" => "required|exists:products,id",
            "items.*.variant_id" => "nullable|integer",
            "items.*.quantity" => "required|integer|min:1",
            "items.*.price" => "required|numeric|min:0",
            "items.*.discount_amount" => "nullable|numeric|min:0",
            "items.*.modifiers" => "nullable|array",
            "items.*.notes" => "nullable|string|max:255",
            "delivery_address" =>
                "required_if:order_type,delivery|nullable|string|max:500",
            "shipping_amount" => "nullable|numeric|min:0",
            "customer_name" => "nullable|string|max:200",
            // ── Mode-specific fields ──────────────────────────────────────
            // Service
            "service_weight" => "nullable|numeric|min:0",
            // Rental
            "rental_duration" => "nullable|integer|min:1",
            "rental_unit" => "nullable|in:per_hour,per_day,per_week",
            // Ticket
            "ticket_event" => "nullable|string|max:200",
            "ticket_slot" => "nullable|string|max:100",
            // Hospitality
            "room_number" => "nullable|string|max:50",
            "guest_count" => "nullable|integer|min:1",
        ]);

        // ── Idempotency check: jika key sudah pernah diproses, kembalikan data existing ──
        if (!empty($validated["idempotency_key"])) {
            $existing = Sale::where(
                "idempotency_key",
                $validated["idempotency_key"],
            )
                ->where("store_id", session("current_store_id"))
                ->first();

            if ($existing) {
                return response()->json([
                    "success" => true,
                    "sale_no" => $existing->sale_no,
                    "sale_id" => $existing->id,
                    "change" => (float) $existing->change_amount,
                    "grand_total" => (float) $existing->grand_total,
                    "is_pg" => $existing->payment_status === "pending",
                    "pg_info" => null,
                    "idempotent" => true,
                ]);
            }
        }

        DB::beginTransaction();
        try {
            $user = $request->user();
            $storeId = session("current_store_id");
            $branchId = session("branch_id");
            $store = Store::find($storeId);
            $now = now();

            $prefix = "SL-" . $now->format("Ymd") . "-";
            $last = \App\Models\Sale::where("sale_no", "like", $prefix . "%")
                ->orderByDesc("sale_no")
                ->first();
            $seq = $last ? (int) substr($last->sale_no, -3) + 1 : 1;
            $saleNo = $prefix . str_pad($seq, 3, "0", STR_PAD_LEFT);

            $items = $validated["items"];

            // ── Resolve customer tier for promo ──
            $customerTier = null;
            if (!empty($validated["customer_id"])) {
                $customerTier = Customer::find($validated["customer_id"])
                    ?->tier;
            }

            // ── Auto-apply promosi per item ──
            $promoService = new PromotionService();
            $items = $promoService->applyPromosToCart($items, $customerTier);

            // ── Hitung subtotal (termasuk promo discount) ──
            $subtotal = 0;
            foreach ($items as $item) {
                $disc =
                    ($item["discount_amount"] ?? 0) +
                    ($item["promo_discount"] ?? 0);
                $modExtra = collect($item["modifiers"] ?? [])->sum(
                    "price_addition",
                );
                $subtotal +=
                    $item["quantity"] * ($item["price"] + $modExtra) - $disc;
            }

            $discount = $validated["discount_amount"] ?? 0;
            $tax = $validated["tax_amount"] ?? 0;

            // ── Auto-apply cart-level promo ──
            $cartPromoResult = $promoService->findBestCartPromo(
                $subtotal,
                $customerTier,
            );
            $cartPromoDiscount = 0;
            $cartPromoId = null;
            if ($cartPromoResult) {
                $cartPromoDiscount = $cartPromoResult["discount"];
                $cartPromoId = $cartPromoResult["promotion"]->id;
            }

            $grandTotal =
                $subtotal -
                $discount -
                $cartPromoDiscount +
                $tax +
                ($validated["shipping_amount"] ?? 0);
            $paidTotal = collect($validated["payments"])->sum("amount");
            $change = max(0, $paidTotal - $grandTotal);

            // Check if this is a PG payment (needs external confirmation)
            $hasPgPayment = collect($validated["payments"])->contains(
                "is_pg",
                true,
            );
            $paymentStatus = $hasPgPayment
                ? "pending"
                : ($paidTotal <= 0
                    ? "unpaid"
                    : ($paidTotal < $grandTotal
                        ? "partial"
                        : "paid"));
            $saleStatus = $hasPgPayment ? "pending" : "completed";

            $sale = \App\Models\Sale::create([
                "store_id" => $storeId,
                "branch_id" => $branchId,
                "table_id" => $validated["table_id"] ?? null,
                "customer_id" => $validated["customer_id"] ?? null,
                "user_id" => $user->id,
                "cashier_shift_id" => $this->getActiveShiftId(
                    $storeId,
                    $user->id,
                ),
                "sale_no" => $saleNo,
                "sale_date" => $now,
                "pos_mode" => $store?->store_type ?? "retail",
                "order_type" => $validated["order_type"],
                "subtotal" => $subtotal,
                "discount_amount" => $discount + $cartPromoDiscount,
                "tax_amount" => $tax,
                "shipping_amount" => $validated["shipping_amount"] ?? 0,
                "delivery_address" => $validated["delivery_address"] ?? null,
                "customer_name" => $validated["customer_name"] ?? null,
                "grand_total" => $grandTotal,
                "paid_amount" => $paidTotal,
                "change_amount" => $change,
                "status" => $saleStatus,
                "payment_status" => $paymentStatus,
                "notes" => $validated["notes"] ?? null,
                "idempotency_key" => $validated["idempotency_key"] ?? null,
                // ── extra_data: mode-specific fields ───────────────────────
                "extra_data" => $this->buildExtraData(
                    $validated,
                    $store?->store_type,
                ),
            ]);

            // Mark table as occupied
            if (!empty($validated["table_id"])) {
                \App\Models\CafeTable::where("id", $validated["table_id"])
                    ->where("store_id", $storeId)
                    ->update(["status" => "occupied"]);
            }

            foreach ($items as $item) {
                $disc =
                    ($item["discount_amount"] ?? 0) +
                    ($item["promo_discount"] ?? 0);
                $modExtra = collect($item["modifiers"] ?? [])->sum(
                    "price_addition",
                );
                $unitPrice = $item["price"] + $modExtra;

                // ── Recipe logic ──────────────────────────────────
                $product = \App\Models\Product::with(
                    "recipes.rawMaterial.stocks",
                )->find($item["product_id"]);

                $recipeSnapshot = null;
                $ingredientCost = 0;
                $hasRecipe = $product && $product->recipes->isNotEmpty();

                if ($hasRecipe) {
                    $snapshot = [];
                    foreach ($product->recipes as $recipe) {
                        $needed = $recipe->quantity * $item["quantity"];
                        $rawStock = $recipe->rawMaterial->stocks
                            ->where("store_id", $storeId)
                            ->sum("quantity");

                        // Cek stok bahan (kecuali is_nullable)
                        if (!$recipe->is_nullable && $rawStock < $needed) {
                            throw new \Exception(
                                "Stok bahan \"{$recipe->rawMaterial->name}\" tidak cukup. " .
                                    "Dibutuhkan {$needed} {$recipe->unit}, tersedia {$rawStock}.",
                            );
                        }

                        $ingredientCost +=
                            $needed * (float) $recipe->rawMaterial->cost_price;

                        $snapshot[] = [
                            "raw_material_id" => $recipe->raw_material_id,
                            "raw_material_name" => $recipe->rawMaterial->name,
                            "quantity_per_unit" => (float) $recipe->quantity,
                            "total_quantity" => $needed,
                            "unit" => $recipe->unit,
                            "cost_price" =>
                                (float) $recipe->rawMaterial->cost_price,
                            "total_cost" =>
                                $needed *
                                (float) $recipe->rawMaterial->cost_price,
                            "is_nullable" => $recipe->is_nullable,
                        ];
                    }
                    $recipeSnapshot = $snapshot;
                }

                \App\Models\SaleItem::create([
                    "sale_id" => $sale->id,
                    "product_id" => $item["product_id"],
                    "variant_id" => $item["variant_id"] ?? null,
                    "promotion_id" => $item["promotion_id"] ?? null,
                    "quantity" => $item["quantity"],
                    "price" => $unitPrice,
                    "discount_amount" => $item["discount_amount"] ?? 0,
                    "promo_discount" => $item["promo_discount"] ?? 0,
                    "subtotal" =>
                        $item["quantity"] * $unitPrice -
                        ($item["discount_amount"] ?? 0) -
                        ($item["promo_discount"] ?? 0),
                    "modifiers" => $item["modifiers"] ?? null,
                    "recipe_snapshot" => $recipeSnapshot,
                    "ingredient_cost" => $ingredientCost,
                    "notes" => $item["notes"] ?? null,
                ]);

                // ── Deduct stock + catat StockMovement ──────────────
                // Skip stock deduction for PG payments — only deduct when payment confirmed
                if ($hasPgPayment) {
                    // Still record recipe snapshot for reference, but don't deduct
                } elseif ($hasRecipe) {
                    // Potong stok bahan baku
                    foreach ($product->recipes as $recipe) {
                        $needed = $recipe->quantity * $item["quantity"];
                        if ($recipe->is_nullable) {
                            $rawStock = $recipe->rawMaterial->stocks
                                ->where("store_id", $storeId)
                                ->sum("quantity");
                            if ($rawStock <= 0) {
                                continue;
                            } // skip bahan opsional yang habis
                        }
                        $stock = \App\Models\ProductStock::firstOrCreate(
                            [
                                "product_id" => $recipe->raw_material_id,
                                "store_id" => $storeId,
                            ],
                            ["quantity" => 0, "reserved_quantity" => 0],
                        );
                        $stock->decrement("quantity", $needed);

                        // Catat riwayat pergerakan stok bahan baku (branch_id untuk audit)
                        \App\Models\StockMovement::create([
                            "product_id" => $recipe->raw_material_id,
                            "store_id" => $storeId,
                            "branch_id" => $branchId,
                            "reference_type" => Sale::class,
                            "reference_id" => $sale->id,
                            "movement_type" => "sale_out",
                            "quantity" => $needed,
                            "unit_cost" => $recipe->rawMaterial->cost_price,
                            "reference_no" => $saleNo,
                            "notes" => "Penjualan #{$saleNo} — bahan untuk {$product->name}",
                            "moved_at" => $now,
                        ]);
                    }
                } else {
                    // Potong stok produk langsung (minimarket behavior)
                    if ($product?->track_stock) {
                        $stock = \App\Models\ProductStock::firstOrCreate(
                            [
                                "product_id" => $item["product_id"],
                                "store_id" => $storeId,
                            ],
                            ["quantity" => 0, "reserved_quantity" => 0],
                        );
                        $stock->decrement("quantity", $item["quantity"]);

                        // Catat riwayat pergerakan stok produk (branch_id untuk audit)
                        \App\Models\StockMovement::create([
                            "product_id" => $item["product_id"],
                            "store_id" => $storeId,
                            "branch_id" => $branchId,
                            "reference_type" => Sale::class,
                            "reference_id" => $sale->id,
                            "movement_type" => "sale_out",
                            "quantity" => $item["quantity"],
                            "unit_cost" => $product?->cost_price ?? 0,
                            "reference_no" => $saleNo,
                            "notes" => "Penjualan #{$saleNo} — {$item["quantity"]}x {$item["product_id"]}",
                            "moved_at" => $now,
                        ]);
                    }
                }
            }

            // Only create SalePayment for non-PG payments (PG creates it on callback)
            foreach ($validated["payments"] as $pay) {
                if (empty($pay["is_pg"])) {
                    \App\Models\SalePayment::create([
                        "sale_id" => $sale->id,
                        "payment_method_id" => $pay["method_id"],
                        "paid_at" => $now,
                        "amount" => $pay["amount"],
                        "reference_no" => $pay["reference_no"] ?? null,
                    ]);
                }
            }

            DB::commit();

            // Build PG info for frontend
            $pgInfo = null;
            if ($hasPgPayment) {
                $pgPayment = collect($validated["payments"])->firstWhere(
                    "is_pg",
                    true,
                );
                $pgInfo = [
                    "provider" => $pgPayment["pg_provider"],
                    "method" => $pgPayment["pg_method"],
                    "amount" => $pgPayment["amount"],
                    "sale_id" => $sale->id,
                ];
            }

            return response()->json([
                "success" => true,
                "sale_no" => $saleNo,
                "sale_id" => $sale->id,
                "change" => $change,
                "grand_total" => $grandTotal,
                "is_pg" => $hasPgPayment,
                "pg_info" => $pgInfo,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(
                ["success" => false, "message" => $e->getMessage()],
                422,
            );
        }
    }
}
