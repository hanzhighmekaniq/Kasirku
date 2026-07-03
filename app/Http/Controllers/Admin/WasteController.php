<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Waste;
use App\Models\WasteItem;
use App\Models\StockMovement;
use App\Models\ProductStock;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Http\Controllers\Concerns\HasStoreScope;

class WasteController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        [$storeId] = $this->storeScope();

        $wastes = Waste::with("user")
            ->where("store_id", $storeId)
            ->latest()
            ->get();

        $stats = [
            "total" => $wastes->count(),
            "draft" => $wastes->where("status", "draft")->count(),
            "approved" => $wastes->where("status", "approved")->count(),
            "rejected" => $wastes->where("status", "rejected")->count(),
        ];

        return Inertia::render("Admin/Stock/Waste/Index", [
            "wastes" => $wastes,
            "stats" => $stats,
        ]);
    }

    public function create()
    {
        [$storeId] = $this->storeScope();

        return Inertia::render("Admin/Stock/Waste/Create", [
            "products" => Product::forStore($storeId)
                ->where("is_active", true)
                ->where("track_stock", true)
                ->orderBy("name")
                ->get(["id", "name", "sku", "type", "cost_price"]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "waste_date" => "required|date",
            "notes" => "nullable|string",
            "items" => "required|array|min:1",
            "items.*.product_id" => "required|exists:products,id",
            "items.*.quantity" => "required|integer|min:1",
            "items.*.waste_category" =>
                "required|string|in:tumpahan,kedaluwarsa,rusak,hilang,lainnya",
            "items.*.notes" => "nullable|string",
        ]);

        $store = $request->user()->store;
        $wasteNo = $this->generateNumber($validated["waste_date"]);

        DB::beginTransaction();
        try {
            $waste = Waste::create([
                "store_id" => $store?->id,
                "user_id" => $request->user()->id,
                "waste_no" => $wasteNo,
                "waste_date" => $validated["waste_date"],
                "status" => "draft",
                "notes" => $validated["notes"] ?? null,
            ]);

            foreach ($validated["items"] as $item) {
                $product = Product::find($item["product_id"]);
                $unitCost = $product->cost_price ?? 0;

                WasteItem::create([
                    "waste_id" => $waste->id,
                    "product_id" => $item["product_id"],
                    "quantity" => $item["quantity"],
                    "unit_cost" => $unitCost,
                    "total_cost" => $unitCost * $item["quantity"],
                    "waste_category" => $item["waste_category"],
                    "notes" => $item["notes"] ?? null,
                ]);
            }

            DB::commit();
            return redirect()
                ->route("admin.wastes.show", $waste)
                ->with("success", "Catat waste berhasil dibuat.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors([
                "items" => "Gagal menyimpan: " . $e->getMessage(),
            ]);
        }
    }

    public function show(Waste $waste)
    {
        $waste->load(["items.product", "user"]);
        return Inertia::render("Admin/Stock/Waste/Show", [
            "waste" => $waste,
        ]);
    }

    public function destroy(Waste $waste)
    {
        if ($waste->status !== "draft") {
            return back()->withErrors([
                "status" => "Hanya waste draft yang dapat dihapus.",
            ]);
        }

        $waste->delete();
        return redirect()
            ->route("admin.wastes.index")
            ->with("success", "Catat waste berhasil dihapus.");
    }

    public function updateStatus(Request $request, Waste $waste)
    {
        $request->validate([
            "status" => "required|in:approved,rejected",
        ]);

        if ($waste->status !== "draft") {
            return back()->withErrors([
                "status" => "Hanya waste draft yang dapat diubah statusnya.",
            ]);
        }

        DB::beginTransaction();
        try {
            $waste->update(["status" => $request->status]);

            if ($request->status === "approved") {
                foreach ($waste->items as $item) {
                    $qty = $item->quantity;
                    if ($qty <= 0) {
                        continue;
                    }

                    // Decrease stock
                    $stock = ProductStock::firstOrCreate([
                        "product_id" => $item->product_id,
                        "store_id" => $waste->store_id,
                    ]);

                    if ($stock->quantity >= $qty) {
                        $stock->decrement("quantity", $qty);
                    } else {
                        // If stock is less than waste, set to 0
                        $stock->update(["quantity" => 0]);
                    }

                    // Create stock movement
                    StockMovement::create([
                        "product_id" => $item->product_id,
                        "store_id" => $waste->store_id,
                        "branch_id" => null,
                        "reference_type" => Waste::class,
                        "reference_id" => $waste->id,
                        "movement_type" => "waste",
                        "quantity" => $qty,
                        "unit_cost" => $item->unit_cost,
                        "reference_no" => $waste->waste_no,
                        "notes" =>
                            "Waste: {$item->waste_category}" .
                            ($item->notes ? " - {$item->notes}" : ""),
                        "moved_at" => now(),
                    ]);
                }
            }

            DB::commit();
            return back()->with("success", "Status waste berhasil diperbarui.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors([
                "status" => "Gagal memperbarui status: " . $e->getMessage(),
            ]);
        }
    }

    private function generateNumber($date)
    {
        $prefix = "WST-" . date("Ymd", strtotime($date));
        $last = Waste::where("waste_no", "like", $prefix . "%")
            ->orderByDesc("waste_no")
            ->first();

        if ($last) {
            $seq = intval(substr($last->waste_no, -3)) + 1;
        } else {
            $seq = 1;
        }

        return $prefix . "-" . str_pad($seq, 3, "0", STR_PAD_LEFT);
    }
}
