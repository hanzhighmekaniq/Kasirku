<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreWallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletController extends Controller
{
    /**
     * Overview saldo semua store — semua pembayaran PG masuk ke akun
     * platform, lalu di-credit ke wallet per store di sini.
     */
    public function index()
    {
        $wallets = StoreWallet::with('store:id,name,code')
            ->orderByDesc('balance')
            ->get()
            ->map(fn ($w) => [
                'id' => $w->id,
                'store_id' => $w->store_id,
                'store_name' => $w->store?->name ?? '—',
                'store_code' => $w->store?->code ?? '—',
                'balance' => (float) $w->balance,
                'pending_balance' => (float) $w->pending_balance,
                'withdrawn' => (float) $w->withdrawn,
                'updated_at' => $w->updated_at?->toISOString(),
            ]);

        $stats = [
            'total_balance' => $wallets->sum('balance'),
            'total_pending' => $wallets->sum('pending_balance'),
            'total_withdrawn' => $wallets->sum('withdrawn'),
            'store_count' => $wallets->count(),
        ];

        return Inertia::render('Developer/Wallets/Index', [
            'wallets' => $wallets,
            'stats' => $stats,
        ]);
    }

    public function show(Store $store)
    {
        $wallet = StoreWallet::firstOrCreate(
            ['store_id' => $store->id],
            ['balance' => 0, 'pending_balance' => 0, 'withdrawn' => 0],
        );

        $transactions = WalletTransaction::where('store_id', $store->id)
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->paginate(30)
            ->through(fn ($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'type_label' => WalletTransaction::typeLabels()[$t->type] ?? $t->type,
                'amount' => (float) $t->amount,
                'balance_after' => (float) $t->balance_after,
                'description' => $t->description,
                'created_by' => $t->creator?->name,
                'created_at' => $t->created_at?->toISOString(),
            ]);

        return Inertia::render('Developer/Wallets/Show', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'code' => $store->code,
            ],
            'wallet' => [
                'balance' => (float) $wallet->balance,
                'pending_balance' => (float) $wallet->pending_balance,
                'withdrawn' => (float) $wallet->withdrawn,
            ],
            'transactions' => $transactions,
        ]);
    }

    /**
     * Manual balance adjustment (e.g. refund correction, developer override).
     */
    public function adjust(Request $request, Store $store)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'description' => 'required|string|max:500',
        ]);

        $wallet = StoreWallet::firstOrCreate(
            ['store_id' => $store->id],
            ['balance' => 0, 'pending_balance' => 0, 'withdrawn' => 0],
        );

        $amount = (float) $validated['amount'];

        if ($amount >= 0) {
            $wallet->credit($amount, 'adjustment', null, $validated['description'], $request->user()->id);
        } else {
            $wallet->debit(abs($amount), 'adjustment', null, $validated['description'], $request->user()->id);
        }

        return back()->with('success', 'Saldo wallet berhasil disesuaikan.');
    }
}
