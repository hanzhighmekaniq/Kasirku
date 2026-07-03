<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Helpers\BarcodeHelper;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    const PRODUCT_TYPES = [
        'finished_goods' => 'Barang Jadi',
        'raw_material'   => 'Bahan Baku',
        'combo'          => 'Combo / Paket',
        'service'        => 'Jasa / Layanan',
        'rental_item'    => 'Item Rental',
        'time_based'     => 'Berbasis Waktu',
    ];
    public function index()
    {
        $storeId = session("current_store_id");

        $products = Product::forStore($storeId)
            ->with(["category", "supplier", "stocks"])
            ->get()
            ->map(function ($product) {
                $product->stock =
                    $product->stocks->sum("quantity") -
                    $product->stocks->sum("reserved_quantity");
                return $product;
            });

        return Inertia::render("Admin/Products/Index", [
            "products" => $products,
        ]);
    }

    public function show(Product $product)
    {
        $product->load([
            "category",
            "supplier",
            "variants",
            "stocks.branch",
            "batches" => fn($q) => $q
                ->orderBy("expiry_date")
                ->orderByDesc("purchase_date")
                ->limit(10),
        ]);

        $totalStock =
            $product->stocks->sum("quantity") -
            $product->stocks->sum("reserved_quantity");
        $totalReserved = $product->stocks->sum("reserved_quantity");

        // Expiry stats dari batch
        $today = \Carbon\Carbon::today();
        $batchStats = [
            "total" => $product->batches->count(),
            "expired" => $product->batches
                ->filter(
                    fn($b) => $b->expiry_date && $b->expiry_date->lt($today),
                )
                ->count(),
            "expiring_soon" => $product->batches
                ->filter(
                    fn($b) => $b->expiry_date &&
                        $b->expiry_date->gte($today) &&
                        $b->expiry_date->lte($today->copy()->addDays(30)),
                )
                ->count(),
        ];

        // Margin
        $margin =
            $product->sell_price > 0
                ? round(
                    (($product->sell_price - $product->cost_price) /
                        $product->sell_price) *
                        100,
                    1,
                )
                : 0;
        $profitRp = $product->sell_price - $product->cost_price;

        return Inertia::render("Admin/Products/Show", [
            "product" => $product,
            "totalStock" => $totalStock,
            "reserved" => $totalReserved,
            "batchStats" => $batchStats,
            "margin" => $margin,
            "profitRp" => $profitRp,
        ]);
    }

    public function create()
    {
        $storeId = session("current_store_id");
        return Inertia::render("Admin/Products/Create", [
            "categories" => Category::forStore($storeId)->orderBy("name")->get(),
            "suppliers"  => Supplier::where("store_id", $storeId)->orderBy("name")->get(),
            "productTypes" => self::PRODUCT_TYPES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "sku" => "required|string|max:100|unique:products,sku",
            "barcode" => "nullable|string|max:100|unique:products,barcode",
            "type" => "required|in:finished_goods,raw_material,combo,service,rental_item,time_based",
            "category_id" => "nullable|exists:categories,id",
            "supplier_id" => "nullable|exists:suppliers,id",
            "unit" => "nullable|string|max:30",
            "sell_price" => "required|numeric|min:0",
            "cost_price" => "nullable|numeric|min:0",
            "initial_stock" => "nullable|integer|min:0",
            "stock_minimum" => "nullable|integer|min:0",
            "track_stock" => "boolean",
            "is_sellable" => "boolean",
            "is_composable" => "boolean",
            "preparation_time" => "nullable|integer|min:0",
            "is_active" => "boolean",
            "image" => "nullable|image|mimes:jpg,jpeg,png,webp|max:2048",
        ]);

        $imagePath = null;
        if ($request->hasFile("image")) {
            $imagePath = $request->file("image")->store("products", "public");
        }

        $product = Product::create([
            "store_id"         => session("current_store_id"),
            "name" => $validated["name"],
            "sku" => $validated["sku"],
            "barcode" => $validated["barcode"] ?? BarcodeHelper::generate(),
            "type" => $validated["type"],
            "category_id" => $validated["category_id"] ?? null,
            "supplier_id" => $validated["supplier_id"] ?? null,
            "unit" => $validated["unit"] ?? "pcs",
            "sell_price" => $validated["sell_price"],
            "cost_price" => $validated["cost_price"] ?? 0,
            "stock_minimum" => $validated["stock_minimum"] ?? 0,
            "track_stock" => $validated["track_stock"] ?? true,
            "is_sellable" => $validated["is_sellable"] ?? true,
            "is_composable" => $validated["is_composable"] ?? false,
            "preparation_time" => $validated["preparation_time"] ?? null,
            "is_active" => $validated["is_active"] ?? true,
            "image" => $imagePath,
        ]);

        $initialStock = (int) ($validated["initial_stock"] ?? 0);
        if ($initialStock > 0 && $product->track_stock) {
            ProductStock::updateOrCreate(
                ['product_id' => $product->id, 'store_id' => session("current_store_id"), 'branch_id' => null],
                ['quantity' => $initialStock, 'reserved_quantity' => 0]
            );
        }

        return redirect()
            ->route("admin.products.index")
            ->with("success", "Produk berhasil ditambahkan.");
    }

    public function edit(Product $product)
    {
        $storeId = session("current_store_id");
        return Inertia::render("Admin/Products/Edit", [
            "product"      => $product,
            "categories"   => Category::forStore($storeId)->orderBy("name")->get(),
            "suppliers"    => Supplier::where("store_id", $storeId)->orderBy("name")->get(),
            "productTypes" => self::PRODUCT_TYPES,
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "sku" =>
                "required|string|max:100|unique:products,sku," . $product->id,
            "barcode" =>
                "nullable|string|max:100|unique:products,barcode," .
                $product->id,
            "type" => "required|in:finished_goods,raw_material,combo,service,rental_item,time_based",
            "category_id" => "nullable|exists:categories,id",
            "supplier_id" => "nullable|exists:suppliers,id",
            "unit" => "nullable|string|max:30",
            "sell_price" => "required|numeric|min:0",
            "cost_price" => "nullable|numeric|min:0",
            "stock_minimum" => "nullable|integer|min:0",
            "track_stock" => "boolean",
            "is_sellable" => "boolean",
            "is_composable" => "boolean",
            "preparation_time" => "nullable|integer|min:0",
            "is_active" => "boolean",
            "image" => "nullable|image|mimes:jpg,jpeg,png,webp|max:2048",
            "remove_image" => "boolean",
        ]);

        // Handle gambar
        $imagePath = $product->image; // default: tetap gambar lama

        if ($request->boolean("remove_image")) {
            // Hapus gambar lama dari storage
            if ($product->image) {
                \Storage::disk("public")->delete($product->image);
            }
            $imagePath = null;
        }

        if ($request->hasFile("image")) {
            // Hapus gambar lama sebelum upload baru
            if ($product->image) {
                \Storage::disk("public")->delete($product->image);
            }
            $imagePath = $request->file("image")->store("products", "public");
        }

        $product->update([
            "name" => $validated["name"],
            "sku" => $validated["sku"],
            "barcode" => $validated["barcode"] ?? null,
            "type" => $validated["type"],
            "category_id" => $validated["category_id"] ?? null,
            "supplier_id" => $validated["supplier_id"] ?? null,
            "unit" => $validated["unit"] ?? "pcs",
            "sell_price" => $validated["sell_price"],
            "cost_price" => $validated["cost_price"] ?? 0,
            "stock_minimum" => $validated["stock_minimum"] ?? 0,
            "track_stock" => $validated["track_stock"] ?? true,
            "is_sellable" => $validated["is_sellable"] ?? true,
            "is_composable" => $validated["is_composable"] ?? false,
            "preparation_time" => $validated["preparation_time"] ?? null,
            "is_active" => $validated["is_active"] ?? true,
            "image" => $imagePath,
        ]);

        return redirect()
            ->route("admin.products.index")
            ->with("success", "Produk berhasil diperbarui.");
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return redirect()
            ->route("admin.products.index")
            ->with("success", "Produk berhasil dihapus.");
    }
}
