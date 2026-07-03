<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductModifier;
use App\Models\ProductModifierGroup;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductModifierGroupController extends Controller
{
    public function index()
    {
        $storeId = session("current_store_id");

        $groups = ProductModifierGroup::forStore($storeId)
            ->withCount("modifiers")
            ->orderBy("sort_order")
            ->orderBy("name")
            ->get();

        return Inertia::render("Admin/ModifierGroups/Index", [
            "groups" => $groups,
        ]);
    }

    public function create()
    {
        return Inertia::render("Admin/ModifierGroups/Create");
    }

    public function store(Request $request)
    {
        $storeId = session("current_store_id");

        $validated = $request->validate([
            "name" => [
                "required",
                "string",
                "max:100",
                Rule::unique("product_modifier_groups", "name")->where(
                    fn($q) => $q->where("store_id", $storeId),
                ),
            ],
            "description" => "nullable|string|max:255",
            "is_required" => "boolean",
            "selection_type" => "required|in:single,multiple",
            "max_selection" => "nullable|integer|min:1",
            "sort_order" => "nullable|integer|min:0",
            "is_active" => "boolean",
        ]);

        $validated["store_id"] = $storeId;
        $validated["is_active"] = $request->boolean("is_active", true);

        ProductModifierGroup::create($validated);

        return redirect()
            ->route("admin.modifier-groups.index")
            ->with("success", "Grup modifier berhasil ditambahkan.");
    }

    public function show(ProductModifierGroup $modifierGroup)
    {
        $storeId = session("current_store_id");
        $modifierGroup->load(["modifiers", "products"]);

        return Inertia::render("Admin/ModifierGroups/Show", [
            "group" => $modifierGroup,
            "allProducts" => Product::forStore($storeId)
                ->where("is_active", true)
                ->orderBy("name")
                ->get(["id", "name", "sku"]),
        ]);
    }

    public function edit(ProductModifierGroup $modifierGroup)
    {
        return Inertia::render("Admin/ModifierGroups/Edit", [
            "group" => $modifierGroup,
        ]);
    }

    public function update(
        Request $request,
        ProductModifierGroup $modifierGroup,
    ) {
        $validated = $request->validate([
            "name" => [
                "required",
                "string",
                "max:100",
                Rule::unique("product_modifier_groups", "name")
                    ->where(
                        fn($q) => $q->where(
                            "store_id",
                            session("current_store_id"),
                        ),
                    )
                    ->ignore($modifierGroup->id),
            ],
            "description" => "nullable|string|max:255",
            "is_required" => "boolean",
            "selection_type" => "required|in:single,multiple",
            "max_selection" => "nullable|integer|min:1",
            "sort_order" => "nullable|integer|min:0",
            "is_active" => "boolean",
        ]);

        $modifierGroup->update($validated);

        return redirect()
            ->route("admin.modifier-groups.index")
            ->with("success", "Grup modifier berhasil diperbarui.");
    }

    public function destroy(ProductModifierGroup $modifierGroup)
    {
        $modifierGroup->delete();

        return redirect()
            ->route("admin.modifier-groups.index")
            ->with("success", "Grup modifier berhasil dihapus.");
    }

    // --- Modifier CRUD (nested) ---

    public function storeModifier(
        Request $request,
        ProductModifierGroup $modifierGroup,
    ) {
        $validated = $request->validate([
            "name" => "required|string|max:100",
            "price_addition" => "required|numeric|min:0",
            "is_active" => "boolean",
            "sort_order" => "nullable|integer|min:0",
        ]);

        $validated["modifier_group_id"] = $modifierGroup->id;
        $validated["is_active"] = $request->boolean("is_active", true);

        ProductModifier::create($validated);

        return back()->with("success", "Modifier berhasil ditambahkan.");
    }

    public function updateModifier(
        Request $request,
        ProductModifierGroup $modifierGroup,
        ProductModifier $modifier,
    ) {
        if ($modifier->modifier_group_id !== $modifierGroup->id) {
            abort(404);
        }

        $validated = $request->validate([
            "name" => "required|string|max:100",
            "price_addition" => "required|numeric|min:0",
            "is_active" => "boolean",
            "sort_order" => "nullable|integer|min:0",
        ]);

        $modifier->update($validated);

        return back()->with("success", "Modifier berhasil diperbarui.");
    }

    public function destroyModifier(
        ProductModifierGroup $modifierGroup,
        ProductModifier $modifier,
    ) {
        if ($modifier->modifier_group_id !== $modifierGroup->id) {
            abort(404);
        }

        $modifier->delete();

        return back()->with("success", "Modifier berhasil dihapus.");
    }

    // --- Product linking ---

    public function attachProduct(
        Request $request,
        ProductModifierGroup $modifierGroup,
    ) {
        $validated = $request->validate([
            "product_id" => "required|exists:products,id",
        ]);

        $modifierGroup
            ->products()
            ->syncWithoutDetaching($validated["product_id"]);

        return back()->with(
            "success",
            "Produk berhasil ditambahkan ke grup modifier.",
        );
    }

    public function detachProduct(
        ProductModifierGroup $modifierGroup,
        Product $product,
    ) {
        $modifierGroup->products()->detach($product->id);

        return back()->with(
            "success",
            "Produk berhasil dilepas dari grup modifier.",
        );
    }
}
