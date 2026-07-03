<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductModifierGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MasterDataController extends Controller
{
    /**
     * Return all master data for offline caching, scoped to the user's store.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = session("current_store_id");
        abort_unless($storeId, 403, "No store selected");

        $withRelations = ["category", "supplier"];

        // Products with stock scoped to this store
        $products = Product::forStore($storeId)
            ->with($withRelations)
            ->with([
                "variants" => fn($q) => $q->where("is_active", true),
                "modifierGroups" => fn($q) => $q->where("is_active")->with([
                    "modifiers" => fn($q) => $q
                        ->where("is_active")
                        ->orderBy("sort_order"),
                ]),
                "stocks" => fn($q) => $q->whereHas(
                    "branch",
                    fn($b) => $b->where("store_id", $storeId),
                ),
            ])
            ->where("is_active", true)
            ->orderBy("name")
            ->get()
            ->map(function ($product) {
                $product->stock_quantity =
                    $product->stocks->sum("quantity") -
                    $product->stocks->sum("reserved_quantity");
                unset($product->stocks);
                return $product;
            });

        // Categories
        $categories = Category::forStore($storeId)
            ->withCount("products")
            ->orderBy("name")
            ->get();

        // Customers scoped to store
        $customers = Customer::where("store_id", $storeId)
            ->orderBy("name")
            ->get();

        // Active payment methods
        $paymentMethods = PaymentMethod::forStore($storeId)
            ->active()
            ->orderBy("name")
            ->get();

        // Active modifier groups (full with modifiers)
        $modifierGroups = ProductModifierGroup::where("is_active", true)
            ->with([
                "modifiers" => fn($q) => $q
                    ->where("is_active")
                    ->orderBy("sort_order"),
            ])
            ->orderBy("sort_order")
            ->get();

        return response()->json([
            "products" => $products,
            "categories" => $categories,
            "customers" => $customers,
            "payment_methods" => $paymentMethods,
            "modifier_groups" => $modifierGroups,
            "synced_at" => now()->toIso8601String(),
        ]);
    }
}
