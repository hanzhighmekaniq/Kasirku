<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureDetailAccess
{
    /**
     * Cek akses ke feature detail (sub-aktivitas dalam fitur).
     *
     * Rantai pengecekan:
     * 1. FeatureDetail aktif?
     * 2. Feature parent-nya aktif?
     * 3. Store type mengizinkan feature parent? (store_type_feature)
     * 4. Plan mengizinkan feature parent? (plan_feature)
     *
     * Usage: ->middleware('feature-detail:pos.hold_order')
     */
    public function handle(
        Request $request,
        Closure $next,
        string $detailCode,
    ): Response {
        /** @var \App\Models\Store|null $store */
        $store = session("current_store_id")
            ? \App\Models\Store::with([
                "planModel.features",
                "storeType.features",
            ])->find(session("current_store_id"))
            : null;

        if (!$store) {
            return $next($request);
        }

        // 1. Cari FeatureDetail & parent Feature
        $detail = \App\Models\FeatureDetail::with("feature")
            ->where("code", $detailCode)
            ->where("is_active", true)
            ->first();

        if (!$detail) {
            // Detail tidak dikenal → anggap tidak tersedia
            return $this->denyType($request, $detailCode, $detailCode, $store, null, null);
        }

        $feature = $detail->feature;
        if (!$feature || !$feature->is_active) {
            return $this->denyType($request, $detailCode, $detail ? ($detail->label ?? $detailCode) : $detailCode, $store, null, $detail);
        }

        $featureLabel = $feature->label ?? $feature->code;
        $detailLabel = $detail->label ?? $detailCode;

        // 2. Store type mengizinkan feature parent?
        $typeFeatureCodes = $store->getRelationValue("storeType")
            ? $store->getRelationValue("storeType")->features->pluck("code")->toArray()
            : [];

        if (!in_array($feature->code, $typeFeatureCodes)) {
            return $this->denyType($request, $detailCode, $detailLabel, $store, $feature, $detail);
        }

        // 3. Plan mengizinkan feature parent?
        if (!$store->planAllowsFeature($feature->code)) {
            return $this->denyPlan($request, $detailCode, $detailLabel, $store, $feature);
        }

        return $next($request);
    }

    /**
     * Feature detail tidak tersedia karena store type tidak support.
     */
    private function denyType(
        Request $request,
        string $detailCode,
        string $detailLabel,
        \App\Models\Store $store,
        ?\App\Models\Feature $feature,
        ?\App\Models\FeatureDetail $detail,
    ) {
        $currentType = $store->getRelationValue("storeType");

        // Tipe toko yang mendukung fitur ini
        $supportedTypes = $feature
            ? $feature->storeTypes
                ->where("is_active", true)
                ->map(fn($t) => ["code" => $t->code, "label" => $t->label])
                ->values()
                ->toArray()
            : [];

        if ($request->header("X-Inertia")) {
            return redirect()
                ->back(302, [], route("admin.dashboard"))
                ->with("typeBlock", [
                    "feature" => $detailCode,
                    "featureLabel" => $detailLabel,
                    "currentType" => $currentType
                        ? ["code" => $currentType->code, "label" => $currentType->label]
                        : null,
                    "supportedTypes" => $supportedTypes,
                ]);
        }

        $typeLabel = $currentType?->label ?? "tipe toko Anda";
        return redirect()
            ->route("admin.dashboard")
            ->with("error", "Fitur \"{$detailLabel}\" tidak tersedia untuk {$typeLabel}.");
    }

    /**
     * Feature detail tersedia untuk tipe toko, tapi plan tidak mengizinkan.
     */
    private function denyPlan(
        Request $request,
        string $detailCode,
        string $detailLabel,
        \App\Models\Store $store,
        \App\Models\Feature $feature,
    ) {
        if ($request->header("X-Inertia")) {
            $planCode = $store->effectivePlanCode();
            $planModel = $store->planModel;

            return Inertia::render("Blocked/FeatureLocked", [
                "feature" => $detailCode,
                "featureLabel" => $detailLabel,
                "storePlan" => [
                    "plan" => $planCode,
                    "label" => $planModel?->label ?? ucfirst($planCode),
                ],
                "storeType" => $store->getRelationValue("storeType")
                    ? [
                        "code" => $store->getRelationValue("storeType")->code,
                        "label" => $store->getRelationValue("storeType")->label,
                    ]
                    : null,
            ]);
        }

        return redirect()
            ->route("admin.dashboard")
            ->with("error", "Fitur \"{$detailLabel}\" tidak tersedia untuk paket Anda. Upgrade plan untuk mengaksesnya.");
    }
}
