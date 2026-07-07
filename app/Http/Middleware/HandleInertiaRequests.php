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
                    fn() => $user && !$user->isDeveloper()
                        ? $user->canSwitchBranch()
                        : false,
                    false,
                    false,
                ),
            ],

            "currentStore" => fn() => rescue(
                fn() => $storeId
                    ? Store::with("storeType")->find($storeId, [
                        "id",
                        "name",
                        "code",
                        "store_type_id",
                        "logo",
                    ])
                    : null,
                null,
                false,
            ),
            "storeTypeFeatures" => fn() => rescue(
                function () use ($storeId) {
                    if (!$storeId) {
                        return [];
                    }
                    $store = \App\Models\Store::with(
                        "storeType.features",
                    )->find($storeId);
                    if (!$store || !$store->getRelationValue("storeType")) {
                        return [];
                    }

                    return $store
                        ->getRelationValue("storeType")
                        ->features->where("is_active", true)
                        ->pluck("code")
                        ->toArray();
                },
                [],
                false,
            ),
            "storeTypeFeatureDetails" => fn() => rescue(
                function () use ($storeId) {
                    if (!$storeId) {
                        return [];
                    }
                    $store = \App\Models\Store::with(
                        "storeType.features",
                    )->find($storeId);
                    $storeType = $store?->getRelationValue("storeType");
                    if (!$storeType) {
                        return [];
                    }

                    $featureIds = $storeType->features
                        ->where("is_active", true)
                        ->pluck("id")
                        ->toArray();

                    if (empty($featureIds)) {
                        return [];
                    }

                    return \App\Models\FeatureDetail::whereIn(
                        "feature_id",
                        $featureIds,
                    )
                        ->where("is_active", true)
                        ->pluck("code")
                        ->toArray();
                },
                [],
                false,
            ),

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
                    ->with("storeType")
                    ->select(
                        "stores.id",
                        "stores.name",
                        "stores.code",
                        "stores.store_type_id",
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
                // Diisi middleware CheckFeatureAccess ketika store type tidak support fitur
                "typeBlock" => fn() => $request->session()->get("typeBlock"),
            ],
        ];
    }

    private function getStorePlan(int $storeId): ?array
    {
        $store = Store::with("planModel.features")->find($storeId);
        if (!$store) {
            return null;
        }

        $planCode = $store->effectivePlanCode();
        $planModel = $store->planModel;
        $maxUsers = $store->effectiveMaxUsers();
        $maxBranches = $store->effectiveMaxBranches();

        // Fitur dari plan_id (DB) — fallback ke hardcoded
        $featureCodes = $planModel ? $planModel->featureCodes() : [];

        if (!empty($featureCodes)) {
            $label = $planModel->label;
            // Ambil detail codes dari features yang sudah eager-loaded
            $featureIds = $planModel->features
                ->where("is_active", true)
                ->pluck("id")
                ->toArray();
            $featureDetails = !empty($featureIds)
                ? \App\Models\FeatureDetail::whereIn("feature_id", $featureIds)
                    ->where("is_active", true)
                    ->pluck("code")
                    ->toArray()
                : [];
        } else {
            // Fallback hardcoded (kalau pivot kosong atau plan_id null).
            // planConfig() kini selalu punya key "features".
            $planConfig =
                \App\Models\Store::planConfig()[$planCode] ??
                \App\Models\Store::planConfig()["free"];
            $featureCodes = $planConfig["features"] ?? [];
            $label = $planConfig["label"];
            $featureDetails = [];
        }

        return [
            "plan" => $planCode,
            "plan_id" => $store->plan_id,
            "label" => $label,
            "features" => $featureCodes,
            "feature_details" => $featureDetails,
            "max_users" => $maxUsers,
            "max_branches" => $maxBranches,
            "expires_at" => $store->plan_expires_at,
            "is_expired" => $store->isPlanExpired(),
            "can_add_user" => $store->canAddUser(),
            "can_add_branch" => $store->canAddBranch(),
        ];
    }
}
