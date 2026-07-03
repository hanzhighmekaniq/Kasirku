<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $storeId = session("current_store_id");
        $categories = Category::forStore($storeId)
            ->with("parent:id,name")
            ->withCount("products")
            ->orderBy("name")
            ->get();

        return Inertia::render("Admin/Categories/Index", [
            "categories" => $categories,
        ]);
    }

    public function create()
    {
        $storeId = session("current_store_id");
        return Inertia::render("Admin/Categories/Create", [
            "parentCategories" => Category::forStore($storeId)
                ->whereNull("parent_id")
                ->orderBy("name")
                ->get(["id", "name"]),
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session("current_store_id");
        $validated = $request->validate([
            "name"        => "required|string|max:255",
            "parent_id"   => "nullable|exists:categories,id",
            "description" => "nullable|string|max:500",
        ]);

        Category::create([
            "store_id"    => $storeId,
            "parent_id"   => $validated["parent_id"] ?? null,
            "name"        => $validated["name"],
            "slug"        => Str::slug($validated["name"]) . '-' . Str::random(4),
            "description" => $validated["description"] ?? null,
        ]);

        return redirect()->route("admin.categories.index")
            ->with("success", "Kategori berhasil ditambahkan.");
    }

    public function edit(Category $category)
    {
        $storeId = session("current_store_id");
        return Inertia::render("Admin/Categories/Edit", [
            "category" => $category,
            "parentCategories" => Category::forStore($storeId)
                ->whereNull("parent_id")
                ->where("id", "!=", $category->id)
                ->orderBy("name")
                ->get(["id", "name"]),
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            "name"        => "required|string|max:255",
            "parent_id"   => "nullable|exists:categories,id",
            "description" => "nullable|string|max:500",
        ]);

        $category->update([
            "parent_id"   => $validated["parent_id"] ?? null,
            "name"        => $validated["name"],
            "slug"        => Str::slug($validated["name"]) . '-' . Str::random(4),
            "description" => $validated["description"] ?? null,
        ]);

        return redirect()->route("admin.categories.index")
            ->with("success", "Kategori berhasil diupdate.");
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return redirect()
            ->route("admin.categories.index")
            ->with("success", "Kategori berhasil dihapus.");
    }
}
