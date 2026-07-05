<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Owner dapat CRUD role khusus store miliknya.
 * Role dengan is_system=true tidak bisa diedit/hapus.
 */
class RoleController extends Controller
{
    private function currentStoreId(): int
    {
        return session('current_store_id');
    }

    private function setTeam(): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->currentStoreId());
    }

    public function index()
    {
        $this->setTeam();
        $storeId = $this->currentStoreId();

        $roles = \App\Services\StoreRoleService::getRolesForStore($storeId);

        $permissions = Permission::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Roles/Index', [
            'roles'       => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $this->setTeam();
        $storeId = $this->currentStoreId();

        $validated = $request->validate([
            'name'        => 'required|string|max:50',
            'description' => 'nullable|string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        // Cek duplikat nama di store ini
        $exists = Role::where('name', $validated['name'])
            ->where(function ($q) use ($storeId) {
                $q->whereNull('store_id')->orWhere('store_id', $storeId);
            })->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'Nama role sudah ada.']);
        }

        $role = Role::create([
            'name'        => $validated['name'],
            'guard_name'  => 'web',
            'store_id'    => $storeId,
            'is_system'   => false,
            'description' => $validated['description'] ?? null,
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return back()->with('success', "Role \"{$role->name}\" berhasil dibuat.");
    }

    public function update(Request $request, Role $role)
    {
        $this->setTeam();
        $storeId = $this->currentStoreId();

        // Tidak bisa edit role sistem
        if ($role->is_system) {
            return back()->withErrors(['role' => 'Role sistem tidak bisa diubah.']);
        }

        // Pastikan role milik store ini
        if ($role->store_id !== $storeId) {
            abort(403);
        }

        $validated = $request->validate([
            'name'          => 'required|string|max:50',
            'description'   => 'nullable|string|max:255',
            'permissions'   => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->update([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        return back()->with('success', "Role \"{$role->name}\" berhasil diperbarui.");
    }

    public function destroy(Role $role)
    {
        $this->setTeam();
        $storeId = $this->currentStoreId();

        if ($role->is_system) {
            return back()->withErrors(['role' => 'Role sistem tidak bisa dihapus.']);
        }

        if ($role->store_id !== $storeId) {
            abort(403);
        }

        $role->delete();

        return back()->with('success', "Role berhasil dihapus.");
    }

    /**
     * Duplikat role sistem sebagai role custom baru.
     * Template: permission diambil dari role asal, is_system = false.
     */
    public function duplicate(Role $role)
    {
        $this->setTeam();
        $storeId = $this->currentStoreId();

        // Hanya boleh duplikat role yang ada di store ini atau role sistem store ini
        if ($role->store_id !== $storeId) {
            abort(403);
        }

        $baseName = $role->name . ' (custom)';
        $counter  = 1;
        $newName  = $baseName;

        // Pastikan nama tidak duplicate
        while (Role::where('name', $newName)->where('store_id', $storeId)->exists()) {
            $newName = $baseName . ' ' . $counter++;
        }

        $newRole = Role::create([
            'name'        => $newName,
            'guard_name'  => 'web',
            'store_id'    => $storeId,
            'is_system'   => false,
            'description' => 'Duplikat dari role "' . $role->name . '"',
        ]);

        // Salin semua permission dari role asal
        $newRole->syncPermissions($role->permissions);

        return back()->with('success', "Role \"{$newRole->name}\" berhasil diduplikat dari \"{$role->name}\".");
    }
}
