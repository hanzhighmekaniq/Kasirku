<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
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
            'recipes.rawMaterial:id,name,sku,unit,base_unit,base_unit_conversion,cost_price,type',
        ]);

        // Komponen yang bisa dipilih.
        //
        // Produk biasa (menu) hanya boleh diisi bahan baku. Paket (combo)
        // juga boleh diisi produk jadi — "Paket Sarapan" berisi Nasi Goreng
        // + Es Teh, bukan tepung dan telur.
        //
        // Untuk combo, komponennya dibatasi produk sederhana karena
        // pemotongan stok resep selalu menyasar bucket dasar
        // (variant_id = null, packaging_unit_id = null):
        //   - tidak punya resep sendiri  -> cegah pemotongan bertingkat
        //   - tidak punya varian/kemasan -> cegah salah bucket stok
        $rawMaterials = Product::forStore($storeId)
            ->when(
                $product->type === 'combo',
                fn ($q) => $q->whereIn('type', ['raw_material', 'finished_goods'])
                    ->where('id', '!=', $product->id)
                    ->whereDoesntHave('recipes')
                    ->where('is_variant', false)
                    ->whereDoesntHave('packagingUnits'),
                fn ($q) => $q->where('type', 'raw_material'),
            )
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'sku',
                'type',
                'unit',
                'base_unit',
                'base_unit_conversion',
                'cost_price',
            ]);

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
            'unit' => 'nullable|string|max:30',
            'is_nullable' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $rawMaterial = Product::forStore(session('current_store_id'))
            ->findOrFail($validated['raw_material_id']);

        $this->assertValidComboComponent($product, $rawMaterial);

        ProductRecipe::updateOrCreate(
            [
                'product_id' => $product->id,
                'raw_material_id' => $validated['raw_material_id'],
            ],
            [
                'quantity' => $validated['quantity'],
                // Satuan resep SELALU diturunkan dari base_unit bahan, tidak
                // pernah diambil dari form. Kalau qty ditulis dalam satuan
                // yang berbeda dari base_unit, seluruh perhitungan HPP
                // (costPerBaseUnit) dan pemotongan stok ikut salah tanpa
                // gejala apa pun. Frontend sudah mengunci pilihannya; ini
                // pengaman untuk request yang dikirim langsung ke endpoint.
                'unit' => $rawMaterial->base_unit,
                'is_nullable' => $validated['is_nullable'] ?? false,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        $product->syncIsComposable();

        return back()->with('success', 'Bahan berhasil disimpan.');
    }

    /**
     * Pastikan komponen yang dipilih layak dipakai sebagai isi paket.
     *
     * Mencerminkan filter di index() — tanpa ini, request langsung ke
     * endpoint bisa memasukkan komponen yang pemotongan stoknya salah
     * sasaran atau bertingkat.
     *
     * @throws ValidationException
     */
    private function assertValidComboComponent(Product $product, Product $component): void
    {
        if ($product->type !== 'combo') {
            return;
        }

        if ($component->recipes()->exists()) {
            throw ValidationException::withMessages([
                'raw_material_id' => 'Komponen paket tidak boleh berupa produk yang punya resep sendiri.',
            ]);
        }

        if ($component->is_variant || $component->packagingUnits()->exists()) {
            throw ValidationException::withMessages([
                'raw_material_id' => 'Komponen paket tidak boleh berupa produk yang punya varian atau kemasan.',
            ]);
        }
    }

    /**
     * Hapus satu baris resep.
     */
    public function destroy(Product $product, ProductRecipe $recipe)
    {
        abort_if($recipe->product_id !== $product->id, 403);
        $recipe->delete();

        $product->syncIsComposable();

        return back()->with('success', 'Bahan dihapus dari resep.');
    }
}
