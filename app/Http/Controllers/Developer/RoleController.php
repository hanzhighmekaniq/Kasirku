<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    /**
     * GET /developer/roles
     * Tampilkan semua role + permission per store.
     */
    public function index(Request $request)
    {
        $storeId = $request->query("store_id");

        $stores = Store::select("id", "code", "name", "store_type_id")
            ->with("storeType:id,code,label")
            ->where("is_active", true)
            ->orderBy("name")
            ->get()
            ->map(
                fn($s) => [
                    "id" => $s->id,
                    "code" => $s->code,
                    "name" => $s->name,
                    "store_type" => $s->getRelationValue("storeType")?->code,
                ],
            );

        $roles = [];
        $allPermissions = [];

        if ($storeId) {
            app(PermissionRegistrar::class)->setPermissionsTeamId(
                (int) $storeId,
            );

            // Ambil semua permissions global
            $allPermissions = Permission::select("id", "name")
                ->orderBy("name")
                ->get()
                ->map(
                    fn($p) => [
                        "id" => $p->id,
                        "name" => $p->name,
                        // Extract group dari nama permission (e.g. "purchase.create" → "purchase")
                        "group" => explode(".", $p->name)[0],
                    ],
                );

            // Ambil semua roles untuk store ini
            $roles = Role::with("permissions:id,name")
                ->where("store_id", (int) $storeId)
                ->orderBy("is_system", "desc")
                ->orderBy("name")
                ->get()
                ->map(
                    fn($r) => [
                        "id" => $r->id,
                        "name" => $r->name,
                        "description" => $r->description,
                        "is_system" => (bool) $r->is_system,
                        "permission_ids" => $r->permissions
                            ->pluck("id")
                            ->toArray(),
                        "permission_names" => $r->permissions
                            ->pluck("name")
                            ->toArray(),
                    ],
                );

            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        }

        $selectedStore = $storeId
            ? $stores->firstWhere("id", (int) $storeId)
            : null;

        return Inertia::render("Developer/Roles/Index", [
            "stores" => $stores,
            "selectedStore" => $selectedStore,
            "roles" => $roles,
            "allPermissions" => $allPermissions,
        ]);
    }

    /**
     * POST /developer/roles/update
     * Update permission untuk role tertentu.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            "store_id" => "required|integer|exists:stores,id",
            "role_id" => "required|integer|exists:roles,id",
            "permission_ids" => "array",
            "permission_ids.*" => "integer|exists:permissions,id",
        ]);

        $storeId = (int) $validated["store_id"];

        app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);

        $role = Role::where("store_id", $storeId)->findOrFail(
            $validated["role_id"],
        );

        $perms = Permission::whereIn(
            "id",
            $validated["permission_ids"] ?? [],
        )->get();
        $role->syncPermissions($perms);

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with(
            "success",
            "Permission untuk role \"{$role->name}\" berhasil diperbarui.",
        );
    }

    /**
     * POST /developer/roles/reset
     * Reset semua role di store ke default (dari StoreRoleService).
     */
    public function reset(Request $request)
    {
        $validated = $request->validate([
            "store_id" => "required|integer|exists:stores,id",
        ]);

        $storeId = (int) $validated["store_id"];

        \App\Services\StoreRoleService::createRolesForStore($storeId);

        return back()->with(
            "success",
            "Semua role untuk store telah di-reset ke default.",
        );
    }
}
