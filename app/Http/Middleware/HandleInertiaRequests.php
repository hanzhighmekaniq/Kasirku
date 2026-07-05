<?php

namespace App\Http\Middleware;

use App\Models\Branch;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = "app";

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Ambil semua permission user via roles di store aktif.
     * Query manual untuk menghindari ambiguous column 'id' bug Spatie teams.
     */
    private function getUserPermissions(?object $user, ?int $storeId): array
    {
        if (!$user || !$storeId) {
            return [];
        }

        try {
            // Ambil role_id yang dimiliki user di store ini
            $roleIds = \Illuminate\Support\Facades\DB::table("model_has_roles")
                ->where("model_id", $user->id)
                ->where("model_type", get_class($user))
                ->where("store_id", $storeId)
                ->pluck("role_id");

            if ($roleIds->isEmpty()) {
                return [];
            }

            // Ambil permission dari role tersebut
            return \Illuminate\Support\Facades\DB::table("permissions")
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
        } catch (\Throwable) {
            return [];
        }
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $storeId = $request->session()->get("current_store_id");
        $branchId =
            $request->session()->get("current_branch_id") ??
            $request->session()->get("branch_id");

        return [
            ...parent::share($request),

            "auth" => [
                "user" => $user
                    ? [
                        "id" => $user->id,
                        "name" => $user->name,
                        "email" => $user->email,
                    ]
                    : null,

                "role" => fn() => rescue(
                    function () use ($user, $storeId) {
                        if (!$user || !$storeId) {
                            return "";
                        }
                        app(
                            \Spatie\Permission\PermissionRegistrar::class,
                        )->setPermissionsTeamId($storeId);
                        return $user->getRoleNames()->first() ?? "";
                    },
                    $user?->role ?? "",
                    false,
                ),

                "permissions" => fn() => rescue(
                    fn() => $this->getUserPermissions($user, $storeId),
                    [],
                    false,
                ),
                "isDeveloper" => fn() => $user?->isDeveloper() ?? false,
                // Apakah user boleh ganti toko/cabang (owner, admin, supervisor)
                // Karyawan biasa (kasir, gudang) false → switcher disembunyikan
                "canSwitch" => fn() => rescue(
                    fn() => $user && !$user->isDeveloper() ? $user->canSwitchBranch() : false,
                    false,
                    false,
                ),
            ],

            "currentStore" => fn() => rescue(
                fn() => $storeId
                    ? Store::find($storeId, [
                        "id",
                        "name",
                        "code",
                        "store_type",
                        "modules",
                        "logo",
                    ])
                    : null,
                null,
                false,
            ),
            "storeTypeFeatures" => function () use ($storeId) {
                if (!$storeId) {
                    return [];
                }
                $store = \App\Models\Store::find($storeId);
                if (!$store) {
                    return [];
                }
                return \App\Models\Feature::where("is_active", true)
                    ->whereNotNull("applicable_types")
                    ->get()
                    ->filter(
                        fn($f) => in_array(
                            $store->store_type,
                            $f->applicable_types ?? [],
                        ),
                    )
                    ->pluck("code")
                    ->toArray();
            },

            "allStoreTypes" => function () {
                return \App\Models\StoreType::active();
            },

            "storePlan" => fn() => rescue(
                function () use ($storeId) {
                    return $storeId ? $this->getStorePlan($storeId) : null;
                },
                null,
                false,
            ),
            "userStores" => fn() => rescue(
                fn() => $user
                    ?->stores()
                    ->select(
                        "stores.id",
                        "stores.name",
                        "stores.code",
                        "stores.store_type",
                        "stores.logo",
                    )
                    ->get() ?? collect(),
                collect(),
                false,
            ),
            "currentBranch" => fn() => $branchId
                ? rescue(
                    fn() => Branch::find($branchId, ["id", "name", "code"]),
                    null,
                    false,
                )
                : null,
            "branches" => fn() => rescue(
                fn() => $storeId
                    ? Branch::where("store_id", $storeId)
                        ->where("is_active", true)
                        ->get(["id", "name", "code"])
                    : collect(),
                collect(),
                false,
            ),

            "flash" => [
                "success" => fn() => $request->session()->get("success"),
                "error" => fn() => $request->session()->get("error"),
                "warning" => fn() => $request->session()->get("warning"),
                "info" => fn() => $request->session()->get("info"),
            ],
        ];
    }

    private function getStorePlan(int $storeId): ?array
    {
        $store = Store::find($storeId);
        if (!$store) {
            return null;
        }
        $planKey = $store->effectivePlan();
        $planConfig =
            \App\Models\Store::planConfig()[$planKey] ??
            \App\Models\Store::planConfig()["free"];
        return [
            "plan" => $planKey,
            "label" => $planConfig["label"],
            "features" => $planConfig["features"],
            "max_users" => $store->max_users ?? $planConfig["max_users"],
            "max_branches" =>
                $store->max_branches ?? $planConfig["max_branches"],
            "expires_at" => $store->plan_expires_at,
            "is_expired" => $store->isPlanExpired(),
            "can_add_user" => $store->canAddUser(),
            "can_add_branch" => $store->canAddBranch(),
        ];
    }
}
