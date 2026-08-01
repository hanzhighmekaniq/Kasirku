<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\RoleTemplate;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with('stores.storeType')
            ->when(
                $request->search,
                fn ($q, $s) => $q
                    ->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%"),
            )
            ->orderByDesc('created_at')
            ->get()
            ->map(
                fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'stores' => $u->stores->map(function ($store) {
                        return [
                            'id' => $store->id,
                            'name' => $store->name,
                            'code' => $store->code,
                            'store_type' => $store->getRelation('storeType')?->code,
                            'store_type_id' => $store->store_type_id,
                        ];
                    }),
                    'created_at' => $u->created_at,
                    // Sumber kebenaran akses developer = kolom is_developer,
                    // levelnya (super admin/support) di developer_role.
                    // sama dengan yang dicek DeveloperMiddleware. hasRole()
                    // selalu false karena role Spatie "developer" tidak ada.
                    'is_developer' => (bool) $u->is_developer,
                    'developer_role' => $u->developer_role,
                ],
            );

        $stores = Store::with('storeType')
            ->orderBy('name')
            ->get()
            ->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'code' => $store->code,
                    'store_type' => $store->getRelation('storeType')?->code,
                    'store_type_id' => $store->store_type_id,
                ];
            });

        return Inertia::render('Developer/Users/Index', [
            'users' => $users,
            'stores' => $stores,
        ]);
    }

    public function show(User $user)
    {
        $user->load(['stores.storeType.features', 'stores.planModel.features']);

        // Semua fitur di sistem
        $allFeatures = Feature::with('storeTypes')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'label', 'category']);

        // Data per toko: role, permissions, fitur tersedia (plan + type)
        $storeAccess = $user->stores->map(function (
            Store $store,
        ) use ($user, $allFeatures) {
            // Role user di store ini
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            $roles = $user->getRoleNames()->values();

            // Permissions user di store ini
            $roleIds = DB::table('model_has_roles')
                ->where('model_id', $user->id)
                ->where('model_type', get_class($user))
                ->where('store_id', $store->id)
                ->pluck('role_id');

            $permissions = DB::table('permissions')
                ->join(
                    'role_has_permissions',
                    'permissions.id',
                    '=',
                    'role_has_permissions.permission_id',
                )
                ->whereIn('role_has_permissions.role_id', $roleIds)
                ->distinct()
                ->pluck('permissions.name')
                ->values()
                ->toArray();

            app(PermissionRegistrar::class)->setPermissionsTeamId(null);

            // Fitur dari plan toko
            $planFeatureCodes = $store->planModel
                ? $store->planModel->features->pluck('code')->toArray()
                : [];
            $planAllAll = empty($planFeatureCodes); // plan tanpa fitur = pro = semua

            // Fitur dari relasi store_type_feature (tipe toko)
            $storeType = $store->getRelationValue('storeType');
            $typeFeatureCodes = $storeType
                ? $storeType->features->pluck('code')->toArray()
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
                        'code' => $f->code,
                        'label' => $f->label,
                        'category' => $f->category,
                        'plan_ok' => $planOk,
                        'type_ok' => $typeOk,
                        'can_access' => $planOk && $typeOk,
                    ];
                })
                ->values();

            return [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'store_code' => $store->code,
                'store_type' => $store->getRelation('storeType')?->code,
                'plan_label' => $store->planModel?->label ?? ($store->plan ?? 'Free'),
                'plan_code' => $store->planModel?->code ?? ($store->plan ?? 'free'),
                'roles' => $roles,
                'permissions' => $permissions,
                'feature_status' => $featureStatus,
            ];
        });

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        // Transform user data
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_developer' => $user->is_developer,
            'developer_role' => $user->developer_role,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'stores' => $user->stores->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'code' => $store->code,
                    'store_type' => $store->getRelation('storeType')?->code,
                ];
            }),
        ];

        return Inertia::render('Developer/Users/Show', [
            'user' => $userData,
            'storeAccess' => $storeAccess,
            'allFeatures' => $allFeatures,
        ]);
    }

    public function create()
    {
        $stores = Store::with('storeType')
            ->orderBy('name')
            ->get()
            ->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'code' => $store->code,
                    'store_type' => $store->getRelation('storeType')?->code,
                    'store_type_id' => $store->store_type_id,
                ];
            });

        return Inertia::render('Developer/Users/Create', [
            'stores' => $stores,
            'rolesByStoreType' => $this->rolesByStoreType(),
            'developerRoles' => User::DEVELOPER_ROLES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'is_developer' => 'boolean',
            'developer_role' => ['nullable', Rule::in(array_keys(User::DEVELOPER_ROLES))],
            // store_roles: [{ store_id: 1, role: 'owner' }, ...]
            ...$this->storeRoleRules(),
        ]);

        DB::transaction(function () use ($validated) {
            $isDeveloper = ! empty($validated['is_developer']);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'is_developer' => $isDeveloper,
                // Level akses hanya relevan untuk developer. Default super
                // admin supaya perilakunya sama seperti sebelum ada level.
                'developer_role' => $isDeveloper
                    ? ($validated['developer_role'] ?? User::DEV_SUPER_ADMIN)
                    : null,
            ]);

            // Akses developer ditentukan kolom is_developer, dicek oleh
            // DeveloperMiddleware/PermissionMiddleware. Tidak ada role Spatie
            // bernama "developer" — assignRole('developer') dulu selalu 500.

            // Assign role per store
            foreach ($validated['store_roles'] ?? [] as $sr) {
                $store = Store::findOrFail($sr['store_id']);
                $store->users()->syncWithoutDetaching([$user->id]);
                app(PermissionRegistrar::class)->setPermissionsTeamId(
                    $sr['store_id'],
                );
                $user->assignRole($sr['role']);
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        });

        return redirect()
            ->route('developer.users.index')
            ->with('success', 'User berhasil dibuat.');
    }

    public function edit(User $user)
    {
        $user->load('stores.storeType');

        // Role per store
        $storeRoles = $user->stores->map(function (Store $store) use ($user) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            $roles = $user->getRoleNames()->values()->first() ?? '';
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);

            return ['store_id' => $store->id, 'role' => $roles];
        });

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_developer' => $user->is_developer,
            'developer_role' => $user->developer_role,
            'created_at' => $user->created_at,
            'stores' => $user->stores->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'code' => $store->code,
                    'store_type' => $store->getRelation('storeType')?->code,
                ];
            }),
        ];

        $stores = Store::with('storeType')
            ->orderBy('name')
            ->get()
            ->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'code' => $store->code,
                    'store_type' => $store->getRelation('storeType')?->code,
                    'store_type_id' => $store->store_type_id,
                ];
            });

        return Inertia::render('Developer/Users/Edit', [
            'user' => $userData,
            'stores' => $stores,
            'storeRoles' => $storeRoles,
            'rolesByStoreType' => $this->rolesByStoreType(),
            'developerRoles' => User::DEVELOPER_ROLES,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:6|confirmed',
            'is_developer' => 'boolean',
            'developer_role' => ['nullable', Rule::in(array_keys(User::DEVELOPER_ROLES))],
            ...$this->storeRoleRules(),
        ]);

        DB::transaction(function () use ($validated, $user) {
            $isDeveloper = ! empty($validated['is_developer']);

            $data = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'is_developer' => $isDeveloper,
                // Level akses hanya relevan untuk developer. Kalau flag
                // developer dicabut, levelnya juga dikosongkan.
                'developer_role' => $isDeveloper
                    ? ($validated['developer_role'] ?? User::DEV_SUPER_ADMIN)
                    : null,
            ];
            if (! empty($validated['password'])) {
                $data['password'] = Hash::make($validated['password']);
            }
            $user->update($data);

            // Hapus semua role & store lama
            DB::table('model_has_roles')
                ->where('model_id', $user->id)
                ->where('model_type', User::class)
                ->delete();
            $user->stores()->detach();

            // Akses developer ditentukan kolom is_developer, dicek oleh
            // DeveloperMiddleware/PermissionMiddleware. Tidak ada role Spatie
            // bernama "developer" — assignRole('developer') dulu selalu 500.

            // Store roles baru
            foreach ($validated['store_roles'] ?? [] as $sr) {
                $store = Store::findOrFail($sr['store_id']);
                $store->users()->syncWithoutDetaching([$user->id]);
                app(PermissionRegistrar::class)->setPermissionsTeamId(
                    $sr['store_id'],
                );
                $user->assignRole($sr['role']);
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        });

        return redirect()
            ->route('developer.users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->where('model_type', User::class)
            ->delete();
        $user->stores()->detach();
        $user->delete();

        return redirect()
            ->route('developer.users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    /**
     * Opsi role per kode tipe toko, bersumber dari tabel role_templates.
     *
     * Dipetakan per tipe toko karena satu form bisa menugaskan user ke beberapa
     * toko sekaligus dengan tipe berbeda — daftar tunggal membuat role seperti
     * kitchen ikut tertawar di toko retail, padahal rolenya tidak ada di sana
     * dan assign-nya gagal.
     *
     * @return array<string, array<int, array{value: string, label: string, desc: ?string}>>
     */
    private function rolesByStoreType(): array
    {
        $templates = RoleTemplate::query()->ordered()->get();

        return StoreType::query()
            ->orderBy('sort_order')
            ->pluck('code')
            ->mapWithKeys(fn (string $code) => [
                $code => $templates
                    ->filter(fn (RoleTemplate $template) => $template->appliesTo($code))
                    ->map(fn (RoleTemplate $template) => [
                        'value' => $template->key,
                        'label' => $template->name,
                        'desc' => $template->description,
                    ])
                    ->values()
                    ->all(),
            ])
            ->all();
    }

    /**
     * Aturan validasi assign role per toko.
     *
     * Role divalidasi harus benar-benar ada di store tujuan. Tanpa ini
     * `assignRole()` melempar RoleDoesNotExist dan request berakhir 500
     * alih-alih memberi pesan yang bisa dibaca user.
     *
     * @return array<string, mixed>
     */
    private function storeRoleRules(): array
    {
        return [
            'store_roles' => 'nullable|array',
            'store_roles.*.store_id' => 'required|exists:stores,id',
            'store_roles.*.role' => [
                'required',
                'string',
                function (string $attribute, mixed $value, callable $fail) {
                    // store_id pasangannya: store_roles.N.role → store_roles.N.store_id
                    $storeId = request()->input(
                        str_replace('.role', '.store_id', $attribute),
                    );

                    if (! $storeId) {
                        return;
                    }

                    $exists = Role::where('name', $value)
                        ->where('store_id', $storeId)
                        ->exists();

                    if (! $exists) {
                        $fail("Role \"{$value}\" tidak tersedia untuk toko yang dipilih.");
                    }
                },
            ],
        ];
    }

    /** AJAX: get branches by store */
    public function branches(Store $store)
    {
        return response()->json(
            $store
                ->branches()
                ->where('is_active', true)
                ->get(['id', 'name', 'code']),
        );
    }
}
