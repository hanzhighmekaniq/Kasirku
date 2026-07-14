<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ExpenseCategoryController extends Controller
{
    public function index()
    {
        $storeId = session('current_store_id');

        $categories = ExpenseCategory::forStore($storeId)
            ->withCount('expenses')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/ExpenseCategories/Index', [
            'categories' => $categories,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/ExpenseCategories/Create');
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('expense_categories', 'name')->where(
                    fn ($q) => $q->where('store_id', $storeId),
                ),
            ],
            'description' => 'nullable|string|max:1000',
        ]);

        $validated['store_id'] = $storeId;
        $validated['code'] = 'EXP-CAT-'.strtoupper(Str::random(4));

        $category = ExpenseCategory::create($validated);

        // Quick-create: return JSON tanpa redirect (dipakai dari expense create)
        if ($request->has('_quick_create')) {
            return response()->json([
                'id' => $category->id,
                'name' => $category->name,
                'code' => $category->code,
            ]);
        }

        // JSON response untuk AJAX/fetch request
        if ($request->expectsJson()) {
            return response()->json([
                'id' => $category->id,
                'name' => $category->name,
                'code' => $category->code,
            ]);
        }

        return redirect()
            ->route('admin.expense-categories.index')
            ->with('success', 'Kategori pengeluaran berhasil ditambahkan.');
    }

    public function edit(ExpenseCategory $expenseCategory)
    {
        return Inertia::render('Admin/ExpenseCategories/Edit', [
            'category' => $expenseCategory,
        ]);
    }

    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('expense_categories', 'name')
                    ->where(
                        fn ($q) => $q->where(
                            'store_id',
                            session('current_store_id'),
                        ),
                    )
                    ->ignore($expenseCategory->id),
            ],
            'description' => 'nullable|string|max:1000',
        ]);

        $expenseCategory->update($validated);

        return redirect()
            ->route('admin.expense-categories.index')
            ->with('success', 'Kategori pengeluaran berhasil diupdate.');
    }

    public function destroy(ExpenseCategory $expenseCategory)
    {
        if ($expenseCategory->expenses()->count() > 0) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Kategori masih digunakan oleh data pengeluaran.',
                ], 422);
            }

            return back()->withErrors([
                'error' => 'Kategori masih digunakan oleh data pengeluaran.',
            ]);
        }

        $expenseCategory->delete();

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Kategori pengeluaran berhasil dihapus.']);
        }

        return redirect()
            ->route('admin.expense-categories.index')
            ->with('success', 'Kategori pengeluaran berhasil dihapus.');
    }
}
