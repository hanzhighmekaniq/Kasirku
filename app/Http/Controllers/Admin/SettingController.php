<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Store;
use App\Models\StoreFeature;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        /** @var User|null $user */
        $user = Auth::user();
        $storeId = session('current_store_id');
        $store =
            Store::find($storeId) ?? $user?->stores()?->first();

        // Ambil semua user di store ini beserta role mereka
        $storeUsers = collect();
        if ($store) {
            $storeUsers = $store
                ->users()
                ->get()
                ->map(function ($u) use ($store) {
                    $roles = DB::table('model_has_roles')
                        ->join(
                            'roles',
                            'roles.id',
                            '=',
                            'model_has_roles.role_id',
                        )
                        ->where('model_has_roles.model_id', $u->id)
                        ->where(
                            'model_has_roles.model_type',
                            User::class,
                        )
                        ->where('model_has_roles.store_id', $store->id)
                        ->pluck('roles.name');

                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'roles' => $roles,
                    ];
                });
        }

        // Ambil fitur yang tersedia untuk toko ini (lolos gate type + plan)
        // beserta status is_enabled dari store_features
        $storeFeatures = collect();
        if ($store) {
            $store->load(['storeType.features', 'planModel.features', 'storeFeatures.feature']);

            $typeFeatures = $store->getRelationValue('storeType')
                ? $store->getRelationValue('storeType')->features->where('is_active', true)
                : collect();

            $planFeatureCodes = $store->planModel
                ? $store->planModel->featureCodes()
                : [];

            // Filter: hanya fitur yang lolos type + plan
            $availableFeatures = $typeFeatures->filter(function ($feature) use ($planFeatureCodes) {
                return in_array($feature->code, $planFeatureCodes);
            });

            // Map ke format yang frontend butuhkan
            $storeFeatureMap = $store->storeFeatures->keyBy('feature_id');

            $storeFeatures = $availableFeatures->map(function ($feature) use ($storeFeatureMap) {
                $override = $storeFeatureMap->get($feature->id);

                return [
                    'feature_id' => $feature->id,
                    'code' => $feature->code,
                    'label' => $feature->label,
                    'description' => $feature->description,
                    'category' => $feature->category,
                    'is_enabled' => $override ? $override->is_enabled : true,
                    'settings' => $override?->settings,
                ];
            })->values();

            // Hapus relasi yang di-load agar tidak ikut ter-serialize ke frontend
            $store->unsetRelations();
        }

        // Ambil semua cabang toko
        $branches = $store ? Branch::where('store_id', $store->id)->orderBy('code')->get(['id', 'code', 'name', 'phone', 'address', 'is_active']) : collect();
        $currentBranchId = session('current_branch_id');
        $currentBranch = $currentBranchId ? $branches->firstWhere('id', $currentBranchId) : $branches->first();

        return Inertia::render('Admin/Settings/Index', [
            'store' => $store,
            'storeUsers' => $storeUsers,
            'storeTypes' => StoreType::active(),
            'storeFeatures' => $storeFeatures,
            'branches' => $branches,
            'currentBranch' => $currentBranch,
        ]);
    }

    public function update(Request $request)
    {
        $storeId = session('current_store_id');
        /** @var User|null $user */
        $user = Auth::user();
        $store =
            Store::find($storeId) ?? $user?->stores()?->first();

        if (! $store) {
            return back()->with('error', 'Toko tidak ditemukan.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('stores', 'code')->ignore($store->id),
            ],
            'store_type' => [
                'required',
                Rule::in(StoreType::codes()),
            ],
            'phone' => 'nullable|string|max:30',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('stores', 'email')->ignore($store->id),
            ],
            'address' => 'nullable|string|max:1000',
            'receipt_header' => 'nullable|string|max:500',
            'receipt_footer' => 'nullable|string|max:500',
            'tax_inclusive' => 'boolean',
            'default_tax_rate' => 'nullable|numeric|min:0|max:100',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'remove_logo' => 'boolean',
        ]);

        // Handle logo
        $logoPath = $store->logo;
        if ($request->hasFile('logo')) {
            if ($store->logo) {
                Storage::disk('public')->delete($store->logo);
            }
            $logoPath = $request->file('logo')->store('stores', 'public');
        } elseif ($request->boolean('remove_logo') && $store->logo) {
            Storage::disk('public')->delete($store->logo);
            $logoPath = null;
        }

        $store->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'store_type' => $validated['store_type'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'receipt_header' => $validated['receipt_header'] ?? null,
            'receipt_footer' => $validated['receipt_footer'] ?? null,
            'tax_inclusive' => $validated['tax_inclusive'] ?? false,
            'default_tax_rate' => $validated['default_tax_rate'] ?? 0,
            'logo' => $logoPath,
        ]);

        return back()->with('success', 'Pengaturan toko berhasil disimpan.');
    }

    public function updateFeatures(Request $request)
    {
        $storeId = session('current_store_id');
        /** @var User|null $user */
        $user = Auth::user();
        $store =
            Store::find($storeId) ?? $user?->stores()?->first();

        if (! $store) {
            return back()->with('error', 'Toko tidak ditemukan.');
        }

        $validated = $request->validate([
            'feature_id' => 'required|exists:features,id',
            'is_enabled' => 'required|boolean',
            'settings' => 'nullable|array',
        ]);

        StoreFeature::updateOrCreate(
            [
                'store_id' => $store->id,
                'feature_id' => $validated['feature_id'],
            ],
            [
                'is_enabled' => $validated['is_enabled'],
                'settings' => $validated['settings'] ?? null,
                'managed_by' => 'owner',
                'enabled_by' => Auth::id(),
                'enabled_at' => now(),
            ],
        );

        return back()->with('success', 'Pengaturan fitur berhasil disimpan.');
    }

    public function updateBranch(Request $request, Branch $branch)
    {
        $storeId = session('current_store_id');
        /** @var User|null $user */
        $user = Auth::user();
        $store = Store::find($storeId) ?? $user?->stores()?->first();

        if (! $store || $branch->store_id !== $store->id) {
            return back()->with('error', 'Akses ditolak.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $branch->update($validated);

        return back()->with('success', "Cabang {$branch->name} berhasil diperbarui.");
    }
}
