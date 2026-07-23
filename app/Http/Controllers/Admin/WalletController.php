<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreWallet;
use App\Models\WalletTransaction;
use Inertia\Inertia;

class WalletController extends Controller
{
    /** Ambil store_id dari session. */
    private function getStoreId(): int
    {
        return session('current_store_id') ?? Store::first()->id;
    }

    /**
     * Saldo & riwayat transaksi wallet toko sendiri. Semua pembayaran PG
     * (QRIS/VA/E-Wallet) masuk ke akun platform, lalu di-credit ke sini.
     */
    public function index()
    {
        $storeId = $this->getStoreId();

        $wallet = StoreWallet::firstOrCreate(
            ['store_id' => $storeId],
            ['balance' => 0, 'pending_balance' => 0, 'withdrawn' => 0],
        );

        $transactions = WalletTransaction::where('store_id', $storeId)
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn ($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'type_label' => WalletTransaction::typeLabels()[$t->type] ?? $t->type,
                'amount' => (float) $t->amount,
                'balance_after' => (float) $t->balance_after,
                'description' => $t->description,
                'created_at' => $t->created_at?->toISOString(),
            ]);

        return Inertia::render('Admin/Wallet/Index', [
            'wallet' => [
                'balance' => (float) $wallet->balance,
                'pending_balance' => (float) $wallet->pending_balance,
                'withdrawn' => (float) $wallet->withdrawn,
            ],
            'transactions' => $transactions,
        ]);
    }
}
