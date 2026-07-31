<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\DeveloperActionLog;
use App\Models\Feature;
use App\Models\FeatureDetail;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FeatureController extends Controller
{
    public function index()
    {
        $features = Feature::withCount('featureDetails')
            ->orderBy('display_group')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Feature $f) => [
                'id' => $f->id,
                'code' => $f->code,
                'label' => $f->label,
                'description' => $f->description,
                'category' => $f->category,
                'display_group' => $f->display_group,
                'is_active' => $f->is_active,
                'sort_order' => $f->sort_order,
                'plans_count' => $f->plans()->count(),
                'store_types_count' => $f->storeTypes()->count(),
                'feature_details_count' => $f->feature_details_count,
            ]);

        return Inertia::render('Developer/Features/Index', [
            'features' => $features,
            'displayGroups' => Feature::DISPLAY_GROUPS,
        ]);
    }

    public function create()
    {
        return Inertia::render('Developer/Features/Form', [
            'feature' => null,
            'displayGroups' => Feature::DISPLAY_GROUPS,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->featureRules());

        $feature = Feature::create($validated);

        DeveloperActionLog::record('feature.create', $feature, null, $validated);

        return redirect()
            ->route('developer.features.index')
            ->with('success', 'Fitur berhasil dibuat.');
    }

    public function edit(Feature $feature)
    {
        return Inertia::render('Developer/Features/Form', [
            'feature' => [
                'id' => $feature->id,
                'code' => $feature->code,
                'label' => $feature->label,
                'description' => $feature->description,
                'category' => $feature->category,
                'display_group' => $feature->display_group,
                'is_active' => $feature->is_active,
                'sort_order' => $feature->sort_order,
            ],
            'displayGroups' => Feature::DISPLAY_GROUPS,
        ]);
    }

    public function update(Request $request, Feature $feature)
    {
        $validated = $request->validate($this->featureRules($feature));
        $oldValues = $feature->only(array_keys($validated));

        $feature->update($validated);

        DeveloperActionLog::record('feature.update', $feature, $oldValues, $validated);

        return redirect()
            ->route('developer.features.index')
            ->with('success', 'Fitur berhasil diperbarui.');
    }

    public function destroy(Feature $feature)
    {
        if ($feature->plans()->exists() || $feature->storeTypes()->exists()) {
            return back()->with(
                'error',
                'Fitur masih dipakai plan atau jenis usaha. Nonaktifkan saja.',
            );
        }

        $snapshot = $feature->only(['id', 'code', 'label']);
        DeveloperActionLog::record('feature.destroy', $feature, $snapshot, null);

        $feature->delete();

        return redirect()
            ->route('developer.features.index')
            ->with('success', 'Fitur berhasil dihapus.');
    }

    /* ─── CRUD Feature Detail (nested) ──────────────────────────────────── */

    public function details(Feature $feature)
    {
        $feature->load(['featureDetails' => fn ($q) => $q->orderBy('sort_order')]);

        return Inertia::render('Developer/Features/Details', [
            'feature' => [
                'id' => $feature->id,
                'code' => $feature->code,
                'label' => $feature->label,
            ],
            'details' => $feature->featureDetails,
        ]);
    }

    public function storeDetail(Request $request, Feature $feature)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('feature_details', 'code')],
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $feature->featureDetails()->create($validated);

        return redirect()
            ->route('developer.features.details', $feature)
            ->with('success', 'Detail fitur berhasil ditambahkan.');
    }

    public function updateDetail(Request $request, Feature $feature, FeatureDetail $detail)
    {
        abort_if($detail->feature_id !== $feature->id, 404);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('feature_details', 'code')->ignore($detail->id)],
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $detail->update($validated);

        return redirect()
            ->route('developer.features.details', $feature)
            ->with('success', 'Detail fitur berhasil diperbarui.');
    }

    public function destroyDetail(Feature $feature, FeatureDetail $detail)
    {
        abort_if($detail->feature_id !== $feature->id, 404);

        $detail->delete();

        return redirect()
            ->route('developer.features.details', $feature)
            ->with('success', 'Detail fitur berhasil dihapus.');
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    /**
     * Aturan validasi fitur — dipakai store() dan update().
     *
     * `category` (kolom lama, bebas teks) dipertahankan untuk kompatibilitas
     * data lama, tapi UI Developer sekarang mengandalkan `display_group`
     * untuk pengelompokan tampilan.
     */
    private function featureRules(?Feature $feature = null): array
    {
        return [
            'code' => [
                'required', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/',
                $feature
                    ? Rule::unique('features', 'code')->ignore($feature->id)
                    : Rule::unique('features', 'code'),
            ],
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'category' => 'nullable|string|max:50',
            'display_group' => ['required', Rule::in(array_keys(Feature::DISPLAY_GROUPS))],
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }
}
