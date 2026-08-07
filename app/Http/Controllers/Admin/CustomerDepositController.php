<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerDeposit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerDepositController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');

        $deposits = CustomerDeposit::with(['customer:id,name,phone', 'user:id,name'])
            ->where('store_id', $storeId)
            ->when($request->customer_id, fn ($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/CustomerDeposits/Index', [
            'deposits' => $deposits,
            'filters' => $request->only(['customer_id', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');
        $userId = $request->user()->id;

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'nullable|string|max:50',
            'reference_no' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'deposit_at' => 'required|date',
        ]);

        // Generate deposit number
        $dateStr = now()->format('Ymd');
        $lastDeposit = CustomerDeposit::where('store_id', $storeId)
            ->where('deposit_no', 'like', "DEP-{$dateStr}-%")
            ->count();
        $depositNo = 'DEP-'.$dateStr.'-'.str_pad($lastDeposit + 1, 3, '0', STR_PAD_LEFT);

        DB::beginTransaction();

        try {
            CustomerDeposit::create([
                'store_id' => $storeId,
                'customer_id' => $validated['customer_id'],
                'user_id' => $userId,
                'deposit_no' => $depositNo,
                'type' => 'deposit',
                'amount' => $validated['amount'],
                'remaining_balance' => $validated['amount'],
                'total_used' => 0,
                'payment_method' => $validated['payment_method'] ?? null,
                'reference_no' => $validated['reference_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'deposit_at' => $validated['deposit_at'],
            ]);

            DB::commit();

            return redirect()
                ->route('admin.customer-deposits.index')
                ->with('success', 'Deposit berhasil dicatat.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Gagal mencatat deposit: '.$e->getMessage()]);
        }
    }

    public function usage(Request $request)
    {
        $storeId = session('current_store_id');
        $userId = $request->user()->id;

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'deposit_id' => 'required|exists:customer_deposits,id',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $deposit = CustomerDeposit::where('store_id', $storeId)
            ->findOrFail($validated['deposit_id']);

        if ($deposit->customer_id != $validated['customer_id']) {
            return back()->withErrors(['error' => 'Deposit bukan milik customer ini.']);
        }

        if ($deposit->remaining_balance < $validated['amount'] - 0.01) {
            return back()->withErrors([
                'error' => 'Saldo deposit tidak cukup. Sisa: Rp '.number_format($deposit->remaining_balance, 0, ',', '.'),
            ]);
        }

        DB::beginTransaction();

        try {
            $deposit->deduct($validated['amount']);

            // Generate usage deposit number
            $dateStr = now()->format('Ymd');
            $lastDeposit = CustomerDeposit::where('store_id', $storeId)
                ->where('deposit_no', 'like', "DEP-{$dateStr}-%")
                ->count();
            $usageNo = 'DEP-'.$dateStr.'-'.str_pad($lastDeposit + 1, 3, '0', STR_PAD_LEFT);

            // Record usage entry
            CustomerDeposit::create([
                'store_id' => $storeId,
                'customer_id' => $validated['customer_id'],
                'user_id' => $userId,
                'deposit_no' => $usageNo,
                'type' => 'usage',
                'amount' => -$validated['amount'],
                'remaining_balance' => $deposit->fresh()->remaining_balance,
                'total_used' => 0,
                'payment_method' => null,
                'reference_no' => $deposit->deposit_no,
                'notes' => $validated['notes'] ?? 'Penggunaan deposit',
                'deposit_at' => now(),
            ]);

            DB::commit();

            return back()->with('success', 'Penggunaan deposit berhasil dicatat. Sisa: Rp '.number_format($deposit->fresh()->remaining_balance, 0, ',', '.'));
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Gagal mencatat penggunaan: '.$e->getMessage()]);
        }
    }

    public function balance(Request $request)
    {
        $storeId = session('current_store_id');

        $customerId = $request->customer_id;
        $totalBalance = CustomerDeposit::where('store_id', $storeId)
            ->where('customer_id', $customerId)
            ->where('type', 'deposit')
            ->sum('remaining_balance');

        return response()->json([
            'customer_id' => $customerId,
            'balance' => (float) $totalBalance,
        ]);
    }
}
