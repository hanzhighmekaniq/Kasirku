<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StoreType;
use App\Models\User;
use App\Services\StoreOnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    /**
     * Form tambah toko baru untuk user yang sudah punya akun.
     * Cek limit max_stores dari plan user sebelum menampilkan form.
     */
    public function create(): Response|RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (! $user->canAddStore()) {
            $maxStores = $user->planModel?->max_stores ?? 1;
            $planLabel = $user->planModel?->label ?? 'kamu';

            return redirect()->route('admin.plan.index')->with(
                'error',
                "Paket {$planLabel} hanya mengizinkan {$maxStores} toko. Upgrade paket untuk menambah toko baru.",
            );
        }

        $storeTypes = StoreType::where('is_active', true)
            ->orderBy('sort_order')
            ->with([
                'businessTemplates' => fn ($q) => $q->ready()->active()->ordered(),
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
                ])->values(),
            ])
            ->values();

        return Inertia::render('Admin/Stores/Create', [
            'storeTypes' => $storeTypes,
        ]);
    }

    /**
     * Buat toko baru untuk user yang sudah login.
     */
    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (! $user->canAddStore()) {
            return back()->with('error', 'Batas toko dari paket kamu sudah tercapai. Upgrade paket untuk menambah toko baru.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'store_type_id' => ['required', 'integer', 'exists:store_types,id'],
            'business_template_code' => ['nullable', 'string', 'exists:business_templates,code'],
        ]);

        $store = DB::transaction(fn () => app(StoreOnboardingService::class)->addStore(
            user: $user,
            storeName: $validated['name'],
            storeTypeId: $validated['store_type_id'],
            businessTemplateCode: $validated['business_template_code'] ?? null,
        ));

        return redirect()
            ->route('admin.dashboard')
            ->with('success', "Toko \"{$store->name}\" berhasil dibuat! Kamu sudah masuk ke toko ini.");
    }
}
