<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Product;

/**
 * Membangun daftar target promo yang bisa dipilih di form promosi.
 *
 * Polanya meniru BuildsStockBucketOptions supaya form promo memakai komponen
 * picker yang sama (produk → varian → satuan), tapi dengan tiga perbedaan
 * yang disengaja:
 *
 * 1. Tidak memfilter `track_stock`. Promo juga berlaku untuk jasa dan produk
 *    non-stok, jadi membatasi ke produk berstok akan menyembunyikan target
 *    yang sah.
 * 2. Memakai harga jual, bukan harga pokok, karena itu angka yang relevan
 *    saat kasir menilai besaran diskon.
 * 3. Produk bervariant TETAP menawarkan bucket dasar (variant NULL). Untuk
 *    promo, memilih produk induk punya arti yang jelas: promo berlaku untuk
 *    seluruh varian produk itu.
 */
trait BuildsPromoTargetOptions
{
    /**
     * @return array<int, array<string, mixed>> daftar rata (flat) untuk picker
     */
    protected function promoTargetOptions(int $storeId): array
    {
        $products = Product::forStore($storeId)
            ->where('is_active', true)
            ->where('is_sellable', true)
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

                $price = $unit?->sell_price
                    ?: ($variant?->price ?: $product->sell_price);

                return [
                    'key' => sprintf('%d-%s-%s', $product->id, $variantId ?? '', $unitId ?? ''),
                    'product_id' => $product->id,
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $unitId,
                    'label' => $label,
                    'product_name' => $product->name,
                    'variant_name' => $variant?->name,
                    'unit_name' => $unit?->name,
                    'sku' => $variant?->sku ?: $product->sku,
                    'conversion_qty' => $unit?->conversion_qty,
                    'sell_price' => (float) ($price ?: 0),
                    'type' => $product->type,
                    'unit' => $product->unit,
                    // Menandai bucket induk produk bervariant supaya frontend
                    // bisa menjelaskan bahwa promo mencakup semua varian.
                    'covers_all_variants' => $variantId === null
                        && $product->variants->isNotEmpty(),
                ];
            };

            $buckets[] = $make(null, null);

            foreach ($product->packagingUnits as $unit) {
                $buckets[] = $make(null, $unit);
            }

            foreach ($product->variants as $variant) {
                $buckets[] = $make($variant, null);

                foreach ($variant->packagingUnits as $unit) {
                    $buckets[] = $make($variant, $unit);
                }
            }
        }

        return $buckets;
    }
}
