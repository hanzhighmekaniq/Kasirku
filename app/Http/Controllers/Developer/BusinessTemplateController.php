<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\BusinessTemplate;
use App\Models\BusinessTemplateCategory;
use App\Models\BusinessTemplateProduct;
use App\Models\DeveloperActionLog;
use App\Models\StoreType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BusinessTemplateController extends Controller
{
    public function index()
    {
        $storeTypes = StoreType::orderBy('sort_order')
            ->with(['businessTemplates' => fn ($q) => $q->ordered()->withCount('categories')])
            ->get()
            ->map(fn (StoreType $type) => [
                'id' => $type->id,
                'code' => $type->code,
                'label' => $type->label,
                'icon' => $type->icon,
                'business_templates' => $type->businessTemplates->map(fn (BusinessTemplate $t) => [
                    'id' => $t->id,
                    'code' => $t->code,
                    'label' => $t->label,
                    'icon' => $t->icon,
                    'description' => $t->description,
                    'is_ready' => $t->is_ready,
                    'is_active' => $t->is_active,
                    'sort_order' => $t->sort_order,
                    'categories_count' => $t->categories_count,
                ]),
            ]);

        return Inertia::render('Developer/BusinessTemplates/Index', [
            'storeTypes' => $storeTypes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Developer/BusinessTemplates/Form', [
            'template' => null,
            'storeTypes' => $this->storeTypeOptions(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->templateRules());

        $template = BusinessTemplate::create($validated + ['is_ready' => false]);

        DeveloperActionLog::record('business_template.create', $template, null, $validated);

        return redirect()
            ->route('developer.business-templates.index')
            ->with('success', 'Template bisnis berhasil dibuat.');
    }

    public function edit(BusinessTemplate $businessTemplate)
    {
        return Inertia::render('Developer/BusinessTemplates/Form', [
            'template' => [
                'id' => $businessTemplate->id,
                'store_type_id' => $businessTemplate->store_type_id,
                'code' => $businessTemplate->code,
                'label' => $businessTemplate->label,
                'icon' => $businessTemplate->icon,
                'description' => $businessTemplate->description,
                'is_active' => $businessTemplate->is_active,
                'sort_order' => $businessTemplate->sort_order,
            ],
            'storeTypes' => $this->storeTypeOptions(),
        ]);
    }

    public function update(Request $request, BusinessTemplate $businessTemplate)
    {
        $validated = $request->validate($this->templateRules($businessTemplate));
        $oldValues = $businessTemplate->only(array_keys($validated));

        $businessTemplate->update($validated);

        DeveloperActionLog::record('business_template.update', $businessTemplate, $oldValues, $validated);

        return redirect()
            ->route('developer.business-templates.index')
            ->with('success', 'Template bisnis berhasil diperbarui.');
    }

    public function destroy(BusinessTemplate $businessTemplate)
    {
        $snapshot = $businessTemplate->only(['id', 'code', 'label']);
        DeveloperActionLog::record('business_template.destroy', $businessTemplate, $snapshot, null);

        $businessTemplate->delete();

        return redirect()
            ->route('developer.business-templates.index')
            ->with('success', 'Template bisnis berhasil dihapus.');
    }

    /* ─── CRUD Kategori (nested level 1) ────────────────────────────────── */

    public function categories(BusinessTemplate $businessTemplate)
    {
        $businessTemplate->load(['categories' => fn ($q) => $q->ordered()->with(['products' => fn ($p) => $p->ordered()])]);

        return Inertia::render('Developer/BusinessTemplates/Categories', [
            'template' => [
                'id' => $businessTemplate->id,
                'code' => $businessTemplate->code,
                'label' => $businessTemplate->label,
                'is_ready' => $businessTemplate->is_ready,
            ],
            'categories' => $businessTemplate->categories->map(fn (BusinessTemplateCategory $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'sort_order' => $c->sort_order,
                'products' => $c->products->map(fn (BusinessTemplateProduct $p) => [
                    'id' => $p->id,
                    'sku' => $p->sku,
                    'name' => $p->name,
                    'unit' => $p->unit,
                    'cost_price' => (float) $p->cost_price,
                    'sell_price' => (float) $p->sell_price,
                    'track_stock' => $p->track_stock,
                    'stock_minimum' => $p->stock_minimum,
                    'preparation_time' => $p->preparation_time,
                    'is_composable' => $p->is_composable,
                    'sort_order' => $p->sort_order,
                ]),
            ]),
        ]);
    }

    public function storeCategory(Request $request, BusinessTemplate $businessTemplate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $businessTemplate->categories()->create($validated);
        $businessTemplate->syncIsReady();

        return redirect()
            ->route('developer.business-templates.categories', $businessTemplate)
            ->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function updateCategory(Request $request, BusinessTemplate $businessTemplate, BusinessTemplateCategory $category)
    {
        abort_if($category->business_template_id !== $businessTemplate->id, 404);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $category->update($validated);

        return redirect()
            ->route('developer.business-templates.categories', $businessTemplate)
            ->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroyCategory(BusinessTemplate $businessTemplate, BusinessTemplateCategory $category)
    {
        abort_if($category->business_template_id !== $businessTemplate->id, 404);

        $category->delete();
        $businessTemplate->syncIsReady();

        return redirect()
            ->route('developer.business-templates.categories', $businessTemplate)
            ->with('success', 'Kategori berhasil dihapus.');
    }

    /* ─── CRUD Produk (nested level 2, di bawah kategori) ───────────────── */

    public function storeProduct(Request $request, BusinessTemplate $businessTemplate, BusinessTemplateCategory $category)
    {
        abort_if($category->business_template_id !== $businessTemplate->id, 404);

        $validated = $request->validate($this->productRules($category));

        $category->products()->create($validated);

        return redirect()
            ->route('developer.business-templates.categories', $businessTemplate)
            ->with('success', 'Produk berhasil ditambahkan.');
    }

    public function updateProduct(
        Request $request,
        BusinessTemplate $businessTemplate,
        BusinessTemplateCategory $category,
        BusinessTemplateProduct $product,
    ) {
        abort_if($category->business_template_id !== $businessTemplate->id, 404);
        abort_if($product->business_template_category_id !== $category->id, 404);

        $validated = $request->validate($this->productRules($category, $product));

        $product->update($validated);

        return redirect()
            ->route('developer.business-templates.categories', $businessTemplate)
            ->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroyProduct(
        BusinessTemplate $businessTemplate,
        BusinessTemplateCategory $category,
        BusinessTemplateProduct $product,
    ) {
        abort_if($category->business_template_id !== $businessTemplate->id, 404);
        abort_if($product->business_template_category_id !== $category->id, 404);

        $product->delete();

        return redirect()
            ->route('developer.business-templates.categories', $businessTemplate)
            ->with('success', 'Produk berhasil dihapus.');
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    private function storeTypeOptions()
    {
        return StoreType::orderBy('sort_order')->get(['id', 'code', 'label', 'icon']);
    }

    /**
     * Aturan validasi metadata template — dipakai store() dan update().
     * `is_ready` sengaja tidak ada di sini karena derived state, bukan input.
     */
    private function templateRules(?BusinessTemplate $template = null): array
    {
        return [
            'store_type_id' => ['required', 'integer', 'exists:store_types,id'],
            'code' => [
                'required', 'string', 'max:50', 'regex:/^[a-z0-9_]+$/',
                $template
                    ? Rule::unique('business_templates', 'code')->ignore($template->id)
                    : Rule::unique('business_templates', 'code'),
            ],
            'label' => 'required|string|max:255',
            'icon' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Aturan validasi produk — SKU unique di-scope ke kategori (tidak perlu
     * unique global, karena produk contoh diterapkan per store yang berbeda).
     */
    private function productRules(BusinessTemplateCategory $category, ?BusinessTemplateProduct $product = null): array
    {
        return [
            'sku' => [
                'required', 'string', 'max:50',
                $product
                    ? Rule::unique('business_template_products', 'sku')
                        ->where(fn ($q) => $q->where('business_template_category_id', $category->id))
                        ->ignore($product->id)
                    : Rule::unique('business_template_products', 'sku')
                        ->where(fn ($q) => $q->where('business_template_category_id', $category->id)),
            ],
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:20',
            'cost_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'track_stock' => 'boolean',
            'stock_minimum' => 'nullable|integer|min:0',
            'preparation_time' => 'nullable|integer|min:0',
            'is_composable' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }
}
