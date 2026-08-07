<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BarcodeLabelController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');

        return Inertia::render('Admin/BarcodeLabels/Index', [
            'buckets' => $this->labelBucketOptions($storeId),
            'storeName' => Store::where('id', $storeId)->value('name'),
        ]);
    }

    /**
     * Bucket produk untuk picker bertingkat (produk → varian → satuan) di
     * halaman label barcode.
     *
     * Bentuknya sengaja sama dengan BuildsStockBucketOptions supaya bisa
     * dipakai komponen StockBucketPicker, tapi tanpa eager-load stok dan
     * tanpa filter `track_stock`: label barcode perlu mencetak semua produk
     * aktif apa pun status pelacakan stoknya, dan info stok per cabang tidak
     * relevan di sini.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function labelBucketOptions(int $storeId): array
    {
        $products = Product::forStore($storeId)
            ->where('is_active', true)
            ->with([
                'variants' => fn ($q) => $q->where('is_active', true),
                'variants.packagingUnits',
                'packagingUnits' => fn ($q) => $q->whereNull('variant_id'),
            ])
            ->orderBy('name')
            ->get();

        $buckets = [];

        foreach ($products as $product) {
            $make = function ($variant, $unit) use ($product) {
                $variantId = $variant?->id;
                $unitId = $unit?->id;
                $label = $product->name;
                if ($variant) {
                    $label .= ' — '.$variant->name;
                }
                if ($unit) {
                    $label .= ' — '.$unit->name;
                }

                return [
                    'key' => sprintf('%d-%s-%s', $product->id, $variantId ?? '', $unitId ?? ''),
                    'product_id' => $product->id,
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $unitId,
                    'label' => $label,
                    'product_name' => $product->name,
                    'variant_name' => $variant?->name,
                    'unit_name' => $unit?->name,
                    'product_sku' => $variant?->sku ?: $product->sku,
                    'barcode' => $unit?->barcode ?: ($variant?->barcode ?: $product->barcode),
                    'sell_price' => (float) ($unit?->sell_price ?: $variant?->price ?: $product->sell_price ?: 0),
                    'conversion_qty' => $unit?->conversion_qty,
                    'type' => $product->type,
                    'unit' => $product->unit,
                    'base_unit' => $product->base_unit,
                    'base_unit_conversion' => $product->base_unit_conversion,
                ];
            };

            if ($product->variants->isNotEmpty()) {
                foreach ($product->variants as $variant) {
                    $buckets[] = $make($variant, null);
                    foreach ($variant->packagingUnits as $unit) {
                        $buckets[] = $make($variant, $unit);
                    }
                }

                continue;
            }

            $buckets[] = $make(null, null);
            foreach ($product->packagingUnits as $unit) {
                $buckets[] = $make(null, $unit);
            }
        }

        return $buckets;
    }
}
