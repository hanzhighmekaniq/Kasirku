<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformPaymentGateway;
use App\Models\StoreWallet;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    private function getStoreId(): int
    {
        return session('current_store_id') ?? auth()->id();
    }

    public function index()
    {
        $storeId = $this->getStoreId();

        $wallet = StoreWallet::firstOrCreate(
            ['store_id' => $storeId],
            ['balance' => 0, 'pending_balance' => 0, 'withdrawn' => 0],
        );

        $withdrawals = WithdrawalRequest::where('store_id', $storeId)
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn (WithdrawalRequest $w) => [
                'id' => $w->id,
                'amount' => (float) $w->amount,
                'status' => $w->status,
                'status_label' => $w->statusLabel(),
                'bank_name' => $w->bank_name,
                'bank_account_name' => $w->bank_account_name,
                'bank_account_number' => $w->bank_account_number,
                'notes' => $w->notes,
                'admin_notes' => $w->admin_notes,
                'created_at' => $w->created_at?->toISOString(),
                'processed_at' => $w->processed_at?->toISOString(),
            ]);

        return Inertia::render('Admin/Wallet/Withdrawals', [
            'withdrawals' => $withdrawals,
            'isSandbox' => PlatformPaymentGateway::isSandbox(),
            'withdrawableBalance' => $wallet->withdrawableBalance(),
            'wallet' => [
                'balance' => (float) $wallet->balance,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $storeId = $this->getStoreId();

        $wallet = StoreWallet::where('store_id', $storeId)->first();

        abort_unless($wallet, 404);

        $withdrawable = $wallet->withdrawableBalance();

        $validated = $request->validate([
            'amount' => [
                'required',
                'numeric',
                'min:'.WithdrawalRequest::MIN_AMOUNT,
                'max:'.$withdrawable,
            ],
            'bank_name' => ['required', 'string', 'max:100'],
            'bank_account_name' => ['required', 'string', 'max:100'],
            'bank_account_number' => ['required', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [
            'amount.min' => 'Minimal penarikan Rp '.number_format(WithdrawalRequest::MIN_AMOUNT, 0, ',', '.'),
            'amount.max' => 'Saldo yang bisa ditarik hanya Rp '.number_format($withdrawable, 0, ',', '.').'. Saldo dari transaksi sandbox tidak dapat ditarik.',
        ]);

        DB::transaction(function () use ($validated, $storeId, $wallet) {
            WithdrawalRequest::create([
                'store_id' => $storeId,
                'amount' => $validated['amount'],
                'status' => WithdrawalRequest::STATUS_PENDING,
                'bank_name' => $validated['bank_name'],
                'bank_account_name' => $validated['bank_account_name'],
                'bank_account_number' => $validated['bank_account_number'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $wallet->decrement('balance', $validated['amount']);
            $wallet->increment('pending_balance', $validated['amount']);
        });

        return back()->with('success', 'Permintaan penarikan berhasil diajukan.');
    }

    public function cancel(WithdrawalRequest $withdrawalRequest)
    {
        $storeId = $this->getStoreId();

        abort_unless(
            $withdrawalRequest->store_id === $storeId
                && $withdrawalRequest->status === WithdrawalRequest::STATUS_PENDING,
            403,
        );

        DB::transaction(function () use ($withdrawalRequest) {
            $wallet = StoreWallet::where('store_id', $withdrawalRequest->store_id)->first();

            if ($wallet) {
                $wallet->decrement('pending_balance', $withdrawalRequest->amount);
                $wallet->increment('balance', $withdrawalRequest->amount);
            }

            $withdrawalRequest->update([
                'status' => WithdrawalRequest::STATUS_REJECTED,
                'admin_notes' => 'Dibatalkan oleh toko',
            ]);
        });

        return back()->with('success', 'Permintaan penarikan berhasil dibatalkan.');
    }
}
