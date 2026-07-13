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
use Illuminate\Support\Facades\Auth;
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

    public function create(Request $request)
    {
        [$storeId] = $this->storeScope();

        $store = Store::with("storeType")->find($storeId);
        $storeTypeCode = $store?->getRelation("storeType")?->code ?? "retail";

        // Pre-fill from product list redirect
        $prefill = null;
        if ($request->has("product_id") && $request->has("supplier_id")) {
            $prefillProduct = Product::find($request->query("product_id"));
            if ($prefillProduct) {
                $prefill = [
                    "supplier_id" => (int) $request->query("supplier_id"),
                    "product_id" => $prefillProduct->id,
                    "product_name" => $prefillProduct->name,
                    "product_sku" => $prefillProduct->sku,
                    "cost_price" => $prefillProduct->cost_price ?? 0,
                ];
            }
        }

        return Inertia::render("Admin/Purchases/Create", [
            "suppliers" => Supplier::where("store_id", $storeId)->get(),
            "products" => Product::where("store_id", $storeId)
                ->where("is_active", true)
                ->get(),
            "paymentMethods" => PaymentMethod::forStore($storeId)
                ->where("is_active", true)
                ->get(),
            "storeType" => $storeTypeCode,
            "prefill" => $prefill,
        ]);
    }

    public function store(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();

        $validated = $request->validate([
            "supplier_id" => "required|exists:suppliers,id",
            "purchase_date" => "required|date",
            "discount_amount" => "nullable|numeric|min:0",
            "tax_amount" => "nullable|numeric|min:0",
            "shipping_amount" => "nullable|numeric|min:0",
            "payment_method_id" => "nullable|exists:payment_methods,id",
            "paid_amount" => "nullable|numeric|min:0",
            "notes" => "nullable|string|max:500",
            "items" => "required|array|min:1",
            "items.*.product_id" => "required|exists:products,id",
            "items.*.quantity" => "required|numeric|min:0.01",
            "items.*.cost_price" => "required|numeric|min:0",
        ]);

        DB::beginTransaction();
        try {
            // Generate purchase_no: PO-YYYYMMDD-NNN
            $date = now()->format("Ymd");
            $last = Purchase::where("purchase_no", "like", "PO-{$date}-%")
                ->orderByRaw(
                    "CAST(SUBSTRING(purchase_no, 13) AS UNSIGNED) DESC",
                )
                ->first();
            $next = $last ? ((int) substr($last->purchase_no, 12)) + 1 : 1;
            $purchaseNo = "PO-{$date}-" . str_pad($next, 3, "0", STR_PAD_LEFT);

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

            $status = "draft";
            $paymentStatus = "unpaid";
            if ($paidAmount >= $grandTotal && $grandTotal > 0) {
                $paymentStatus = "paid";
                $status = "completed";
            } elseif ($paidAmount > 0) {
                $paymentStatus = "partial";
            }

            $purchase = Purchase::create([
                "store_id" => $storeId,
                "branch_id" => $branchId,
                "supplier_id" => $validated["supplier_id"],
                "user_id" => Auth::id(),
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
                "notes" => $validated["notes"] ?? null,
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
            }

            // Jika ada pembayaran, catat sebagai payment
            if ($paidAmount > 0 && ($validated["payment_method_id"] ?? false)) {
                PurchasePayment::create([
                    "purchase_id" => $purchase->id,
                    "payment_method_id" => $validated["payment_method_id"],
                    "paid_at" => $validated["purchase_date"],
                    "amount" => $paidAmount,
                ]);
            }

            // Jika langsung completed (lunas), tambah stok sekaligus
            if ($status === "completed") {
                foreach ($purchase->items as $item) {
                    $product = Product::find($item->product_id);
                    if ($product?->track_stock) {
                        $stock = ProductStock::firstOrCreate(
                            [
                                "product_id" => $item->product_id,
                                "store_id" => $storeId,
                                "branch_id" => $branchId,
                            ],
                            ["quantity" => 0, "reserved_quantity" => 0],
                        );
                        $stock->increment("quantity", $item->quantity);

                        // Auto-set supplier default pada produk
                        $product->update([
                            "supplier_id" => $purchase->supplier_id,
                        ]);

                        // Update moving average cost
                        $this->updateMovingAverageCost(
                            $product,
                            $item->cost_price,
                            $item->quantity,
                            $stock->quantity - $item->quantity,
                        );

                        StockMovement::create([
                            "product_id" => $item->product_id,
                            "store_id" => $storeId,
                            "branch_id" => $branchId,
                            "reference_type" => Purchase::class,
                            "reference_id" => $purchase->id,
                            "movement_type" => "purchase_in",
                            "quantity" => $item->quantity,
                            "unit_cost" => $item->cost_price,
                            "reference_no" => $purchase->purchase_no,
                            "notes" => "Pembelian #{$purchase->purchase_no}",
                            "moved_at" => now(),
                        ]);
                    }
                }
            }

            DB::commit();

            return redirect()
                ->route("admin.purchases.show", $purchase->id)
                ->with("success", "Pembelian berhasil dibuat.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with("error", "Gagal membuat pembelian: " . $e->getMessage());
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

    public function edit(Purchase $purchase)
    {
        $storeId = $this->storeScope()[0];

        // Only draft purchases can be edited
        if ($purchase->status !== "draft") {
            return redirect()
                ->route("admin.purchases.show", $purchase->id)
                ->with(
                    "error",
                    "Hanya pembelian dengan status draft yang dapat diedit.",
                );
        }

        $purchase->load([
            "supplier",
            "items.product",
            "payments.paymentMethod",
        ]);

        $store = Store::with("storeType")->find($storeId);
        $storeTypeCode = $store?->getRelation("storeType")?->code ?? "retail";

        return Inertia::render("Admin/Purchases/Edit", [
            "purchase" => $purchase,
            "suppliers" => Supplier::where("store_id", $storeId)->get(),
            "products" => Product::where("store_id", $storeId)
                ->where("is_active", true)
                ->get(),
            "paymentMethods" => PaymentMethod::forStore($storeId)
                ->where("is_active", true)
                ->get(),
            "storeType" => $storeTypeCode ?? "retail",
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        if ($purchase->status !== "draft") {
            return redirect()
                ->route("admin.purchases.show", $purchase->id)
                ->with(
                    "error",
                    "Hanya pembelian dengan status draft yang dapat diedit.",
                );
        }

        $storeId = $this->storeScope()[0];

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
            "items.*.quantity" => "required|numeric|min:0.01",
            "items.*.cost_price" => "required|numeric|min:0",
        ]);

        DB::beginTransaction();
        try {
            // Replace items — safe karena draft (belum ada stok movement)
            $purchase->items()->delete();
            foreach ($validated["items"] as $item) {
                \App\Models\PurchaseItem::create([
                    "purchase_id" => $purchase->id,
                    "product_id" => $item["product_id"],
                    "quantity" => $item["quantity"],
                    "cost_price" => $item["cost_price"],
                    "subtotal" => $item["quantity"] * $item["cost_price"],
                ]);
            }
            $purchase->load("items");

            // Recalculate from new items
            $subtotal = 0;
            foreach ($purchase->items as $item) {
                $subtotal += $item->quantity * $item->cost_price;
            }

            $discount = $validated["discount_amount"] ?? 0;
            $tax = $validated["tax_amount"] ?? 0;
            $shipping = $validated["shipping_amount"] ?? 0;
            $grandTotal = $subtotal - $discount + $tax + $shipping;
            $paidAmount = $validated["paid_amount"] ?? 0;

            $status = "draft";
            $paymentStatus = "unpaid";
            if ($paidAmount >= $grandTotal && $grandTotal > 0) {
                $paymentStatus = "paid";
                $status = "completed";
            } elseif ($paidAmount > 0) {
                $paymentStatus = "partial";
            }

            $wasDraft = $purchase->status === "draft";

            $purchase->update([
                "supplier_id" => $validated["supplier_id"],
                "purchase_date" => $validated["purchase_date"],
                "discount_amount" => $discount,
                "tax_amount" => $tax,
                "shipping_amount" => $shipping,
                "subtotal" => $subtotal,
                "grand_total" => $grandTotal,
                "status" => $status,
                "payment_status" => $paymentStatus,
                "paid_amount" => $paidAmount,
            ]);

            // If moving from draft to completed, update stock
            if ($wasDraft && $status === "completed") {
                foreach ($purchase->items as $item) {
                    $product = Product::find($item->product_id);
                    if ($product?->track_stock) {
                        $stock = ProductStock::firstOrCreate(
                            [
                                "product_id" => $item->product_id,
                                "store_id" => $storeId,
                                "branch_id" => $purchase->branch_id,
                            ],
                            ["quantity" => 0, "reserved_quantity" => 0],
                        );
                        $stock->increment("quantity", $item->quantity);

                        // Update moving average cost
                        $this->updateMovingAverageCost(
                            $product,
                            $item->cost_price,
                            $item->quantity,
                            $stock->quantity - $item->quantity,
                        );

                        $exists = StockMovement::where([
                            "reference_type" => Purchase::class,
                            "reference_id" => $purchase->id,
                            "product_id" => $item->product_id,
                            "movement_type" => "purchase_in",
                        ])->exists();
                        if (!$exists) {
                            StockMovement::create([
                                "product_id" => $item->product_id,
                                "store_id" => $storeId,
                                "branch_id" => $purchase->branch_id,
                                "reference_type" => Purchase::class,
                                "reference_id" => $purchase->id,
                                "movement_type" => "purchase_in",
                                "quantity" => $item->quantity,
                                "unit_cost" => $item->cost_price,
                                "reference_no" => $purchase->purchase_no,
                                "notes" => "Pembelian #{$purchase->purchase_no}",
                                "moved_at" => now(),
                            ]);
                        }
                    }
                }
            }

            // Update/create payment
            if ($paidAmount > 0 && ($validated["payment_method_id"] ?? false)) {
                $existingPayment = $purchase->payments()->first();
                if ($existingPayment) {
                    $existingPayment->update([
                        "payment_method_id" => $validated["payment_method_id"],
                        "paid_at" => $validated["purchase_date"],
                        "amount" => $paidAmount,
                    ]);
                } else {
                    PurchasePayment::create([
                        "purchase_id" => $purchase->id,
                        "payment_method_id" => $validated["payment_method_id"],
                        "paid_at" => $validated["purchase_date"],
                        "amount" => $paidAmount,
                    ]);
                }
            }

            DB::commit();

            return redirect()
                ->route("admin.purchases.show", $purchase->id)
                ->with("success", "Pembelian berhasil diperbarui.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with(
                    "error",
                    "Gagal memperbarui pembelian: " . $e->getMessage(),
                );
        }
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
                        "branch_id" => $purchase->branch_id,
                    ])->first();
                    if ($stock) {
                        $oldQty = $stock->quantity;
                        $stock->decrement("quantity", $item->quantity);

                        // Revert moving average cost
                        $this->revertMovingAverageCost(
                            $product,
                            $item->cost_price,
                            $item->quantity,
                            $oldQty,
                        );

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
                                "branch_id" => $purchase->branch_id,
                            ],
                            ["quantity" => 0, "reserved_quantity" => 0],
                        );
                        $stock->increment("quantity", $item->quantity);

                        // Update moving average cost
                        $this->updateMovingAverageCost(
                            $product,
                            $item->cost_price,
                            $item->quantity,
                            $stock->quantity - $item->quantity,
                        );

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
                            "branch_id" => $purchase->branch_id,
                        ])->first();
                        if ($stock) {
                            $oldQty = $stock->quantity;
                            $stock->decrement("quantity", $item->quantity);

                            // Revert moving average cost when cancelling
                            $this->revertMovingAverageCost(
                                $product,
                                $item->cost_price,
                                $item->quantity,
                                $oldQty,
                            );

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

    /**
     * Update product cost_price using moving average method.
     * Called after purchase stock increment.
     */
    private function updateMovingAverageCost(
        Product $product,
        float $newPrice,
        float $newQty,
        float $oldQtyBefore,
    ): void {
        $oldCost = $product->cost_price ?? 0;
        $totalQty = $oldQtyBefore + $newQty;

        if ($totalQty > 0) {
            $avgCost =
                ($oldQtyBefore * $oldCost + $newQty * $newPrice) / $totalQty;
        } else {
            $avgCost = $newPrice;
        }

        $product->update(["cost_price" => round($avgCost, 2)]);
    }

    /**
     * Revert product cost_price when purchase is cancelled/deleted.
     * Removes the purchase contribution from the moving average.
     */
    private function revertMovingAverageCost(
        Product $product,
        float $removedPrice,
        float $removedQty,
        float $oldQtyBefore,
    ): void {
        $oldCost = $product->cost_price ?? 0;
        $remainingQty = $oldQtyBefore - $removedQty;

        if ($remainingQty <= 0) {
            $product->update(["cost_price" => 0]);
        } else {
            $revertCost =
                ($oldQtyBefore * $oldCost - $removedQty * $removedPrice) /
                $remainingQty;
            $product->update([
                "cost_price" => round(max(0, $revertCost), 2),
            ]);
        }
    }
}
