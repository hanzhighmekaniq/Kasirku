<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
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

        // Session menyimpan store_id sebagai string, sedangkan kolomnya
        // integer. Perbandingan strict tanpa cast membuat 1 !== "1" selalu
        // benar sehingga setiap pelunasan ditolak.
        abort_if($customer->store_id !== (int) $storeId, 403);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $amount = (float) $validated['amount'];
        $currentDebt = (float) $customer->debt_balance;

        // Ditolak sebagai error validasi, bukan back()->with('error'):
        // pesannya menempel di field dan klien JSON menerima 422, bukan 302
        // yang terlihat seolah berhasil.
        if ($amount > $currentDebt) {
            throw ValidationException::withMessages([
                'amount' => 'Jumlah pelunasan melebihi hutang. Sisa: Rp'.number_format($currentDebt),
            ]);
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
