<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session("current_store_id");

        // Server-side search on root categories
        $rootsQuery = Category::forStore($storeId)
            ->whereNull("parent_id")
            ->withCount("products");

        if ($search = $request->get("search")) {
            $rootsQuery->where(function ($q) use ($search) {
                $q->where("name", "like", "%{$search}%")->orWhere(
                    "description",
                    "like",
                    "%{$search}%",
                );
            });
        }

        // Paginate root categories only
        $roots = $rootsQuery->orderBy("name")->paginate(20)->withQueryString();

        // Load ALL categories for this store (for tree building)
        $allCategories = Category::forStore($storeId)
            ->withCount("products")
            ->get();

        // Build a child map: parent_id => [children]
        $byParent = [];
        foreach ($allCategories as $cat) {
            $pid = $cat->parent_id ?? 0;
            if (!isset($byParent[$pid])) {
                $byParent[$pid] = [];
            }
            $byParent[$pid][] = $cat;
        }

        // Helper: count total products recursively
        $countProducts = function ($catId) use ($byParent, &$countProducts) {
            $total = 0;
            if (isset($byParent[$catId])) {
                foreach ($byParent[$catId] as $child) {
                    $total +=
                        ($child->products_count ?? 0) +
                        $countProducts($child->id);
                }
            }
            return $total;
        };

        // Build tree for each root in current page
        $buildTree = function ($cat) use (
            $byParent,
            $countProducts,
            &$buildTree,
        ) {
            $children = isset($byParent[$cat->id]) ? $byParent[$cat->id] : [];
            $totalProducts =
                ($cat->products_count ?? 0) + $countProducts($cat->id);

            return [
                "id" => $cat->id,
                "name" => $cat->name,
                "slug" => $cat->slug,
                "description" => $cat->description,
                "parent_id" => $cat->parent_id,
                "depth" => $cat->parent_id ? 1 : 0,
                "products_count" => $cat->products_count,
                "total_products" => $totalProducts,
                "has_children" => count($children) > 0,
                "children" => array_map(fn($c) => $buildTree($c), $children),
            ];
        };

        $rootsData = $roots->through(function ($root) use ($buildTree) {
            return $buildTree($root);
        });

        return Inertia::render("Admin/Categories/Index", [
            "categories" => $rootsData,
            "stats" => [
                "total" => $roots->total(),
                "root" => $roots->total(),
            ],
            "filters" => $request->only("search"),
        ]);
    }

    public function create()
    {
        $storeId = session("current_store_id");
        $allCategories = Category::forStore($storeId)
            ->orderBy("name")
            ->get(["id", "name", "description", "parent_id"]);

        // Build hashmap for O(1) parent lookups
        $map = $allCategories->keyBy("id");

        $parentCategories = $allCategories
            ->map(function ($cat) use ($map) {
                // Compute depth by walking up parent chain via hashmap
                $depth = 0;
                $currentId = $cat->parent_id;
                while ($currentId && isset($map[$currentId])) {
                    $depth++;
                    $currentId = $map[$currentId]->parent_id;
                }
                $cat->depth = $depth;

                // Build path from hashmap (no DB queries)
                $parts = [$cat->name];
                $currentId = $cat->parent_id;
                while ($currentId && isset($map[$currentId])) {
                    array_unshift($parts, $map[$currentId]->name);
                    $currentId = $map[$currentId]->parent_id;
                }
                $cat->display_path = implode(" > ", $parts);

                return $cat;
            })
            ->sortBy("display_path")
            ->values();

        return Inertia::render("Admin/Categories/Create", [
            "parentCategories" => $parentCategories,
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session("current_store_id");
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "parent_id" => "nullable|exists:categories,id",
            "description" => "nullable|string|max:500",
        ]);

        Category::create([
            "store_id" => $storeId,
            "parent_id" => $validated["parent_id"] ?? null,
            "name" => $validated["name"],
            "slug" => Str::slug($validated["name"]) . "-" . Str::random(4),
            "description" => $validated["description"] ?? null,
        ]);

        return redirect()
            ->route("admin.categories.index")
            ->with("success", "Kategori berhasil ditambahkan.");
    }

    public function edit(Category $category)
    {
        $storeId = session("current_store_id");
        $allCategories = Category::forStore($storeId)
            ->where("id", "!=", $category->id)
            ->orderBy("name")
            ->get(["id", "name", "description", "parent_id"]);

        // Build hashmap for O(1) parent lookups
        $map = $allCategories->keyBy("id");

        $parentCategories = $allCategories
            ->map(function ($cat) use ($map) {
                // Compute depth
                $depth = 0;
                $currentId = $cat->parent_id;
                while ($currentId && isset($map[$currentId])) {
                    $depth++;
                    $currentId = $map[$currentId]->parent_id;
                }
                $cat->depth = $depth;

                // Build path from hashmap
                $parts = [$cat->name];
                $currentId = $cat->parent_id;
                while ($currentId && isset($map[$currentId])) {
                    array_unshift($parts, $map[$currentId]->name);
                    $currentId = $map[$currentId]->parent_id;
                }
                $cat->display_path = implode(" > ", $parts);

                return $cat;
            })
            ->sortBy("display_path")
            ->values();

        return Inertia::render("Admin/Categories/Edit", [
            "category" => $category,
            "parentCategories" => $parentCategories,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "parent_id" => "nullable|exists:categories,id",
            "description" => "nullable|string|max:500",
        ]);

        $category->update([
            "parent_id" => $validated["parent_id"] ?? null,
            "name" => $validated["name"],
            "slug" => Str::slug($validated["name"]) . "-" . Str::random(4),
            "description" => $validated["description"] ?? null,
        ]);

        return redirect()
            ->route("admin.categories.index")
            ->with("success", "Kategori berhasil diupdate.");
    }

    public function destroy(Category $category)
    {
        $productCount = $category->products()->count();
        if ($productCount > 0) {
            return back()->with(
                "error",
                "Kategori \"{$category->name}\" tidak dapat dihapus karena masih memiliki {$productCount} produk. Pindahkan atau hapus produk terlebih dahulu.",
            );
        }

        $childCount = $category->children()->count();
        if ($childCount > 0) {
            return back()->with(
                "error",
                "Kategori \"{$category->name}\" tidak dapat dihapus karena masih memiliki {$childCount} sub-kategori. Hapus sub-kategori terlebih dahulu.",
            );
        }

        $categoryName = $category->name;
        $category->delete();

        return redirect()
            ->route("admin.categories.index")
            ->with("success", "Kategori \"{$categoryName}\" berhasil dihapus.");
    }
}
