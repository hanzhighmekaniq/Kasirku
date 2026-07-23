<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;

/**
 * Shared stock deduction logic for sales (normal & split bill).
 */
trait FinalizesSaleStock
{
    /**
     * Pre-validate that enough stock exists for all items.
     *
     * @throws \Exception if stock is insufficient
     */
    protected function validateStockForItems(array $items, int $storeId): void
    {
        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            if (! $product || ! $product->track_stock) {
                continue;
            }
            $hasRecipe = $product->recipes()->exists();
            if ($hasRecipe) {
                continue;
            }

            $actualQty = $item['quantity'];
            $currentStock = ProductStock::where('product_id', $item['product_id'])
                ->where('variant_id', $item['variant_id'] ?? null)
                ->where('packaging_unit_id', $item['packaging_unit_id'] ?? null)
                ->where('store_id', $storeId)
                ->sum('quantity');

            if ($currentStock < $actualQty) {
                $unitLabel = ! empty($item['unit_name']) ? " ({$item['unit_name']})" : '';
                throw new \Exception(
                    "Stok \"{$product->name}{$unitLabel}\" tidak cukup. ".
                    "Dibutuhkan {$actualQty}, tersedia {$currentStock}.",
                );
            }
        }
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
        $now = $movedAt ?? now();

        foreach ($items as $item) {
            $product = Product::with(
                'recipes.rawMaterial.stocks',
            )->find($item['product_id']);

            if (! $product) {
                continue;
            }

            $hasRecipe = $product->recipes->isNotEmpty();

            if ($hasRecipe) {
                // Potong stok bahan baku
                foreach ($product->recipes as $recipe) {
                    $needed = $recipe->quantity * $item['quantity'];
                    if ($recipe->is_nullable) {
                        $rawStock = $recipe->rawMaterial->stocks
                            ->where('store_id', $storeId)
                            ->sum('quantity');
                        if ($rawStock <= 0) {
                            continue;
                        }
                    }
                    $stock = ProductStock::firstOrCreate(
                        [
                            'product_id' => $recipe->raw_material_id,
                            'variant_id' => null,
                            'packaging_unit_id' => null,
                            'store_id' => $storeId,
                        ],
                        ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
                    );
                    $stock->decrement('quantity', $needed);

                    StockMovement::create([
                        'product_id' => $recipe->raw_material_id,
                        'store_id' => $storeId,
                        'branch_id' => $branchId,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'movement_type' => 'sale_out',
                        'quantity' => $needed,
                        'unit_cost' => $recipe->rawMaterial->cost_price,
                        'reference_no' => $referenceNo,
                        'notes' => "Penjualan #{$referenceNo} — bahan untuk {$product->name}",
                        'moved_at' => $now,
                    ]);
                }
            } elseif ($product->track_stock) {
                // Bucket-aware: potong stok dari bucket yang tepat
                $actualQty = $item['quantity'];
                $variantId = $item['variant_id'] ?? null;
                $packagingUnitId = $item['packaging_unit_id'] ?? null;

                $stock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $item['product_id'],
                        'variant_id' => $variantId,
                        'packaging_unit_id' => $packagingUnitId,
                        'store_id' => $storeId,
                    ],
                    ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
                );
                $stock->decrement('quantity', $actualQty);

                $unitLabel = ! empty($item['unit_name']) ? " ({$item['unit_name']})" : '';

                StockMovement::create([
                    'product_id' => $item['product_id'],
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $packagingUnitId,
                    'store_id' => $storeId,
                    'branch_id' => $branchId,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'movement_type' => 'sale_out',
                    'quantity' => $actualQty,
                    'unit_cost' => $stock->average_cost > 0
                        ? $stock->average_cost
                        : ($product->cost_price ?? 0),
                    'reference_no' => $referenceNo,
                    'notes' => "Penjualan #{$referenceNo} — {$item['quantity']}x{$unitLabel} {$product->name}",
                    'moved_at' => $now,
                ]);
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

            $product = Product::with(
                'recipes.rawMaterial.stocks',
            )->find($item['product_id']);

            $recipeSnapshot = null;
            $ingredientCost = 0;
            $hasRecipe = $product && $product->recipes->isNotEmpty();

            if ($hasRecipe) {
                $snapshot = [];
                foreach ($product->recipes as $recipe) {
                    $needed = $recipe->quantity * $item['quantity'];
                    $rawStock = $recipe->rawMaterial->stocks
                        ->where('store_id', $storeId)
                        ->sum('quantity');

                    if (! $recipe->is_nullable && $rawStock < $needed) {
                        throw new \Exception(
                            "Stok bahan \"{$recipe->rawMaterial->name}\" tidak cukup. ".
                            "Dibutuhkan {$needed} {$recipe->unit}, tersedia {$rawStock}.",
                        );
                    }

                    $ingredientCost += $needed * (float) $recipe->rawMaterial->cost_price;

                    $snapshot[] = [
                        'raw_material_id' => $recipe->raw_material_id,
                        'raw_material_name' => $recipe->rawMaterial->name,
                        'quantity_per_unit' => (float) $recipe->quantity,
                        'total_quantity' => $needed,
                        'unit' => $recipe->unit,
                        'cost_price' => (float) $recipe->rawMaterial->cost_price,
                        'total_cost' => $needed * (float) $recipe->rawMaterial->cost_price,
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
