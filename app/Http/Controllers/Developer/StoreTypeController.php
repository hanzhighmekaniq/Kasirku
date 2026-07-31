<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\DeveloperActionLog;
use App\Models\StoreType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StoreTypeController extends Controller
{
    public function index()
    {
        $storeTypes = StoreType::orderBy('sort_order')
            ->get()
            ->map(fn (StoreType $type) => [
                'id' => $type->id,
                'code' => $type->code,
                'label' => $type->label,
                'icon' => $type->icon,
                'description' => $type->description,
                'is_active' => $type->is_active,
                'sort_order' => $type->sort_order,
                'stores_count' => $type->stores()->count(),
                'business_templates_count' => $type->businessTemplates()->count(),
            ]);

        return Inertia::render('Developer/StoreTypes/Index', [
            'storeTypes' => $storeTypes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Developer/StoreTypes/Form', [
            'storeType' => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->storeTypeRules());

        $storeType = StoreType::create($validated);

        DeveloperActionLog::record('store_type.create', $storeType, null, $validated);

        return redirect()
            ->route('developer.store-types.index')
            ->with('success', 'Jenis usaha berhasil dibuat.');
    }

    public function edit(StoreType $storeType)
    {
        return Inertia::render('Developer/StoreTypes/Form', [
            'storeType' => [
                'id' => $storeType->id,
                'code' => $storeType->code,
                'label' => $storeType->label,
                'icon' => $storeType->icon,
                'description' => $storeType->description,
                'is_active' => $storeType->is_active,
                'sort_order' => $storeType->sort_order,
            ],
        ]);
    }

    public function update(Request $request, StoreType $storeType)
    {
        $validated = $request->validate($this->storeTypeRules($storeType));
        $oldValues = $storeType->only(array_keys($validated));

        $storeType->update($validated);

        DeveloperActionLog::record('store_type.update', $storeType, $oldValues, $validated);

        return redirect()
            ->route('developer.store-types.index')
            ->with('success', 'Jenis usaha berhasil diperbarui.');
    }

    public function destroy(StoreType $storeType)
    {
        if ($storeType->stores()->exists()) {
            return back()->with(
                'error',
                'Jenis usaha masih dipakai oleh toko. Nonaktifkan saja.',
            );
        }

        $snapshot = $storeType->only(['id', 'code', 'label']);
        DeveloperActionLog::record('store_type.destroy', $storeType, $snapshot, null);

        $storeType->delete();

        return redirect()
            ->route('developer.store-types.index')
            ->with('success', 'Jenis usaha berhasil dihapus.');
    }

    /** Reorder jenis usaha via drag & drop — terima array of { id, sort_order } */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|integer|exists:store_types,id',
            'orders.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['orders'] as $item) {
            StoreType::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Aturan validasi jenis usaha — dipakai store() dan update().
     *
     * `pos_behavior` & `order_types` sengaja tidak divalidasi/diisi dari sini:
     * field itu legacy dan tidak dipakai untuk switch perilaku kasir manapun
     * (lihat KasirController — mode kasir di-switch berdasarkan `code`, bukan
     * `pos_behavior`). Jenis usaha baru dari panel ini murni metadata
     * (label, ikon, deskripsi, mapping fitur) — mode kasir teknis untuk kode
     * baru tetap butuh pengembangan programmer.
     */
    private function storeTypeRules(?StoreType $storeType = null): array
    {
        return [
            'code' => [
                'required', 'string', 'max:50', 'regex:/^[a-z0-9_]+$/',
                $storeType
                    ? Rule::unique('store_types', 'code')->ignore($storeType->id)
                    : Rule::unique('store_types', 'code'),
            ],
            'label' => 'required|string|max:255',
            'icon' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }
}
