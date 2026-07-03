<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Helpers\BarcodeHelper;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    public function index(Product $product)
    {
        $product->load(["variants", "category"]);

        return Inertia::render("Admin/Products/Variants", [
            "product" => $product,
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            "name" => "required|string|max:100",
            "sku" => "required|string|max:100|unique:product_variants,sku",
            "barcode" =>
                "nullable|string|max:100|unique:product_variants,barcode",
            "price" => "required|numeric|min:0",
            "cost_price" => "nullable|numeric|min:0",
            "is_active" => "boolean",
        ]);

        $validated["product_id"] = $product->id;
        $validated["cost_price"] = $validated["cost_price"] ?? 0;
        $validated["is_active"] = $request->boolean("is_active", true);

        // Auto-generate barcode if not provided
        if (empty($validated["barcode"])) {
            $validated["barcode"] = BarcodeHelper::generateForVariant(
                $product->id,
            );
        }

        ProductVariant::create($validated);

        return back()->with("success", "Varian berhasil ditambahkan.");
    }

    public function update(
        Request $request,
        Product $product,
        ProductVariant $variant,
    ) {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }

        $validated = $request->validate([
            "name" => "required|string|max:100",
            "sku" =>
                "required|string|max:100|unique:product_variants,sku," .
                $variant->id,
            "barcode" =>
                "nullable|string|max:100|unique:product_variants,barcode," .
                $variant->id,
            "price" => "required|numeric|min:0",
            "cost_price" => "nullable|numeric|min:0",
            "is_active" => "boolean",
        ]);

        $validated["cost_price"] = $validated["cost_price"] ?? 0;

        $variant->update($validated);

        return back()->with("success", "Varian berhasil diperbarui.");
    }

    public function destroy(Product $product, ProductVariant $variant)
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }

        $variant->delete();

        return back()->with("success", "Varian berhasil dihapus.");
    }
}
