<?php

namespace App\Http\Middleware;

use Closure;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Inertia\Inertia;

/**
 * Extends Spatie's PermissionMiddleware with:
 * 1. Developer bypass (is_developer=true lolos semua)
 * 2. Auto-set Spatie team context dari session current_store_id
 * 3. Error yang jelas via Inertia (bukan redirect silent)
 */
class PermissionMiddleware extends
    \Spatie\Permission\Middleware\PermissionMiddleware
{
    public function handle($request, Closure $next, $permission, $guard = null)
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route("login");
        }

        // Developer bypass
        if ($user->isDeveloper()) {
            return $next($request);
        }

        // Set Spatie team context — WAJIB agar $user->can() nemu role per store
        $storeId = $request->session()->get("current_store_id");
        if ($storeId) {
            app(
                \Spatie\Permission\PermissionRegistrar::class,
            )->setPermissionsTeamId((int) $storeId);
        }

        try {
            return parent::handle($request, $next, $permission, $guard);
        } catch (UnauthorizedException $e) {
            // Tampilkan error yang jelas, jangan redirect silent
            if ($request->header("X-Inertia")) {
                return Inertia::render("Blocked/PermissionDenied", [
                    "permission" => $permission,
                    "error" => "Anda tidak memiliki izin \"{$permission}\".",
                ])
                    ->toResponse($request)
                    ->setStatusCode(403);
            }

            // Non-Inertia: abort dengan pesan jelas
            abort(403, "Forbidden — tidak memiliki permission: {$permission}");
        }
    }
}
