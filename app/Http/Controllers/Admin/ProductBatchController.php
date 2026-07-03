<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductBatch;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductBatchController extends Controller
{
    private function getStoreId(): int
    {
        return session("current_store_id") ?? \App\Models\Store::first()->id;
    }

    public function index(Request $request)
    {
        $storeId = $this->getStoreId();

        $batches = ProductBatch::with(["product:id,name,sku", "branch:id,name"])
            ->where("store_id", $storeId)
            ->when(
                $request->product_id,
                fn($q) => $q->where("product_id", $request->product_id),
            )
            ->when($request->status, function ($q) use ($request) {
                $today = Carbon::today();
                match ($request->status) {
                    "expired" => $q
                        ->whereNotNull("expiry_date")
                        ->where("expiry_date", "<", $today),
                    "expiring_soon" => $q
                        ->whereNotNull("expiry_date")
                        ->where("expiry_date", ">=", $today)
                        ->where(
                            "expiry_date",
                            "<=",
                            $today->copy()->addDays(30),
                        ),
                    "active" => $q->where(
                        fn($s) => $s
                            ->whereNull("expiry_date")
                            ->orWhere(
                                "expiry_date",
                                ">",
                                $today->copy()->addDays(30),
                            ),
                    ),
                    default => null,
                };
            })
            ->orderBy("expiry_date")
            ->orderByDesc("purchase_date")
            ->get()
            ->map(
                fn($b) => array_merge($b->toArray(), [
                    "expiry_status" => $b->expiry_status,
                    "days_until_expiry" => $b->days_until_expiry,
                ]),
            );

        $products = Product::forStore($storeId)
            ->where("is_active", true)
            ->select("id", "name", "sku")
            ->orderBy("name")
            ->get();

        return Inertia::render("Admin/ProductBatches/Index", [
            "batches" => $batches,
            "products" => $products,
            "filters" => $request->only("product_id", "status"),
        ]);
    }

    public function create()
    {
        $storeId = $this->getStoreId();

        return Inertia::render("Admin/ProductBatches/Create", [
            "products" => Product::forStore($storeId)
                ->where("is_active", true)
                ->select("id", "name", "sku", "cost_price")
                ->orderBy("name")
                ->get(),
            "branches" => Branch::where("store_id", $storeId)
                ->where("is_active", true)
                ->select("id", "name")
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $storeId = $this->getStoreId();

        $validated = $request->validate(
            [
                "product_id" => "required|exists:products,id",
                "branch_id" => "nullable|exists:branches,id",
                "batch_no" => [
                    "required",
                    "string",
                    "max:100",
                    Rule::unique("product_batches")->where(
                        fn($q) => $q->where("product_id", $request->product_id),
                    ),
                ],
                "purchase_date" => "nullable|date",
                "expiry_date" => "nullable|date|after_or_equal:purchase_date",
                "quantity" => "required|integer|min:0",
                "cost_price" => "required|numeric|min:0",
            ],
            [
                "batch_no.unique" =>
                    "Nomor batch ini sudah digunakan untuk produk tersebut.",
                "expiry_date.after_or_equal" =>
                    "Tanggal kadaluarsa harus setelah atau sama dengan tanggal pembelian.",
            ],
        );

        $validated["store_id"] = $storeId;

        ProductBatch::create($validated);

        return redirect()
            ->route("admin.product-batches.index")
            ->with("success", "Batch produk berhasil ditambahkan.");
    }

    public function edit(ProductBatch $productBatch)
    {
        $storeId = $this->getStoreId();

        return Inertia::render("Admin/ProductBatches/Edit", [
            "batch" => $productBatch->load("product:id,name,sku,cost_price"),
            "products" => Product::forStore($storeId)
                ->where("is_active", true)
                ->select("id", "name", "sku", "cost_price")
                ->orderBy("name")
                ->get(),
            "branches" => Branch::where("store_id", $storeId)
                ->where("is_active", true)
                ->select("id", "name")
                ->get(),
        ]);
    }

    public function update(Request $request, ProductBatch $productBatch)
    {
        $validated = $request->validate(
            [
                "product_id" => "required|exists:products,id",
                "branch_id" => "nullable|exists:branches,id",
                "batch_no" => [
                    "required",
                    "string",
                    "max:100",
                    Rule::unique("product_batches")
                        ->where(
                            fn($q) => $q->where(
                                "product_id",
                                $request->product_id,
                            ),
                        )
                        ->ignore($productBatch->id),
                ],
                "purchase_date" => "nullable|date",
                "expiry_date" => "nullable|date|after_or_equal:purchase_date",
                "quantity" => "required|integer|min:0",
                "cost_price" => "required|numeric|min:0",
            ],
            [
                "batch_no.unique" =>
                    "Nomor batch ini sudah digunakan untuk produk tersebut.",
                "expiry_date.after_or_equal" =>
                    "Tanggal kadaluarsa harus setelah atau sama dengan tanggal pembelian.",
            ],
        );

        $productBatch->update($validated);

        return redirect()
            ->route("admin.product-batches.index")
            ->with("success", "Batch produk berhasil diperbarui.");
    }

    public function destroy(ProductBatch $productBatch)
    {
        $productBatch->delete();

        return redirect()
            ->route("admin.product-batches.index")
            ->with("success", "Batch produk berhasil dihapus.");
    }
}
