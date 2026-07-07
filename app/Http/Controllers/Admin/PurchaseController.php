<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\PaymentMethod;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Http\Controllers\Concerns\HasStoreScope;

class PurchaseController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        [$storeId, $branchId] = $this->storeScope();

        $query = Purchase::where("store_id", $storeId)
            ->with("supplier")
            ->latest();
        if ($branchId) {
            $query->where("branch_id", $branchId);
        }

        $purchases = $query->get();

        $stats = [
            "total" => $purchases->count(),
            "draft" => $purchases->where("status", "draft")->count(),
            "completed" => $purchases->where("status", "completed")->count(),
            "unpaid" => $purchases->where("payment_status", "unpaid")->count(),
        ];

        $store = Store::with("storeType")->find($storeId);
        $storeTypeCode = $store?->getRelation("storeType")?->code ?? "retail";

        return Inertia::render("Admin/Purchases/Index", [
            "purchases" => $purchases,
            "stats" => $stats,
            "storeType" => $storeTypeCode,
        ]);
    }

    public function create()
    {
        try {
            // Gunakan storeScope untuk mendapatkan store ID dengan fallback
            [$storeId, $branchId] = $this->storeScope();
            
            if (!$storeId) {
                \Log::warning('Purchase Create: No store ID found');
                return redirect()->route('admin.dashboard')
                    ->with('error', 'Silakan pilih toko terlebih dahulu.');
            }
            
            // Load store dengan eager loading storeType
            $store = Store::with("storeType")->find($storeId);
            
            // Pastikan store ada
            if (!$store) {
                \Log::error("Purchase Create: Store not found - ID: {$storeId}");
                return redirect()->route('admin.dashboard')
                    ->with('error', 'Toko tidak ditemukan.');
            }
            
            // Ambil store type code
            // CATATAN: Gunakan accessor yang return string, atau akses relasi dengan getRelation
            $storeType = $store->getRelation("storeType");
            if (!$storeType) {
                \Log::error("Purchase Create: Store type not found for store ID: {$storeId}");
                return redirect()->route('admin.dashboard')
                    ->with('error', 'Tipe toko tidak ditemukan.');
            }
            
            $storeTypeCode = $storeType->code ?? "retail";
            \Log::info("Purchase Create: Store {$storeId}, Type: {$storeTypeCode}");

            // Filter products by store type
            $productsQuery = Product::forStore($storeId)
                ->where("is_active", true);
                
            if ($storeTypeCode === "fnb") {
                $productsQuery->where("type", "raw_material");
            } elseif ($storeTypeCode === "rental") {
                $productsQuery->whereIn("type", ["rental_item", "finished_goods"]);
            } else {
                $productsQuery->whereIn("type", ["finished_goods", "combo", "service", "time_based"]);
            }
            
            $products = $productsQuery
                ->with("stocks", fn($q) => $q->where("store_id", $storeId))
                ->orderBy("name")
                ->get()
                ->map(fn($p) => [
                    "id" => $p->id,
                    "name" => $p->name,
                    "sku" => $p->sku,
                    "cost_price" => (float) ($p->cost_price ?? 0),
                    "type" => $p->type,
                    "stock" => $p->stocks->sum("quantity") - $p->stocks->sum("reserved_quantity"),
                    "base_unit" => $p->base_unit ?? "pcs",
                ]);

            $suppliers = Supplier::where("store_id", $storeId)
                ->orderBy("name")
                ->get(['id', 'name', 'phone', 'email']);

            $paymentMethods = PaymentMethod::forStore($storeId)
                ->where("is_active", true)
                ->orderBy("name")
                ->get(['id', 'name', 'type']);

            \Log::info("Purchase Create: Rendering with " . count($products) . " products, " . 
                       count($suppliers) . " suppliers, " . count($paymentMethods) . " payment methods");

            return Inertia::render("Admin/Purchases/Create", [
                "suppliers" => $suppliers,
                "products" => $products,
                "paymentMethods" => $paymentMethods,
                "storeType" => $storeTypeCode,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Purchase Create Error: ' . $e->getMessage());
            \Log::error('Stack Trace: ' . $e->getTraceAsString());
            
            return redirect()->route('admin.dashboard')
                ->with('error', 'Terjadi kesalahan saat memuat halaman pembelian: ' . $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "supplier_id" => "required|exists:suppliers,id",
            "purchase_date" => "required|date",
            "discount_amount" => "nullable|numeric|min:0",
            "tax_amount" => "nullable|numeric|min:0",
            "shipping_amount" => "nullable|numeric|min:0",
            "payment_method_id" => "nullable|exists:payment_methods,id",
            "paid_amount" => "nullable|numeric|min:0",
            "items" => "required|array|min:1",
            "items.*.product_id" => "required|exists:products,id",
            "items.*.quantity" => "required|integer|min:1",
            "items.*.cost_price" => "required|numeric|min:0",
        ]);

        DB::beginTransaction();

        try {
            // Generate purchase number
            $date = \Carbon\Carbon::parse($validated["purchase_date"]);
            $prefix = "PB-" . $date->format("Ymd") . "-";
            $lastPurchase = Purchase::where(
                "purchase_no",
                "like",
                $prefix . "%",
            )
                ->orderByDesc("purchase_no")
                ->first();
            $seq = 1;
            if ($lastPurchase) {
                $seq = (int) substr($lastPurchase->purchase_no, -3) + 1;
            }
            $purchaseNo = $prefix . str_pad($seq, 3, "0", STR_PAD_LEFT);

            // Calculate subtotal from items
            $subtotal = 0;
            foreach ($validated["items"] as $item) {
                $subtotal += $item["quantity"] * $item["cost_price"];
            }

            $discount = $validated["discount_amount"] ?? 0;
            $tax = $validated["tax_amount"] ?? 0;
            $shipping = $validated["shipping_amount"] ?? 0;
            $grandTotal = $subtotal - $discount + $tax + $shipping;
            $paidAmount = $validated["paid_amount"] ?? 0;

            // Determine statuses
            $status = "draft";
            $paymentStatus = "unpaid";
            if ($paidAmount >= $grandTotal && $grandTotal > 0) {
                $paymentStatus = "paid";
                $status = "completed";
            } elseif ($paidAmount > 0) {
                $paymentStatus = "partial";
            }

            $purchase = Purchase::create([
                "store_id" =>
                    session("current_store_id") ?? $request->user()?->store_id,
                "branch_id" =>
                    session("current_branch_id") ?? session("branch_id"),
                "supplier_id" => $validated["supplier_id"],
                "user_id" => $request->user()?->id,
                "purchase_no" => $purchaseNo,
                "purchase_date" => $validated["purchase_date"],
                "subtotal" => $subtotal,
                "discount_amount" => $discount,
                "tax_amount" => $tax,
                "shipping_amount" => $shipping,
                "grand_total" => $grandTotal,
                "paid_amount" => $paidAmount,
                "status" => $status,
                "payment_status" => $paymentStatus,
            ]);

            // Create purchase items
            foreach ($validated["items"] as $item) {
                PurchaseItem::create([
                    "purchase_id" => $purchase->id,
                    "product_id" => $item["product_id"],
                    "quantity" => $item["quantity"],
                    "cost_price" => $item["cost_price"],
                    "subtotal" => $item["quantity"] * $item["cost_price"],
                ]);

                // Update product cost_price if higher
                $product = Product::find($item["product_id"]);
                if (
                    $product &&
                    ($product->cost_price == 0 ||
                        $item["cost_price"] > $product->cost_price)
                ) {
                    $product->update(["cost_price" => $item["cost_price"]]);
                }

                // Update stock if completed (store-level)
                if ($status === "completed" && $product?->track_stock) {
                    $storeId =
                        session("current_store_id") ??
                        $request->user()?->store_id;
                    $branchId =
                        session("current_branch_id") ?? session("branch_id");
                    $stock = ProductStock::firstOrCreate(
                        [
                            "product_id" => $item["product_id"],
                            "store_id" => $storeId,
                        ],
                        ["quantity" => 0, "reserved_quantity" => 0],
                    );
                    $stock->increment("quantity", $item["quantity"]);

                    StockMovement::create([
                        "product_id" => $item["product_id"],
                        "store_id" => $storeId,
                        "branch_id" => $branchId,
                        "reference_type" => Purchase::class,
                        "reference_id" => $purchase->id,
                        "movement_type" => "purchase_in",
                        "quantity" => $item["quantity"],
                        "unit_cost" => $item["cost_price"],
                        "reference_no" => $purchaseNo,
                        "notes" => "Pembelian #{$purchaseNo}",
                        "moved_at" => now(),
                    ]);
                }
            }

            // Create initial payment if any
            if ($paidAmount > 0 && $validated["payment_method_id"] ?? false) {
                PurchasePayment::create([
                    "purchase_id" => $purchase->id,
                    "payment_method_id" => $validated["payment_method_id"],
                    "paid_at" => $validated["purchase_date"],
                    "amount" => $paidAmount,
                ]);
            }

            DB::commit();

            return redirect()
                ->route("admin.purchases.show", $purchase->id)
                ->with("success", "Pembelian berhasil disimpan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with(
                    "error",
                    "Gagal menyimpan pembelian: " . $e->getMessage(),
                );
        }
    }

    public function show(Purchase $purchase)
    {
        $purchase->load([
            "supplier",
            "items.product",
            "payments.paymentMethod",
            "user",
        ]);

        return Inertia::render("Admin/Purchases/Show", [
            "purchase" => $purchase,
        ]);
    }

    public function destroy(Purchase $purchase)
    {
        if ($purchase->status === "completed") {
            // Reverse stock for completed purchases (store-level)
            foreach ($purchase->items as $item) {
                $product = $item->product;
                if ($product?->track_stock) {
                    $stock = ProductStock::where([
                        "product_id" => $item->product_id,
                        "store_id" => $purchase->store_id,
                    ])->first();
                    if ($stock) {
                        $stock->decrement("quantity", $item->quantity);

                        StockMovement::create([
                            "product_id" => $item->product_id,
                            "store_id" => $purchase->store_id,
                            "branch_id" => $purchase->branch_id,
                            "reference_type" => Purchase::class,
                            "reference_id" => $purchase->id,
                            "movement_type" => "purchase_out",
                            "quantity" => $item["quantity"],
                            "unit_cost" => $item->cost_price,
                            "reference_no" => $purchase->purchase_no,
                            "notes" => "Pembelian #{$purchase->purchase_no} — dihapus",
                            "moved_at" => now(),
                        ]);
                    }
                }
            }
        }

        $purchase->delete();

        return redirect()
            ->route("admin.purchases.index")
            ->with("success", "Pembelian berhasil dihapus.");
    }

    public function updateStatus(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            "status" => "required|in:completed,cancelled",
        ]);

        $oldStatus = $purchase->status;
        $newStatus = $validated["status"];

        DB::beginTransaction();

        try {
            if ($oldStatus !== "completed" && $newStatus === "completed") {
                // Mark as completed — add stock (store-level)
                foreach ($purchase->items as $item) {
                    $product = $item->product;
                    if ($product?->track_stock) {
                        $stock = ProductStock::firstOrCreate(
                            [
                                "product_id" => $item->product_id,
                                "store_id" => $purchase->store_id,
                            ],
                            ["quantity" => 0, "reserved_quantity" => 0],
                        );
                        $stock->increment("quantity", $item->quantity);

                        StockMovement::create([
                            "product_id" => $item->product_id,
                            "store_id" => $purchase->store_id,
                            "branch_id" => $purchase->branch_id,
                            "reference_type" => Purchase::class,
                            "reference_id" => $purchase->id,
                            "movement_type" => "purchase_in",
                            "quantity" => $item["quantity"],
                            "unit_cost" => $item->cost_price,
                            "reference_no" => $purchase->purchase_no,
                            "notes" => "Pembelian #{$purchase->purchase_no} — diubah ke selesai",
                            "moved_at" => now(),
                        ]);
                    }
                }
            } elseif (
                $oldStatus === "completed" &&
                $newStatus === "cancelled"
            ) {
                // Cancel completed — reverse stock (store-level)
                foreach ($purchase->items as $item) {
                    $product = $item->product;
                    if ($product?->track_stock) {
                        $stock = ProductStock::where([
                            "product_id" => $item->product_id,
                            "store_id" => $purchase->store_id,
                        ])->first();
                        if ($stock) {
                            $stock->decrement("quantity", $item->quantity);

                            StockMovement::create([
                                "product_id" => $item->product_id,
                                "store_id" => $purchase->store_id,
                                "branch_id" => $purchase->branch_id,
                                "reference_type" => Purchase::class,
                                "reference_id" => $purchase->id,
                                "movement_type" => "purchase_out",
                                "quantity" => $item["quantity"],
                                "unit_cost" => $item->cost_price,
                                "reference_no" => $purchase->purchase_no,
                                "notes" => "Pembelian #{$purchase->purchase_no} — dibatalkan",
                                "moved_at" => now(),
                            ]);
                        }
                    }
                }
            }

            // Update payment_status based on paid vs grand_total
            $paymentStatus = $purchase->payment_status;
            if ($newStatus === "cancelled") {
                $paymentStatus = "unpaid";
            }

            $purchase->update([
                "status" => $newStatus,
                "payment_status" => $paymentStatus,
            ]);

            DB::commit();

            return back()->with(
                "success",
                "Status pembelian berhasil diperbarui.",
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with(
                "error",
                "Gagal memperbarui status: " . $e->getMessage(),
            );
        }
    }
}
