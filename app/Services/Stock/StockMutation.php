<?php

namespace App\Services\Stock;

/**
 * Parameter object untuk satu mutasi stok.
 *
 * Membungkus semua informasi yang dibutuhkan StockService supaya setiap
 * pemanggil tidak perlu mengingat urutan 10 parameter. Kalau nanti ada
 * atribut baru (mis. batch_id untuk FEFO), cukup tambah di sini — semua
 * pemanggil tidak perlu berubah.
 */
final class StockMutation
{
    public function __construct(
        public readonly int $productId,
        public readonly ?int $variantId,
        public readonly ?int $packagingUnitId,
        public readonly int $storeId,
        public readonly ?int $branchId,
        public readonly float $quantity,
        public readonly float $unitCost = 0.0,
        public readonly string $movementType = 'adjustment',
        public readonly string $referenceType = '',
        public readonly ?int $referenceId = null,
        public readonly string $referenceNo = '',
        public readonly string $notes = '',
        public readonly ?string $movedAt = null,
        public readonly ?int $productBatchId = null,
        // Bila true, decrease() akan merevisi average_cost bucket seolah
        // qty ini tidak pernah masuk — dipakai saat membatalkan pembelian.
        public readonly bool $revertAvgCost = false,
    ) {
        if ($this->quantity <= 0) {
            throw new \InvalidArgumentException("StockMutation quantity harus lebih dari 0, diterima: {$this->quantity}");
        }
    }

    /**
     * Kunci bucket lengkap — selalu lima kolom.
     * Ini yang menentukan baris mana di product_stocks yang akan disentuh.
     *
     * @return array<string, mixed>
     */
    public function bucketKey(): array
    {
        return [
            'product_id' => $this->productId,
            'variant_id' => $this->variantId,
            'packaging_unit_id' => $this->packagingUnitId,
            'store_id' => $this->storeId,
            'branch_id' => $this->branchId,
        ];
    }

    /**
     * Kolom tambahan untuk StockMovement — tidak termasuk yang ada di bucketKey().
     *
     * @return array<string, mixed>
     */
    public function movementData(): array
    {
        return [
            'movement_type' => $this->movementType,
            'quantity' => $this->quantity,
            'unit_cost' => $this->unitCost,
            'reference_type' => $this->referenceType ?: null,
            'reference_id' => $this->referenceId,
            'reference_no' => $this->referenceNo ?: null,
            'notes' => $this->notes ?: null,
            'moved_at' => $this->movedAt ?? now(),
            'product_batch_id' => $this->productBatchId,
        ];
    }
}
