<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;

class SettingController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        $storeId = session("current_store_id");
        $store =
            \App\Models\Store::find($storeId) ?? $user?->stores()?->first();

        // Ambil semua user di store ini beserta role mereka
        $storeUsers = collect();
        if ($store) {
            $storeUsers = $store
                ->users()
                ->get()
                ->map(function ($u) use ($store) {
                    $roles = DB::table("model_has_roles")
                        ->join(
                            "roles",
                            "roles.id",
                            "=",
                            "model_has_roles.role_id",
                        )
                        ->where("model_has_roles.model_id", $u->id)
                        ->where(
                            "model_has_roles.model_type",
                            \App\Models\User::class,
                        )
                        ->where("model_has_roles.store_id", $store->id)
                        ->pluck("roles.name");
                    return [
                        "id" => $u->id,
                        "name" => $u->name,
                        "email" => $u->email,
                        "roles" => $roles,
                    ];
                });
        }

        return Inertia::render("Admin/Settings/Index", [
            "store" => $store,
            "storeUsers" => $storeUsers,
            "storeTypes" => \App\Models\StoreType::active(),
        ]);
    }

    public function update(Request $request)
    {
        $storeId = session("current_store_id");
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        $store =
            \App\Models\Store::find($storeId) ?? $user?->stores()?->first();

        if (!$store) {
            return back()->with("error", "Toko tidak ditemukan.");
        }

        $validated = $request->validate([
            "name" => "required|string|max:255",
            "code" => [
                "required",
                "string",
                "max:50",
                Rule::unique("stores", "code")->ignore($store->id),
            ],
            "store_type" => [
                "required",
                Rule::in(\App\Models\StoreType::codes()),
            ],
            "phone" => "nullable|string|max:30",
            "email" => [
                "nullable",
                "email",
                "max:255",
                Rule::unique("stores", "email")->ignore($store->id),
            ],
            "address" => "nullable|string|max:1000",
            "receipt_header" => "nullable|string|max:500",
            "receipt_footer" => "nullable|string|max:500",
            "tax_inclusive" => "boolean",
            "default_tax_rate" => "nullable|numeric|min:0|max:100",
            "logo" => "nullable|image|mimes:jpg,jpeg,png,webp|max:2048",
            "remove_logo" => "boolean",
        ]);

        // Handle logo
        $logoPath = $store->logo;
        if ($request->hasFile("logo")) {
            if ($store->logo) {
                Storage::disk("public")->delete($store->logo);
            }
            $logoPath = $request->file("logo")->store("stores", "public");
        } elseif ($request->boolean("remove_logo") && $store->logo) {
            Storage::disk("public")->delete($store->logo);
            $logoPath = null;
        }

        $store->update([
            "name" => $validated["name"],
            "code" => $validated["code"],
            "store_type" => $validated["store_type"],
            "phone" => $validated["phone"] ?? null,
            "email" => $validated["email"] ?? null,
            "address" => $validated["address"] ?? null,
            "receipt_header" => $validated["receipt_header"] ?? null,
            "receipt_footer" => $validated["receipt_footer"] ?? null,
            "tax_inclusive" => $validated["tax_inclusive"] ?? false,
            "default_tax_rate" => $validated["default_tax_rate"] ?? 0,
            "logo" => $logoPath,
        ]);

        return back()->with("success", "Pengaturan toko berhasil disimpan.");
    }
}
