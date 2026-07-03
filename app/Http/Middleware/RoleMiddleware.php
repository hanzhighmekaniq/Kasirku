<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cek apakah user punya salah satu dari roles yang diminta,
 * dalam konteks store yang sedang aktif (Spatie teams).
 *
 * Usage:
 *   ->middleware('role:developer')
 *   ->middleware('role:owner,admin')
 */
class RoleMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$roles,
    ): Response {
        $user = $request->user();

        if (!$user) {
            return redirect()->route("login");
        }

        // Developer selalu lolos di semua route non-developer panel
        if ($user->isDeveloper()) {
            return $next($request);
        }

        $storeId = $request->session()->get("current_store_id");
        if ($storeId) {
            app(
                \Spatie\Permission\PermissionRegistrar::class,
            )->setPermissionsTeamId($storeId);
        }

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        // Owner juga punya akses ke semua route admin/kasir
        if ($user->hasRole("owner")) {
            return $next($request);
        }

        if ($request->expectsJson() && !$request->header("X-Inertia")) {
            return response()->json(["message" => "Forbidden"], 403);
        }

        abort(403, "Akses ditolak.");
    }
}
