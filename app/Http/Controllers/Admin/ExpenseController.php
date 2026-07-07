<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

use App\Http\Controllers\Concerns\HasStoreScope;

class ExpenseController extends Controller
{
    use HasStoreScope;

    public function index(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();
        $user = Auth::user();
        /** @var \App\Models\User|null $user */

        $query = Expense::with(["expenseCategory", "user", "branch"])
            ->where("store_id", $storeId)
            ->latest();
        // User dengan sale.void (admin ke atas) bisa filter multi-branch
        if (
            $user &&
            $user->can("sale.void") &&
            $request->filled("branch_ids")
        ) {
            $query->whereIn("branch_id", (array) $request->input("branch_ids"));
        } elseif ($branchId) {
            $query->where("branch_id", $branchId);
        }

        $expenses = $query->get();

        return Inertia::render("Admin/Expenses/Index", [
            "expenses" => $expenses,
            "branches" => \App\Models\Branch::where("store_id", $storeId)
                ->where("is_active", true)
                ->get(["id", "code", "name"]),
            "filters" => [
                "branch_ids" => $request->input("branch_ids", []),
            ],
        ]);
    }

    public function create()
    {
        $storeId = session("current_store_id");

        $categories = ExpenseCategory::forStore($storeId)
            ->orderBy("name")
            ->get(["id", "name", "code"]);

        return Inertia::render("Admin/Expenses/Create", [
            "categories" => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "expense_category_id" => "nullable|exists:expense_categories,id",
            "expense_date" => "required|date",
            "amount" => "required|numeric|min:0.01",
            "notes" => "nullable|string|max:1000",
        ]);

        // Generate expense number
        $dateStr = now()->format("Ymd");
        $lastExpense = Expense::where(
            "expense_no",
            "like",
            "EXP-{$dateStr}-%",
        )->count();
        $expenseNo =
            "EXP-" .
            $dateStr .
            "-" .
            str_pad($lastExpense + 1, 3, "0", STR_PAD_LEFT);

        $validated["expense_no"] = $expenseNo;
        $validated["user_id"] = Auth::user()->id;
        $validated["store_id"] = session("current_store_id");
        $validated["branch_id"] =
            session("current_branch_id") ?? session("branch_id");
        $validated["status"] = "posted";

        Expense::create($validated);

        return redirect()
            ->route("admin.expenses.index")
            ->with("success", "Pengeluaran berhasil dicatat.");
    }

    public function show(Expense $expense)
    {
        $expense->load(["expenseCategory", "user", "store", "branch"]);

        return Inertia::render("Admin/Expenses/Show", [
            "expense" => $expense,
        ]);
    }

    public function destroy(Expense $expense)
    {
        if ($expense->status !== "draft") {
            return back()->withErrors([
                "error" => "Hanya pengeluaran status draft yang dapat dihapus.",
            ]);
        }

        $expense->delete();

        return redirect()
            ->route("admin.expenses.index")
            ->with("success", "Pengeluaran berhasil dihapus.");
    }

    public function updateStatus(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            "status" => "required|in:posted,cancelled",
        ]);

        $expense->update(["status" => $validated["status"]]);

        return back()->with(
            "success",
            "Status pengeluaran berhasil diperbarui.",
        );
    }
}
