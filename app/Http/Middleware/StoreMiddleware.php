<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pastikan user punya store aktif di session.
 * Set Spatie team ID = current_store_id agar permission check
 * otomatis terikat ke store yang sedang aktif.
 */
class StoreMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Developer tidak perlu store context
        if ($user->isDeveloper()) {
            return $next($request);
        }

        $storeId = $request->session()->get('current_store_id');

        // Set / validasi store dari session
        if (!$storeId) {
            $first = $user->stores()->first();
            if ($first) {
                $storeId = $first->id;
                $request->session()->put('current_store_id', $storeId);
            }
        }

        if ($storeId) {
            // Pastikan user masih punya akses ke store ini
            $hasAccess = $user->stores()->where('stores.id', $storeId)->exists()
                // Developer akses semua store
                || $user->hasRole('developer');

            if (!$hasAccess) {
                $request->session()->forget(['current_store_id', 'current_branch_id']);
                $first = $user->stores()->first();
                if ($first) {
                    $storeId = $first->id;
                    $request->session()->put('current_store_id', $storeId);
                } else {
                    return redirect()->route('login')
                        ->with('error', 'Akun kamu belum terhubung ke toko mana pun.');
                }
            }

            // Set Spatie team context → semua permission check pakai store ini
            app(\Spatie\Permission\PermissionRegistrar::class)
                ->setPermissionsTeamId($storeId);
        }

        return $next($request);
    }
}
