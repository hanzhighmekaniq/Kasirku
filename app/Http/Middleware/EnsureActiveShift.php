<?php

namespace App\Http\Middleware;

use App\Models\CashierShift;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Middleware: pastikan kasir punya shift aktif sebelum transaksi.
// Hanya berlaku untuk role "kasir". Admin tidak terkena pembatasan ini.
class EnsureActiveShift
{
    public function handle(Request $request, Closure $next)
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if (!$user || !$user->isKasir()) {
            return $next($request);
        }

        $storeId =
            session("current_store_id") ?? $user->stores()->get()->first()?->id;

        if (!$storeId) {
            return $next($request);
        }

        $activeShift = CashierShift::where("store_id", $storeId)
            ->where("user_id", $user->id)
            ->where("status", "open")
            ->first();

        if (!$activeShift) {
            if ($request->expectsJson() || $request->is("api/*")) {
                return response()->json(
                    [
                        "success" => false,
                        "message" =>
                            "Anda harus membuka shift terlebih dahulu sebelum melakukan transaksi.",
                    ],
                    422,
                );
            }

            return redirect()
                ->route("admin.cashier-shifts.create")
                ->with(
                    "error",
                    "Anda harus membuka shift terlebih dahulu sebelum melakukan transaksi.",
                );
        }

        return $next($request);
    }
}
