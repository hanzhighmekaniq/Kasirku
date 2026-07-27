<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\Stock\StockMutation;
use App\Services\Stock\StockService;

/**
 * Shared stock deduction logic for sales (normal & split bill).
 *
 * Setelah refactor Tahap 1, trait ini mendelegasikan semua operasi stok ke
 * StockService. Keuntungannya: kalau nanti FEFO atau aturan stok lain
 * ditambahkan, cukup ubah StockService — trait ini tidak perlu disentuh.
 */
trait FinalizesSaleStock
{
    /**
     * Pre-validate that enough stock exists for all items.
     *
     * @throws \RuntimeException if stock is insufficient
     */
    protected function validateStockForItems(array $items, int $storeId, ?int $branchId = null): void
    {
        app(StockService::class)->assertSufficientStock($items, $storeId, $branchId ?? 0);
    }

    /**
     * Deduct stock + create StockMovement records for a completed sale.
     * Handles both recipe-based and direct product stock.
     */
    protected function deductStockForSale(
        Sale $sale,
        $items,
        int $storeId,
        int $branchId,
        string $referenceNo,
        ?\DateTimeImmutable $movedAt = null,
    ): void {
        $stockService = app(StockService::class);
        $now = $movedAt ?? now();

        foreach ($items as $item) {
            $product = Product::with('recipes.rawMaterial.stocks')->find($item['product_id']);

            if (! $product) {
                continue;
            }

            if ($product->recipes->isNotEmpty()) {
                // Produk FnB berkomposisi: potong bahan baku via resep
                $stockService->decreaseRecipeIngredients(
                    item: $item,
                    product: $product,
                    referenceType: Sale::class,
                    referenceId: $sale->id,
                    referenceNo: $referenceNo,
                    storeId: $storeId,
                    branchId: $branchId,
                    movedAt: $movedAt,
                );
            } elseif ($product->track_stock) {
                $variantId = $item['variant_id'] ?? null;
                $packagingUnitId = $item['packaging_unit_id'] ?? null;
                $unitLabel = ! empty($item['unit_name']) ? " ({$item['unit_name']})" : '';

                // Baca average_cost dari bucket yang tepat sebelum dikurangi
                $existing = ProductStock::where([
                    'product_id' => $item['product_id'],
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $packagingUnitId,
                    'store_id' => $storeId,
                    'branch_id' => $branchId,
                ])->first();

                $unitCost = $existing && $existing->average_cost > 0
                    ? $existing->average_cost
                    : ($product->cost_price ?? 0);

                $stockService->decrease(new StockMutation(
                    productId: $item['product_id'],
                    variantId: $variantId,
                    packagingUnitId: $packagingUnitId,
                    storeId: $storeId,
                    branchId: $branchId,
                    quantity: (float) $item['quantity'],
                    unitCost: (float) $unitCost,
                    movementType: 'sale_out',
                    referenceType: Sale::class,
                    referenceId: $sale->id,
                    referenceNo: $referenceNo,
                    notes: "Penjualan #{$referenceNo} — {$item['quantity']}x{$unitLabel} {$product->name}",
                    movedAt: $now ? (string) $now : null,
                ));
            }
        }
    }

    /**
     * Create SaleItem records for a sale.
     *
     * @return array items with resolved promo data (for stock deduction)
     */
    protected function createSaleItems(Sale $sale, $items, int $storeId): array
    {
        $resolvedItems = [];

        foreach ($items as $item) {
            $disc = ($item['discount_amount'] ?? 0) + ($item['promo_discount'] ?? 0);
            $modExtra = collect($item['modifiers'] ?? [])->sum('price_addition');
            $unitPrice = $item['price'] + $modExtra;

            $product = Product::with('recipes.rawMaterial.stocks')->find($item['product_id']);

            $recipeSnapshot = null;
            $ingredientCost = 0;
            $hasRecipe = $product && $product->recipes->isNotEmpty();

            if ($hasRecipe) {
                $snapshot = [];
                foreach ($product->recipes as $recipe) {
                    $needed = (float) $recipe->quantity * (float) $item['quantity'];
                    $rawStock = $recipe->rawMaterial->stocks
                        ->where('store_id', $storeId)
                        ->sum('quantity');

                    if (! $recipe->is_nullable && $rawStock < $needed) {
                        throw new \RuntimeException(
                            "Stok bahan \"{$recipe->rawMaterial->name}\" tidak cukup. ".
                            "Dibutuhkan {$needed} {$recipe->unit}, tersedia {$rawStock}.",
                        );
                    }

                    $costPerUnit = $recipe->rawMaterial->costPerBaseUnit();
                    $ingredientCost += $needed * $costPerUnit;

                    $snapshot[] = [
                        'raw_material_id' => $recipe->raw_material_id,
                        'raw_material_name' => $recipe->rawMaterial->name,
                        'quantity_per_unit' => (float) $recipe->quantity,
                        'total_quantity' => $needed,
                        'unit' => $recipe->unit,
                        'cost_price' => $costPerUnit,
                        'total_cost' => $needed * $costPerUnit,
                        'is_nullable' => $recipe->is_nullable,
                    ];
                }
                $recipeSnapshot = $snapshot;
            }

            SaleItem::create([
                'sale_id' => $sale->id,
                'product_id' => $item['product_id'],
                'variant_id' => $item['variant_id'] ?? null,
                'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                'unit_name' => $item['unit_name'] ?? null,
                'unit_conversion_qty' => $item['unit_conversion_qty'] ?? 1,
                'promotion_id' => $item['promotion_id'] ?? null,
                'quantity' => $item['quantity'],
                'price' => $unitPrice,
                'discount_amount' => $item['discount_amount'] ?? 0,
                'promo_discount' => $item['promo_discount'] ?? 0,
                'subtotal' => $item['quantity'] * $unitPrice
                    - ($item['discount_amount'] ?? 0)
                    - ($item['promo_discount'] ?? 0),
                'modifiers' => $item['modifiers'] ?? null,
                'recipe_snapshot' => $recipeSnapshot,
                'ingredient_cost' => $ingredientCost,
                'notes' => $item['notes'] ?? null,
            ]);

            $resolvedItems[] = $item;
        }

        return $resolvedItems;
    }
}
