<?php

namespace App\Services;

use App\Models\BusinessTemplate;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;

/**
 * Menerapkan data awal (kategori & produk contoh) sebuah template bisnis ke
 * toko baru. Sepenuhnya data-driven — isi kategori/produk dikelola developer
 * lewat panel Developer (tabel business_template_categories/_products),
 * bukan hardcoded di kode PHP. Menambah template baru tidak perlu deploy
 * kode sama sekali.
 *
 * Satu sumber kebenaran yang dipakai baik saat registrasi self-service
 * maupun (potensial) alur lain yang butuh seed data awal toko.
 */
class BusinessTemplateService
{
    /**
     * Terapkan template ke toko berdasarkan kode-nya.
     *
     * Tidak melakukan apa pun bila kode template null/kosong (mis. user
     * memilih "Mulai Kosong") atau template belum punya kategori sama
     * sekali (is_ready false — belum ada data contoh untuknya).
     *
     * Idempotent — aman dipanggil berulang untuk toko yang sama karena
     * insert kategori/produk pakai firstOrCreate.
     */
    public static function apply(Store $store, ?string $templateCode): void
    {
        if (! $templateCode) {
            return;
        }

        $template = BusinessTemplate::where('code', $templateCode)
            ->with('categories.products')
            ->first();

        if (! $template) {
            return;
        }

        $categoryIds = [];

        foreach ($template->categories as $index => $category) {
            $model = Category::firstOrCreate(
                ['store_id' => $store->id, 'name' => $category->name],
                [
                    'sort_order' => $category->sort_order ?? $index + 1,
                    'is_active' => true,
                ],
            );

            $categoryIds[$category->id] = $model->id;

            foreach ($category->products as $product) {
                Product::firstOrCreate(
                    ['store_id' => $store->id, 'sku' => $product->sku],
                    [
                        'category_id' => $model->id,
                        'name' => $product->name,
                        'type' => 'finished_goods',
                        'unit' => $product->unit,
                        'cost_price' => $product->cost_price,
                        'sell_price' => $product->sell_price,
                        'track_stock' => $product->track_stock,
                        'stock_minimum' => $product->stock_minimum ?? 0,
                        'preparation_time' => $product->preparation_time,
                        'is_composable' => $product->is_composable,
                        'is_sellable' => true,
                        'is_active' => true,
                        'is_variant' => false,
                    ],
                );
            }
        }
    }
}
