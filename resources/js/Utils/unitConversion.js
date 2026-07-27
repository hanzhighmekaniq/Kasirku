/**
 * Konversi satuan beli → satuan pakai (bahan baku FnB).
 *
 * Bahan baku punya dua satuan di satu baris produk: `unit` (satuan beli,
 * mis. kg) dan `base_unit` (satuan pakai di resep, mis. gram). Stok selalu
 * DISIMPAN dalam satuan pakai, sementara pembelian DICATAT dalam satuan
 * beli — lihat Product::toBaseUnit() dan PurchaseItem::stockQuantity().
 *
 * Helper di sini hanya untuk menampilkan terjemahan itu ke user, supaya
 * angka di layar tidak terasa ganjil ("beli 5, stoknya kok jadi 5.000?").
 * Semua perhitungan yang sesungguhnya tetap di backend.
 */
import { formatNumber } from "@/Utils/currency";

/**
 * Apakah produk ini memakai konversi satuan?
 *
 * Syaratnya ganda dan sengaja ketat, mencerminkan
 * Product::usesUnitConversion() di backend: hanya bahan baku yang punya dua
 * satuan dalam satu baris produk. Barang jadi retail memisahkan satuannya
 * ke bucket packaging_unit masing-masing, jadi tidak pernah dikonversi.
 */
export function usesUnitConversion(product) {
    return (
        product?.type === "raw_material" &&
        Number(product?.base_unit_conversion ?? 0) > 0
    );
}

/** Qty satuan beli → qty satuan pakai. Tanpa konversi: nilai apa adanya. */
export function toBaseUnit(product, quantity) {
    const qty = Number(quantity ?? 0);

    return usesUnitConversion(product)
        ? qty * Number(product.base_unit_conversion)
        : qty;
}

/** Qty satuan pakai → qty satuan beli, untuk subteks "≈ 5 kg". */
export function fromBaseUnit(product, quantity) {
    const qty = Number(quantity ?? 0);

    return usesUnitConversion(product)
        ? qty / Number(product.base_unit_conversion)
        : qty;
}

/**
 * Teks stok dalam satuan pakai — "5.000 gram".
 * Mengembalikan null kalau produk tidak memakai konversi, supaya pemanggil
 * bisa langsung memakainya sebagai kondisi render.
 */
export function baseUnitLabel(product, quantity) {
    if (!usesUnitConversion(product)) return null;

    return `${formatNumber(toBaseUnit(product, quantity))} ${product.base_unit}`;
}

/**
 * Subteks setara dalam satuan beli — "≈ 5 kg".
 * Dipakai di bawah angka stok utama sebagai bantuan baca saat mencocokkan
 * dengan fisik gudang, bukan sebagai angka yang bisa diedit.
 */
export function purchaseUnitHint(product, baseQuantity) {
    if (!usesUnitConversion(product)) return null;

    const converted = fromBaseUnit(product, baseQuantity);
    // Bahan baku sering pecahan (0,25 kg) — dua desimal cukup, dan trailing
    // zero dibuang supaya "5,00 kg" tampil sebagai "5 kg".
    const rounded = Number(converted.toFixed(2));

    return `≈ ${formatNumber(rounded)} ${product.unit}`;
}
