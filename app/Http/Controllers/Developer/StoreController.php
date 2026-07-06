<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

use App\Services\StoreRoleService;

class StoreController extends Controller
{
    public static function getStoreTypes(): array
    {
        return \App\Models\StoreType::codes();
    }

    /** Definisi paket langganan — sync dengan Store::planConfig() */
    public static function PLANS(): array
    {
        return \App\Models\Store::planConfig();
    }

    const PLAN_KEYS = ["free", "basic", "pro"];

    public function index()
    {
        $stores = Store::with(["storeType", "planModel"])
            ->withCount(["users", "branches", "sales"])
            ->orderByDesc("created_at")
            ->get()
            ->map(function ($store) {
                $storeTypeRelation = $store->getRelation("storeType");

                return [
                    "id" => $store->id,
                    "code" => $store->code,
                    "name" => $store->name,
                    "store_type" => $storeTypeRelation?->code,
                    "plan" => $store->planModel?->code,
                    "is_active" => $store->is_active,
                    "created_at" => $store->created_at,
                    "users_count" => $store->users_count,
                    "branches_count" => $store->branches_count,
                    "sales_count" => $store->sales_count,
                ];
            });

        // Ambil owner per toko (user dengan role "owner")
        $storeIds = $stores->pluck("id");
        $ownerMap = collect();
        if ($storeIds->isNotEmpty()) {
            $ownerMap = \Illuminate\Support\Facades\DB::table("users")
                ->join("user_store", "users.id", "=", "user_store.user_id")
                ->join("model_has_roles", function ($join) {
                    $join
                        ->on("users.id", "=", "model_has_roles.model_id")
                        ->where(
                            "model_has_roles.model_type",
                            \App\Models\User::class,
                        );
                })
                ->join("roles", "model_has_roles.role_id", "=", "roles.id")
                ->where("roles.name", "owner")
                ->whereIn("user_store.store_id", $storeIds)
                ->select(
                    "users.id",
                    "users.name",
                    "users.email",
                    "user_store.store_id",
                )
                ->get()
                ->groupBy("store_id");
        }

        // Merge owner ke data store
        $stores = $stores->map(function ($store) use ($ownerMap) {
            $ownersForStore = $ownerMap->get($store["id"]) ?? collect();
            return [
                ...$store,
                "owners" => $ownersForStore
                    ->map(
                        fn($o) => [
                            "id" => $o->id,
                            "name" => $o->name,
                            "email" => $o->email,
                        ],
                    )
                    ->values(),
                "has_owner" => $ownersForStore->isNotEmpty(),
            ];
        });

        $allStoreTypes = \App\Models\StoreType::orderBy("sort_order")->get([
            "id",
            "code",
            "label",
            "icon",
        ]);

        return Inertia::render("Developer/Stores/Index", [
            "stores" => $stores,
            "storeTypes" => $allStoreTypes,
        ]);
    }

    public function create()
    {
        // Semua user yang bisa di-assign sebagai owner
        $availableOwners = User::orderBy("name")
            ->get(["id", "name", "email"])
            ->map(
                fn($u) => [
                    "id" => $u->id,
                    "name" => $u->name,
                    "email" => $u->email,
                    "stores" => $u->stores()->pluck("name"),
                ],
            );

        // Ambil store types dengan features-nya
        $storeTypes = \App\Models\StoreType::with("features")
            ->where("is_active", true)
            ->orderBy("sort_order")
            ->get()
            ->map(function ($st) {
                return [
                    "id" => $st->id,
                    "code" => $st->code,
                    "label" => $st->label,
                    "icon" => $st->icon,
                    "features" => $st
                        ->features()
                        ->where("features.is_active", true)
                        ->orderBy("features.sort_order")
                        ->get([
                            "features.id",
                            "features.code",
                            "features.label",
                            "features.category",
                        ]),
                ];
            });

        return Inertia::render("Developer/Stores/Create", [
            "availableOwners" => $availableOwners,
            "storeTypes" => $storeTypes,
            "plans" => Store::allPlans(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "code" => "required|string|max:50|unique:stores,code",
            "name" => "required|string|max:255",
            "store_type_id" => ["required", "integer", "exists:store_types,id"],
            "phone" => "nullable|string|max:30",
            "email" => "nullable|email|unique:stores,email",
            "address" => "nullable|string",
            "is_active" => "boolean",
            // Branches wajib minimal 1
            "branches" => "required|array|min:1",
            "branches.*.code" => "required|string|max:50|distinct",
            "branches.*.name" => "required|string|max:255",
            "branches.*.phone" => "nullable|string|max:30",
            "branches.*.address" => "nullable|string",
            // Owner — bisa pilih existing atau buat baru
            "owner_ids" => "nullable|array",
            "owner_ids.*" => "exists:users,id",
            "new_owner.name" => "nullable|string|max:255",
            "new_owner.email" => "nullable|email|unique:users,email",
            "new_owner.password" => "nullable|string|min:6",
            "plan_id" => ["nullable", "integer", "exists:plans,id"],
        ]);

        DB::transaction(function () use ($validated) {
            // Resolve plan
            $planId = $validated["plan_id"] ?? null;

            // 1. Buat store (modules tidak perlu lagi, fitur diambil dari relasi)
            $store = Store::create([
                "code" => strtoupper($validated["code"]),
                "name" => $validated["name"],
                "store_type_id" => $validated["store_type_id"],
                "phone" => $validated["phone"] ?? null,
                "email" => $validated["email"] ?? null,
                "address" => $validated["address"] ?? null,
                "is_active" => $validated["is_active"] ?? true,
                "plan_id" => $planId,
                // max_users & max_branches null → ikut plan
                "max_users" => null,
                "max_branches" => null,
            ]);

            // 2. Buat branches
            foreach ($validated["branches"] as $b) {
                $store->branches()->create([
                    "code" => strtoupper($b["code"]),
                    "name" => $b["name"],
                    "phone" => $b["phone"] ?? null,
                    "address" => $b["address"] ?? null,
                    "is_active" => true,
                ]);
            }

            // 3. Buat semua role sistem untuk store ini
            StoreRoleService::createRolesForStore($store->id);

            // 4. Assign existing users sebagai owner
            if (!empty($validated["owner_ids"])) {
                foreach ($validated["owner_ids"] as $userId) {
                    $user = User::findOrFail($userId);
                    $store->users()->syncWithoutDetaching([$userId]);
                    $this->assignOwnerRole($user, $store->id);
                }
            }

            // 5. Buat owner baru jika diisi
            $no = $validated["new_owner"] ?? [];
            if (
                !empty($no["name"]) &&
                !empty($no["email"]) &&
                !empty($no["password"])
            ) {
                $newUser = User::create([
                    "name" => $no["name"],
                    "email" => $no["email"],
                    "password" => Hash::make($no["password"]),
                ]);
                $store->users()->syncWithoutDetaching([$newUser->id]);
                $this->assignOwnerRole($newUser, $store->id);
            }
        });

        return redirect()
            ->route("developer.stores.index")
            ->with("success", "Toko berhasil dibuat.");
    }

    public function show(Store $store)
    {
        $store->load(["branches", "storeType.features", "planModel.features"]);
        $store->loadCount(["branches", "employees"]);

        // Get the actual StoreType model bypassing the accessor
        $storeTypeRelation = $store->getRelation("storeType");
        $planModelRelation = $store->getRelation("planModel");

        // Fitur dari store type
        $storeTypeFeatures = $storeTypeRelation
            ? $storeTypeRelation
                ->features()
                ->where("features.is_active", true)
                ->orderBy("features.sort_order")
                ->get([
                    "features.id",
                    "features.code",
                    "features.label",
                    "features.category",
                ])
            : collect();

        // Fitur dari plan yang tersedia untuk toko ini
        $planFeatures = $planModelRelation
            ? $planModelRelation
                ->features()
                ->with("storeTypes:store_types.id,store_types.code")
                ->where("features.is_active", true)
                ->orderBy("features.sort_order")
                ->get([
                    "features.id",
                    "features.code",
                    "features.label",
                    "features.category",
                ])
            : collect();

        // Fitur yang benar-benar aktif (intersection dari store_type dan plan)
        $activeFeatures = $storeTypeFeatures
            ->filter(function ($storeTypeFeature) use ($planFeatures) {
                return $planFeatures->contains("code", $storeTypeFeature->code);
            })
            ->values();

        // Hanya owner di store ini (exclude developer, exclude tanpa role)
        $owners = $store
            ->users()
            ->where("is_developer", false)
            ->get()
            ->map(function (User $user) use ($store) {
                app(PermissionRegistrar::class)->setPermissionsTeamId(
                    $store->id,
                );
                $roles = $user->getRoleNames();
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);

                if ($roles->isEmpty()) {
                    return null;
                }

                return [
                    "id" => $user->id,
                    "name" => $user->name,
                    "email" => $user->email,
                    "roles" => $roles,
                ];
            })
            ->filter()
            ->values();

        // Semua user non-developer untuk dropdown assign owner
        $allUsers = User::where("is_developer", false)
            ->orderBy("name")
            ->get(["id", "name", "email"]);

        // Transform store data untuk frontend
        $storeData = [
            "id" => $store->id,
            "code" => $store->code,
            "name" => $store->name,
            "store_type" => $storeTypeRelation?->code,
            "store_type_id" => $store->store_type_id,
            "plan" => $planModelRelation?->code,
            "plan_id" => $store->plan_id,
            "plan_expires_at" => $store->plan_expires_at,
            "max_users" => $store->max_users,
            "max_branches" => $store->max_branches,
            "phone" => $store->phone,
            "email" => $store->email,
            "address" => $store->address,
            "is_active" => $store->is_active,
            "created_at" => $store->created_at,
            "updated_at" => $store->updated_at,
            "branches_count" => $store->branches_count,
            "employees_count" => $store->employees_count,
            "branches" => $store->branches,
            "storeType" => $storeTypeRelation,
            "planModel" => $planModelRelation,
        ];

        return Inertia::render("Developer/Stores/Show", [
            "store" => $storeData,
            "owners" => $owners,
            "allUsers" => $allUsers,
            "storeTypeFeatures" => $storeTypeFeatures,
            "planFeatures" => $planFeatures,
            "activeFeatures" => $activeFeatures,
        ]);
    }

    public function edit(Store $store)
    {
        $store->load([
            "planModel",
            "storeType",
            "storeType.features",
            "planModel.features",
        ]);
        $store->loadCount(["users", "branches", "sales"]);

        // Get the actual relations bypassing the accessor
        $storeTypeRelation = $store->getRelation("storeType");
        $planModelRelation = $store->getRelation("planModel");

        // Get available features for this store type
        $availableFeatures = $storeTypeRelation
            ? $storeTypeRelation
                ->features()
                ->where("features.is_active", true)
                ->orderBy("features.sort_order")
                ->get([
                    "features.id",
                    "features.code",
                    "features.label",
                    "features.category",
                ])
            : collect();

        // Transform store data untuk frontend
        $storeData = [
            "id" => $store->id,
            "code" => $store->code,
            "name" => $store->name,
            "store_type" => $storeTypeRelation?->code,
            "store_type_id" => $store->store_type_id,
            "plan" => $planModelRelation?->code,
            "plan_id" => $store->plan_id,
            "plan_expires_at" => $store->plan_expires_at,
            "max_users" => $store->max_users,
            "max_branches" => $store->max_branches,
            "phone" => $store->phone,
            "email" => $store->email,
            "address" => $store->address,
            "is_active" => $store->is_active,
            "created_at" => $store->created_at,
            "updated_at" => $store->updated_at,
            "users_count" => $store->users_count,
            "branches_count" => $store->branches_count,
            "sales_count" => $store->sales_count,
            "storeType" => $storeTypeRelation,
            "planModel" => $planModelRelation,
        ];

        return Inertia::render("Developer/Stores/Edit", [
            "store" => $storeData,
            "storeTypes" => \App\Models\StoreType::orderBy("sort_order")->get([
                "id",
                "code",
                "label",
                "icon",
            ]),
            "plans" => Store::allPlans(),
            "availableFeatures" => $availableFeatures,
        ]);
    }

    public function update(Request $request, Store $store)
    {
        $validated = $request->validate([
            "code" => [
                "required",
                "string",
                "max:50",
                Rule::unique("stores", "code")->ignore($store->id),
            ],
            "name" => "required|string|max:255",
            "store_type_id" => ["required", "integer", "exists:store_types,id"],
            "phone" => "nullable|string|max:30",
            "email" => [
                "nullable",
                "email",
                Rule::unique("stores", "email")->ignore($store->id),
            ],
            "address" => "nullable|string",
            "is_active" => "boolean",
            "plan_id" => ["nullable", "integer", "exists:plans,id"],
            "plan_expires_at" => "nullable|date",
            // Override manual per-toko (opsional, null = ikut plan)
            "max_users" => "nullable|integer|min:1",
            "max_branches" => "nullable|integer|min:1",
        ]);

        $store->update($validated);

        return redirect()
            ->route("developer.stores.show", $store->id)
            ->with("success", "Toko berhasil diperbarui.");
    }

    public function destroy(Store $store)
    {
        $store->loadCount(["sales", "purchases"]);
        if ($store->sales_count > 0) {
            return back()->withErrors([
                "store" =>
                    "Toko sudah memiliki data transaksi. Nonaktifkan saja jika tidak digunakan.",
            ]);
        }
        $store->delete();
        return redirect()
            ->route("developer.stores.index")
            ->with("success", "Toko berhasil dihapus.");
    }

    /** Assign user owner + Spatie role di store */
    public function assignOwner(Request $request, Store $store)
    {
        $validated = $request->validate([
            "user_id" => "required|exists:users,id",
        ]);

        $user = User::findOrFail($validated["user_id"]);
        $store->users()->syncWithoutDetaching([$user->id]);
        $this->assignOwnerRole($user, $store->id);

        return back()->with(
            "success",
            "User {$user->name} berhasil dijadikan owner toko ini.",
        );
    }

    /** Cabut owner dari store */
    public function revokeOwner(Request $request, Store $store)
    {
        $validated = $request->validate([
            "user_id" => "required|exists:users,id",
        ]);
        $user = User::findOrFail($validated["user_id"]);

        $store->users()->detach($user->id);

        // Hapus role owner di store ini
        DB::table("model_has_roles")
            ->where("model_id", $user->id)
            ->where("model_type", User::class)
            ->where("store_id", $store->id)
            ->delete();

        return back()->with("success", "Akses owner dicabut dari toko.");
    }

    private function assignOwnerRole(User $user, int $storeId): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
        // Hapus role lama di store ini dulu
        DB::table("model_has_roles")
            ->where("model_id", $user->id)
            ->where("model_type", User::class)
            ->where("store_id", $storeId)
            ->delete();
        $user->assignRole("owner");
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
    }

    public function typeFeatures()
    {
        // Ambil semua fitur aktif
        $allFeatures = \App\Models\Feature::where("is_active", true)
            ->orderBy("sort_order")
            ->get()
            ->map(function ($feature) {
                return [
                    "id" => $feature->id,
                    "code" => $feature->code,
                    "label" => $feature->label,
                    "category" => $feature->category,
                ];
            });

        // Ambil semua tipe toko dengan relasi features
        $storeTypes = \App\Models\StoreType::with("features")
            ->where("is_active", true)
            ->orderBy("sort_order")
            ->get();

        // Ambil kode tipe toko
        $types = $storeTypes->pluck("code")->toArray();

        // Build mapping: { retail: ['dashboard', 'basic_pos'], fnb: [...], ... }
        $mapping = [];
        foreach ($storeTypes as $storeType) {
            $mapping[$storeType->code] = $storeType->features
                ->where("is_active", true)
                ->pluck("code")
                ->toArray();
        }

        // Tambahkan allStoreTypes untuk info icon dan label
        $allStoreTypes = $storeTypes->map(function ($st) {
            return [
                "id" => $st->id,
                "code" => $st->code,
                "label" => $st->label,
                "icon" => $st->icon,
            ];
        });

        return Inertia::render("Developer/TypeFeatures/Index", [
            "types" => $types,
            "allFeatures" => $allFeatures,
            "mapping" => $mapping,
            "allStoreTypes" => $allStoreTypes,
        ]);
    }

    public function updateTypeFeatures(Request $request)
    {
        $validated = $request->validate([
            "features" => "present|array",
            "features.*.store_type" => "required|string",
            "features.*.feature_code" => "required|string|exists:features,code",
        ]);

        // Hapus semua mapping lama
        DB::table("store_type_feature")->delete();

        // Insert mapping baru
        if (!empty($validated["features"])) {
            // Ambil feature IDs by code
            $featureIds = \App\Models\Feature::whereIn(
                "code",
                array_column($validated["features"], "feature_code"),
            )->pluck("id", "code");

            // Ambil store type IDs by code
            $storeTypeIds = \App\Models\StoreType::whereIn(
                "code",
                array_column($validated["features"], "store_type"),
            )->pluck("id", "code");

            $inserts = [];
            foreach ($validated["features"] as $item) {
                $featureId = $featureIds[$item["feature_code"]] ?? null;
                $storeTypeId = $storeTypeIds[$item["store_type"]] ?? null;

                if ($featureId && $storeTypeId) {
                    $inserts[] = [
                        "store_type_id" => $storeTypeId,
                        "feature_id" => $featureId,
                        "created_at" => now(),
                        "updated_at" => now(),
                    ];
                }
            }

            if (!empty($inserts)) {
                DB::table("store_type_feature")->insert($inserts);
            }
        }

        return back()->with(
            "success",
            "Fitur per tipe toko berhasil disimpan.",
        );
    }
}
