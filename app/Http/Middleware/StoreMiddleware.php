<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
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
        'admin.store.select',
        'admin.store.select.post',
        'admin.store.switch',
        'admin.branch.select',
        'admin.branch.select.post',
        'admin.branch.switch',
        'admin.profile.edit',
        'admin.profile.update',
        'admin.profile.destroy',
        'admin.activity-logs.index',
        'sidebar-order',
        'welcome',
        'onboarding',
        'onboarding.store',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        // Developer tidak perlu store context
        if ($user->isDeveloper()) {
            return $next($request);
        }

        $storeId = $request->session()->get('current_store_id');

        // Cek apakah route saat ini exempt dari store requirement
        $currentRoute = $request->route()?->getName() ?? '';
        $isExempt =
            in_array($currentRoute, self::STORE_EXEMPT_ROUTES, true) ||
            str_starts_with($currentRoute, 'admin.store.') ||
            str_starts_with($currentRoute, 'admin.branch.');

        // ── Tidak ada store di session ──────────────────────────────
        if (! $storeId) {
            // Route exempt → biarkan lewat tanpa store
            if ($isExempt) {
                return $next($request);
            }

            $storeCount = $user->stores()->count();

            if ($storeCount === 0) {
                return redirect()
                    ->route('onboarding')
                    ->with(
                        'warning',
                        'Kamu belum punya toko. Buat toko dulu untuk mulai menggunakan kasir.',
                    );
            }

            if ($storeCount > 1) {
                // Multi store → suruh pilih toko dulu
                $request->session()->put('url.intended', $request->url());

                return redirect()->route('admin.store.select');
            }

            // Single store → auto-set (hanya store aktif)
            $firstActive = $user->stores()->where('is_active', true)->first();
            if (! $firstActive) {
                return redirect()
                    ->route('login')
                    ->with(
                        'error',
                        'Semua toko kamu sudah tidak aktif. Hubungi admin.',
                    );
            }
            $storeId = $firstActive->id;
            $request->session()->put('current_store_id', $storeId);
        }

        // ── Validasi store masih bisa diakses + aktif ─────────────────
        if ($storeId) {
            $store = $user->stores()->where('stores.id', $storeId)->first();

            if (! $store || ! $store->is_active) {
                $request
                    ->session()
                    ->forget(['current_store_id', 'current_branch_id']);

                // Route exempt → biarkan lewat
                if ($isExempt) {
                    return $next($request);
                }

                // Jika store inactive, force redirect ke store select
                $activeStores = $user->stores()->where('is_active', true)->get();

                if ($activeStores->count() > 1) {
                    return redirect()->route('admin.store.select');
                }

                $first = $activeStores->first();
                if ($first) {
                    $storeId = $first->id;
                    $request->session()->put('current_store_id', $storeId);
                } else {
                    return redirect()
                        ->route('login')
                        ->with(
                            'error',
                            'Semua toko kamu sudah tidak aktif. Hubungi admin.',
                        );
                }
            }

            // Set Spatie team context → semua permission check pakai store ini
            app(
                PermissionRegistrar::class,
            )->setPermissionsTeamId($storeId);
        }

        return $next($request);
    }
}
