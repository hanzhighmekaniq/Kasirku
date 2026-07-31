<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\DeveloperActionLog;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\PlanAddon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index()
    {
        $plans = Plan::with('features')
            ->orderBy('sort_order')
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'code' => $plan->code,
                    'label' => $plan->label,
                    'description' => $plan->description,
                    'max_users' => $plan->max_users,
                    'max_branches' => $plan->max_branches,
                    'price' => (float) $plan->price,
                    'trial_days' => $plan->trial_days,
                    'is_active' => $plan->is_active,
                    'sort_order' => $plan->sort_order,
                    'created_at' => $plan->created_at,
                    'stores_count' => $plan->stores()->count(),
                    'features' => $plan->features->map(function ($feature) {
                        return [
                            'id' => $feature->id,
                            'code' => $feature->code,
                            'label' => $feature->label,
                            'category' => $feature->category,
                            'sort_order' => $feature->sort_order,
                        ];
                    }),
                ];
            });

        return Inertia::render('Developer/Plans/Index', [
            'plans' => $plans,
        ]);
    }

    public function create()
    {
        return Inertia::render('Developer/Plans/Form', [
            'plan' => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->planRules());

        $plan = Plan::create($validated);

        DeveloperActionLog::record('plan.create', $plan, null, $validated);

        return redirect()
            ->route('developer.plans.index')
            ->with('success', 'Paket berhasil dibuat.');
    }

    public function edit(Plan $plan)
    {
        $planData = [
            'id' => $plan->id,
            'code' => $plan->code,
            'label' => $plan->label,
            'description' => $plan->description,
            'max_users' => $plan->max_users,
            'max_branches' => $plan->max_branches,
            'max_stores' => $plan->max_stores,
            'max_products' => $plan->max_products,
            'max_transactions_per_month' => $plan->max_transactions_per_month,
            'price' => (float) $plan->price,
            'price_yearly' => (float) $plan->price_yearly,
            'trial_days' => $plan->trial_days,
            'is_active' => $plan->is_active,
            'is_popular' => $plan->is_popular,
            'is_seasonal' => $plan->is_seasonal,
            'seasonal_label' => $plan->seasonal_label,
            'sort_order' => $plan->sort_order,
        ];

        return Inertia::render('Developer/Plans/Form', [
            'plan' => $planData,
        ]);
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate($this->planRules($plan));
        $oldValues = $plan->only(array_keys($validated));

        $plan->update($validated);

        DeveloperActionLog::record('plan.update', $plan, $oldValues, $validated);

        return redirect()
            ->route('developer.plans.index')
            ->with('success', 'Paket berhasil diperbarui.');
    }

    public function destroy(Plan $plan)
    {
        if ($plan->stores()->exists()) {
            return back()->with(
                'error',
                'Paket masih digunakan oleh toko. Nonaktifkan saja.',
            );
        }

        $snapshot = $plan->only(['id', 'code', 'label']);
        DeveloperActionLog::record('plan.destroy', $plan, $snapshot, null);

        $plan->delete();

        return redirect()
            ->route('developer.plans.index')
            ->with('success', 'Paket berhasil dihapus.');
    }

    /** Reorder plans via drag & drop — terima array of { id, sort_order } */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|integer|exists:plans,id',
            'orders.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['orders'] as $item) {
            Plan::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['ok' => true]);
    }

    /* ─── Halaman Kelola Fitur ────────────────────────────────────────────── */

    /** Render halaman checkbox fitur untuk satu plan. */
    public function features(Plan $plan)
    {
        $plan->load('features');

        $allFeatures = Feature::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'label', 'category', 'sort_order']);

        return Inertia::render('Developer/Plans/Features', [
            'plan' => [
                'id' => $plan->id,
                'code' => $plan->code,
                'label' => $plan->label,
                'feature_ids' => $plan->features->pluck('id')->values(),
                'features_count' => $plan->features->count(),
            ],
            'allFeatures' => $allFeatures,
        ]);
    }

    /** Simpan pilihan fitur untuk satu plan. */
    public function updateFeatures(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'feature_ids' => 'nullable|array',
            'feature_ids.*' => 'integer|exists:features,id',
        ]);

        $plan->features()->sync($validated['feature_ids'] ?? []);

        return redirect()
            ->route('developer.plans.features', $plan->id)
            ->with('success', "Fitur paket {$plan->label} berhasil disimpan.");
    }

    /* ─── CRUD Add-on ────────────────────────────────────────────────────── */

    /** Render halaman kelola add-on untuk satu plan. */
    public function addons(Plan $plan)
    {
        $plan->load('addons');

        return Inertia::render('Developer/Plans/Addons', [
            'plan' => [
                'id' => $plan->id,
                'code' => $plan->code,
                'label' => $plan->label,
            ],
            'addons' => $plan->addons,
            'addonCodes' => PlanAddon::CODES,
        ]);
    }

    public function storeAddon(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                Rule::in(array_keys(PlanAddon::CODES)),
                Rule::unique('plan_addons')->where(fn ($q) => $q->where('plan_id', $plan->id)),
            ],
            'label' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $plan->addons()->create($validated);

        return redirect()
            ->route('developer.plans.addons', $plan->id)
            ->with('success', 'Add-on berhasil ditambahkan.');
    }

    public function updateAddon(Request $request, Plan $plan, PlanAddon $addon)
    {
        abort_if($addon->plan_id !== $plan->id, 404);

        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $addon->update($validated);

        return redirect()
            ->route('developer.plans.addons', $plan->id)
            ->with('success', 'Add-on berhasil diperbarui.');
    }

    public function destroyAddon(Plan $plan, PlanAddon $addon)
    {
        abort_if($addon->plan_id !== $plan->id, 404);

        $addon->delete();

        return redirect()
            ->route('developer.plans.addons', $plan->id)
            ->with('success', 'Add-on berhasil dihapus.');
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    /**
     * Aturan validasi plan — dipakai store() dan update() supaya tidak duplikasi.
     * Fitur disimpan lewat endpoint tersendiri (updateFeatures), bukan form ini.
     */
    private function planRules(?Plan $plan = null): array
    {
        return [
            'code' => [
                'required', 'string', 'max:30',
                $plan
                    ? Rule::unique('plans', 'code')->ignore($plan->id)
                    : Rule::unique('plans', 'code'),
            ],
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'max_users' => 'required|integer|min:1',
            'max_branches' => 'required|integer|min:1',
            'max_stores' => 'required|integer|min:1',
            'max_products' => 'nullable|integer|min:1',
            'max_transactions_per_month' => 'nullable|integer|min:1',
            'price' => 'nullable|numeric|min:0',
            'price_yearly' => 'nullable|numeric|min:0',
            'trial_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'is_popular' => 'boolean',
            'is_seasonal' => 'boolean',
            'seasonal_label' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }
}
