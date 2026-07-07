<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with("stores.storeType")
            ->when(
                $request->search,
                fn($q, $s) => $q
                    ->where("name", "like", "%{$s}%")
                    ->orWhere("email", "like", "%{$s}%"),
            )
            ->orderByDesc("created_at")
            ->get()
            ->map(
                fn(User $u) => [
                    "id" => $u->id,
                    "name" => $u->name,
                    "email" => $u->email,
                    "stores" => $u->stores->map(function ($store) {
                        return [
                            "id" => $store->id,
                            "name" => $store->name,
                            "code" => $store->code,
                            "store_type" => $store->getRelation('storeType')?->code,
                            "store_type_id" => $store->store_type_id,
                        ];
                    }),
                    "created_at" => $u->created_at,
                    // Ambil role global (developer) atau per store
                    "is_developer" => $u->hasRole("developer"),
                ],
            );

        $stores = Store::with("storeType")
            ->orderBy("name")
            ->get()
            ->map(function ($store) {
                return [
                    "id" => $store->id,
                    "name" => $store->name,
                    "code" => $store->code,
                    "store_type" => $store->getRelation('storeType')?->code,
                    "store_type_id" => $store->store_type_id,
                ];
            });

        return Inertia::render("Developer/Users/Index", [
            "users" => $users,
            "stores" => $stores,
        ]);
    }

    public function show(User $user)
    {
        $user->load(["stores.storeType.features", "stores.planModel.features"]);

        // Semua fitur di sistem
        $allFeatures = \App\Models\Feature::with("storeTypes")
            ->where("is_active", true)
            ->orderBy("sort_order")
            ->get(["id", "code", "label", "category"]);

        // Data per toko: role, permissions, fitur tersedia (plan + type)
        $storeAccess = $user->stores->map(function (
            \App\Models\Store $store,
        ) use ($user, $allFeatures) {
            // Role user di store ini
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            $roles = $user->getRoleNames()->values();

            // Permissions user di store ini
            $roleIds = DB::table("model_has_roles")
                ->where("model_id", $user->id)
                ->where("model_type", get_class($user))
                ->where("store_id", $store->id)
                ->pluck("role_id");

            $permissions = DB::table("permissions")
                ->join(
                    "role_has_permissions",
                    "permissions.id",
                    "=",
                    "role_has_permissions.permission_id",
                )
                ->whereIn("role_has_permissions.role_id", $roleIds)
                ->distinct()
                ->pluck("permissions.name")
                ->values()
                ->toArray();

            app(PermissionRegistrar::class)->setPermissionsTeamId(null);

            // Fitur dari plan toko
            $planFeatureCodes = $store->planModel
                ? $store->planModel->features->pluck("code")->toArray()
                : [];
            $planAllAll = empty($planFeatureCodes); // plan tanpa fitur = pro = semua

            // Fitur dari relasi store_type_feature (tipe toko)
            $storeType = $store->getRelationValue("storeType");
            $typeFeatureCodes = $storeType
                ? $storeType->features->pluck("code")->toArray()
                : [];

            // Status per fitur: plan_ok, type_ok → can_access
            $featureStatus = $allFeatures
                ->map(function ($f) use (
                    $planFeatureCodes,
                    $planAllAll,
                    $typeFeatureCodes,
                ) {
                    $planOk =
                        $planAllAll || in_array($f->code, $planFeatureCodes);
                    $typeOk = in_array($f->code, $typeFeatureCodes);
                    return [
                        "code" => $f->code,
                        "label" => $f->label,
                        "category" => $f->category,
                        "plan_ok" => $planOk,
                        "type_ok" => $typeOk,
                        "can_access" => $planOk && $typeOk,
                    ];
                })
                ->values();

            return [
                "store_id" => $store->id,
                "store_name" => $store->name,
                "store_code" => $store->code,
                "store_type" => $store->getRelation('storeType')?->code,
                "plan_label" =>
                    $store->planModel?->label ?? ($store->plan ?? "Free"),
                "plan_code" =>
                    $store->planModel?->code ?? ($store->plan ?? "free"),
                "roles" => $roles,
                "permissions" => $permissions,
                "feature_status" => $featureStatus,
            ];
        });

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        // Transform user data
        $userData = [
            "id" => $user->id,
            "name" => $user->name,
            "email" => $user->email,
            "is_developer" => $user->is_developer,
            "created_at" => $user->created_at,
            "updated_at" => $user->updated_at,
            "stores" => $user->stores->map(function ($store) {
                return [
                    "id" => $store->id,
                    "name" => $store->name,
                    "code" => $store->code,
                    "store_type" => $store->getRelation('storeType')?->code,
                ];
            }),
        ];

        return Inertia::render("Developer/Users/Show", [
            "user" => $userData,
            "storeAccess" => $storeAccess,
            "allFeatures" => $allFeatures,
        ]);
    }

    public function create()
    {
        $stores = Store::with("storeType")
            ->orderBy("name")
            ->get()
            ->map(function ($store) {
                return [
                    "id" => $store->id,
                    "name" => $store->name,
                    "code" => $store->code,
                    "store_type" => $store->getRelation('storeType')?->code,
                    "store_type_id" => $store->store_type_id,
                ];
            });

        return Inertia::render("Developer/Users/Create", [
            "stores" => $stores,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "email" => "required|email|unique:users,email",
            "password" => "required|string|min:6|confirmed",
            "is_developer" => "boolean",
            // store_roles: [{ store_id: 1, role: 'owner' }, ...]
            "store_roles" => "nullable|array",
            "store_roles.*.store_id" => "required|exists:stores,id",
            "store_roles.*.role" => "required|string",
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                "name" => $validated["name"],
                "email" => $validated["email"],
                "password" => Hash::make($validated["password"]),
                "is_developer" => !empty($validated["is_developer"]),
            ]);

            // Assign developer role (global, semua store)
            if (!empty($validated["is_developer"])) {
                $stores = Store::pluck("id");
                foreach ($stores as $sid) {
                    app(PermissionRegistrar::class)->setPermissionsTeamId($sid);
                    $user->assignRole("developer");
                }
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }

            // Assign role per store
            foreach ($validated["store_roles"] ?? [] as $sr) {
                $store = Store::findOrFail($sr["store_id"]);
                $store->users()->syncWithoutDetaching([$user->id]);
                app(PermissionRegistrar::class)->setPermissionsTeamId(
                    $sr["store_id"],
                );
                $user->assignRole($sr["role"]);
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        });

        return redirect()
            ->route("developer.users.index")
            ->with("success", "User berhasil dibuat.");
    }

    public function edit(User $user)
    {
        $user->load("stores.storeType");

        // Role per store
        $storeRoles = $user->stores->map(function (Store $store) use ($user) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            $roles = $user->getRoleNames()->values()->first() ?? "";
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            return ["store_id" => $store->id, "role" => $roles];
        });

        $userData = [
            "id" => $user->id,
            "name" => $user->name,
            "email" => $user->email,
            "is_developer" => $user->is_developer,
            "created_at" => $user->created_at,
            "stores" => $user->stores->map(function ($store) {
                return [
                    "id" => $store->id,
                    "name" => $store->name,
                    "code" => $store->code,
                    "store_type" => $store->getRelation('storeType')?->code,
                ];
            }),
        ];

        $stores = Store::with("storeType")
            ->orderBy("name")
            ->get()
            ->map(function ($store) {
                return [
                    "id" => $store->id,
                    "name" => $store->name,
                    "code" => $store->code,
                    "store_type" => $store->getRelation('storeType')?->code,
                    "store_type_id" => $store->store_type_id,
                ];
            });

        return Inertia::render("Developer/Users/Edit", [
            "user" => $userData,
            "stores" => $stores,
            "storeRoles" => $storeRoles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "email" => [
                "required",
                "email",
                Rule::unique("users", "email")->ignore($user->id),
            ],
            "password" => "nullable|string|min:6|confirmed",
            "is_developer" => "boolean",
            "store_roles" => "nullable|array",
            "store_roles.*.store_id" => "required|exists:stores,id",
            "store_roles.*.role" => "required|string",
        ]);

        DB::transaction(function () use ($validated, $user) {
            $data = [
                "name" => $validated["name"],
                "email" => $validated["email"],
                "is_developer" => !empty($validated["is_developer"]),
            ];
            if (!empty($validated["password"])) {
                $data["password"] = Hash::make($validated["password"]);
            }
            $user->update($data);

            // Hapus semua role & store lama
            DB::table("model_has_roles")
                ->where("model_id", $user->id)
                ->where("model_type", User::class)
                ->delete();
            $user->stores()->detach();

            // Developer role
            if (!empty($validated["is_developer"])) {
                $stores = Store::pluck("id");
                foreach ($stores as $sid) {
                    app(PermissionRegistrar::class)->setPermissionsTeamId($sid);
                    $user->assignRole("developer");
                }
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }

            // Store roles baru
            foreach ($validated["store_roles"] ?? [] as $sr) {
                $store = Store::findOrFail($sr["store_id"]);
                $store->users()->syncWithoutDetaching([$user->id]);
                app(PermissionRegistrar::class)->setPermissionsTeamId(
                    $sr["store_id"],
                );
                $user->assignRole($sr["role"]);
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        });

        return redirect()
            ->route("developer.users.index")
            ->with("success", "User berhasil diperbarui.");
    }

    public function destroy(User $user)
    {
        DB::table("model_has_roles")
            ->where("model_id", $user->id)
            ->where("model_type", User::class)
            ->delete();
        $user->stores()->detach();
        $user->delete();

        return redirect()
            ->route("developer.users.index")
            ->with("success", "User berhasil dihapus.");
    }

    /** AJAX: get branches by store */
    public function branches(Store $store)
    {
        return response()->json(
            $store
                ->branches()
                ->where("is_active", true)
                ->get(["id", "name", "code"]),
        );
    }
}
