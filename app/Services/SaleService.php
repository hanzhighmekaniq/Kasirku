<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Services\PromotionService;
use Illuminate\Support\Facades\DB;

class SaleService
{
    /**
     * Create a sale with items and payments.
     *
     * @param array $data  {
     *   store_id, branch_id, user_id,
     *   customer_id?, table_id?, order_type,
     *   discount_amount?, tax_amount?, notes?,
     *   payments: array of { method_id, amount, is_pg?, pg_provider?, pg_method?, reference_no? },
     *   items: array of { product_id, variant_id?, quantity, price, discount_amount?, modifiers?, notes? }
     * }
     * @return \App\Models\Sale
     */
    public function createSale(array $data): Sale
    {
        $now      = now();
        $storeId  = (int) ($data['store_id'] ?? session('current_store_id'));
        $branchId = (int) ($data['branch_id'] ?? session('branch_id'));
        $userId   = (int) ($data['user_id'] ?? auth()->id());

        // ── Generate sale_no ──
        $prefix = 'SL-' . $now->format('Ymd') . '-';
        $last   = Sale::where('sale_no', 'like', $prefix . '%')->orderByDesc('sale_no')->first();
        $seq    = $last ? (int) substr($last->sale_no, -3) + 1 : 1;
        $saleNo = $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);

        $items = $data['items'] ?? [];

        // ── Resolve customer tier for promo ──
        $customerTier = null;
        if (!empty($data['customer_id'])) {
            $customerTier = Customer::find($data['customer_id'])?->tier;
        }

        // ── Auto-apply promosi per item ──
        $promoService = new PromotionService();
        $items = $promoService->applyPromosToCart($items, $customerTier);

        // ── Hitung subtotal ──
        $subtotal = 0;
        foreach ($items as $item) {
            $disc     = ($item['discount_amount'] ?? 0) + ($item['promo_discount'] ?? 0);
            $modExtra = collect($item['modifiers'] ?? [])->sum('price_addition');
            $subtotal += ($item['quantity'] * ($item['price'] + $modExtra)) - $disc;
        }

        $discount = $data['discount_amount'] ?? 0;
        $tax      = $data['tax_amount'] ?? 0;

        // ── Auto-apply cart-level promo ──
        $cartPromoResult = $promoService->findBestCartPromo($subtotal, $customerTier);
        $cartPromoDiscount = 0;
        if ($cartPromoResult) {
            $cartPromoDiscount = $cartPromoResult['discount'];
        }

        $grandTotal = $subtotal - $discount - $cartPromoDiscount + $tax;
        $paidTotal  = collect($data['payments'])->sum('amount');
        $change     = max(0, $paidTotal - $grandTotal);

        // ── Payment status ──
        $hasPgPayment = collect($data['payments'])->contains('is_pg', true);
        $paymentStatus = $hasPgPayment ? 'pending' : ($paidTotal <= 0 ? 'unpaid' : ($paidTotal < $grandTotal ? 'partial' : 'paid'));
        $saleStatus    = $hasPgPayment ? 'pending' : 'completed';

        // ── Check if order has mix-and-match promo ──
        $hasMixMatch = collect($items)->contains(fn ($i) => ($i['promo_type'] ?? null) === 'mix_and_match');

        DB::beginTransaction();
        try {
            $sale = Sale::create([
                'store_id'        => $storeId,
                'branch_id'       => $branchId,
                'table_id'        => $data['table_id'] ?? null,
                'customer_id'     => $data['customer_id'] ?? null,
                'user_id'         => $userId,
                'sale_no'         => $saleNo,
                'sale_date'       => $now,
                'subtotal'        => $subtotal,
                'discount_amount' => $discount + $cartPromoDiscount,
                'tax_amount'      => $tax,
                'shipping_amount' => 0,
                'grand_total'     => $grandTotal,
                'paid_amount'     => $paidTotal,
                'change_amount'   => $change,
                'status'          => $saleStatus,
                'payment_status'  => $paymentStatus,
                'order_type'      => $data['order_type'],
                'notes'           => $data['notes'] ?? null,
            ]);

            // ── Create SaleItems ──
            foreach ($items as $item) {
                $disc      = ($item['discount_amount'] ?? 0) + ($item['promo_discount'] ?? 0);
                $modExtra  = collect($item['modifiers'] ?? [])->sum('price_addition');
                $unitPrice = $item['price'] + $modExtra;

                // ── Recipe logic ──────────────────────────────────
                $product       = Product::with('recipes.rawMaterial.stocks')->find($item['product_id']);
                $recipeSnapshot = null;
                $ingredientCost = 0;
                $hasRecipe      = $product && $product->recipes->isNotEmpty();

                if ($hasRecipe) {
                    $snapshot = [];
                    foreach ($product->recipes as $recipe) {
                        $needed   = $recipe->quantity * $item['quantity'];
                        $rawStock = $recipe->rawMaterial->stocks
                            ->where('store_id', $storeId)
                            ->sum('quantity');

                        // Cek stok bahan (kecuali is_nullable)
                        if (!$recipe->is_nullable && $rawStock < $needed) {
                            throw new \Exception(
                                "Stok bahan \"{$recipe->rawMaterial->name}\" tidak cukup. " .
                                "Dibutuhkan {$needed} {$recipe->unit}, tersedia {$rawStock}."
                            );
                        }

                        $ingredientCost += $needed * (float) $recipe->rawMaterial->cost_price;

                        $snapshot[] = [
                            'raw_material_id'   => $recipe->raw_material_id,
                            'raw_material_name' => $recipe->rawMaterial->name,
                            'quantity_per_unit' => (float) $recipe->quantity,
                            'total_quantity'    => $needed,
                            'unit'              => $recipe->unit,
                            'cost_price'        => (float) $recipe->rawMaterial->cost_price,
                            'total_cost'        => $needed * (float) $recipe->rawMaterial->cost_price,
                            'is_nullable'       => $recipe->is_nullable,
                        ];
                    }
                    $recipeSnapshot = $snapshot;
                }

                $sale->items()->create([
                    'sale_id'          => $sale->id,
                    'product_id'       => $item['product_id'],
                    'variant_id'       => $item['variant_id'] ?? null,
                    'promotion_id'     => $item['promotion_id'] ?? null,
                    'quantity'         => $item['quantity'],
                    'price'            => $unitPrice,
                    'discount_amount'  => $item['discount_amount'] ?? 0,
                    'promo_discount'   => $item['promo_discount'] ?? 0,
                    'subtotal'         => ($item['quantity'] * $unitPrice) - ($item['discount_amount'] ?? 0) - ($item['promo_discount'] ?? 0),
                    'modifiers'        => !empty($item['modifiers']) ? $item['modifiers'] : null,
                    'recipe_snapshot'  => $recipeSnapshot,
                    'ingredient_cost'  => $ingredientCost,
                    'notes'            => $item['notes'] ?? null,
                ]);

                // ── Deduct stock + catat StockMovement ──────────────
                // Skip stock deduction for PG payments — only deduct when payment confirmed
                if ($hasPgPayment) {
                    // Still record recipe snapshot for reference, but don't deduct
                } elseif ($hasRecipe) {
                    // Potong stok bahan baku
                    foreach ($product->recipes as $recipe) {
                        $needed = $recipe->quantity * $item['quantity'];
                        if ($recipe->is_nullable) {
                            $rawStock = $recipe->rawMaterial->stocks->where('store_id', $storeId)->sum('quantity');
                            if ($rawStock <= 0) continue; // skip bahan opsional yang habis
                        }
                        $stock = ProductStock::firstOrCreate(
                            ['product_id' => $recipe->raw_material_id, 'store_id' => $storeId],
                            ['quantity' => 0, 'reserved_quantity' => 0]
                        );
                        $stock->decrement('quantity', $needed);

                        // Catat riwayat pergerakan stok bahan baku
                        StockMovement::create([
                            'product_id'     => $recipe->raw_material_id,
                            'store_id'       => $storeId,
                            'branch_id'      => $branchId,
                            'reference_type' => Sale::class,
                            'reference_id'   => $sale->id,
                            'movement_type'  => 'sale_out',
                            'quantity'       => $needed,
                            'unit_cost'      => $recipe->rawMaterial->cost_price,
                            'reference_no'   => $saleNo,
                            'notes'          => "Penjualan #{$saleNo} — bahan untuk {$product->name}",
                            'moved_at'       => $now,
                        ]);
                    }
                } else {
                    // Potong stok produk langsung (minimarket behavior)
                    if ($product?->track_stock) {
                        $stock = ProductStock::firstOrCreate(
                            ['product_id' => $item['product_id'], 'store_id' => $storeId],
                            ['quantity' => 0, 'reserved_quantity' => 0]
                        );
                        $stock->decrement('quantity', $item['quantity']);

                        // Catat riwayat pergerakan stok produk
                        StockMovement::create([
                            'product_id'     => $item['product_id'],
                            'store_id'       => $storeId,
                            'branch_id'      => $branchId,
                            'reference_type' => Sale::class,
                            'reference_id'   => $sale->id,
                            'movement_type'  => 'sale_out',
                            'quantity'       => $item['quantity'],
                            'unit_cost'      => $product?->cost_price ?? 0,
                            'reference_no'   => $saleNo,
                            'notes'          => "Penjualan #{$saleNo} — {$item['quantity']}x {$item['product_id']}",
                            'moved_at'       => $now,
                        ]);
                    }
                }
            }

            // ── Create SalePayments (only for non-PG; PG creates on callback) ──
            foreach ($data['payments'] as $pay) {
                if (empty($pay['is_pg'])) {
                    $sale->payments()->create([
                        'sale_id'           => $sale->id,
                        'payment_method_id' => $pay['method_id'],
                        'paid_at'           => $now,
                        'amount'            => $pay['amount'],
                        'reference_no'      => $pay['reference_no'] ?? null,
                    ]);
                }
            }

            DB::commit();

            return $sale;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
