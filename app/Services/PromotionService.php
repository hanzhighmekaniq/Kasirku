<?php

namespace App\Services;

use App\Models\Promotion;

class PromotionService
{
    private function activePromosQuery()
    {
        return Promotion::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('start_hour')
                    ->orWhere('start_hour', '<=', now()->format('H:i'));
            })
            ->where(function ($q) {
                $q->whereNull('end_hour')
                    ->orWhere('end_hour', '>=', now()->format('H:i'));
            });
    }

    public function findBestPromoForItem(string $productId, int $quantity, float $unitPrice, ?string $customerTier = null): ?array
    {
        $promotions = $this->activePromosQuery()
            ->where('scope', 'item')
            ->where(function ($q) use ($productId) {
                $q->whereHas('products', fn($q2) => $q2->where('products.id', $productId))
                  ->orWhereDoesntHave('products');
            })
            ->get();

        if ($promotions->isEmpty()) return null;

        $itemTotal = $quantity * $unitPrice;
        $bestDiscount = 0;
        $bestPromo = null;

        foreach ($promotions as $promo) {
            if ($promo->products->isNotEmpty() && !$promo->products->contains('id', $productId)) {
                continue;
            }
            if ($promo->min_purchase_amount > 0 && $itemTotal < $promo->min_purchase_amount) {
                continue;
            }
            if ($promo->min_quantity > 0 && $quantity < $promo->min_quantity) {
                continue;
            }
            if ($promo->customer_tier && $promo->customer_tier !== $customerTier) {
                continue;
            }

            $discount = $this->calculateDiscount($promo, $quantity, $unitPrice, $itemTotal, $customerTier);

            if ($discount > $bestDiscount) {
                $bestDiscount = $discount;
                $bestPromo = $promo;
            }
        }

        if ($bestPromo && $bestDiscount > 0) {
            return ['promotion' => $bestPromo, 'discount' => round($bestDiscount, 2)];
        }

        return null;
    }

    private function calculateDiscount(Promotion $promo, int $quantity, float $unitPrice, float $itemTotal, ?string $customerTier): float
    {
        return match ($promo->type) {
            'percentage'   => $this->calculatePercentage($promo, $unitPrice, $quantity),
            'fixed_amount' => $this->calculateFixedAmount($promo),
            'buy_x_get_y'  => $this->calculateBuyXGetY($promo, $quantity, $unitPrice),
            'bundle'       => $this->calculateBundle($promo, $unitPrice, $quantity),
            'tiered'       => $this->calculateTiered($promo, $quantity, $unitPrice),
            'member_price' => $this->calculateMemberPrice($promo, $quantity, $unitPrice),
            'bogo'         => $this->calculateBogo($promo, $quantity),
            default        => 0,
        };
    }

    private function calculatePercentage(Promotion $promo, float $unitPrice, int $quantity): float
    {
        $discount = $unitPrice * $quantity * ($promo->discount_value / 100);
        if ($promo->max_discount_amount > 0) {
            $discount = min($discount, $promo->max_discount_amount);
        }
        return $discount;
    }

    private function calculateFixedAmount(Promotion $promo): float
    {
        return $promo->discount_value;
    }

    private function calculateBuyXGetY(Promotion $promo, int $quantity, float $unitPrice): float
    {
        $buyQty = (int) $promo->discount_value;
        if ($buyQty <= 0 || $quantity < ($buyQty + 1)) return 0;
        return floor($quantity / ($buyQty + 1)) * $unitPrice;
    }

    private function calculateBundle(Promotion $promo, float $unitPrice, int $quantity): float
    {
        return $promo->discount_value * $quantity;
    }

    private function calculateTiered(Promotion $promo, int $quantity, float $unitPrice): float
    {
        if ($promo->tier_price <= 0 || $unitPrice <= $promo->tier_price) return 0;
        return ($unitPrice - $promo->tier_price) * $quantity;
    }

    private function calculateMemberPrice(Promotion $promo, int $quantity, float $unitPrice): float
    {
        if ($promo->tier_price <= 0 || $unitPrice <= $promo->tier_price) return 0;
        return ($unitPrice - $promo->tier_price) * $quantity;
    }

    private function calculateBogo(Promotion $promo, int $quantity): float
    {
        $buyQty = (int) $promo->discount_value;
        if ($buyQty <= 0 || !$promo->free_product_id || $quantity < $buyQty) return 0;
        $freeCount = floor($quantity / $buyQty);
        return $freeCount * ($promo->freeProduct?->sell_price ?? 0);
    }

    public function findBestCartPromo(float $cartSubtotal, ?string $customerTier = null): ?array
    {
        $promotions = $this->activePromosQuery()
            ->where('scope', 'cart')
            ->get();

        if ($promotions->isEmpty()) return null;

        $bestDiscount = 0;
        $bestPromo = null;

        foreach ($promotions as $promo) {
            if ($promo->min_purchase_amount > 0 && $cartSubtotal < $promo->min_purchase_amount) {
                continue;
            }
            if ($promo->customer_tier && $promo->customer_tier !== $customerTier) {
                continue;
            }

            $discount = match ($promo->type) {
                'percentage' => min(
                    $cartSubtotal * ($promo->discount_value / 100),
                    $promo->max_discount_amount > 0 ? $promo->max_discount_amount : PHP_FLOAT_MAX
                ),
                'fixed_amount' => $promo->discount_value,
                default => 0,
            };

            if ($discount > $bestDiscount) {
                $bestDiscount = $discount;
                $bestPromo = $promo;
            }
        }

        if ($bestPromo && $bestDiscount > 0) {
            return ['promotion' => $bestPromo, 'discount' => round($bestDiscount, 2)];
        }

        return null;
    }

    public function applyPromosToCart(array $items, ?string $customerTier = null): array
    {
        $fixedAmountPromos = [];
        $result = [];
        $index = 0;

        foreach ($items as $item) {
            $best = $this->findBestPromoForItem(
                $item['product_id'],
                $item['quantity'],
                $item['price'],
                $customerTier
            );

            if ($best) {
                $item['promotion_id'] = $best['promotion']->id;

                if ($best['promotion']->type === 'fixed_amount') {
                    $promoId = $best['promotion']->id;
                    if (!isset($fixedAmountPromos[$promoId])) {
                        $fixedAmountPromos[$promoId] = [
                            'discount'  => $best['discount'],
                            'indices'   => [],
                            'subtotals' => [],
                        ];
                    }
                    $fixedAmountPromos[$promoId]['indices'][] = $index;
                    $fixedAmountPromos[$promoId]['subtotals'][] = $item['quantity'] * $item['price'];
                    $item['promo_discount'] = 0;
                } else {
                    $item['promo_discount'] = $best['discount'];
                }
            } else {
                $item['promotion_id'] = null;
                $item['promo_discount'] = 0;
            }

            $result[] = $item;
            $index++;
        }

        foreach ($fixedAmountPromos as $data) {
            $totalSubtotal = array_sum($data['subtotals']);
            if ($totalSubtotal <= 0) continue;
            foreach ($data['indices'] as $i => $idx) {
                $proportion = $data['subtotals'][$i] / $totalSubtotal;
                $result[$idx]['promo_discount'] = round($data['discount'] * $proportion, 2);
            }
        }

        return $result;
    }
}
