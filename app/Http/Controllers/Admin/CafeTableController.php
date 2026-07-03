<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CafeTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CafeTableController extends Controller
{
    private function ensureSameStore(CafeTable $cafeTable): bool
    {
        return $cafeTable->store_id == session("current_store_id");
    }

    public function index()
    {
        $storeId = session("current_store_id");

        $cafeTables = CafeTable::with("branch:id,name")
            ->where("store_id", $storeId)
            ->orderByDesc("id")
            ->get();

        $branches = Branch::where("store_id", $storeId)
            ->where("is_active", true)
            ->orderBy("name")
            ->select("id", "name")
            ->get();

        return Inertia::render("Admin/CafeTables/Index", [
            "cafeTables" => $cafeTables,
            "branches" => $branches,
        ]);
    }

    public function create()
    {
        $branches = Branch::where("store_id", session("current_store_id"))
            ->where("is_active", true)
            ->orderBy("name")
            ->select("id", "name")
            ->get();

        return Inertia::render("Admin/CafeTables/Create", [
            "branches" => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session("current_store_id");

        $validated = $request->validate([
            "branch_id" => "required|exists:branches,id",
            "table_number" => "required|string|max:20",
            "capacity" => "required|integer|min:1",
            "status" => "nullable|string|in:available,occupied,reserved",
            "is_active" => "boolean",
        ]);

        // Pastikan branch milik store saat ini
        $branch = Branch::find($validated["branch_id"]);
        if (!$branch || $branch->store_id != $storeId) {
            return back()
                ->withErrors([
                    "branch_id" => "Cabang tidak valid untuk store ini.",
                ])
                ->withInput();
        }

        $validated["store_id"] = $storeId;
        $validated["status"] = $validated["status"] ?? "available";
        $validated["is_active"] = $validated["is_active"] ?? true;

        // Unique per branch
        $exists = CafeTable::where("branch_id", $validated["branch_id"])
            ->where("table_number", $validated["table_number"])
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    "table_number" => "Nomor meja sudah ada di cabang ini.",
                ])
                ->withInput();
        }

        CafeTable::create($validated);

        return redirect()
            ->route("admin.cafe-tables.index")
            ->with("success", "Meja berhasil ditambahkan.");
    }

    public function edit(CafeTable $cafeTable)
    {
        if (!$this->ensureSameStore($cafeTable)) {
            abort(403, "Akses ditolak.");
        }

        $branches = Branch::where("store_id", session("current_store_id"))
            ->where("is_active", true)
            ->orderBy("name")
            ->select("id", "name")
            ->get();

        return Inertia::render("Admin/CafeTables/Edit", [
            "cafeTable" => $cafeTable,
            "branches" => $branches,
        ]);
    }

    public function update(Request $request, CafeTable $cafeTable)
    {
        if (!$this->ensureSameStore($cafeTable)) {
            abort(403, "Akses ditolak.");
        }

        $storeId = session("current_store_id");

        $validated = $request->validate([
            "branch_id" => "required|exists:branches,id",
            "table_number" => "required|string|max:20",
            "capacity" => "required|integer|min:1",
            "status" => "nullable|string|in:available,occupied,reserved",
            "is_active" => "boolean",
        ]);

        // Pastikan branch milik store saat ini
        $branch = Branch::find($validated["branch_id"]);
        if (!$branch || $branch->store_id != $storeId) {
            return back()
                ->withErrors([
                    "branch_id" => "Cabang tidak valid untuk store ini.",
                ])
                ->withInput();
        }

        $validated["store_id"] = $storeId;
        $validated["is_active"] = $validated["is_active"] ?? true;

        // Unique per branch (exclude self)
        $exists = CafeTable::where("branch_id", $validated["branch_id"])
            ->where("table_number", $validated["table_number"])
            ->where("id", "!=", $cafeTable->id)
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    "table_number" => "Nomor meja sudah ada di cabang ini.",
                ])
                ->withInput();
        }

        $cafeTable->update($validated);

        return redirect()
            ->route("admin.cafe-tables.index")
            ->with("success", "Meja berhasil diupdate.");
    }

    public function destroy(CafeTable $cafeTable)
    {
        if (!$this->ensureSameStore($cafeTable)) {
            abort(403, "Akses ditolak.");
        }

        $cafeTable->delete();

        return redirect()
            ->route("admin.cafe-tables.index")
            ->with("success", "Meja berhasil dihapus.");
    }

    /** Kosongkan meja (set ke available). Dipanggil dari POS atau admin. */
    public function freeTable(CafeTable $cafeTable)
    {
        if (!$this->ensureSameStore($cafeTable)) {
            abort(403, "Akses ditolak.");
        }

        $cafeTable->update(["status" => "available"]);

        return response()->json([
            "success" => true,
            "message" => "Meja {$cafeTable->table_number} berhasil dikosongkan.",
        ]);
    }
}
