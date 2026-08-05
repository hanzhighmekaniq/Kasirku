<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\CustomerTier;
use App\Models\DeveloperActionLog;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\PlanSubscription;
use App\Models\Store;
use App\Models\StoreNote;
use App\Models\StoreSuspension;
use App\Models\StoreType;
use App\Models\User;
use App\Notifications\StoreSuspended;
use App\Services\StoreRoleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class StoreController extends Controller
{
    public static function getStoreTypes(): array
    {
        return StoreType::codes();
    }

    public function index()
    {
        $stores = Store::with(['storeType', 'planModel'])
            ->withCount(['users', 'branches', 'sales'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($store) {
                $storeTypeRelation = $store->getRelation('storeType');

                return [
                    'id' => $store->id,
                    'code' => $store->code,
                    'name' => $store->name,
                    'store_type' => $storeTypeRelation?->code,
                    'plan' => $store->planModel?->code,
                    'is_active' => $store->is_active,
                    'created_at' => $store->created_at,
                    'users_count' => $store->users_count,
                    'branches_count' => $store->branches_count,
                    'sales_count' => $store->sales_count,
                ];
            });

        // Ambil owner per toko (user dengan role "owner")
        $storeIds = $stores->pluck('id');
        $ownerMap = collect();
        if ($storeIds->isNotEmpty()) {
            $ownerMap = DB::table('users')
                ->join('user_store', 'users.id', '=', 'user_store.user_id')
                ->join('model_has_roles', function ($join) {
                    $join
                        ->on('users.id', '=', 'model_has_roles.model_id')
                        ->where(
                            'model_has_roles.model_type',
                            User::class,
                        );
                })
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('roles.name', 'owner')
                ->whereIn('user_store.store_id', $storeIds)
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'user_store.store_id',
                )
                ->get()
                ->groupBy('store_id');
        }

        // Merge owner ke data store
        $stores = $stores->map(function ($store) use ($ownerMap) {
            $ownersForStore = $ownerMap->get($store['id']) ?? collect();

            return [
                ...$store,
                'owners' => $ownersForStore
                    ->map(
                        fn ($o) => [
                            'id' => $o->id,
                            'name' => $o->name,
                            'email' => $o->email,
                        ],
                    )
                    ->values(),
                'has_owner' => $ownersForStore->isNotEmpty(),
            ];
        });

        $allStoreTypes = StoreType::orderBy('sort_order')->get([
            'id',
            'code',
            'label',
            'icon',
        ]);

        return Inertia::render('Developer/Stores/Index', [
            'stores' => $stores,
            'storeTypes' => $allStoreTypes,
        ]);
    }

    public function create()
    {
        // Semua user yang bisa di-assign sebagai owner
        $availableOwners = User::orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(
                fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'stores' => $u->stores()->pluck('name'),
                ],
            );

        // Ambil store types dengan features-nya
        $storeTypes = StoreType::with('features')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($st) {
                return [
                    'id' => $st->id,
                    'code' => $st->code,
                    'label' => $st->label,
                    'icon' => $st->icon,
                    'features' => $st
                        ->features()
                        ->where('features.is_active', true)
                        ->orderBy('features.sort_order')
                        ->get([
                            'features.id',
                            'features.code',
                            'features.label',
                            'features.category',
                        ]),
                ];
            });

        return Inertia::render('Developer/Stores/Create', [
            'availableOwners' => $availableOwners,
            'storeTypes' => $storeTypes,
            'plans' => Store::allPlans(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:stores,code',
            'name' => 'required|string|max:255',
            'store_type_id' => ['required', 'integer', 'exists:store_types,id'],
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|unique:stores,email',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            // Branches wajib minimal 1
            'branches' => 'required|array|min:1',
            'branches.*.code' => 'required|string|max:50|distinct',
            'branches.*.name' => 'required|string|max:255',
            'branches.*.phone' => 'nullable|string|max:30',
            'branches.*.address' => 'nullable|string',
            // Owner — bisa pilih existing atau buat baru
            'owner_ids' => 'nullable|array',
            'owner_ids.*' => 'exists:users,id',
            'new_owner.name' => 'nullable|string|max:255',
            'new_owner.email' => 'nullable|email|unique:users,email',
            'new_owner.password' => 'nullable|string|min:6',
            'plan_id' => ['nullable', 'integer', 'exists:plans,id'],
        ]);

        DB::transaction(function () use ($validated) {
            // 1. Buat store (modules tidak perlu lagi, fitur diambil dari relasi)
            $store = Store::create([
                'code' => strtoupper($validated['code']),
                'name' => $validated['name'],
                'store_type_id' => $validated['store_type_id'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'address' => $validated['address'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                // max_users & max_branches null → ikut plan
                'max_users' => null,
                'max_branches' => null,
            ]);

            // 2. Buat branches
            foreach ($validated['branches'] as $b) {
                $store->branches()->create([
                    'code' => strtoupper($b['code']),
                    'name' => $b['name'],
                    'phone' => $b['phone'] ?? null,
                    'address' => $b['address'] ?? null,
                    'is_active' => true,
                ]);
            }

            // 3. Buat semua role sistem untuk store ini
            StoreRoleService::createRolesForStore($store->id);

            // 4. Assign existing users sebagai owner
            if (! empty($validated['owner_ids'])) {
                foreach ($validated['owner_ids'] as $userId) {
                    $user = User::findOrFail($userId);
                    $store->users()->syncWithoutDetaching([$userId]);
                    $this->assignOwnerRole($user, $store->id);
                }
            }

            // 5. Buat owner baru jika diisi
            $no = $validated['new_owner'] ?? [];
            if (
                ! empty($no['name']) &&
                ! empty($no['email']) &&
                ! empty($no['password'])
            ) {
                $newUser = User::create([
                    'name' => $no['name'],
                    'email' => $no['email'],
                    'password' => Hash::make($no['password']),
                    'plan_id' => $validated['plan_id'] ?? null,
                ]);
                $store->users()->syncWithoutDetaching([$newUser->id]);
                $this->assignOwnerRole($newUser, $store->id);
            }

            // 6. Auto-seed metode pembayaran wajib (Tunai + Hutang/Kasbon)
            $store->paymentMethods()->create([
                'code' => 'CASH_'.$store->id,
                'name' => 'Tunai',
                'type' => 'cash',
                'is_active' => true,
                'sort_order' => 0,
            ]);
            $store->paymentMethods()->create([
                'code' => 'DEBT_'.$store->id,
                'name' => 'Hutang / Kasbon',
                'type' => 'debt',
                'is_active' => true,
                'sort_order' => 1,
            ]);

            // 7. Tier bawaan
            CustomerTier::seedDefaultsForStore($store->id);

            DeveloperActionLog::record('store.create', $store, null, $store->only([
                'code', 'name', 'store_type_id', 'is_active',
            ]));
        });

        return redirect()
            ->route('developer.stores.index')
            ->with('success', 'Toko berhasil dibuat.');
    }

    public function show(Store $store)
    {
        $store->load(['branches', 'storeType.features', 'planModel.features']);
        $store->loadCount(['branches', 'employees']);

        // Get the actual StoreType model bypassing the accessor
        $storeTypeRelation = $store->getRelation('storeType');
        $planModelRelation = $store->getRelation('planModel');

        // Fitur dari store type
        $storeTypeFeatures = $storeTypeRelation
            ? $storeTypeRelation
                ->features()
                ->where('features.is_active', true)
                ->orderBy('features.sort_order')
                ->get([
                    'features.id',
                    'features.code',
                    'features.label',
                    'features.category',
                ])
            : collect();

        // Fitur dari plan yang tersedia untuk toko ini
        $planFeatures = $planModelRelation
            ? $planModelRelation
                ->features()
                ->with('storeTypes:store_types.id,store_types.code')
                ->where('features.is_active', true)
                ->orderBy('features.sort_order')
                ->get([
                    'features.id',
                    'features.code',
                    'features.label',
                    'features.category',
                ])
            : collect();

        // Fitur yang benar-benar aktif (intersection dari store_type dan plan)
        $activeFeatures = $storeTypeFeatures
            ->filter(function ($storeTypeFeature) use ($planFeatures) {
                return $planFeatures->contains('code', $storeTypeFeature->code);
            })
            ->values();

        // Hanya owner di store ini (exclude developer, exclude tanpa role)
        $owners = $store
            ->users()
            ->where('is_developer', false)
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
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $roles,
                ];
            })
            ->filter()
            ->values();

        // Semua user non-developer untuk dropdown assign owner
        $allUsers = User::where('is_developer', false)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        // Transform store data untuk frontend
        $storeData = [
            'id' => $store->id,
            'code' => $store->code,
            'name' => $store->name,
            'store_type' => $storeTypeRelation?->code,
            'store_type_id' => $store->store_type_id,
            'plan' => $planModelRelation?->code,
            'plan_id' => $store->owner?->plan_id,
            'plan_expires_at' => $store->owner?->plan_expires_at,
            'max_users' => $store->max_users,
            'max_branches' => $store->max_branches,
            'phone' => $store->phone,
            'email' => $store->email,
            'address' => $store->address,
            'is_active' => $store->is_active,
            'created_at' => $store->created_at,
            'updated_at' => $store->updated_at,
            'branches_count' => $store->branches_count,
            'employees_count' => $store->employees_count,
            'branches' => $store->branches,
            'storeType' => $storeTypeRelation,
            'planModel' => $planModelRelation,
        ];

        $planHistory = $store->owner
            ? PlanSubscription::where('user_id', $store->owner->id)
                ->with(['plan:id,code,label', 'createdBy:id,name'])
                ->orderByDesc('started_at')
                ->get()
                ->map(fn (PlanSubscription $s) => [
                    'id' => $s->id,
                    'plan_label' => $s->plan?->label ?? '—',
                    'plan_code' => $s->plan?->code,
                    'started_at' => $s->started_at,
                    'ended_at' => $s->ended_at,
                    'reason' => $s->reason,
                    'reason_label' => PlanSubscription::REASONS[$s->reason] ?? $s->reason,
                    'created_by' => $s->createdBy?->name,
                ])
            : collect();

        $notes = $store->notes()
            ->with('developer:id,name')
            ->get()
            ->map(fn (StoreNote $n) => [
                'id' => $n->id,
                'note' => $n->note,
                'developer_name' => $n->developer?->name ?? 'Sistem',
                'created_at' => $n->created_at,
            ]);

        $suspensionHistory = StoreSuspension::where('store_id', $store->id)
            ->with(['suspendedBy:id,name', 'reactivatedBy:id,name'])
            ->orderByDesc('suspended_at')
            ->get()
            ->map(fn (StoreSuspension $s) => [
                'id' => $s->id,
                'reason' => $s->reason,
                'suspended_at' => $s->suspended_at,
                'suspended_by' => $s->suspendedBy?->name,
                'reactivated_at' => $s->reactivated_at,
                'reactivated_by' => $s->reactivatedBy?->name,
                'is_active' => $s->isActive(),
            ]);

        // User yang bisa di-impersonate — non-developer yang terhubung ke toko ini
        $impersonatableUsers = $store
            ->users()
            ->where('is_developer', false)
            ->get(['users.id', 'users.name', 'users.email']);

        return Inertia::render('Developer/Stores/Show', [
            'store' => $storeData,
            'owners' => $owners,
            'allUsers' => $allUsers,
            'storeTypeFeatures' => $storeTypeFeatures,
            'planFeatures' => $planFeatures,
            'activeFeatures' => $activeFeatures,
            'planHistory' => $planHistory,
            'planUsage' => $store->planUsageSummary(),
            'notes' => $notes,
            'suspensionHistory' => $suspensionHistory,
            'impersonatableUsers' => $impersonatableUsers,
        ]);
    }

    public function edit(Store $store)
    {
        $store->load([
            'planModel',
            'storeType',
            'storeType.features',
            'planModel.features',
        ]);
        $store->loadCount(['users', 'branches', 'sales']);

        // Get the actual relations bypassing the accessor
        $storeTypeRelation = $store->getRelation('storeType');
        $planModelRelation = $store->getRelation('planModel');

        // Get available features for this store type
        $availableFeatures = $storeTypeRelation
            ? $storeTypeRelation
                ->features()
                ->where('features.is_active', true)
                ->orderBy('features.sort_order')
                ->get([
                    'features.id',
                    'features.code',
                    'features.label',
                    'features.category',
                ])
            : collect();

        // Transform store data untuk frontend
        $storeData = [
            'id' => $store->id,
            'code' => $store->code,
            'name' => $store->name,
            'store_type' => $storeTypeRelation?->code,
            'store_type_id' => $store->store_type_id,
            'plan' => $planModelRelation?->code,
            'plan_id' => $store->owner?->plan_id,
            'plan_expires_at' => $store->owner?->plan_expires_at,
            'max_users' => $store->max_users,
            'max_branches' => $store->max_branches,
            'phone' => $store->phone,
            'email' => $store->email,
            'address' => $store->address,
            'is_active' => $store->is_active,
            'created_at' => $store->created_at,
            'updated_at' => $store->updated_at,
            'users_count' => $store->users_count,
            'branches_count' => $store->branches_count,
            'sales_count' => $store->sales_count,
            'storeType' => $storeTypeRelation,
            'planModel' => $planModelRelation,
        ];

        return Inertia::render('Developer/Stores/Edit', [
            'store' => $storeData,
            'storeTypes' => StoreType::orderBy('sort_order')->get([
                'id',
                'code',
                'label',
                'icon',
            ]),
            'plans' => Store::allPlans(),
            'availableFeatures' => $availableFeatures,
        ]);
    }

    public function update(Request $request, Store $store)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('stores', 'code')->ignore($store->id),
            ],
            'name' => 'required|string|max:255',
            'store_type_id' => ['required', 'integer', 'exists:store_types,id'],
            'phone' => 'nullable|string|max:30',
            'email' => [
                'nullable',
                'email',
                Rule::unique('stores', 'email')->ignore($store->id),
            ],
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            // Wajib diisi kalau is_active diubah dari true jadi false —
            // divalidasi manual di bawah (butuh tahu nilai lama dulu).
            'suspend_reason' => 'nullable|string|max:500',
            'plan_id' => ['nullable', 'integer', 'exists:plans,id'],
            'plan_expires_at' => 'nullable|date',
            // Override manual per-toko (opsional, null = ikut plan)
            'max_users' => 'nullable|integer|min:1',
            'max_branches' => 'nullable|integer|min:1',
        ]);

        // oldPlanId dari owner user (bukan store) — plan sekarang di user
        $owner = $store->owner;
        $oldPlanId = $owner?->plan_id;
        $newPlanId = $validated['plan_id'] ?? null;
        $wasActive = $store->is_active;
        $willBeActive = $validated['is_active'] ?? true;
        $suspendReason = $validated['suspend_reason'] ?? null;
        unset($validated['suspend_reason']);

        // Menonaktifkan toko (suspend) wajib mencantumkan alasan.
        if ($wasActive && ! $willBeActive && ! $suspendReason) {
            return back()->withErrors([
                'suspend_reason' => 'Alasan wajib diisi saat menonaktifkan toko.',
            ])->withInput();
        }

        $oldValues = $store->only(array_keys($validated));

        $store->update($validated);

        DeveloperActionLog::record('store.update', $store, $oldValues, $validated);

        // ── Suspend: is_active true → false ──────────────────────────
        if ($wasActive && ! $willBeActive) {
            StoreSuspension::create([
                'store_id' => $store->id,
                'reason' => $suspendReason,
                'suspended_by' => Auth::id(),
                'suspended_at' => now(),
            ]);

            DeveloperActionLog::record('store.suspend', $store, null, ['reason' => $suspendReason]);

            if ($owner) {
                $owner->notify(new StoreSuspended($store, $suspendReason));
            }
        }

        // ── Reaktivasi: is_active false → true ───────────────────────
        if (! $wasActive && $willBeActive) {
            StoreSuspension::where('store_id', $store->id)
                ->whereNull('reactivated_at')
                ->update([
                    'reactivated_at' => now(),
                    'reactivated_by' => Auth::id(),
                ]);

            DeveloperActionLog::record('store.reactivate', $store);
        }

        // Catat riwayat perubahan plan ke USER owner kalau plan berubah.
        if ($newPlanId !== $oldPlanId) {
            if ($owner) {
                PlanSubscription::where('user_id', $owner->id)
                    ->whereNull('ended_at')
                    ->update(['ended_at' => now()]);

                if ($newPlanId) {
                    $oldPlan = $oldPlanId ? Plan::find($oldPlanId) : null;
                    $newPlan = Plan::find($newPlanId);
                    $reason = $oldPlan && $newPlan && $newPlan->sort_order < $oldPlan->sort_order
                        ? 'downgraded'
                        : 'upgraded';

                    PlanSubscription::create([
                        'user_id' => $owner->id,
                        'plan_id' => $newPlanId,
                        'started_at' => now(),
                        'reason' => $reason,
                        'created_by' => Auth::id(),
                    ]);

                    $owner->update([
                        'plan_id' => $newPlanId,
                        'plan_expires_at' => $validated['plan_expires_at'] ?? null,
                    ]);
                }
            }
        }

        return redirect()
            ->route('developer.stores.show', $store->id)
            ->with('success', 'Toko berhasil diperbarui.');
    }

    public function destroy(Store $store)
    {
        $store->loadCount(['sales', 'purchases']);
        if ($store->sales_count > 0 || $store->purchases_count > 0) {
            return back()->withErrors([
                'store' => 'Toko sudah memiliki data transaksi (penjualan/pembelian). Nonaktifkan saja jika tidak digunakan.',
            ]);
        }

        $snapshot = $store->only(['id', 'code', 'name', 'store_type_id']);
        $snapshot['plan_id'] = $store->owner?->plan_id;
        DeveloperActionLog::record('store.destroy', $store, $snapshot, null);

        $store->delete();

        return redirect()
            ->route('developer.stores.index')
            ->with('success', 'Toko berhasil dihapus.');
    }

    /** Tambah catatan internal developer untuk sebuah toko (tidak terlihat oleh owner). */
    public function storeNote(Request $request, Store $store)
    {
        $validated = $request->validate([
            'note' => 'required|string|max:2000',
        ]);

        $store->notes()->create([
            'developer_id' => Auth::id(),
            'note' => $validated['note'],
        ]);

        return back()->with('success', 'Catatan berhasil ditambahkan.');
    }

    public function destroyNote(Store $store, StoreNote $note)
    {
        abort_if($note->store_id !== $store->id, 404);

        $note->delete();

        return back()->with('success', 'Catatan berhasil dihapus.');
    }

    /** Assign user owner + Spatie role di store */
    public function assignOwner(Request $request, Store $store)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $store->users()->syncWithoutDetaching([$user->id]);
        $this->assignOwnerRole($user, $store->id);

        return back()->with(
            'success',
            "User {$user->name} berhasil dijadikan owner toko ini.",
        );
    }

    /** Cabut owner dari store */
    public function revokeOwner(Request $request, Store $store)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);
        $user = User::findOrFail($validated['user_id']);

        $store->users()->detach($user->id);

        // Hapus role owner di store ini
        DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->where('model_type', User::class)
            ->where('store_id', $store->id)
            ->delete();

        return back()->with('success', 'Akses owner dicabut dari toko.');
    }

    private function assignOwnerRole(User $user, int $storeId): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
        // Hapus role lama di store ini dulu
        DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->where('model_type', User::class)
            ->where('store_id', $storeId)
            ->delete();
        $user->assignRole('owner');
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
    }

    public function typeFeatures()
    {
        // Ambil semua fitur aktif
        $allFeatures = Feature::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($feature) {
                return [
                    'id' => $feature->id,
                    'code' => $feature->code,
                    'label' => $feature->label,
                    'category' => $feature->category,
                ];
            });

        // Ambil semua tipe toko dengan relasi features
        $storeTypes = StoreType::with('features')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        // Ambil kode tipe toko
        $types = $storeTypes->pluck('code')->toArray();

        // Build mapping: { retail: ['dashboard', 'basic_pos'], fnb: [...], ... }
        $mapping = [];
        foreach ($storeTypes as $storeType) {
            $mapping[$storeType->code] = $storeType->features
                ->where('is_active', true)
                ->pluck('code')
                ->toArray();
        }

        // Tambahkan allStoreTypes untuk info icon dan label
        $allStoreTypes = $storeTypes->map(function ($st) {
            return [
                'id' => $st->id,
                'code' => $st->code,
                'label' => $st->label,
                'icon' => $st->icon,
            ];
        });

        return Inertia::render('Developer/TypeFeatures/Index', [
            'types' => $types,
            'allFeatures' => $allFeatures,
            'mapping' => $mapping,
            'allStoreTypes' => $allStoreTypes,
        ]);
    }

    public function updateTypeFeatures(Request $request)
    {
        $validated = $request->validate([
            'features' => 'present|array',
            'features.*.store_type' => 'required|string',
            'features.*.feature_code' => 'required|string|exists:features,code',
        ]);

        DB::transaction(function () use ($validated) {
            // Hapus semua mapping lama
            DB::table('store_type_feature')->delete();

            // Insert mapping baru
            if (! empty($validated['features'])) {
                // Ambil feature IDs by code
                $featureIds = Feature::whereIn(
                    'code',
                    array_column($validated['features'], 'feature_code'),
                )->pluck('id', 'code');

                // Ambil store type IDs by code
                $storeTypeIds = StoreType::whereIn(
                    'code',
                    array_column($validated['features'], 'store_type'),
                )->pluck('id', 'code');

                $inserts = [];
                foreach ($validated['features'] as $item) {
                    $featureId = $featureIds[$item['feature_code']] ?? null;
                    $storeTypeId = $storeTypeIds[$item['store_type']] ?? null;

                    if ($featureId && $storeTypeId) {
                        $inserts[] = [
                            'store_type_id' => $storeTypeId,
                            'feature_id' => $featureId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }

                if (! empty($inserts)) {
                    DB::table('store_type_feature')->insert($inserts);
                }
            }
        });

        return back()->with(
            'success',
            'Fitur per tipe toko berhasil disimpan.',
        );
    }
}
