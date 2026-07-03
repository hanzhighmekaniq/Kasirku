<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BranchController extends Controller
{
    /**
     * List ALL branches across all stores (developer overview).
     */
    public function allIndex()
    {
        $branches = Branch::with("store")
            ->withCount(["employees", "sales", "purchases"])
            ->orderBy("store_id")
            ->orderByDesc("is_active")
            ->orderBy("name")
            ->get();

        return Inertia::render("Developer/Branches/AllIndex", [
            "branches" => $branches,
            "stores" => Store::orderBy("name")->get(["id", "name", "code"]),
        ]);
    }

    public function index(Request $request, Store $store)
    {
        $branches = Branch::where("store_id", $store->id)
            ->withCount(["employees", "sales", "purchases"])
            ->orderByDesc("is_active")
            ->orderBy("name")
            ->get();

        return Inertia::render("Developer/Branches/Index", [
            "store" => $store,
            "branches" => $branches,
        ]);
    }

    public function create(Store $store)
    {
        return Inertia::render("Developer/Branches/Create", [
            "store" => $store,
        ]);
    }

    public function store(Request $request, Store $store)
    {
        $validated = $request->validate($this->rules($store->id));

        Branch::create([
            "store_id" => $store->id,
            "code" => strtoupper($validated["code"]),
            "name" => $validated["name"],
            "phone" => $validated["phone"] ?? null,
            "address" => $validated["address"] ?? null,
            "is_active" => $validated["is_active"] ?? true,
        ]);

        return redirect()
            ->route("developer.stores.branches.index", $store)
            ->with("success", "Cabang berhasil ditambahkan.");
    }

    public function edit(Store $store, Branch $branch)
    {
        abort_unless($branch->store_id === $store->id, 404);

        return Inertia::render("Developer/Branches/Edit", [
            "store" => $store,
            "branch" => $branch,
            "stores" => Store::orderBy("name")->get(["id", "name", "code"]),
        ]);
    }

    public function update(Request $request, Store $store, Branch $branch)
    {
        abort_unless($branch->store_id === $store->id, 404);

        $validated = $request->validate($this->rules($store->id, $branch->id));

        $branch->update([
            "code" => strtoupper($validated["code"]),
            "name" => $validated["name"],
            "phone" => $validated["phone"] ?? null,
            "address" => $validated["address"] ?? null,
            "is_active" => $validated["is_active"] ?? true,
        ]);

        return redirect()
            ->route("developer.stores.branches.index", $store)
            ->with("success", "Cabang berhasil diperbarui.");
    }

    public function destroy(Store $store, Branch $branch)
    {
        abort_unless($branch->store_id === $store->id, 404);

        $branch->loadCount(["employees", "sales", "purchases"]);

        if (
            $branch->employees_count ||
            $branch->sales_count ||
            $branch->purchases_count
        ) {
            return back()->with(
                "error",
                "Cabang sudah dipakai pada data operasional. Nonaktifkan cabang jika tidak digunakan lagi.",
            );
        }

        $branch->delete();

        return redirect()
            ->route("developer.stores.branches.index", $store)
            ->with("success", "Cabang berhasil dihapus.");
    }

    private function rules(int $storeId, ?int $ignoreId = null): array
    {
        return [
            "code" => [
                "required",
                "string",
                "max:50",
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique("branches", "code")
                    ->where(fn($query) => $query->where("store_id", $storeId))
                    ->ignore($ignoreId),
            ],
            "name" => ["required", "string", "max:255"],
            "phone" => ["nullable", "string", "max:30"],
            "address" => ["nullable", "string"],
            "is_active" => ["boolean"],
        ];
    }
}
