<?php

namespace App\Services;

use App\Models\Customer;
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
            })
            ->where(function ($q) {
                $q->where('max_usage', 0)
                    ->orWhereNull('max_usage')
                    ->orWhereColumn('used_count', '<', 'max_usage');
            });
    }

    /**
     * Apakah target promo mencakup bucket item yang sedang dihitung?
     *
     * Aturannya menurun dari yang paling umum ke paling spesifik:
     * - promo tanpa target sama sekali → berlaku untuk semua produk
     * - target tanpa varian & satuan    → semua varian/satuan produk itu
     * - target dengan varian saja       → semua satuan pada varian itu
     * - target dengan varian & satuan   → hanya kombinasi itu
     */
    private function promoCoversItem(
        Promotion $promo,
        string|int $productId,
        ?int $variantId,
        ?int $packagingUnitId,
    ): bool {
        if ($promo->products->isEmpty()) {
            return true;
        }

        foreach ($promo->products as $target) {
            if ((int) $target->id !== (int) $productId) {
                continue;
            }

            $targetVariantId = $target->pivot->variant_id;
            $targetUnitId = $target->pivot->packaging_unit_id;

            if ($targetVariantId !== null && (int) $targetVariantId !== (int) $variantId) {
                continue;
            }

            if ($targetUnitId !== null && (int) $targetUnitId !== (int) $packagingUnitId) {
                continue;
            }

            return true;
        }

        return false;
    }

    /**
     * Promo terbaik untuk satu item.
     *
     * `$customerTierId` merujuk `customer_tiers.id`, bukan nama tier — nama bisa
     * diganti owner kapan saja, id tidak.
     */
    public function findBestPromoForItem(
        string $productId,
        int $quantity,
        float $unitPrice,
        ?int $customerTierId = null,
        ?int $variantId = null,
        ?int $packagingUnitId = null,
    ): ?array {
        $promotions = $this->activePromosQuery()
            ->where('scope', 'item')
            ->where(function ($q) use ($productId) {
                $q->whereHas('products', fn ($q2) => $q2->where('products.id', $productId))
                    ->orWhereDoesntHave('products');
            })
            ->with(['products', 'freeProduct:id,sell_price', 'freeVariant:id,price'])
            ->get();

        if ($promotions->isEmpty()) {
            return null;
        }

        $itemTotal = $quantity * $unitPrice;
        $bestDiscount = 0;
        $bestPromo = null;

        foreach ($promotions as $promo) {
            if (! $this->promoCoversItem($promo, $productId, $variantId, $packagingUnitId)) {
                continue;
            }
            if (! $promo->isActiveOnDay()) {
                continue;
            }
            if ($promo->min_purchase_amount > 0 && $itemTotal < $promo->min_purchase_amount) {
                continue;
            }
            if ($promo->min_quantity > 0 && $quantity < $promo->min_quantity) {
                continue;
            }
            if ($promo->customer_tier_id && $promo->customer_tier_id !== $customerTierId) {
                continue;
            }

            $discount = $this->calculateDiscount($promo, $quantity, $unitPrice, $itemTotal);

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

    private function calculateDiscount(Promotion $promo, int $quantity, float $unitPrice, float $itemTotal): float
    {
        return match ($promo->type) {
            'percentage' => $this->calculatePercentage($promo, $unitPrice, $quantity),
            'fixed_amount' => $this->calculateFixedAmount($promo),
            'buy_x_get_y' => $this->calculateBuyXGetY($promo, $quantity, $unitPrice),
            'bundle' => $this->calculateBundle($promo, $unitPrice, $quantity),
            'tiered' => $this->calculateTiered($promo, $quantity, $unitPrice),
            'member_price' => $this->calculateMemberPrice($promo, $quantity, $unitPrice),
            'bogo' => $this->calculateBogo($promo, $quantity),
            default => 0,
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
        if ($buyQty <= 0 || $quantity < ($buyQty + 1)) {
            return 0;
        }

        return floor($quantity / ($buyQty + 1)) * $unitPrice;
    }

    private function calculateBundle(Promotion $promo, float $unitPrice, int $quantity): float
    {
        return $promo->discount_value * $quantity;
    }

    private function calculateTiered(Promotion $promo, int $quantity, float $unitPrice): float
    {
        if ($promo->tier_price <= 0 || $unitPrice <= $promo->tier_price) {
            return 0;
        }

        return ($unitPrice - $promo->tier_price) * $quantity;
    }

    private function calculateMemberPrice(Promotion $promo, int $quantity, float $unitPrice): float
    {
        if ($promo->tier_price <= 0 || $unitPrice <= $promo->tier_price) {
            return 0;
        }

        return ($unitPrice - $promo->tier_price) * $quantity;
    }

    private function calculateBogo(Promotion $promo, int $quantity): float
    {
        $buyQty = (int) $promo->discount_value;
        if ($buyQty <= 0 || ! $promo->free_product_id || $quantity < $buyQty) {
            return 0;
        }

        // Berapa banyak item gratis per kelipatan pembelian. Default 1 supaya
        // promo lama yang belum mengisi free_quantity tetap berperilaku sama.
        $freePerBundle = max(1, (int) ($promo->free_quantity ?? 1));
        $freeCount = floor($quantity / $buyQty) * $freePerBundle;

        // Harga varian gratis dipakai kalau promo menargetkan varian tertentu,
        // karena harga varian bisa berbeda dari produk induknya.
        $freeUnitPrice = (float) (
            $promo->freeVariant?->price
            ?: $promo->freeProduct?->sell_price
            ?: 0
        );

        return $freeCount * $freeUnitPrice;
    }

    /**
     * Kandidat diskon keranjang dari membership pelanggan.
     *
     * Delegasi ke MembershipBenefitService supaya diskon legacy
     * (`memberships.discount_percent`) dan benefit dinamis di kolom JSON
     * dievaluasi lewat satu jalur yang sama.
     */
    public function membershipDiscountCandidate(?Customer $customer, float $cartSubtotal): ?array
    {
        return app(MembershipBenefitService::class)->cartDiscount($customer, $cartSubtotal);
    }

    /**
     * Promo keranjang terbaik. `$customerTierId` merujuk `customer_tiers.id`.
     */
    public function findBestCartPromo(float $cartSubtotal, ?int $customerTierId = null): ?array
    {
        $promotions = $this->activePromosQuery()
            ->where('scope', 'cart')
            ->get();

        if ($promotions->isEmpty()) {
            return null;
        }

        $bestDiscount = 0;
        $bestPromo = null;

        foreach ($promotions as $promo) {
            if (! $promo->isActiveOnDay()) {
                continue;
            }
            if ($promo->min_purchase_amount > 0 && $cartSubtotal < $promo->min_purchase_amount) {
                continue;
            }
            if ($promo->customer_tier_id && $promo->customer_tier_id !== $customerTierId) {
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

    /**
     * Terapkan promo per item ke seluruh keranjang.
     *
     * `$customerTierId` merujuk `customer_tiers.id`.
     */
    public function applyPromosToCart(array $items, ?int $customerTierId = null): array
    {
        $fixedAmountPromos = [];
        $result = [];
        $index = 0;

        foreach ($items as $item) {
            $best = $this->findBestPromoForItem(
                $item['product_id'],
                $item['quantity'],
                $item['price'],
                $customerTierId,
                $item['variant_id'] ?? null,
                $item['packaging_unit_id'] ?? null,
            );

            if ($best) {
                $item['promotion_id'] = $best['promotion']->id;

                if ($best['promotion']->type === 'fixed_amount') {
                    $promoId = $best['promotion']->id;
                    if (! isset($fixedAmountPromos[$promoId])) {
                        $fixedAmountPromos[$promoId] = [
                            'discount' => $best['discount'],
                            'indices' => [],
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
            if ($totalSubtotal <= 0) {
                continue;
            }
            foreach ($data['indices'] as $i => $idx) {
                $proportion = $data['subtotals'][$i] / $totalSubtotal;
                $result[$idx]['promo_discount'] = round($data['discount'] * $proportion, 2);
            }
        }

        return $result;
    }
}
