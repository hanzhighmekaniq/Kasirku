<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use App\Services\ImageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    use HasStoreScope;

    public function index(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();
        $user = Auth::user();
        /** @var User|null $user */
        $query = Expense::with(['expenseCategory', 'user', 'branch'])
            ->where('store_id', $storeId)
            ->latest();
        // User dengan sale.void (admin ke atas) bisa filter multi-branch
        if (
            $user &&
            $user->can('sale.void') &&
            $request->filled('branch_ids')
        ) {
            $query->whereIn('branch_id', (array) $request->input('branch_ids'));
        } elseif ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $expenses = $query->get();

        return Inertia::render('Admin/Expenses/Index', [
            'expenses' => $expenses,
            'branches' => Branch::where('store_id', $storeId)
                ->where('is_active', true)
                ->get(['id', 'code', 'name']),
            'filters' => [
                'branch_ids' => $request->input('branch_ids', []),
            ],
        ]);
    }

    public function create()
    {
        $storeId = session('current_store_id');

        $categories = ExpenseCategory::forStore($storeId)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Expenses/Create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
            'receipt_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'is_recurring' => 'boolean',
            'recurrence_type' => 'nullable|required_if:is_recurring,true|in:weekly,monthly,yearly',
        ]);

        // Handle receipt image upload
        $receiptPath = null;
        if ($request->hasFile('receipt_image')) {
            $receiptPath = app(ImageService::class)->upload(
                $request->file('receipt_image'),
                'expenses/receipts',
            );
        }

        // Generate expense number
        $dateStr = now()->format('Ymd');
        $lastExpense = Expense::where(
            'expense_no',
            'like',
            "EXP-{$dateStr}-%",
        )->count();
        $expenseNo =
            'EXP-'.
            $dateStr.
            '-'.
            str_pad($lastExpense + 1, 3, '0', STR_PAD_LEFT);

        $validated['expense_no'] = $expenseNo;
        $validated['user_id'] = Auth::user()->id;
        $validated['store_id'] = session('current_store_id');
        $validated['branch_id'] =
            session('current_branch_id') ?? session('branch_id');
        $validated['status'] = 'draft';
        $validated['is_recurring'] = $validated['is_recurring'] ?? false;
        $validated['receipt_image'] = $receiptPath;

        // Hitung next_due_date jika recurring
        if ($validated['is_recurring'] && ! empty($validated['recurrence_type'])) {
            $validated['next_due_date'] = match ($validated['recurrence_type']) {
                'weekly' => Carbon::parse($validated['expense_date'])->addWeek(),
                'monthly' => Carbon::parse($validated['expense_date'])->addMonth(),
                'yearly' => Carbon::parse($validated['expense_date'])->addYear(),
            };
        }

        Expense::create($validated);

        $message = 'Pengeluaran berhasil dicatat.';
        if ($validated['is_recurring']) {
            $message .= ' Akan otomatis dibuat ulang setiap '.($validated['recurrence_type'] ?? 'bulan').'.';
        }

        return redirect()
            ->route('admin.expenses.index')
            ->with('success', $message);
    }

    public function show(Expense $expense)
    {
        $expense->load(['expenseCategory', 'user', 'store', 'branch']);

        return Inertia::render('Admin/Expenses/Show', [
            'expense' => $expense,
        ]);
    }

    public function destroy(Expense $expense)
    {
        if ($expense->status !== 'draft') {
            return back()->withErrors([
                'error' => 'Hanya pengeluaran status draft yang dapat dihapus.',
            ]);
        }

        $expense->delete();

        return redirect()
            ->route('admin.expenses.index')
            ->with('success', 'Pengeluaran berhasil dihapus.');
    }

    public function updateStatus(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'status' => 'required|in:posted,cancelled',
        ]);

        $expense->update(['status' => $validated['status']]);

        return back()->with(
            'success',
            'Status pengeluaran berhasil diperbarui.',
        );
    }

    public function approve(Request $request, Expense $expense)
    {
        abort_unless($request->user()->can('expense.approve'), 403);

        if ($expense->status !== 'pending_approval') {
            return back()->withErrors(['error' => 'Hanya pengeluaran pending approval yang bisa di-approve.']);
        }

        $expense->update([
            'status' => 'posted',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Pengeluaran berhasil di-approve.');
    }

    public function reject(Request $request, Expense $expense)
    {
        abort_unless($request->user()->can('expense.approve'), 403);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        if ($expense->status !== 'pending_approval') {
            return back()->withErrors(['error' => 'Hanya pengeluaran pending approval yang bisa ditolak.']);
        }

        $expense->update([
            'status' => 'draft',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', 'Pengeluaran ditolak. Alasan: '.$validated['rejection_reason']);
    }
}
