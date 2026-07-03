<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Owner / Admin kelola user di store mereka:
 * - Lihat semua user yang terdaftar di store
 * - Invite user baru (buat akun + assign ke store)
 * - Assign / ganti role user di store ini
 * - Cabut akses user dari store ini
 */
class UserManagementController extends Controller
{
    private function currentStore(): Store
    {
        return Store::findOrFail(session('current_store_id'));
    }

    private function setTeam(int $storeId): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
    }

    public function index()
    {
        $store = $this->currentStore();
        $this->setTeam($store->id);

        $users = $store->users()
            ->with(['employee' => fn ($q) => $q->where('store_id', $store->id)])
            ->get()
            ->map(fn (User $user) => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'roles'    => $user->getRoleNames(),
                'branch'   => $user->employee?->branch?->only(['id', 'name']),
                'position' => $user->employee?->position,
            ]);

        // Roles yang tersedia di store ini (sistem + custom store ini)
        $roles = Role::where(function ($q) use ($store) {
            $q->whereNull('store_id')->orWhere('store_id', $store->id);
        })
        ->where('name', '!=', 'developer') // developer tidak bisa di-assign oleh owner
        ->get(['id', 'name', 'description', 'is_system']);

        $branches = Branch::where('store_id', $store->id)
            ->where('is_active', true)
            ->get(['id', 'name']);

        return Inertia::render('Admin/Users/Index', [
            'storeUsers' => $users,
            'roles'      => $roles,
            'branches'   => $branches,
            'canInvite'  => $store->canAddUser(),
            'planInfo'   => [
                'plan'         => $store->effectivePlan(),
                'label'        => \App\Models\Store::planConfig()[$store->effectivePlan()]['label'],
                'max_users'    => $store->max_users,
                'current_users'=> $users->count(),
            ],
        ]);
    }

    /**
     * Invite user baru: buat akun + langsung assign ke store + beri role
     */
    public function invite(Request $request)
    {
        $store = $this->currentStore();
        $this->setTeam($store->id);

        // Cek batas user sesuai plan
        if (!$store->canAddUser()) {
            $plan   = $store->effectivePlan();
            $config = \App\Models\Store::planConfig()[$plan];
            return back()->withErrors([
                'invite' => "Batas maksimal {$config['max_users']} user untuk paket {$config['label']} sudah tercapai. Upgrade paket untuk menambah lebih banyak pengguna.",
            ]);
        }

        $validated = $request->validate([
            'name'      => 'required|string|max:100',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:6',
            'role'      => 'required|string',
            'branch_id' => 'nullable|exists:branches,id',
            'position'  => 'nullable|string|max:100',
        ]);

        // Validasi role ada di store ini
        $role = Role::where('name', $validated['role'])
            ->where(function ($q) use ($store) {
                $q->whereNull('store_id')->orWhere('store_id', $store->id);
            })->firstOrFail();

        DB::transaction(function () use ($validated, $store, $role) {
            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            // Attach ke store
            $store->users()->syncWithoutDetaching([$user->id]);

            // Assign role di konteks store ini
            $user->assignRole($role);

            // Buat employee record jika ada branch / position
            if (!empty($validated['branch_id']) || !empty($validated['position'])) {
                Employee::create([
                    'store_id'        => $store->id,
                    'branch_id'       => $validated['branch_id'] ?? null,
                    'user_id'         => $user->id,
                    'employee_code'   => 'EMP-' . strtoupper(substr($store->code, 0, 3)) . '-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                    'name'            => $user->name,
                    'email'           => $user->email,
                    'position'        => $validated['position'] ?? null,
                    'commission_type' => 'none',
                    'status'          => 'active',
                ]);
            }
        });

        return back()->with('success', "User {$validated['name']} berhasil diundang ke toko.");
    }

    /**
     * Ganti role user di store ini
     */
    public function assignRole(Request $request, User $user)
    {
        $store = $this->currentStore();
        $this->setTeam($store->id);

        // Pastikan user memang ada di store ini
        if (!$store->users()->where('users.id', $user->id)->exists()) {
            abort(403, 'User tidak terdaftar di toko ini.');
        }

        $validated = $request->validate([
            'role' => 'required|string',
        ]);

        $role = Role::where('name', $validated['role'])
            ->where(function ($q) use ($store) {
                $q->whereNull('store_id')->orWhere('store_id', $store->id);
            })->firstOrFail();

        // Cabut semua role lama di store ini, assign yang baru
        // Hapus manual dari model_has_roles untuk store ini
        DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->where('model_type', User::class)
            ->where('store_id', $store->id)
            ->delete();

        $user->assignRole($role);

        return back()->with('success', "Role user berhasil diperbarui.");
    }

    /**
     * Cabut akses user dari store ini
     */
    public function revoke(User $user)
    {
        $store = $this->currentStore();
        $this->setTeam($store->id);

        if (!$store->users()->where('users.id', $user->id)->exists()) {
            abort(403);
        }

        DB::transaction(function () use ($user, $store) {
            // Hapus dari pivot user_store
            $store->users()->detach($user->id);

            // Hapus semua role di store ini
            DB::table('model_has_roles')
                ->where('model_id', $user->id)
                ->where('model_type', User::class)
                ->where('store_id', $store->id)
                ->delete();

            // Hapus employee record jika ada
            Employee::where('user_id', $user->id)
                ->where('store_id', $store->id)
                ->delete();
        });

        return back()->with('success', "Akses user dicabut dari toko ini.");
    }
}
