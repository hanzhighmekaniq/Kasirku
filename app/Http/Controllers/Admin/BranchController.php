<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');

        $branches = Branch::query()
            ->when($storeId, fn ($query) => $query->where('store_id', $storeId))
            ->withCount(['employees', 'sales', 'purchases'])
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Branches/Index', [
            'branches' => $branches,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Branches/Create');
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');
        abort_unless($storeId, 403);

        $validated = $request->validate($this->rules($storeId));

        Branch::create([
            'store_id' => $storeId,
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('admin.branches.index')->with('success', 'Cabang berhasil ditambahkan.');
    }

    public function edit(Request $request, Branch $branch)
    {
        $this->ensureSameStore($request, $branch);

        return Inertia::render('Admin/Branches/Edit', [
            'branch' => $branch,
        ]);
    }

    public function update(Request $request, Branch $branch)
    {
        $this->ensureSameStore($request, $branch);

        $validated = $request->validate($this->rules($branch->store_id, $branch->id));

        $branch->update([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('admin.branches.index')->with('success', 'Cabang berhasil diperbarui.');
    }

    public function destroy(Request $request, Branch $branch)
    {
        $this->ensureSameStore($request, $branch);

        $branch->loadCount(['employees', 'sales', 'purchases']);

        if ($branch->employees_count || $branch->sales_count || $branch->purchases_count) {
            return back()->with('error', 'Cabang sudah dipakai pada data operasional. Nonaktifkan cabang jika tidak digunakan lagi.');
        }

        $branch->delete();

        return redirect()->route('admin.branches.index')->with('success', 'Cabang berhasil dihapus.');
    }

    private function rules(int $storeId, ?int $ignoreId = null): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('branches', 'code')
                    ->where(fn ($query) => $query->where('store_id', $storeId))
                    ->ignore($ignoreId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }

    private function ensureSameStore(Request $request, Branch $branch): void
    {
        $storeId = session('current_store_id');

        abort_unless($storeId && $branch->store_id === $storeId, 404);
    }
}
