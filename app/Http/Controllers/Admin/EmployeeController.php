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
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');

        $employees = Employee::with([
            'user:id,name,email',
            'branch:id,name,code',
        ])
            ->where('store_id', $storeId)
            ->orderBy('name')
            ->get()
            ->map(function ($emp) use ($storeId) {
                // Ambil role user di store ini
                $roles = $emp->user_id
                    ? DB::table('model_has_roles')
                        ->join(
                            'roles',
                            'roles.id',
                            '=',
                            'model_has_roles.role_id',
                        )
                        ->where('model_has_roles.model_id', $emp->user_id)
                        ->where(
                            'model_has_roles.model_type',
                            User::class,
                        )
                        ->where('model_has_roles.store_id', $storeId)
                        ->pluck('roles.name')
                    : collect();

                return array_merge($emp->toArray(), [
                    'user_roles' => $roles,
                ]);
            });

        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
            'storeType' => Store::with('storeType')
                ->find($storeId)
                ?->getRelation('storeType')?->code ?? 'retail',
        ]);
    }

    public function create(Request $request)
    {
        $storeId = session('current_store_id');
        $roles = Role::where(function ($q) use (
            $storeId,
        ) {
            $q->whereNull('store_id')->orWhere('store_id', $storeId);
        })
            ->where('name', '!=', 'owner')
            ->where('name', '!=', 'developer')
            ->get(['id', 'name', 'description']);

        return Inertia::render('Admin/Employees/Create', [
            'branches' => $this->branchOptions($request),
            'suggestedCode' => $this->nextEmployeeCode($storeId),
            'roles' => $roles,
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');
        abort_unless($storeId, 403);

        $validated = $request->validate($this->rules($storeId));
        $wantsAccount = $request->boolean('create_account');

        DB::transaction(function () use ($validated, $storeId, $wantsAccount) {
            $user = null;

            if ($wantsAccount) {
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                ]);

                // Attach ke store
                $user->stores()->attach($storeId);

                // Assign role via Spatie
                if (! empty($validated['role'])) {
                    app(
                        PermissionRegistrar::class,
                    )->setPermissionsTeamId($storeId);
                    $user->assignRole($validated['role']);
                    app(
                        PermissionRegistrar::class,
                    )->setPermissionsTeamId(null);
                }
            }

            Employee::create([
                'store_id' => $storeId,
                'branch_id' => $validated['branch_id'] ?? null,
                'user_id' => $user?->id,
                'employee_code' => strtoupper($validated['employee_code']),
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'position' => $validated['position'] ?? null,
                'commission_type' => $validated['commission_type'] ?? 'none',
                'commission_value' => $validated['commission_value'] ?? 0,
                'status' => $validated['status'],
            ]);
        });

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Karyawan berhasil ditambahkan.');
    }

    public function edit(Request $request, Employee $employee)
    {
        $this->ensureSameStore($request, $employee);
        $storeId = session('current_store_id');

        $roles = Role::where(function ($q) use (
            $storeId,
        ) {
            $q->whereNull('store_id')->orWhere('store_id', $storeId);
        })
            ->where('name', '!=', 'owner')
            ->where('name', '!=', 'developer')
            ->get(['id', 'name', 'description']);

        $employee->load([
            'branch:id,name,code',
            'user:id,name,email',
        ]);

        $userRoles = $employee->user_id
            ? DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $employee->user_id)
                ->where('model_has_roles.model_type', User::class)
                ->where('model_has_roles.store_id', $storeId)
                ->pluck('roles.name')
            : collect();

        return Inertia::render('Admin/Employees/Edit', [
            'employee' => array_merge($employee->toArray(), [
                'user_roles' => $userRoles,
            ]),
            'branches' => $this->branchOptions($request),
            'roles' => $roles,
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $this->ensureSameStore($request, $employee);
        $storeId = $employee->store_id;

        $validated = $request->validate($this->rules($storeId, $employee));
        $wantsAccount = $request->boolean('create_account');

        DB::transaction(function () use (
            $validated,
            $employee,
            $wantsAccount,
            $storeId,
        ) {
            $user = $employee->user;

            if ($wantsAccount) {
                $payload = [
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                ];
                if (! empty($validated['password'])) {
                    $payload['password'] = Hash::make($validated['password']);
                }

                if ($user) {
                    $user->update($payload);
                } else {
                    $payload['password'] = Hash::make($validated['password']);
                    $user = User::create($payload);
                    $user->stores()->attach($storeId);
                }

                // Update role Spatie
                if (! empty($validated['role'])) {
                    app(
                        PermissionRegistrar::class,
                    )->setPermissionsTeamId($storeId);
                    DB::table('model_has_roles')
                        ->where('model_id', $user->id)
                        ->where('model_type', User::class)
                        ->where('store_id', $storeId)
                        ->delete();
                    $user->assignRole($validated['role']);
                    app(
                        PermissionRegistrar::class,
                    )->setPermissionsTeamId(null);
                }
            } elseif ($user) {
                // Cabut akun
                DB::table('model_has_roles')
                    ->where('model_id', $user->id)
                    ->where('model_type', User::class)
                    ->where('store_id', $storeId)
                    ->delete();
                $user->stores()->detach($storeId);
                $employee->update(['user_id' => null]);
                $user = null;
            }

            $employee->update([
                'branch_id' => $validated['branch_id'] ?? null,
                'user_id' => $user?->id,
                'employee_code' => strtoupper($validated['employee_code']),
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'position' => $validated['position'] ?? null,
                'commission_type' => $validated['commission_type'] ?? 'none',
                'commission_value' => $validated['commission_value'] ?? 0,
                'status' => $validated['status'],
            ]);
        });

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Karyawan berhasil diperbarui.');
    }

    public function destroy(Request $request, Employee $employee)
    {
        $this->ensureSameStore($request, $employee);

        if ($employee->user_id === $request->user()?->id) {
            return back()->with(
                'error',
                'Karyawan yang sedang login tidak bisa dihapus.',
            );
        }

        DB::transaction(function () use ($employee) {
            $user = $employee->user;
            if ($user) {
                $user->stores()->detach();
            }
            $employee->delete();
            $user?->delete();
        });

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Karyawan berhasil dihapus.');
    }

    private function rules(int $storeId, ?Employee $employee = null): array
    {
        $userId = $employee?->user_id;
        $employeeId = $employee?->id;

        return [
            'employee_code' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('employees', 'employee_code')
                    ->where(fn ($q) => $q->where('store_id', $storeId))
                    ->ignore($employeeId),
            ],
            'branch_id' => [
                'nullable',
                Rule::exists('branches', 'id')->where(
                    fn ($q) => $q->where('store_id', $storeId),
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('employees', 'email')->ignore($employeeId),
                Rule::unique('users', 'email')->ignore($userId),
                Rule::requiredIf(fn () => request()->boolean('create_account')),
            ],
            'position' => ['nullable', 'string', 'max:100'],
            'commission_type' => [
                'nullable',
                Rule::in(['none', 'percent', 'flat']),
            ],
            'commission_value' => ['nullable', 'numeric', 'min:0'],
            'status' => [
                'required',
                Rule::in(['active', 'inactive', 'terminated']),
            ],
            'create_account' => ['boolean'],
            'role' => [
                Rule::requiredIf(fn () => request()->boolean('create_account')),
                'nullable',
                'string',
            ],
            'password' => [
                Rule::requiredIf(
                    fn () => request()->boolean('create_account') && ! $userId,
                ),
                'nullable',
                'string',
                'min:6',
                'confirmed',
            ],
        ];
    }

    private function branchOptions(Request $request)
    {
        $storeId = session('current_store_id');

        return Branch::query()
            ->when($storeId, fn ($query) => $query->where('store_id', $storeId))
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name']);
    }

    private function nextEmployeeCode(?int $storeId): string
    {
        if (! $storeId) {
            return 'EMP0001';
        }

        $nextId = (int) Employee::where('store_id', $storeId)->max('id') + 1;

        return 'EMP'.str_pad((string) $nextId, 4, '0', STR_PAD_LEFT);
    }

    private function ensureSameStore(Request $request, Employee $employee): void
    {
        $storeId = session('current_store_id');

        abort_unless(
            $storeId && (int) $employee->store_id === (int) $storeId,
            404,
        );
    }

    private function resolveStoreType(): string
    {
        $storeId = session('current_store_id');

        return Store::with('storeType')
            ->find($storeId)
            ?->getRelation('storeType')?->code ?? 'retail';
    }
}
