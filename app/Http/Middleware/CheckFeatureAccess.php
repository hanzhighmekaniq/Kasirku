<?php

namespace App\Http\Middleware;

use App\Models\Feature;
use App\Models\Store;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckFeatureAccess
{
    /**
     * Cek 2 hal:
     * 1. Store type mendukung fitur ini (via store_type_feature)
     * 2. Plan toko mengizinkan fitur ini (via plan_features)
     *
     * Urutan cek: type dulu, baru plan.
     * Kalau type tidak support → popup "tipe toko salah" (upgrade plan tidak akan membantu)
     * Kalau plan tidak allow → halaman "Upgrade Plan"
     *
     * Usage: ->middleware('feature:kitchen')
     */
    public function handle(
        Request $request,
        Closure $next,
        string $feature,
    ) {
        /** @var Store|null $store */
        $store = session('current_store_id')
            ? Store::with([
                'planModel.features',
                'storeType.features',
            ])->find(session('current_store_id'))
            : null;

        // Kalau belum ada store di session, lanjut saja (biarkan StoreMiddleware yang handle)
        if (! $store) {
            return $next($request);
        }

        // Ambil info fitur dari DB untuk label yang ramah pengguna
        $featureModel = Feature::with('storeTypes')
            ->where('code', $feature)
            ->first();
        $featureLabel = $featureModel?->label ?? $feature;

        // ── Cek 1: Store type mendukung fitur ini? ────────────────────────
        $typeFeatureCodes = $store->getRelationValue('storeType')
            ? $store
                ->getRelationValue('storeType')
                ->features->pluck('code')
                ->toArray()
            : [];

        if (! in_array($feature, $typeFeatureCodes)) {
            return $this->denyType(
                $request,
                $feature,
                $featureLabel,
                $store,
                $featureModel,
            );
        }

        // ── Cek 2: Plan mengizinkan fitur ini? ───────────────────────────
        if (! $store->planAllowsFeature($feature)) {
            return $this->denyPlan($request, $feature, $featureLabel, $store);
        }

        return $next($request);
    }

    /**
     * Fitur tidak tersedia untuk tipe toko ini.
     * → Inertia: redirect back + flash "typeBlock" agar frontend tampilkan popup
     * → Non-Inertia: redirect dashboard dengan pesan error
     */
    private function denyType(
        Request $request,
        string $feature,
        string $featureLabel,
        Store $store,
        ?Feature $featureModel,
    ) {
        $currentType = $store->getRelationValue('storeType');

        // Tipe toko yang BISA menggunakan fitur ini
        $supportedTypes = $featureModel
            ? $featureModel->storeTypes
                ->where('is_active', true)
                ->map(fn ($t) => ['code' => $t->code, 'label' => $t->label])
                ->values()
                ->toArray()
            : [];

        if ($request->header('X-Inertia')) {
            return redirect()
                ->back(302, [], route('admin.dashboard'))
                ->with('typeBlock', [
                    'feature' => $feature,
                    'featureLabel' => $featureLabel,
                    'currentType' => $currentType
                        ? [
                            'code' => $currentType->code,
                            'label' => $currentType->label,
                        ]
                        : null,
                    'supportedTypes' => $supportedTypes,
                ]);
        }

        $typeLabel = $currentType?->label ?? 'tipe toko Anda';

        return redirect()
            ->route('admin.dashboard')
            ->with(
                'error',
                "Fitur \"{$featureLabel}\" tidak tersedia untuk {$typeLabel}.",
            );
    }

    /**
     * Fitur tersedia untuk tipe toko, tapi plan tidak mengizinkan.
     * → Inertia: render halaman "Upgrade Plan" secara inline
     * → Non-Inertia: redirect dashboard dengan pesan error
     */
    private function denyPlan(
        Request $request,
        string $feature,
        string $featureLabel,
        Store $store,
    ) {
        if ($request->header('X-Inertia')) {
            $planCode = $store->effectivePlanCode();
            $planModel = $store->planModel;

            return Inertia::render('Blocked/FeatureLocked', [
                'feature' => $feature,
                'featureLabel' => $featureLabel,
                'storePlan' => [
                    'plan' => $planCode,
                    'label' => $planModel?->label ?? ucfirst($planCode),
                ],
                'storeType' => $store->getRelationValue('storeType')
                    ? [
                        'code' => $store->getRelationValue('storeType')->code,
                        'label' => $store->getRelationValue('storeType')->label,
                    ]
                    : null,
            ])->toResponse($request);
        }

        return redirect()
            ->route('admin.dashboard')
            ->with(
                'error',
                "Fitur \"{$featureLabel}\" tidak tersedia untuk paket Anda. Upgrade plan untuk mengaksesnya.",
            );
    }
}
