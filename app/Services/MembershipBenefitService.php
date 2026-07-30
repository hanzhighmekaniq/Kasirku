<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\Membership;

/**
 * Mengeksekusi benefit membership yang bersifat otomatis.
 *
 * Bentuk benefit disimpan dinamis di kolom JSON `memberships.benefits`, jadi
 * service ini yang menerjemahkan katalog `Membership::BENEFIT_TYPES` menjadi
 * angka konkret di keranjang: diskon, subsidi ongkir, dan hak produk gratis.
 */
class MembershipBenefitService
{
    /** Membership aktif pelanggan, null jika tidak ada. */
    public function activeMembership(?Customer $customer): ?Membership
    {
        return $customer?->activeMembership()?->membership;
    }

    /**
     * Diskon keranjang dari benefit membership.
     *
     * Membaca lewat normalizedBenefits(), yang sudah menaikkan kolom lama
     * (`discount_percent`) menjadi benefit — jadi membership yang belum
     * dimigrasi tetap jalan tanpa cabang khusus di sini. Nilai terbesar di
     * antara semua kandidat yang syaratnya terpenuhi yang dipakai: satu
     * transaksi hanya menerima satu diskon keranjang.
     *
     * @return array{discount: float, source: string, membership_id: int, benefit_type: string}|null
     */
    public function cartDiscount(?Customer $customer, float $cartSubtotal): ?array
    {
        $membership = $this->activeMembership($customer);

        if (! $membership) {
            return null;
        }

        $best = 0.0;
        $bestType = null;

        foreach ($membership->normalizedBenefits() as $benefit) {
            if (! in_array($benefit['type'], ['discount_percent', 'discount_amount'], true)) {
                continue;
            }

            if (! $this->minPurchaseMet($benefit, $cartSubtotal)) {
                continue;
            }

            $value = (float) ($benefit['value'] ?? 0);
            if ($value <= 0) {
                continue;
            }

            $discount = $benefit['type'] === 'discount_percent'
                ? $cartSubtotal * ($value / 100)
                : $value;

            if ($benefit['type'] === 'discount_percent' && ($benefit['max_amount'] ?? 0) > 0) {
                $discount = min($discount, (float) $benefit['max_amount']);
            }

            $discount = min($discount, $cartSubtotal);

            if ($discount > $best) {
                $best = $discount;
                $bestType = $benefit['type'];
            }
        }

        if ($best <= 0 || $bestType === null) {
            return null;
        }

        return [
            'discount' => round(min($best, $cartSubtotal), 2),
            'source' => 'membership',
            'membership_id' => $membership->id,
            'benefit_type' => $bestType,
        ];
    }

    /**
     * Potongan biaya kirim dari benefit `free_shipping`.
     *
     * `max_amount` berperan sebagai plafon subsidi: kosong berarti ongkir
     * dinolkan penuh, terisi berarti hanya sebesar plafon itu.
     *
     * @return array{waived: float, remaining: float, label: string}|null
     */
    public function shippingWaiver(?Customer $customer, float $shippingAmount, float $cartSubtotal): ?array
    {
        if ($shippingAmount <= 0) {
            return null;
        }

        $membership = $this->activeMembership($customer);
        $benefit = $membership?->benefitOfType('free_shipping');

        if (! $benefit || ! $this->minPurchaseMet($benefit, $cartSubtotal)) {
            return null;
        }

        $cap = (float) ($benefit['max_amount'] ?? 0);
        $waived = $cap > 0 ? min($cap, $shippingAmount) : $shippingAmount;

        return [
            'waived' => round($waived, 2),
            'remaining' => round($shippingAmount - $waived, 2),
            'label' => $benefit['label'],
        ];
    }

    /**
     * Hak produk gratis milik member, untuk ditawarkan di kasir.
     *
     * @return array<int, array{product_id: int, quantity: int, label: string}>
     */
    public function freeProductEntitlements(?Customer $customer, float $cartSubtotal): array
    {
        $membership = $this->activeMembership($customer);

        if (! $membership) {
            return [];
        }

        $entitlements = [];

        foreach ($membership->normalizedBenefits() as $benefit) {
            if ($benefit['type'] !== 'free_product' || ! $benefit['product_id']) {
                continue;
            }

            if (! $this->minPurchaseMet($benefit, $cartSubtotal)) {
                continue;
            }

            $entitlements[] = [
                'product_id' => (int) $benefit['product_id'],
                'quantity' => max(1, (int) ($benefit['quantity'] ?? 1)),
                'label' => $benefit['label'],
            ];
        }

        return $entitlements;
    }

    public function hasPriorityQueue(?Customer $customer): bool
    {
        return (bool) $this->activeMembership($customer)?->hasBenefit('priority_queue');
    }

    /**
     * Ringkasan benefit per pelanggan untuk dikirim ke kasir.
     *
     * Kasir menghitung preview total di sisi klien, jadi ia butuh aturan
     * benefit yang sama dengan server. Tanpa ini, angka di layar kasir bisa
     * berbeda dari yang akhirnya tersimpan. Dikumpulkan dalam satu query untuk
     * semua pelanggan sekaligus, bukan per pelanggan, supaya halaman kasir
     * dengan ribuan pelanggan tidak jadi N+1.
     *
     * @param  array<int, int>  $customerIds
     * @return array<int, array{membership_name: string, percent: array{value: float, min_purchase: float, cap: float}, amount: array{value: float, min_purchase: float}, free_shipping: array{active: bool, min_purchase: float, cap: float}, point_multiplier: int, tier: ?string, tier_id: ?int, tier_rank: int, priority_queue: bool, free_products: array<int, array{product_id: int, quantity: int, label: string, min_purchase: float}>, labels: array<int, string>}>
     */
    public function summaryForCustomers(array $customerIds): array
    {
        if ($customerIds === []) {
            return [];
        }

        $active = CustomerMembership::with('membership')
            ->whereIn('customer_id', $customerIds)
            ->active()
            ->orderBy('id')
            ->get()
            ->keyBy('customer_id');

        $summary = [];

        foreach ($active as $customerId => $customerMembership) {
            $membership = $customerMembership->membership;

            if (! $membership) {
                continue;
            }

            // Semua nilai diisi dari normalizedBenefits() di bawah — kolom lama
            // sudah dinaikkan jadi benefit di sana, jadi tidak dibaca langsung.
            $entry = [
                'membership_name' => $membership->name,
                'percent' => ['value' => 0.0, 'min_purchase' => 0.0, 'cap' => 0.0],
                'amount' => ['value' => 0.0, 'min_purchase' => 0.0],
                'free_shipping' => ['active' => false, 'min_purchase' => 0.0, 'cap' => 0.0],
                'point_multiplier' => 1,
                'tier' => null,
                'tier_id' => null,
                'tier_rank' => 0,
                'priority_queue' => false,
                'free_products' => [],
                'labels' => [],
            ];

            foreach ($membership->normalizedBenefits() as $benefit) {
                $entry['labels'][] = $benefit['label'];
                $value = (float) ($benefit['value'] ?? 0);

                switch ($benefit['type']) {
                    case 'discount_percent':
                        // Persen terbesar yang menang, ikut membawa syarat & plafonnya.
                        if ($value > $entry['percent']['value']) {
                            $entry['percent'] = [
                                'value' => $value,
                                'min_purchase' => (float) ($benefit['min_purchase'] ?? 0),
                                'cap' => (float) ($benefit['max_amount'] ?? 0),
                            ];
                        }
                        break;

                    case 'discount_amount':
                        if ($value > $entry['amount']['value']) {
                            $entry['amount'] = [
                                'value' => $value,
                                'min_purchase' => (float) ($benefit['min_purchase'] ?? 0),
                            ];
                        }
                        break;

                    case 'free_shipping':
                        $entry['free_shipping'] = [
                            'active' => true,
                            'min_purchase' => (float) ($benefit['min_purchase'] ?? 0),
                            'cap' => (float) ($benefit['max_amount'] ?? 0),
                        ];
                        break;

                    case 'free_product':
                        $entry['free_products'][] = [
                            'product_id' => (int) $benefit['product_id'],
                            'quantity' => max(1, (int) ($benefit['quantity'] ?? 1)),
                            'label' => $benefit['label'],
                            'min_purchase' => (float) ($benefit['min_purchase'] ?? 0),
                        ];
                        break;

                    case 'point_multiplier':
                        $entry['point_multiplier'] = max(1, (int) $value);
                        break;

                    case 'maps_to_tier':
                        // Tier dikirim sebagai nama + id supaya kasir bisa
                        // membandingkan rank tanpa query tambahan.
                        $tier = $membership->mapsToTier();
                        $entry['tier'] = $tier?->name;
                        $entry['tier_id'] = $tier?->id;
                        $entry['tier_rank'] = $tier?->rank ?? 0;
                        break;

                    case 'priority_queue':
                        $entry['priority_queue'] = true;
                        break;
                }
            }

            $summary[(int) $customerId] = $entry;
        }

        return $summary;
    }

    private function minPurchaseMet(array $benefit, float $cartSubtotal): bool
    {
        $min = (float) ($benefit['min_purchase'] ?? 0);

        return $min <= 0 || $cartSubtotal >= $min;
    }
}
