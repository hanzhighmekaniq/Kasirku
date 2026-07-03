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

    /**
     * Modules default per tipe — loaded from features.applicable_types.
     */
    public static function defaultModulesForType(string $type): array
    {
        $features = \App\Models\Feature::where("is_active", true)
            ->whereNotNull("applicable_types")
            ->get()
            ->filter(fn($f) => in_array($type, $f->applicable_types ?? []))
            ->pluck("code")
            ->toArray();

        return [
            "pos_modes" => [$type],
            "features" => $features,
        ];
    }

    /** Hardcoded fallback — 6 mode strict */
    const DEFAULT_MODULES_FALLBACK = [
        "retail" => [
            "pos_modes" => ["retail"],
            "features" => [
                "stock",
                "purchase",
                "batch",
                "expiry",
                "promo",
                "sale_return",
                "report",
                "payment_gateway",
                "stock_opname",
            ],
        ],
        "fnb" => [
            "pos_modes" => ["fnb"],
            "features" => [
                "stock",
                "purchase",
                "recipe",
                "modifier",
                "table",
                "kitchen",
                "waste",
                "promo",
                "delivery",
                "booking",
                "sale_return",
                "report",
                "payment_gateway",
                "stock_opname",
            ],
        ],
        "service" => [
            "pos_modes" => ["service"],
            "features" => [
                "queue",
                "booking",
                "commission",
                "membership",
                "deposit",
                "promo",
                "report",
                "payment_gateway",
            ],
        ],
        "rental" => [
            "pos_modes" => ["rental"],
            "features" => [
                "stock",
                "purchase",
                "booking",
                "deposit",
                "report",
                "payment_gateway",
            ],
        ],
        "ticket" => [
            "pos_modes" => ["ticket"],
            "features" => ["booking", "promo", "report", "payment_gateway"],
        ],
        "hospitality" => [
            "pos_modes" => ["hospitality"],
            "features" => [
                "booking",
                "membership",
                "deposit",
                "report",
                "payment_gateway",
            ],
        ],
    ];

    /** @deprecated Use defaultModulesForType() instead */
    const DEFAULT_MODULES = self::DEFAULT_MODULES_FALLBACK;

    public function index()
    {
        $stores = Store::withCount(["users", "branches", "sales"])
            ->orderByDesc("created_at")
            ->get();

        return Inertia::render("Developer/Stores/Index", [
            "stores" => $stores,
            "storeTypes" => self::getStoreTypes(),
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

        return Inertia::render("Developer/Stores/Create", [
            "availableOwners" => $availableOwners,
            "storeTypes" => self::getStoreTypes(),
            "defaultModules" => self::DEFAULT_MODULES,
            "plans" => Store::allPlans(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "code" => "required|string|max:50|unique:stores,code",
            "name" => "required|string|max:255",
            "store_type" => ["required", Rule::in(self::getStoreTypes())],
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
            "plan" => ["nullable", "string", Rule::in(self::PLAN_KEYS)],
        ]);

        DB::transaction(function () use ($validated) {
            // 1. Buat store dengan modules default sesuai store_type
            $modules = self::defaultModulesForType($validated["store_type"]);
            $store = Store::create([
                "code" => strtoupper($validated["code"]),
                "name" => $validated["name"],
                "store_type" => $validated["store_type"],
                "modules" => $modules,
                "phone" => $validated["phone"] ?? null,
                "email" => $validated["email"] ?? null,
                "address" => $validated["address"] ?? null,
                "is_active" => $validated["is_active"] ?? true,
                "plan" => $validated["plan"] ?? "free",
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

            // 3. Assign existing users sebagai owner
            if (!empty($validated["owner_ids"])) {
                foreach ($validated["owner_ids"] as $userId) {
                    $user = User::findOrFail($userId);
                    $store->users()->syncWithoutDetaching([$userId]);
                    $this->assignOwnerRole($user, $store->id);
                }
            }

            // 4. Buat owner baru jika diisi
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
        $store->load(["branches", "users"]);
        $store->loadCount(["sales", "products", "employees"]);

        // Users dengan role mereka di store ini
        $usersWithRole = $store->users->map(function (User $user) use ($store) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            return [
                "id" => $user->id,
                "name" => $user->name,
                "email" => $user->email,
                "roles" => $user->getRoleNames(),
            ];
        });
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        return Inertia::render("Developer/Stores/Show", [
            "store" => $store,
            "usersWithRole" => $usersWithRole,
            "allUsers" => User::orderBy("name")->get(["id", "name", "email"]),
            "plans" => collect(\App\Models\Store::planConfig())
                ->map(
                    fn($p, $k) => array_merge($p, [
                        "key" => $k,
                        "color" => match ($k) {
                            "free" => "bg-slate-100 text-slate-600",
                            "basic" => "bg-blue-100 text-blue-700",
                            "pro" => "bg-indigo-100 text-indigo-700",
                            default => "bg-slate-100 text-slate-600",
                        },
                    ]),
                )
                ->toArray(),
            "defaultModules" => self::DEFAULT_MODULES,
            "allFeatures" => $this->allFeaturesList(),
        ]);
    }

    /** Semua fitur yang bisa diaktifkan/nonaktifkan per store — 6 mode strict */
    private function allFeaturesList(): array
    {
        return [
            [
                "key" => "stock",
                "label" => "Manajemen Stok",
                "modes" => ["retail", "fnb", "rental"],
            ],
            [
                "key" => "purchase",
                "label" => "Pembelian",
                "modes" => ["retail", "fnb", "rental"],
            ],
            [
                "key" => "batch",
                "label" => "Batch & Expired",
                "modes" => ["retail", "fnb"],
            ],
            [
                "key" => "expiry",
                "label" => "Pantau Kedaluwarsa",
                "modes" => ["retail", "fnb"],
            ],
            [
                "key" => "recipe",
                "label" => "Resep Bahan Baku",
                "modes" => ["fnb"],
            ],
            [
                "key" => "modifier",
                "label" => "Modifier / Topping",
                "modes" => ["fnb"],
            ],
            [
                "key" => "table",
                "label" => "Manajemen Meja",
                "modes" => ["fnb", "hospitality"],
            ],
            [
                "key" => "kitchen",
                "label" => "Kitchen Display",
                "modes" => ["fnb"],
            ],
            [
                "key" => "waste",
                "label" => "Waste / Pemborosan",
                "modes" => ["fnb"],
            ],
            [
                "key" => "promo",
                "label" => "Promo & Diskon",
                "modes" => ["retail", "fnb", "service", "ticket"],
            ],
            ["key" => "delivery", "label" => "Delivery", "modes" => ["fnb"]],
            ["key" => "queue", "label" => "Antrian", "modes" => ["service"]],
            [
                "key" => "booking",
                "label" => "Booking / Reservasi",
                "modes" => [
                    "fnb",
                    "service",
                    "rental",
                    "ticket",
                    "hospitality",
                ],
            ],
            [
                "key" => "commission",
                "label" => "Komisi Karyawan",
                "modes" => ["service"],
            ],
            [
                "key" => "membership",
                "label" => "Membership",
                "modes" => ["service", "hospitality"],
            ],
            [
                "key" => "deposit",
                "label" => "Deposit Pelanggan",
                "modes" => ["service", "rental", "hospitality"],
            ],
            [
                "key" => "sale_return",
                "label" => "Retur Penjualan",
                "modes" => ["retail", "fnb"],
            ],
            [
                "key" => "stock_opname",
                "label" => "Opname Stok",
                "modes" => ["retail", "fnb"],
            ],
            ["key" => "report", "label" => "Laporan", "modes" => ["*"]],
            [
                "key" => "payment_gateway",
                "label" => "Payment Gateway",
                "modes" => ["*"],
            ],
        ];
    }

    public function edit(Store $store)
    {
        $store->loadCount(["users", "branches", "sales"]);

        return Inertia::render("Developer/Stores/Edit", [
            "store" => $store,
            "storeTypes" => self::getStoreTypes(),
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
            "store_type" => ["required", Rule::in(self::getStoreTypes())],
            "phone" => "nullable|string|max:30",
            "email" => [
                "nullable",
                "email",
                Rule::unique("stores", "email")->ignore($store->id),
            ],
            "address" => "nullable|string",
            "is_active" => "boolean",
            "modules" => "nullable|array",
            "plan" => [
                "nullable",
                Rule::in(array_keys(\App\Models\Store::planConfig())),
            ],
            "plan_expires_at" => "nullable|date",
            "max_users" => "nullable|integer|min:1",
            "max_branches" => "nullable|integer|min:1",
        ]);

        // Kalau store_type berubah, update modules ke default tipe baru (kecuali modules sudah dikirim)
        if (
            $validated["store_type"] !== $store->store_type &&
            empty($validated["modules"])
        ) {
            $validated["modules"] =
                self::DEFAULT_MODULES[$validated["store_type"]] ?? null;
        }

        // Kalau plan berubah, update max_users & max_branches sesuai plan (kecuali di-override manual)
        if (!empty($validated["plan"])) {
            $planConfig = self::PLANS()[$validated["plan"]];
            if (empty($validated["max_users"])) {
                $validated["max_users"] = $planConfig["max_users"];
            }
            if (empty($validated["max_branches"])) {
                $validated["max_branches"] = $planConfig["max_branches"];
            }
        }

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
        $allFeatures = \App\Models\Feature::where("is_active", true)
            ->orderBy("sort_order")
            ->get(["code", "label", "category"]);

        $mapping = [];
        foreach (self::getStoreTypes() as $type) {
            $mapping[$type] = \App\Models\Feature::where("is_active", true)
                ->whereNotNull("applicable_types")
                ->get()
                ->filter(fn($f) => in_array($type, $f->applicable_types ?? []))
                ->pluck("code")
                ->toArray();
        }

        return Inertia::render("Developer/TypeFeatures/Index", [
            "types" => self::getStoreTypes(),
            "allFeatures" => $allFeatures,
            "mapping" => $mapping,
        ]);
    }

    public function updateTypeFeatures(Request $request)
    {
        $validated = $request->validate([
            "features" => "required|array",
            "features.*.store_type" =>
                "required|string|in:" . implode(",", self::getStoreTypes()),
            "features.*.feature_code" => "required|string",
        ]);

        // Reset all applicable_types
        \App\Models\Feature::query()->update(["applicable_types" => null]);

        // Build new mapping
        $typeFeatures = [];
        foreach ($validated["features"] as $item) {
            $typeFeatures[$item["feature_code"]][] = $item["store_type"];
        }

        foreach ($typeFeatures as $featureCode => $types) {
            \App\Models\Feature::where("code", $featureCode)->update([
                "applicable_types" => $types,
            ]);
        }

        return back()->with(
            "success",
            "Fitur per tipe toko berhasil disimpan.",
        );
    }
}
