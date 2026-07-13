<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MembershipController extends Controller
{
    public function index()
    {
        $storeId = session("current_store_id");
        $memberships = Membership::where("store_id", $storeId)
            ->withCount("customerMemberships")
            ->orderBy("sort_order")
            ->orderBy("name")
            ->get();

        return Inertia::render("Admin/Memberships/Index", [
            "memberships" => $memberships,
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session("current_store_id");
        $validated = $request->validate([
            "code" => "required|string|max:50",
            "name" => "required|string|max:255",
            "description" => "nullable|string|max:500",
            "duration_type" => "required|in:day,month,year,visit",
            "duration_value" => "required|integer|min:1",
            "price" => "numeric|min:0",
            "discount_percent" => "required|numeric|min:0|max:100",
            "point_multiplier" => "required|integer|min:1",
            "benefits" => "nullable|array",
            "is_active" => "boolean",
        ]);

        $exists = Membership::where("store_id", $storeId)
            ->where("code", $validated["code"])
            ->exists();

        if ($exists) {
            return back()->withErrors(["code" => "Kode sudah digunakan."]);
        }

        Membership::create(array_merge($validated, ["store_id" => $storeId]));

        return back()->with(
            "success",
            "Membership \"{$validated["name"]}\" berhasil dibuat.",
        );
    }

    public function update(Request $request, Membership $membership)
    {
        $storeId = session("current_store_id");
        $validated = $request->validate([
            "code" => "required|string|max:50",
            "name" => "required|string|max:255",
            "description" => "nullable|string|max:500",
            "duration_type" => "required|in:day,month,year,visit",
            "duration_value" => "required|integer|min:1",
            "price" => "numeric|min:0",
            "discount_percent" => "required|numeric|min:0|max:100",
            "point_multiplier" => "required|integer|min:1",
            "benefits" => "nullable|array",
            "is_active" => "boolean",
        ]);

        // Cek duplicate code di membership lain
        $exists = Membership::where("store_id", $storeId)
            ->where("code", $validated["code"])
            ->where("id", "!=", $membership->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                "code" => "Kode sudah digunakan oleh membership lain.",
            ]);
        }

        $membership->update($validated);

        return back()->with(
            "success",
            "Membership \"{$validated["name"]}\" berhasil diperbarui.",
        );
    }

    public function destroy(Membership $membership)
    {
        if ($membership->customerMemberships()->exists()) {
            return back()->with(
                "error",
                "Membership masih dipakai pelanggan. Nonaktifkan saja.",
            );
        }

        $membership->delete();

        return back()->with("success", "Membership berhasil dihapus.");
    }
}
