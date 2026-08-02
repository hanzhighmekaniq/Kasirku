<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\StoreType;
use App\Services\StoreOnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman onboarding — buat toko pertama setelah registrasi.
 *
 * User yang baru registrasi (belum punya toko) diarahkan ke sini.
 * Setelah memilih plan, jenis usaha, dan nama toko, store dibuat
 * dan user langsung masuk dashboard.
 */
class OnboardingController extends Controller
{
    public function create(): Response
    {
        $storeTypes = StoreType::where('is_active', true)
            ->orderBy('sort_order')
            ->with([
                'businessTemplates' => fn ($q) => $q
                    ->ready()
                    ->active()
                    ->ordered(),
            ])
            ->get()
            ->map(fn (StoreType $type) => [
                'id' => $type->id,
                'code' => $type->code,
                'label' => $type->label,
                'icon' => $type->icon,
                'description' => $type->description,
                'business_templates' => $type->businessTemplates->map(fn ($t) => [
                    'code' => $t->code,
                    'label' => $t->label,
                    'icon' => $t->icon,
                    'description' => $t->description,
                ])->values(),
            ])
            ->values();

        return Inertia::render('Onboarding/Index', [
            'storeTypes' => $storeTypes,
            'plans' => Store::allPlans(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_type_id' => ['required', 'integer', 'exists:store_types,id'],
            'business_template_code' => ['nullable', 'string', 'exists:business_templates,code'],
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'store_name' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();

        $store = DB::transaction(fn () => app(StoreOnboardingService::class)->createStoreFromOnboarding(
            user: $user,
            storeTypeId: (int) $validated['store_type_id'],
            planId: (int) $validated['plan_id'],
            businessTemplateCode: $validated['business_template_code'] ?? null,
            storeName: $validated['store_name'],
        ));

        $request->session()->put('current_store_id', $store->id);

        return redirect()->route('admin.dashboard');
    }
}
