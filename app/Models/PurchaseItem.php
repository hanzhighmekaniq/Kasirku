<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id', 'product_id', 'variant_id', 'packaging_unit_id', 'unit_name',
        'batch_no', 'expiry_date',
        'product_batch_id', 'quantity', 'cost_price', 'subtotal',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function packagingUnit(): BelongsTo
    {
        return $this->belongsTo(ProductPackagingUnit::class, 'packaging_unit_id');
    }

    public function productBatch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class);
    }

    // --- Konversi satuan (bahan baku FnB) ---
    //
    // Baris pembelian dicatat dalam satuan BELI (mis. 5 kg) karena itu yang
    // tertera di nota supplier. Tapi stok harus disimpan dalam satuan PAKAI
    // (5.000 gram) supaya pemotongan resep — yang selalu memakai base_unit —
    // beroperasi pada satuan yang sama.
    //
    // Kedua accessor di bawah adalah satu-satunya tempat konversi itu terjadi
    // di alur pembelian. Kalau produk tidak memakai konversi (semua produk
    // retail, dan bahan baku yang satuan beli = satuan pakai), keduanya
    // mengembalikan nilai asli tanpa perubahan apa pun.

    /**
     * Qty untuk ditulis ke product_stocks — sudah dalam satuan pakai.
     */
    public function stockQuantity(): float
    {
        $quantity = (float) $this->quantity;

        return $this->product?->toBaseUnit($quantity) ?? $quantity;
    }

    /**
     * Modal per satuan pakai, pasangan dari stockQuantity().
     *
     * Dihitung dari nilai total baris dibagi qty hasil konversi — bukan
     * cost_price dibagi konversi — supaya average_cost tetap konsisten
     * walau kelak ada diskon/pembulatan di level baris:
     *
     *     5 kg × Rp 20.000 = Rp 100.000 ÷ 5.000 gram = Rp 20 / gram
     */
    public function stockUnitCost(): float
    {
        $stockQuantity = $this->stockQuantity();

        if ($stockQuantity <= 0) {
            return (float) $this->cost_price;
        }

        return ((float) $this->quantity * (float) $this->cost_price) / $stockQuantity;
    }
}
