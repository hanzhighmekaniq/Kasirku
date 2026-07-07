<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pastikan user punya store aktif di session.
 * Jika user punya > 1 store → redirect ke halaman pilih toko.
 * Jika 1 store → auto-set.
 * Set Spatie team ID = current_store_id agar permission check
 * otomatis terikat ke store yang sedang aktif.
 */
class StoreMiddleware
{
    /** Route names yang boleh diakses tanpa store dipilih */
    private const STORE_EXEMPT_ROUTES = [
        "admin.store.select",
        "admin.store.select.post",
        "admin.store.switch",
        "admin.branch.select",
        "admin.branch.select.post",
        "admin.branch.switch",
        "admin.profile.edit",
        "admin.profile.update",
        "admin.profile.destroy",
        "admin.activity-logs.index",
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route("login");
        }

        // Developer tidak perlu store context
        if ($user->isDeveloper()) {
            return $next($request);
        }

        $storeId = $request->session()->get("current_store_id");

        // Cek apakah route saat ini exempt dari store requirement
        $currentRoute = $request->route()?->getName() ?? "";
        $isExempt =
            in_array($currentRoute, self::STORE_EXEMPT_ROUTES, true) ||
            str_starts_with($currentRoute, "admin.store.") ||
            str_starts_with($currentRoute, "admin.branch.");

        // ── Tidak ada store di session ──────────────────────────────
        if (!$storeId) {
            // Route exempt → biarkan lewat tanpa store
            if ($isExempt) {
                return $next($request);
            }

            $storeCount = $user->stores()->count();

            if ($storeCount === 0) {
                return redirect()
                    ->route("login")
                    ->with(
                        "error",
                        "Akun kamu belum terhubung ke toko mana pun.",
                    );
            }

            if ($storeCount > 1) {
                // Multi store → suruh pilih toko dulu
                $request->session()->put("url.intended", $request->url());
                return redirect()->route("admin.store.select");
            }

            // Single store → auto-set
            $storeId = $user->stores()->first()->id;
            $request->session()->put("current_store_id", $storeId);
        }

        // ── Validasi store masih bisa diakses ───────────────────────
        if ($storeId) {
            $hasAccess = $user
                ->stores()
                ->where("stores.id", $storeId)
                ->exists();

            if (!$hasAccess) {
                $request
                    ->session()
                    ->forget(["current_store_id", "current_branch_id"]);

                // Route exempt → biarkan lewat
                if ($isExempt) {
                    return $next($request);
                }

                $storeCount = $user->stores()->count();

                if ($storeCount > 1) {
                    return redirect()->route("admin.store.select");
                }

                $first = $user->stores()->first();
                if ($first) {
                    $storeId = $first->id;
                    $request->session()->put("current_store_id", $storeId);
                } else {
                    return redirect()
                        ->route("login")
                        ->with(
                            "error",
                            "Akun kamu belum terhubung ke toko mana pun.",
                        );
                }
            }

            // Set Spatie team context → semua permission check pakai store ini
            app(
                \Spatie\Permission\PermissionRegistrar::class,
            )->setPermissionsTeamId($storeId);
        }

        return $next($request);
    }
}
