<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class ProductBarcodeController extends Controller
{
    /**
     * Cari produk by barcode (produk utama atau variant)
     * Digunakan oleh POS Scanner
     */
    public function findByBarcode(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'required|string|max:100'
        ]);

        $barcode = trim($validated['barcode']);
        $storeId = session('current_store_id');

        // 1. Cari di Product terlebih dahulu
        $product = Product::where('barcode', $barcode)
            ->where('store_id', $storeId)
            ->where('is_active', true)
            ->where('is_sellable', true)
            ->first();

        if ($product) {
            $stock = $product->stocks()->sum('quantity') - $product->stocks()->sum('reserved_quantity');

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'barcode' => $product->barcode,
                    'sku' => $product->sku,
                    'sell_price' => (float) $product->sell_price,
                    'cost_price' => (float) $product->cost_price,
                    'type' => 'product',
                    'product_id' => $product->id,
                    'variant_id' => null,
                    'stock' => (int) $stock,
                    'unit' => $product->unit ?? 'pcs',
                    'image' => $product->image,
                ]
            ]);
        }

        // 2. Kalau ga ketemu, cari di ProductVariant
        $variant = ProductVariant::where('barcode', $barcode)
            ->whereHas('product', function($query) use ($storeId) {
                $query->where('store_id', $storeId)
                      ->where('is_active', true);
            })
            ->where('is_active', true)
            ->with(['product'])
            ->first();

        if ($variant) {
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $variant->id,
                    'name' => $variant->product->name . (($variant->name !== $variant->product->name) ? ' - ' . $variant->name : ''),
                    'barcode' => $variant->barcode,
                    'sku' => $variant->sku,
                    'sell_price' => (float) $variant->price,
                    'cost_price' => (float) $variant->cost_price,
                    'type' => 'variant',
                    'product_id' => $variant->product_id,
                    'variant_id' => $variant->id,
                    'stock' => null, // Variant ga punya stock sendiri
                    'unit' => $variant->product->unit ?? 'pcs',
                    'image' => $variant->product->image,
                ]
            ]);
        }

        // 3. Produk tidak ditemukan
        return response()->json([
            'success' => false,
            'message' => 'Produk dengan barcode "' . $barcode . '" tidak ditemukan'
        ], 404);
    }
}
