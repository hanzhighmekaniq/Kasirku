<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DebtController extends Controller
{
    public function index()
    {
        $storeId = session('current_store_id');

        $customers = Customer::where('store_id', $storeId)
            ->where('debt_balance', '>', 0)
            ->with(['debtLogs' => fn ($q) => $q->latest()->limit(5)])
            ->orderByDesc('debt_balance')
            ->get(['id', 'code', 'name', 'phone', 'debt_balance', 'credit_limit']);

        return Inertia::render('Admin/Debts/Index', [
            'customers' => $customers,
        ]);
    }

    public function pay(Request $request, Customer $customer)
    {
        $storeId = session('current_store_id');

        if ($customer->store_id !== $storeId) {
            return back()->with('error', 'Pelanggan tidak ditemukan.');
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $amount = (float) $validated['amount'];
        $currentDebt = (float) $customer->debt_balance;

        if ($amount > $currentDebt) {
            return back()->with('error', 'Jumlah pelunasan melebihi hutang. Sisa: Rp'.number_format($currentDebt));
        }

        $newBalance = $currentDebt - $amount;

        CustomerDebtLog::create([
            'customer_id' => $customer->id,
            'store_id' => $storeId,
            'type' => 'payment',
            'amount' => $amount,
            'balance_after' => $newBalance,
            'notes' => $validated['notes'] ?? 'Pelunasan hutang',
            'created_by' => Auth::id(),
        ]);

        $customer->update(['debt_balance' => $newBalance]);

        return back()->with('success', 'Pelunasan berhasil. Sisa: Rp'.number_format($newBalance));
    }
}
