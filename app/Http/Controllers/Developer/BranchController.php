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
    public function index()
    {
        $branches = Branch::with(["store.storeType"])
            ->withCount(["employees", "sales", "purchases"])
            ->orderBy("store_id")
            ->orderByDesc("is_active")
            ->orderBy("name")
            ->get()
            ->map(fn($b) => [
                "id"              => $b->id,
                "code"            => $b->code,
                "name"            => $b->name,
                "address"         => $b->address,
                "phone"           => $b->phone,
                "is_active"       => $b->is_active,
                "created_at"      => $b->created_at,
                "employees_count" => $b->employees_count,
                "sales_count"     => $b->sales_count,
                "purchases_count" => $b->purchases_count,
                "store"           => $b->store ? [
                    "id"   => $b->store->id,
                    "code" => $b->store->code,
                    "name" => $b->store->name,
                    "store_type" => $b->store->storeType ? [
                        "id"    => $b->store->storeType->id,
                        "code"  => $b->store->storeType->code,
                        "label" => $b->store->storeType->label,
                    ] : null,
                ] : null,
            ]);

        $stores = Store::with("storeType")->orderBy("name")->get()->map(fn($s) => [
            "id"   => $s->id,
            "code" => $s->code,
            "name" => $s->name,
            "store_type" => $s->storeType ? [
                "id"    => $s->storeType->id,
                "code"  => $s->storeType->code,
                "label" => $s->storeType->label,
            ] : null,
        ]);

        return Inertia::render("Developer/Branches/Index", [
            "branches" => $branches,
            "stores"   => $stores,
        ]);
    }

    public function create()
    {
        $stores = Store::orderBy("name")->get()->map(fn($s) => [
            "id"   => $s->id,
            "code" => $s->code,
            "name" => $s->name,
        ]);

        return Inertia::render("Developer/Branches/Create", [
            "stores" => $stores,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "store_id"  => ["required", "integer", "exists:stores,id"],
            "code"      => ["required", "string", "max:50", "regex:/^[A-Za-z0-9_-]+$/"],
            "name"      => ["required", "string", "max:255"],
            "phone"     => ["nullable", "string", "max:30"],
            "address"   => ["nullable", "string"],
            "is_active" => ["boolean"],
        ]);

        // Unique code per store
        $exists = Branch::where("store_id", $validated["store_id"])
            ->where("code", strtoupper($validated["code"]))
            ->exists();

        if ($exists) {
            return back()->withErrors(["code" => "Kode sudah dipakai di toko ini."]);
        }

        Branch::create([
            "store_id"  => $validated["store_id"],
            "code"      => strtoupper($validated["code"]),
            "name"      => $validated["name"],
            "phone"     => $validated["phone"] ?? null,
            "address"   => $validated["address"] ?? null,
            "is_active" => $validated["is_active"] ?? true,
        ]);

        return redirect()->route("developer.branches.index")->with("success", "Cabang berhasil ditambahkan.");
    }

    public function show(Branch $branch)
    {
        $branch->load(["store.storeType", "employees.user"]);

        return Inertia::render("Developer/Branches/Show", [
            "branch" => [
                "id"         => $branch->id,
                "code"       => $branch->code,
                "name"       => $branch->name,
                "address"    => $branch->address,
                "phone"      => $branch->phone,
                "is_active"  => $branch->is_active,
                "store_id"   => $branch->store_id,
                "created_at" => $branch->created_at,
            ],
            "store" => $branch->store ? [
                "id"   => $branch->store->id,
                "code" => $branch->store->code,
                "name" => $branch->store->name,
            ] : null,
            "employees" => $branch->employees->map(fn($e) => [
                "id"        => $e->id,
                "name"      => $e->name,
                "position"  => $e->position,
                "phone"     => $e->phone,
                "is_active" => $e->is_active,
                "user"      => $e->user ? [
                    "id"    => $e->user->id,
                    "name"  => $e->user->name,
                    "email" => $e->user->email,
                ] : null,
            ]),
        ]);
    }

    public function edit(Branch $branch)
    {
        $stores = Store::orderBy("name")->get()->map(fn($s) => [
            "id"   => $s->id,
            "code" => $s->code,
            "name" => $s->name,
        ]);

        return Inertia::render("Developer/Branches/Edit", [
            "branch" => [
                "id"        => $branch->id,
                "code"      => $branch->code,
                "name"      => $branch->name,
                "address"   => $branch->address,
                "phone"     => $branch->phone,
                "is_active" => $branch->is_active,
                "store_id"  => $branch->store_id,
            ],
            "store" => $branch->store ? [
                "id"   => $branch->store->id,
                "code" => $branch->store->code,
                "name" => $branch->store->name,
            ] : null,
            "stores" => $stores,
        ]);
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            "store_id"  => ["sometimes", "required", "integer", "exists:stores,id"],
            "code"      => ["required", "string", "max:50", "regex:/^[A-Za-z0-9_-]+$/"],
            "name"      => ["required", "string", "max:255"],
            "phone"     => ["nullable", "string", "max:30"],
            "address"   => ["nullable", "string"],
            "is_active" => ["boolean"],
        ]);

        $storeId = $validated["store_id"] ?? $branch->store_id;

        $exists = Branch::where("store_id", $storeId)
            ->where("code", strtoupper($validated["code"]))
            ->where("id", "!=", $branch->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(["code" => "Kode sudah dipakai di toko ini."]);
        }

        $branch->update([
            "store_id"  => $storeId,
            "code"      => strtoupper($validated["code"]),
            "name"      => $validated["name"],
            "phone"     => $validated["phone"] ?? null,
            "address"   => $validated["address"] ?? null,
            "is_active" => $validated["is_active"] ?? true,
        ]);

        return redirect()->route("developer.branches.index")->with("success", "Cabang berhasil diperbarui.");
    }

    public function destroy(Branch $branch)
    {
        $branch->loadCount(["employees", "sales", "purchases"]);

        if ($branch->employees_count || $branch->sales_count || $branch->purchases_count) {
            return back()->with("error", "Cabang sudah dipakai. Nonaktifkan saja.");
        }

        $branch->delete();

        return redirect()->route("developer.branches.index")->with("success", "Cabang berhasil dihapus.");
    }
}
