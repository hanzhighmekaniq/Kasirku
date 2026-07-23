<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductRecipeController extends Controller
{
    /**
     * Halaman manajemen resep produk.
     */
    public function index(Product $product)
    {
        $storeId = session('current_store_id');
        $store = Store::with('storeType')->find($storeId);

        $product->load([
            'recipes.rawMaterial:id,name,sku,unit,base_unit,cost_price,type',
        ]);

        // Bahan baku yang bisa dipilih
        $rawMaterials = Product::forStore($storeId)
            ->where('type', 'raw_material')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'unit', 'base_unit', 'cost_price']);

        return Inertia::render('Admin/Products/Recipes', [
            'product' => $product->only(
                'id',
                'name',
                'sku',
                'type',
                'sell_price',
                'cost_price',
                'image',
            ),
            'recipes' => $product->recipes,
            'rawMaterials' => $rawMaterials,
            'storeType' => $store?->getRelation('storeType')?->code ?? 'retail',
        ]);
    }

    /**
     * Simpan atau update satu baris resep.
     */
    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'raw_material_id' => [
                'required',
                'exists:products,id',
                // tidak boleh sama dengan produk itu sendiri
                function ($attr, $val, $fail) use ($product) {
                    if ((int) $val === $product->id) {
                        $fail(
                            'Bahan baku tidak boleh sama dengan produk itu sendiri.',
                        );
                    }
                },
            ],
            'quantity' => 'required|numeric|min:0.0001',
            'unit' => 'required|string|max:30',
            'is_nullable' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $recipe = ProductRecipe::updateOrCreate(
            [
                'product_id' => $product->id,
                'raw_material_id' => $validated['raw_material_id'],
            ],
            [
                'quantity' => $validated['quantity'],
                'unit' => $validated['unit'],
                'is_nullable' => $validated['is_nullable'] ?? false,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        return back()->with('success', 'Bahan berhasil disimpan.');
    }

    /**
     * Hapus satu baris resep.
     */
    public function destroy(Product $product, ProductRecipe $recipe)
    {
        abort_if($recipe->product_id !== $product->id, 403);
        $recipe->delete();

        return back()->with('success', 'Bahan dihapus dari resep.');
    }
}
