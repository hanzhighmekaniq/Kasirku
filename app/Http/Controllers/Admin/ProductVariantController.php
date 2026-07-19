<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\BarcodeHelper;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    public function index(Product $product)
    {
        $product->load([
            'variants.priceTiers',
            'variants.packagingUnits',
            'category',
        ]);

        return Inertia::render('Admin/Products/Variants', [
            'product' => $product,
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'sku' => 'required|string|max:100|unique:product_variants,sku',
            'barcode' => 'nullable|string|max:100|unique:product_variants,barcode',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'price_tiers' => 'nullable|array',
            'price_tiers.*.min_qty' => 'required|integer|min:1',
            'price_tiers.*.price' => 'required|numeric|min:0',
            'packaging_units' => 'nullable|array',
            'packaging_units.*.name' => 'required|string|max:50',
            'packaging_units.*.conversion_qty' => 'required|integer|min:1',
            'packaging_units.*.sell_price' => 'nullable|numeric|min:0',
            'packaging_units.*.barcode' => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($validated, $product) {
            $barcode = $validated['barcode'] ?? BarcodeHelper::generateForVariant($product->id);

            $variant = $product->variants()->create([
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'barcode' => $barcode,
                'price' => $validated['price'],
                'cost_price' => $validated['cost_price'] ?? 0,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['price_tiers'] ?? [] as $tier) {
                $product->priceTiers()->create([
                    'variant_id' => $variant->id,
                    'min_qty' => $tier['min_qty'],
                    'price' => $tier['price'],
                ]);
            }

            foreach ($validated['packaging_units'] ?? [] as $pu) {
                $product->packagingUnits()->create([
                    'variant_id' => $variant->id,
                    'name' => $pu['name'],
                    'conversion_qty' => $pu['conversion_qty'],
                    'sell_price' => $pu['sell_price'] ?? 0,
                    'barcode' => $pu['barcode'] ?? null,
                ]);
            }

            // Auto-set is_variant = true
            if (! $product->is_variant) {
                $product->update(['is_variant' => true]);
            }
        });

        return back()->with('success', 'Varian berhasil ditambahkan.');
    }

    public function update(Request $request, Product $product, ProductVariant $variant)
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'sku' => 'required|string|max:100|unique:product_variants,sku,'.$variant->id,
            'barcode' => 'nullable|string|max:100|unique:product_variants,barcode,'.$variant->id,
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'price_tiers' => 'nullable|array',
            'price_tiers.*.min_qty' => 'required|integer|min:1',
            'price_tiers.*.price' => 'required|numeric|min:0',
            'packaging_units' => 'nullable|array',
            'packaging_units.*.name' => 'required|string|max:50',
            'packaging_units.*.conversion_qty' => 'required|integer|min:1',
            'packaging_units.*.sell_price' => 'nullable|numeric|min:0',
            'packaging_units.*.barcode' => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($validated, $variant, $product) {
            $variant->update([
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'price' => $validated['price'],
                'cost_price' => $validated['cost_price'] ?? 0,
                'is_active' => $validated['is_active'] ?? $variant->is_active,
            ]);

            // Rebuild variant-scoped price_tiers
            $product->priceTiers()->where('variant_id', $variant->id)->delete();
            foreach ($validated['price_tiers'] ?? [] as $tier) {
                $product->priceTiers()->create([
                    'variant_id' => $variant->id,
                    'min_qty' => $tier['min_qty'],
                    'price' => $tier['price'],
                ]);
            }

            // Rebuild variant-scoped packaging_units
            $product->packagingUnits()->where('variant_id', $variant->id)->delete();
            foreach ($validated['packaging_units'] ?? [] as $pu) {
                $product->packagingUnits()->create([
                    'variant_id' => $variant->id,
                    'name' => $pu['name'],
                    'conversion_qty' => $pu['conversion_qty'],
                    'sell_price' => $pu['sell_price'] ?? 0,
                    'barcode' => $pu['barcode'] ?? null,
                ]);
            }
        });

        return back()->with('success', 'Varian berhasil diperbarui.');
    }

    public function destroy(Product $product, ProductVariant $variant)
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }

        $variant->delete();

        // Auto-set is_variant = false if no variants left
        if ($product->variants()->count() === 0) {
            $product->update(['is_variant' => false]);
        }

        return back()->with('success', 'Varian berhasil dihapus.');
    }
}
