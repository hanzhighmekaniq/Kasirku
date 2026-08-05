<?php

namespace App\Http\Controllers;

use App\Models\BusinessTemplate;
use App\Models\Plan;
use App\Models\StoreType;
use App\Services\StoreOnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman onboarding — buat toko pertama setelah registrasi.
 *
 * User yang baru registrasi (belum punya toko) diarahkan ke sini.
 * Satu layar saja: pilih template bisnis (atau tipe toko kosong) +
 * isi nama toko + nama pemilik → store langsung dibuat dengan plan
 * Free. Tidak ada langkah pilih plan di sini — upgrade dilakukan
 * belakangan dari halaman Plan & Billing. Verifikasi email juga
 * TIDAK menjadi syarat, dicek terpisah lewat banner di dashboard.
 *
 * Pemilihan jenis usaha: user langsung memilih dari daftar template
 * bisnis (mis. "Cafe", "Minimarket"), dan `store_type_id` otomatis
 * terisi dari relasi template → store type. Tipe toko yang belum
 * punya template siap tetap tampil sebagai kartu "mulai kosong".
 */
class OnboardingController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        // Guard: developer tidak perlu onboarding
        if ($user->isDeveloper()) {
            return redirect()->route('developer.dashboard');
        }

        // Guard: user yang sudah punya toko tidak boleh akses onboarding
        if ($user->stores()->count() > 0) {
            return redirect()->route('admin.dashboard');
        }

        // Guard: cek apakah user masih punya kuota toko
        if (! $user->canAddStore()) {
            return redirect()->route('admin.plan.index')->withErrors([
                'plan' => 'Kuota toko sudah habis. Upgrade plan untuk membuat toko baru.',
            ]);
        }

        $storeTypes = StoreType::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $businessTemplates = BusinessTemplate::query()
            ->active()
            ->ordered()
            ->with('storeType')
            ->get()
            ->map(fn (BusinessTemplate $t) => [
                'code' => $t->code,
                'label' => $t->label,
                'icon' => $t->icon,
                'description' => $t->description,
                'is_ready' => $t->is_ready,
                'store_type_id' => $t->store_type_id,
                'store_type' => [
                    'id' => $t->storeType->id,
                    'code' => $t->storeType->code,
                    'label' => $t->storeType->label,
                    'icon' => $t->storeType->icon,
                ],
            ])
            ->values();

        // Tipe toko yang belum punya template aktif — tetap bisa dipilih
        // langsung sebagai "mulai kosong" untuk jenis usaha ini.
        $storeTypesWithoutTemplate = $storeTypes
            ->reject(fn (StoreType $type) => $businessTemplates->contains(
                fn ($t) => $t['store_type_id'] === $type->id,
            ))
            ->map(fn (StoreType $type) => [
                'id' => $type->id,
                'code' => $type->code,
                'label' => $type->label,
                'icon' => $type->icon,
                'description' => $type->description,
            ])
            ->values();

        return Inertia::render('Onboarding/Index', [
            'businessTemplates' => $businessTemplates,
            'emptyStoreTypes' => $storeTypesWithoutTemplate,
            'userName' => Auth::user()?->name ?? '',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Guard: developer tidak perlu onboarding
        if ($user->isDeveloper()) {
            return redirect()->route('developer.dashboard');
        }

        // Guard: user yang sudah punya toko tidak boleh buat lagi
        if ($user->stores()->count() > 0) {
            return redirect()->route('admin.dashboard');
        }

        // Guard: cek kuota toko sesuai plan
        if (! $user->canAddStore()) {
            return redirect()->route('admin.plan.index')->withErrors([
                'plan' => 'Kuota toko sudah habis. Upgrade plan untuk membuat toko baru.',
            ]);
        }

        $validated = $request->validate([
            'store_type_id' => ['required', 'integer', 'exists:store_types,id'],
            'business_template_code' => ['nullable', 'string', 'exists:business_templates,code'],
            'store_name' => ['required', 'string', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:255'],
        ]);

        // Trim owner_name, set null jika kosong setelah trim
        if (! empty($validated['owner_name'])) {
            $validated['owner_name'] = trim($validated['owner_name']);
            if ($validated['owner_name'] === '') {
                $validated['owner_name'] = null;
            }
        }

        // Trim store_name
        $validated['store_name'] = trim($validated['store_name']);

        // Kalau template dipilih, pastikan template itu memang milik
        // store_type_id yang dikirim — mencegah pasangan tidak konsisten
        // yang bisa dikirim langsung lewat request tanpa lewat UI.
        if (! empty($validated['business_template_code'])) {
            $templateBelongsToStoreType = BusinessTemplate::where(
                'code',
                $validated['business_template_code'],
            )->where('store_type_id', $validated['store_type_id'])->exists();

            if (! $templateBelongsToStoreType) {
                throw ValidationException::withMessages([
                    'business_template_code' => 'Template bisnis tidak sesuai dengan tipe toko yang dipilih.',
                ]);
            }
        }

        $freePlan = Plan::where('code', 'free')->firstOrFail();

        $user = $request->user();

        // Update nama user jika diisi di onboarding
        if (! empty($validated['owner_name'])) {
            $user->update(['name' => $validated['owner_name']]);
        }

        $store = DB::transaction(fn () => app(StoreOnboardingService::class)->createStoreFromOnboarding(
            user: $user,
            storeTypeId: (int) $validated['store_type_id'],
            planId: $freePlan->id,
            businessTemplateCode: $validated['business_template_code'] ?? null,
            storeName: $validated['store_name'],
        ));

        $request->session()->put('current_store_id', $store->id);

        return redirect()->route('admin.dashboard');
    }
}
