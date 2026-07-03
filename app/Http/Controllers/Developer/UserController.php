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
        $users = User::with('stores:id,name,code,store_type')
            ->when($request->search, fn ($q, $s) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
            )
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (User $u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'stores'     => $u->stores,
                'created_at' => $u->created_at,
                // Ambil role global (developer) atau per store
                'is_developer' => $u->hasRole('developer'),
            ]);

        return Inertia::render('Developer/Users/Index', [
            'users'  => $users,
            'stores' => Store::orderBy('name')->get(['id', 'name', 'code', 'store_type']),
        ]);
    }

    public function show(User $user)
    {
        $user->load('stores');

        // Kumpulkan role per store
        $storeRoles = $user->stores->map(function (Store $store) use ($user) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            return [
                'store_id'   => $store->id,
                'store_name' => $store->name,
                'store_type' => $store->store_type,
                'roles'      => $user->getRoleNames()->values(),
            ];
        });
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);

        return Inertia::render('Developer/Users/Show', [
            'user'       => $user,
            'storeRoles' => $storeRoles,
        ]);
    }

    public function create()
    {
        return Inertia::render('Developer/Users/Create', [
            'stores' => Store::orderBy('name')->get(['id', 'name', 'code', 'store_type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|string|min:6|confirmed',
            'is_developer'    => 'boolean',
            // store_roles: [{ store_id: 1, role: 'owner' }, ...]
            'store_roles'     => 'nullable|array',
            'store_roles.*.store_id' => 'required|exists:stores,id',
            'store_roles.*.role'     => 'required|string',
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name'         => $validated['name'],
                'email'        => $validated['email'],
                'password'     => Hash::make($validated['password']),
                'is_developer' => !empty($validated['is_developer']),
            ]);

            // Assign developer role (global, semua store)
            if (!empty($validated['is_developer'])) {
                $stores = Store::pluck('id');
                foreach ($stores as $sid) {
                    app(PermissionRegistrar::class)->setPermissionsTeamId($sid);
                    $user->assignRole('developer');
                }
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }

            // Assign role per store
            foreach ($validated['store_roles'] ?? [] as $sr) {
                $store = Store::findOrFail($sr['store_id']);
                $store->users()->syncWithoutDetaching([$user->id]);
                app(PermissionRegistrar::class)->setPermissionsTeamId($sr['store_id']);
                $user->assignRole($sr['role']);
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        });

        return redirect()->route('developer.users.index')
            ->with('success', 'User berhasil dibuat.');
    }

    public function edit(User $user)
    {
        $user->load('stores');

        // Role per store
        $storeRoles = $user->stores->map(function (Store $store) use ($user) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
            $roles = $user->getRoleNames()->values()->first() ?? '';
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            return ['store_id' => $store->id, 'role' => $roles];
        });

        return Inertia::render('Developer/Users/Edit', [
            'user'       => $user,
            'stores'     => Store::orderBy('name')->get(['id', 'name', 'code', 'store_type']),
            'storeRoles' => $storeRoles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password'        => 'nullable|string|min:6|confirmed',
            'is_developer'    => 'boolean',
            'store_roles'     => 'nullable|array',
            'store_roles.*.store_id' => 'required|exists:stores,id',
            'store_roles.*.role'     => 'required|string',
        ]);

        DB::transaction(function () use ($validated, $user) {
            $data = [
                'name'         => $validated['name'],
                'email'        => $validated['email'],
                'is_developer' => !empty($validated['is_developer']),
            ];
            if (!empty($validated['password'])) {
                $data['password'] = Hash::make($validated['password']);
            }
            $user->update($data);

            // Hapus semua role & store lama
            DB::table('model_has_roles')->where('model_id', $user->id)->where('model_type', User::class)->delete();
            $user->stores()->detach();

            // Developer role
            if (!empty($validated['is_developer'])) {
                $stores = Store::pluck('id');
                foreach ($stores as $sid) {
                    app(PermissionRegistrar::class)->setPermissionsTeamId($sid);
                    $user->assignRole('developer');
                }
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }

            // Store roles baru
            foreach ($validated['store_roles'] ?? [] as $sr) {
                $store = Store::findOrFail($sr['store_id']);
                $store->users()->syncWithoutDetaching([$user->id]);
                app(PermissionRegistrar::class)->setPermissionsTeamId($sr['store_id']);
                $user->assignRole($sr['role']);
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        });

        return redirect()->route('developer.users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        DB::table('model_has_roles')->where('model_id', $user->id)->where('model_type', User::class)->delete();
        $user->stores()->detach();
        $user->delete();

        return redirect()->route('developer.users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    /** AJAX: get branches by store */
    public function branches(Store $store)
    {
        return response()->json($store->branches()->where('is_active', true)->get(['id', 'name', 'code']));
    }
}
