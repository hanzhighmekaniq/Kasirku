<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentItem;
use App\Models\StockMovement;
use App\Models\ProductStock;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Http\Controllers\Concerns\HasStoreScope;

class StockAdjustmentController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        [$storeId] = $this->storeScope();

        $adjustments = StockAdjustment::with("user")
            ->where("store_id", $storeId)
            ->latest()
            ->get();

        $stats = [
            "total" => $adjustments->count(),
            "draft" => $adjustments->where("status", "draft")->count(),
            "approved" => $adjustments->where("status", "approved")->count(),
            "rejected" => $adjustments->where("status", "rejected")->count(),
        ];

        return Inertia::render("Admin/Stock/Adjustment/Index", [
            "adjustments" => $adjustments,
            "stats" => $stats,
        ]);
    }

    public function create()
    {
        [$storeId] = $this->storeScope();

        return Inertia::render("Admin/Stock/Adjustment/Create", [
            "products" => Product::forStore($storeId)
                ->with([
                    "stocks" => function ($q) use ($storeId) {
                        $q->where("store_id", $storeId);
                    },
                ])
                ->where("is_active", true)
                ->where("track_stock", true)
                ->orderBy("name")
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "adjustment_date" => "required|date",
            "reason" => "nullable|string|max:150",
            "notes" => "nullable|string",
            "items" => "required|array|min:1",
            "items.*.product_id" => "required|exists:products,id",
            "items.*.system_qty" => "required|integer|min:0",
            "items.*.actual_qty" => "required|integer|min:0",
            "items.*.notes" => "nullable|string",
        ]);

        $store = $request->user()->store;
        $storeId = session("current_store_id") ?? $store?->id;
        $adjNo = $this->generateNumber($validated["adjustment_date"]);

        DB::beginTransaction();
        try {
            $adjustment = StockAdjustment::create([
                "store_id" => $storeId,
                "user_id" => $request->user()->id,
                "adjustment_no" => $adjNo,
                "adjustment_date" => $validated["adjustment_date"],
                "reason" => $validated["reason"] ?? null,
                "notes" => $validated["notes"] ?? null,
                "status" => "draft",
            ]);

            foreach ($validated["items"] as $item) {
                $diff = $item["actual_qty"] - $item["system_qty"];
                $product = Product::find($item["product_id"]);
                $unitCost = $product->cost_price ?? 0;

                StockAdjustmentItem::create([
                    "stock_adjustment_id" => $adjustment->id,
                    "product_id" => $item["product_id"],
                    "system_qty" => $item["system_qty"],
                    "actual_qty" => $item["actual_qty"],
                    "difference_qty" => $diff,
                    "unit_cost" => $unitCost,
                    "total_cost" => abs($diff) * $unitCost,
                    "notes" => $item["notes"] ?? null,
                ]);
            }

            DB::commit();
            return redirect()
                ->route("admin.stock-adjustments.show", $adjustment)
                ->with("success", "Penyesuaian stok berhasil dibuat.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors([
                "items" => "Gagal menyimpan: " . $e->getMessage(),
            ]);
        }
    }

    public function show(StockAdjustment $stockAdjustment)
    {
        $stockAdjustment->load(["items.product", "user"]);
        return Inertia::render("Admin/Stock/Adjustment/Show", [
            "adjustment" => $stockAdjustment,
        ]);
    }

    public function destroy(StockAdjustment $stockAdjustment)
    {
        if ($stockAdjustment->status !== "draft") {
            return back()->withErrors([
                "status" => "Hanya penyesuaian draft yang dapat dihapus.",
            ]);
        }

        $stockAdjustment->delete();
        return redirect()
            ->route("admin.stock-adjustments.index")
            ->with("success", "Penyesuaian stok berhasil dihapus.");
    }

    /**
     * Quick stock adjustment (IN/OUT) dari product list.
     * Auto-approved — langsung update stok tanpa workflow draft.
     */
    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            "product_id" => "required|exists:products,id",
            "type" => "required|in:in,out",
            "quantity" => "required|numeric|min:0.0001",
            "reason" => "nullable|string|max:150",
            "notes" => "nullable|string|max:2000",
        ]);

        $storeId = session("current_store_id");
        $branchId = session("current_branch_id");
        $product = Product::findOrFail($validated["product_id"]);

        $productStock = ProductStock::where("product_id", $product->id)
            ->where("store_id", $storeId)
            ->when($branchId, fn($q) => $q->where("branch_id", $branchId))
            ->first();
        $currentStock = $productStock->quantity ?? 0;

        // Validasi: stok tidak mencukupi untuk OUT
        if (
            $validated["type"] === "out" &&
            $currentStock < $validated["quantity"]
        ) {
            return back()->withErrors([
                "quantity" => "Stok tidak mencukupi. Stok saat ini: {$currentStock}.",
            ]);
        }

        $unitCost = $product->cost_price ?? 0;

        if ($validated["type"] === "in") {
            $systemQty = (float) $currentStock;
            $actualQty = $systemQty + (float) $validated["quantity"];
            $diff = (float) $validated["quantity"];
        } else {
            $systemQty = (float) $currentStock;
            $actualQty = $systemQty - (float) $validated["quantity"];
            $diff = -(float) $validated["quantity"];
        }

        DB::beginTransaction();
        try {
            $adjustment = StockAdjustment::create([
                "store_id" => $storeId,
                "branch_id" => $branchId,
                "user_id" => $request->user()->id,
                "adjustment_no" => $this->generateNumber(now()->toDateString()),
                "adjustment_date" => now(),
                "reason" => $validated["reason"] ?? "Penyesuaian cepat",
                "notes" => $validated["notes"] ?? null,
                "status" => "approved",
            ]);

            StockAdjustmentItem::create([
                "stock_adjustment_id" => $adjustment->id,
                "product_id" => $product->id,
                "system_qty" => $systemQty,
                "actual_qty" => $actualQty,
                "difference_qty" => $diff,
                "unit_cost" => $unitCost,
                "total_cost" => abs($diff) * $unitCost,
                "notes" => $validated["notes"] ?? null,
            ]);

            $stock = ProductStock::firstOrCreate(
                [
                    "product_id" => $product->id,
                    "store_id" => $storeId,
                ],
                [
                    "branch_id" => $branchId,
                    "quantity" => 0,
                    "reserved_quantity" => 0,
                ],
            );

            if ($diff > 0) {
                $stock->increment("quantity", $diff);
                $type = "adjustment_in";
            } else {
                $stock->decrement("quantity", abs($diff));
                $type = "adjustment_out";
            }

            StockMovement::create([
                "product_id" => $product->id,
                "store_id" => $storeId,
                "branch_id" => $branchId,
                "reference_type" => StockAdjustment::class,
                "reference_id" => $adjustment->id,
                "movement_type" => $type,
                "quantity" => abs($diff),
                "unit_cost" => $unitCost,
                "reference_no" => $adjustment->adjustment_no,
                "notes" =>
                    $validated["notes"] ??
                    "Penyesuaian #{$adjustment->adjustment_no}",
                "moved_at" => now(),
            ]);

            DB::commit();

            return redirect()
                ->back()
                ->with("success", "Stok berhasil disesuaikan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors([
                "items" => "Gagal menyimpan: " . $e->getMessage(),
            ]);
        }
    }

    public function updateStatus(
        Request $request,
        StockAdjustment $stockAdjustment,
    ) {
        $request->validate([
            "status" => "required|in:approved,rejected",
        ]);

        if ($stockAdjustment->status !== "draft") {
            return back()->withErrors([
                "status" =>
                    "Hanya penyesuaian draft yang dapat diubah statusnya.",
            ]);
        }

        DB::beginTransaction();
        try {
            $stockAdjustment->update(["status" => $request->status]);

            if ($request->status === "approved") {
                foreach ($stockAdjustment->items as $item) {
                    $diff = $item->difference_qty;
                    if ($diff === 0) {
                        continue;
                    }

                    $stock = ProductStock::firstOrCreate([
                        "product_id" => $item->product_id,
                        "store_id" => $stockAdjustment->store_id,
                    ]);

                    if ($diff > 0) {
                        $stock->increment("quantity", $diff);
                        $type = "adjustment_in";
                    } else {
                        $stock->decrement("quantity", abs($diff));
                        $type = "adjustment_out";
                    }

                    StockMovement::create([
                        "product_id" => $item->product_id,
                        "store_id" => $stockAdjustment->store_id,
                        "branch_id" => null,
                        "reference_type" => StockAdjustment::class,
                        "reference_id" => $stockAdjustment->id,
                        "movement_type" => $type,
                        "quantity" => abs($diff),
                        "unit_cost" => $item->unit_cost,
                        "reference_no" => $stockAdjustment->adjustment_no,
                        "notes" =>
                            $item->notes ??
                            "Penyesuaian #{$stockAdjustment->adjustment_no}",
                        "moved_at" => now(),
                    ]);
                }
            }

            DB::commit();
            return back()->with(
                "success",
                "Status penyesuaian berhasil diperbarui.",
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors([
                "status" => "Gagal memperbarui status: " . $e->getMessage(),
            ]);
        }
    }

    private function generateNumber($date)
    {
        $prefix = "ADJ-" . date("Ymd", strtotime($date));
        $last = StockAdjustment::where("adjustment_no", "like", $prefix . "%")
            ->orderByDesc("adjustment_no")
            ->first();

        if ($last) {
            $seq = intval(substr($last->adjustment_no, -3)) + 1;
        } else {
            $seq = 1;
        }

        return $prefix . "-" . str_pad($seq, 3, "0", STR_PAD_LEFT);
    }
}
