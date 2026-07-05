<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureAccess
{
    /**
     * Cek 2 hal:
     * 1. Plan toko mengizinkan fitur ini (via plan_features)
     * 2. Store type mendukung fitur ini (via applicable_types)
     *
     * Usage: ->middleware('feature:kitchen')
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        /** @var \App\Models\Store|null $store */
        $store = session('current_store_id')
            ? \App\Models\Store::with(['planModel.planFeatures'])->find(session('current_store_id'))
            : null;

        // Kalau belum ada store di session, lanjut saja (biarkan StoreMiddleware yang handle)
        if (! $store) {
            return $next($request);
        }

        // ── Cek 1: Plan mengizinkan fitur ini? ───────────────────────────
        if (! $store->planAllowsFeature($feature)) {
            return $this->deny($request, $feature, 'plan');
        }

        // ── Cek 2: Store type mendukung fitur ini? ────────────────────────
        // Cek dari tabel features.applicable_types
        $featureModel = \App\Models\Feature::where('code', $feature)
            ->where('is_active', true)
            ->first();

        if ($featureModel) {
            $applicableTypes = $featureModel->applicable_types ?? [];

            // Kalau applicable_types kosong / null → fitur berlaku untuk semua tipe
            if (! empty($applicableTypes) && ! in_array($store->store_type, $applicableTypes)) {
                return $this->deny($request, $feature, 'type');
            }
        }

        // ── Cek 3: Fitur aktif di modules toko ───────────────────────────
        // Ini opsional — modules dikonfigurasi developer per toko
        // Hanya enforce kalau modules sudah dikonfigurasi (tidak kosong)
        $modules = $store->modules ?? [];
        if (! empty($modules['features']) && ! in_array($feature, $modules['features'])) {
            return $this->deny($request, $feature, 'modules');
        }

        return $next($request);
    }

    private function deny(Request $request, string $feature, string $reason): Response
    {
        $messages = [
            'plan'    => 'Fitur ini tidak tersedia untuk paket langganan toko Anda. Upgrade plan untuk mengakses fitur ini.',
            'type'    => 'Fitur ini tidak tersedia untuk tipe toko Anda.',
            'modules' => 'Fitur ini belum diaktifkan untuk toko Anda. Hubungi administrator.',
        ];

        $message = $messages[$reason] ?? 'Fitur tidak tersedia untuk paket/tipe toko Anda.';

        if ($request->wantsJson() || $request->header('X-Inertia')) {
            abort(403, $message);
        }

        return redirect()
            ->route('admin.dashboard')
            ->with('error', $message);
    }
}
