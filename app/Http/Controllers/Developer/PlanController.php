<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index()
    {
        $plans = Plan::with("planFeatures")->orderBy("sort_order")->get();
        return Inertia::render("Developer/Plans/Index", [
            "plans" => $plans,
        ]);
    }

    public function create()
    {
        return Inertia::render("Developer/Plans/Form", [
            "plan" => null,
            "allFeatures" => Feature::where("is_active", true)
                ->orderBy("sort_order")
                ->get(["id", "code", "label", "category", "sort_order"]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "code" => "required|string|max:30|unique:plans,code",
            "label" => "required|string|max:255",
            "description" => "nullable|string|max:500",
            "max_users" => "required|integer|min:1",
            "max_branches" => "required|integer|min:1",
            "price" => "nullable|numeric|min:0",
            "trial_days" => "nullable|integer|min:0",
            "feature_ids" => "nullable|array",
            "is_active" => "boolean",
            "sort_order" => "nullable|integer|min:0",
        ]);

        $plan = Plan::create($validated);

        if (isset($validated["feature_ids"])) {
            $plan->planFeatures()->sync($validated["feature_ids"]);
        }

        return redirect()
            ->route("developer.plans.index")
            ->with("success", "Paket berhasil dibuat.");
    }

    public function edit(Plan $plan)
    {
        $plan->load("planFeatures");
        return Inertia::render("Developer/Plans/Form", [
            "plan" => $plan,
            "allFeatures" => Feature::where("is_active", true)
                ->orderBy("sort_order")
                ->get(["id", "code", "label", "category", "sort_order"]),
        ]);
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            "code" => [
                "required",
                "string",
                "max:30",
                Rule::unique("plans", "code")->ignore($plan->id),
            ],
            "label" => "required|string|max:255",
            "description" => "nullable|string|max:500",
            "max_users" => "required|integer|min:1",
            "max_branches" => "required|integer|min:1",
            "price" => "nullable|numeric|min:0",
            "trial_days" => "nullable|integer|min:0",
            "feature_ids" => "nullable|array",
            "is_active" => "boolean",
            "sort_order" => "nullable|integer|min:0",
        ]);

        $plan->update($validated);

        if (isset($validated["feature_ids"])) {
            $plan->planFeatures()->sync($validated["feature_ids"]);
        }

        return redirect()
            ->route("developer.plans.index")
            ->with("success", "Paket berhasil diperbarui.");
    }

    public function destroy(Plan $plan)
    {
        // Jangan hapus kalau ada toko yang pakai
        if ($plan->stores()->exists()) {
            return back()->with(
                "error",
                "Paket masih digunakan oleh toko. Nonaktifkan saja.",
            );
        }

        $plan->delete();
        return redirect()
            ->route("developer.plans.index")
            ->with("success", "Paket berhasil dihapus.");
    }

    /** Reorder plans via drag & drop — terima array of { id, sort_order } */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            "orders"              => "required|array",
            "orders.*.id"         => "required|integer|exists:plans,id",
            "orders.*.sort_order" => "required|integer|min:0",
        ]);

        foreach ($validated["orders"] as $item) {
            Plan::where("id", $item["id"])->update(["sort_order" => $item["sort_order"]]);
        }

        return response()->json(["ok" => true]);
    }
}
