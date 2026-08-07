<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\PlatformPaymentGateway;
use App\Models\StoreWallet;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function index(Request $request)
    {
        $query = WithdrawalRequest::with('store:id,name,code')
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        $withdrawals = $query->get();

        return Inertia::render('Developer/Withdrawals/Index', [
            'withdrawals' => $withdrawals,
            'isSandbox' => PlatformPaymentGateway::isSandbox(),
            'payoutMode' => PlatformPaymentGateway::getPayoutMode(),
        ]);
    }

    public function approve(WithdrawalRequest $withdrawalRequest)
    {
        if ($withdrawalRequest->status !== WithdrawalRequest::STATUS_PENDING) {
            return back()->withErrors(['status' => 'Hanya permintaan pending yang dapat disetujui.']);
        }

        DB::transaction(function () use ($withdrawalRequest) {
            $wallet = StoreWallet::where('store_id', $withdrawalRequest->store_id)->first();

            $withdrawable = $wallet->withdrawableBalance();

            if (! $wallet || $withdrawable < $withdrawalRequest->amount) {
                abort(422, 'Saldo production tidak mencukupi. Saldo yang bisa ditarik: Rp '.number_format($withdrawable, 0, ',', '.'));
            }

            $wallet->debit(
                $withdrawalRequest->amount,
                'withdrawal_debit',
                $withdrawalRequest,
                "Penarikan dana #{$withdrawalRequest->id}",
                auth()->id(),
            );

            $wallet->increment('withdrawn', $withdrawalRequest->amount);

            $withdrawalRequest->update([
                'status' => WithdrawalRequest::STATUS_APPROVED,
                'processed_by' => auth()->id(),
                'processed_at' => now(),
            ]);
        });

        return back()->with('success', 'Penarikan dana berhasil disetujui. Transfer manual ke rekening store.');
    }

    public function markPaid(WithdrawalRequest $withdrawalRequest)
    {
        if ($withdrawalRequest->status !== WithdrawalRequest::STATUS_APPROVED) {
            return back()->withErrors(['status' => 'Hanya permintaan yang sudah disetujui yang bisa ditandai sebagai dibayar.']);
        }

        $withdrawalRequest->update([
            'status' => WithdrawalRequest::STATUS_COMPLETED,
            'paid_at' => now(),
        ]);

        return back()->with('success', 'Penarikan dana ditandai sebagai sudah dibayar.');
    }

    public function reject(Request $request, WithdrawalRequest $withdrawalRequest)
    {
        if ($withdrawalRequest->status !== WithdrawalRequest::STATUS_PENDING) {
            return back()->withErrors(['status' => 'Hanya permintaan pending yang dapat ditolak.']);
        }

        $validated = $request->validate([
            'admin_notes' => 'required|string',
        ]);

        $withdrawalRequest->update([
            'status' => WithdrawalRequest::STATUS_REJECTED,
            'admin_notes' => $validated['admin_notes'],
            'processed_by' => auth()->id(),
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Penarikan dana berhasil ditolak.');
    }
}
