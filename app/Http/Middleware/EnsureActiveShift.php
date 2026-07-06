<?php

namespace App\Http\Middleware;

use App\Models\CashierShift;
use App\Models\Store;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Pastikan user punya shift aktif sebelum transaksi POS.
 *
 * Hanya berlaku jika:
 * 1. User punya permission shift.open (artinya role yang perlu shift)
 * 2. Store punya feature 'cashier_shift' aktif
 * 3. User TIDAK punya shift.manage (owner/admin/supervisor bebas)
 */
class EnsureActiveShift
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }
        // Developer dan user tanpa permission shift.open tidak kena enforce
        /** @var \App\Models\User $user */

        if ($user->isDeveloper() || !$user->can("shift.open")) {
            return $next($request);
        }

        // Owner/admin/supervisor (punya shift.manage) tidak kena enforce
        if ($user->can("shift.manage")) {
            return $next($request);
        }

        $storeId = session("current_store_id");
        if (!$storeId) {
            return $next($request);
        }

        // Cek apakah store ini mengaktifkan fitur shift
        $store = Store::with(["storeType"])->find($storeId);
        if (!$store || !$store->hasFeature("cashier_shift")) {
            return $next($request);
        }

        // Cek shift aktif
        $activeShift = CashierShift::where("store_id", $storeId)
            ->where("user_id", $user->id)
            ->where("status", "open")
            ->exists();

        if (!$activeShift) {
            if ($request->expectsJson() || $request->is("api/*")) {
                return response()->json(
                    [
                        "success" => false,
                        "message" =>
                            "Buka shift kasir terlebih dahulu sebelum melakukan transaksi.",
                    ],
                    422,
                );
            }

            return redirect()
                ->route("admin.cashier-shifts.create")
                ->with(
                    "error",
                    "Buka shift kasir terlebih dahulu sebelum melakukan transaksi.",
                );
        }

        return $next($request);
    }
}
