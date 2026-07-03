<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PromotionController extends Controller
{
    public function index()
    {
        $storeId = session("current_store_id");

        $promotions = Promotion::forStore($storeId)
            ->withCount("products")
            ->orderByDesc("id")
            ->get();

        return Inertia::render("Admin/Promotions/Index", [
            "promotions" => $promotions,
        ]);
    }

    public function create()
    {
        $storeId = session("current_store_id");

        $products = Product::forStore($storeId)
            ->where("is_active", true)
            ->orderBy("name")
            ->select("id", "name", "sku", "sell_price")
            ->get();

        return Inertia::render("Admin/Promotions/Create", [
            "products" => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "type" =>
                "required|string|in:percentage,fixed_amount,buy_x_get_y,bundle,tiered,member_price,bogo",
            "scope" => "required|string|in:item,cart",
            "discount_value" => "required|numeric|min:0",
            "min_purchase_amount" => "nullable|numeric|min:0",
            "max_discount_amount" => "nullable|numeric|min:0",
            "min_quantity" => "nullable|integer|min:1",
            "tier_price" => "nullable|numeric|min:0",
            "customer_tier" => "nullable|string|max:50",
            "start_date" => "nullable|date",
            "end_date" => "nullable|date|after_or_equal:start_date",
            "start_hour" => "nullable|string|max:5",
            "end_hour" => "nullable|string|max:5",
            "free_product_id" => "nullable|exists:products,id",
            "is_active" => "boolean",
            "product_ids" => "nullable|array",
            "product_ids.*" => "exists:products,id",
        ]);

        $validated["code"] = "PROMO" . strtoupper(Str::random(6));

        if (empty($validated["min_purchase_amount"])) {
            $validated["min_purchase_amount"] = 0;
        }
        if (empty($validated["max_discount_amount"])) {
            $validated["max_discount_amount"] = null;
        }

        // Normalize empty strings to null for nullable fields
        foreach (
            [
                "min_quantity",
                "tier_price",
                "customer_tier",
                "start_hour",
                "end_hour",
                "free_product_id",
            ]
            as $field
        ) {
            if (isset($validated[$field]) && $validated[$field] === "") {
                $validated[$field] = null;
            }
        }

        $productIds = $validated["product_ids"] ?? [];
        unset($validated["product_ids"]);

        $validated["store_id"] = session("current_store_id");
        $validated["is_active"] = $validated["is_active"] ?? true;

        $promotion = Promotion::create($validated);

        if (!empty($productIds)) {
            $promotion->products()->sync($productIds);
        }

        return redirect()
            ->route("admin.promotions.index")
            ->with("success", "Promo berhasil ditambahkan.");
    }

    public function edit(Promotion $promotion)
    {
        $storeId = session("current_store_id");
        $promotion->load("products:id", "freeProduct:id,name,sell_price");

        $products = Product::forStore($storeId)
            ->where("is_active", true)
            ->orderBy("name")
            ->select("id", "name", "sku", "sell_price")
            ->get();

        return Inertia::render("Admin/Promotions/Edit", [
            "promotion" => $promotion,
            "products" => $products,
        ]);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "type" =>
                "required|string|in:percentage,fixed_amount,buy_x_get_y,bundle,tiered,member_price,bogo",
            "scope" => "required|string|in:item,cart",
            "discount_value" => "required|numeric|min:0",
            "min_purchase_amount" => "nullable|numeric|min:0",
            "max_discount_amount" => "nullable|numeric|min:0",
            "min_quantity" => "nullable|integer|min:1",
            "tier_price" => "nullable|numeric|min:0",
            "customer_tier" => "nullable|string|max:50",
            "start_date" => "nullable|date",
            "end_date" => "nullable|date|after_or_equal:start_date",
            "start_hour" => "nullable|string|max:5",
            "end_hour" => "nullable|string|max:5",
            "free_product_id" => "nullable|exists:products,id",
            "is_active" => "boolean",
            "product_ids" => "nullable|array",
            "product_ids.*" => "exists:products,id",
        ]);

        if (empty($validated["min_purchase_amount"])) {
            $validated["min_purchase_amount"] = 0;
        }
        if (empty($validated["max_discount_amount"])) {
            $validated["max_discount_amount"] = null;
        }

        // Normalize empty strings to null for nullable fields
        foreach (
            [
                "min_quantity",
                "tier_price",
                "customer_tier",
                "start_hour",
                "end_hour",
                "free_product_id",
            ]
            as $field
        ) {
            if (isset($validated[$field]) && $validated[$field] === "") {
                $validated[$field] = null;
            }
        }

        $productIds = $validated["product_ids"] ?? [];
        unset($validated["product_ids"]);

        $validated["is_active"] = $validated["is_active"] ?? true;

        $promotion->update($validated);
        $promotion->products()->sync($productIds);

        return redirect()
            ->route("admin.promotions.index")
            ->with("success", "Promo berhasil diupdate.");
    }

    public function destroy(Promotion $promotion)
    {
        $promotion->products()->detach();
        $promotion->delete();

        return redirect()
            ->route("admin.promotions.index")
            ->with("success", "Promo berhasil dihapus.");
    }
}
