<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session("current_store_id");
        abort_unless($storeId, 403);

        $customers = Customer::where("store_id", $storeId)
            ->orderByDesc("created_at")
            ->get();

        return Inertia::render("Admin/Customers/Index", [
            "customers" => $customers,
            "storeType" => \App\Models\Store::find($storeId)?->store_type ?? 'retail',
        ]);
    }

    public function create()
    {
        return Inertia::render("Admin/Customers/Create");
    }

    public function store(Request $request)
    {
        $storeId = session("current_store_id");
        abort_unless($storeId, 403);

        $validated = $request->validate([
            "name"    => "required|string|max:255",
            "phone"   => "nullable|string|max:30",
            "email"   => ["nullable","email",Rule::unique("customers","email")->where("store_id",$storeId)],
            "address" => "nullable|string",
            "birth_date" => "nullable|date",
            "gender"     => "nullable|in:male,female",
            "notes"      => "nullable|string|max:500",
        ]);

        $validated["store_id"] = $storeId;
        $validated["code"]     = $this->nextCode($storeId);

        $customer = Customer::create($validated);

        if ($request->expectsJson()) {
            return response()->json(["success" => true, "customer" => $customer->fresh()]);
        }

        return redirect()->route("admin.customers.index")
            ->with("success", "Pelanggan berhasil ditambahkan.");
    }

    public function update(Request $request, Customer $customer)
    {
        $this->ensureSameStore($customer);
        $storeId = session("current_store_id");

        $validated = $request->validate([
            "name"    => "required|string|max:255",
            "phone"   => "nullable|string|max:30",
            "email"   => ["nullable","email",Rule::unique("customers","email")->ignore($customer->id)->where("store_id",$storeId)],
            "address" => "nullable|string",
            "birth_date" => "nullable|date",
            "gender"     => "nullable|in:male,female",
            "notes"      => "nullable|string|max:500",
        ]);

        $customer->update($validated);

        return redirect()->route("admin.customers.index")
            ->with("success", "Pelanggan berhasil diupdate.");
    }

    public function destroy(Customer $customer)
    {
        $this->ensureSameStore($customer);

        $customer->delete();
        return redirect()
            ->route("admin.customers.index")
            ->with("success", "Pelanggan berhasil dihapus.");
    }

    // ── Helpers ──────────────────────────────────────────

    private function ensureSameStore(Customer $customer): void
    {
        abort_if(
            $customer->store_id !== (int) session("current_store_id"),
            403,
        );
    }

    private function nextCode(int $storeId): string
    {
        $last = Customer::where("store_id", $storeId)
            ->orderByDesc("id")
            ->value("code");

        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            return "CST" . str_pad((int) $m[1] + 1, 3, "0", STR_PAD_LEFT);
        }

        return "CST001";
    }
}
