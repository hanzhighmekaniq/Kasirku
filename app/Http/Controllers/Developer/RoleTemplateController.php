<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\RoleTemplate;
use App\Models\Store;
use App\Models\StoreType;
use App\Services\StoreRoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

/**
 * Template role level platform — menentukan role apa saja yang dibuat saat
 * toko baru lahir, dan di tipe toko mana role itu berlaku.
 *
 * Setiap perubahan permission/cakupan langsung disinkronkan ke semua toko yang
 * tipenya cocok (StoreRoleService::syncTemplateToStores). Sinkronisasi hanya
 * menambah dan memperbarui — tidak pernah menghapus role, supaya user yang
 * memakai role tersebut tidak kehilangan akses diam-diam.
 *
 * Template `is_core` (owner, kasir) tidak bisa dihapus atau di-rename karena
 * namanya dipakai langsung di kode: middleware `role:owner`, RoleMiddleware,
 * dan redirect login `hasRole('kasir')`.
 */
class RoleTemplateController extends Controller
{
    public function index(): Response
    {
        // Jumlah toko per tipe, untuk memberi tahu berapa toko yang benar-benar
        // tersentuh saat template disinkronkan.
        $storeCountByType = Store::query()
            ->with('storeType:id,code')
            ->get(['id', 'store_type_id'])
            ->groupBy(fn (Store $store) => $store->getRelationValue('storeType')?->code ?? '')
            ->map->count();

        $templates = RoleTemplate::query()
            ->ordered()
            ->get()
            ->map(fn (RoleTemplate $t) => [
                'id' => $t->id,
                'key' => $t->key,
                'name' => $t->name,
                'description' => $t->description,
                'icon' => $t->icon,
                'color' => $t->color,
                'is_core' => $t->is_core,
                'permissions' => $t->permissions ?? [],
                'grants_all' => $t->grantsAllPermissions(),
                'store_type_codes' => $t->store_type_codes ?? [],
                'sort_order' => $t->sort_order,
                'store_count' => $storeCountByType
                    ->filter(fn ($count, $code) => $t->appliesTo($code ?: null))
                    ->sum(),
            ]);

        return Inertia::render('Developer/RoleTemplates/Index', [
            'templates' => $templates,
            'storeTypes' => StoreType::query()
                ->orderBy('id')
                ->get(['id', 'code', 'label'])
                ->map(fn (StoreType $type) => [
                    'code' => $type->code,
                    'label' => $type->label,
                ]),
            'allPermissions' => Permission::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Permission $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'group' => explode('.', $p->name)[0],
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'key' => ['nullable', 'string', 'max:50', 'regex:/^[a-z][a-z0-9_-]*$/', Rule::unique('role_templates', 'key')],
            'description' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:30'],
            'store_type_codes' => ['required', 'array', 'min:1'],
            'store_type_codes.*' => ['string', 'max:50'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $key = ($validated['key'] ?? null) ?: Str::slug($validated['name'], '_');

        if (RoleTemplate::where('key', $key)->exists()) {
            return back()->withErrors(['key' => 'Kode template sudah dipakai.']);
        }

        $template = RoleTemplate::create([
            'key' => $key,
            'name' => $validated['name'],
            'description' => ($validated['description'] ?? null) ?: null,
            'icon' => ($validated['icon'] ?? null) ?: 'ShieldCheck',
            'color' => ($validated['color'] ?? null) ?: 'muted',
            'is_core' => false,
            'permissions' => $validated['permissions'] ?? [],
            'store_type_codes' => $validated['store_type_codes'],
            'sort_order' => (int) RoleTemplate::max('sort_order') + 1,
        ]);

        $touched = StoreRoleService::syncTemplateToStores($template);

        return redirect()
            ->route('developer.role-templates.index')
            ->with('success', "Template \"{$template->name}\" dibuat dan diterapkan ke {$touched} toko.");
    }

    /**
     * Ubah nama, deskripsi, tampilan, dan cakupan tipe toko.
     * Template inti boleh diubah cakupan/deskripsinya, tapi `key`-nya dikunci.
     */
    public function update(Request $request, RoleTemplate $roleTemplate): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:30'],
            'store_type_codes' => ['required', 'array', 'min:1'],
            'store_type_codes.*' => ['string', 'max:50'],
        ]);

        $roleTemplate->update([
            'name' => $validated['name'],
            'description' => ($validated['description'] ?? null) ?: null,
            'icon' => ($validated['icon'] ?? null) ?: $roleTemplate->icon,
            'color' => ($validated['color'] ?? null) ?: $roleTemplate->color,
            'store_type_codes' => $validated['store_type_codes'],
        ]);

        $touched = StoreRoleService::syncTemplateToStores($roleTemplate);

        return redirect()
            ->route('developer.role-templates.index')
            ->with('success', "Template \"{$roleTemplate->name}\" diperbarui dan disinkron ke {$touched} toko.");
    }

    /** Simpan daftar permission template, lalu sinkron ke semua toko cocok. */
    public function updatePermissions(Request $request, RoleTemplate $roleTemplate): RedirectResponse
    {
        $validated = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
            'grants_all' => ['sometimes', 'boolean'],
        ]);

        $roleTemplate->update([
            'permissions' => ($validated['grants_all'] ?? false)
                ? ['*']
                : ($validated['permissions'] ?? []),
        ]);

        $touched = StoreRoleService::syncTemplateToStores($roleTemplate);

        return redirect()
            ->route('developer.role-templates.index')
            ->with('success', "Permission \"{$roleTemplate->name}\" disimpan dan disinkron ke {$touched} toko.");
    }

    /**
     * Hapus template. Role yang sudah terbuat di toko TIDAK dihapus — hanya
     * berhenti dibuat untuk toko baru. Penghapusan role per-toko dilakukan dari
     * halaman Role & Permission.
     */
    public function destroy(RoleTemplate $roleTemplate): RedirectResponse
    {
        if ($roleTemplate->is_core) {
            return back()->withErrors([
                'template' => 'Template inti tidak bisa dihapus karena dipakai sistem otorisasi.',
            ]);
        }

        $name = $roleTemplate->name;
        $roleTemplate->delete();

        return redirect()
            ->route('developer.role-templates.index')
            ->with('success', "Template \"{$name}\" dihapus. Role yang sudah ada di toko tidak terpengaruh.");
    }
}
