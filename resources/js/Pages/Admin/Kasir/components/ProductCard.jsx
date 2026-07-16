import { useState } from "react";
import UnitModal from "./UnitModal";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

/* ── Product card ────────────────────────────────────── */
export default function ProductCard({ product, onClick, onUnitClick }) {
    const isOut = product.track_stock && product.stock <= 0;
    const hasRecipe = product.recipes?.length > 0;
    const ingredientShortage = hasRecipe
        ? product.recipes.filter(
              (r) =>
                  !r.is_nullable &&
                  (r.raw_material?.current_stock ?? 0) < r.quantity,
          )
        : [];
    const isIngredientOut = ingredientShortage.length > 0;
    const isDisabled = hasRecipe ? isIngredientOut : isOut;
    const packagingUnits = product.packaging_units ?? [];
    const hasUnits = packagingUnits.length > 0;
    const hasActiveVariants =
        (product.variants ?? []).filter((v) => v.is_active).length > 0;

    // Multi-satuan: pilihan dibuka lewat modal terpusat (UnitModal) agar
    // semua opsi kemasan terlihat jelas, bukan pill kecil yang gampang
    // salah pencet. Modal ini menggantikan pill selector + bottom sheet lama.
    const [showUnitModal, setShowUnitModal] = useState(false);

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (isDisabled) return;
        if (hasActiveVariants) {
            // Produk dengan varian/modifier: biarkan flow modal existing menangani
            onClick?.();
        } else if (hasUnits) {
            // Produk dengan >1 satuan: buka modal pilih satuan + qty
            setShowUnitModal(true);
        } else {
            onClick?.();
        }
    };

    return (
        <div
            className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
                isDisabled
                    ? "border-slate-200 opacity-60"
                    : "border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
            }`}
        >
            {/* Image area — hanya visual, tidak menambahkan ke keranjang */}
            <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                {product.image ? (
                    <img
                        src={`/storage/${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg
                            className="h-14 w-14 text-slate-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                            />
                        </svg>
                    </div>
                )}

                {/* "Stok Menipis" badge takes priority over category badge */}
                {!hasRecipe && product.track_stock && product.stock > 0 && product.stock <= 10 && (
                    <div className="absolute top-2 left-2 rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                        Low stock
                    </div>
                )}

                {/* Multi-satuan badge */}
                {hasUnits && !hasActiveVariants && (
                    <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-indigo-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        {1 + packagingUnits.length} satuan
                    </div>
                )}

                {/* Grosir badge — tampil juga untuk produk variant yang punya tier di salah satu variantnya */}
                {(product.price_tiers?.length > 0 || (product.variants ?? []).some((v) => v.price_tiers?.length > 0)) && !hasUnits && (
                    <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm">
                        Grosir
                    </div>
                )}

                {/* Disabled overlay */}
                {isDisabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                        <div className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white shadow-lg">
                            <span className="text-sm">HABIS</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Info area */}
            <div className="flex flex-1 flex-col p-3">
                {/* Product name — hanya visual */}
                <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-slate-900">
                    {product.name}
                </p>

                {/* SKU · stock (small gray meta, mirrors category if present) */}
                <p className="mt-1 text-[10.5px] text-slate-400">
                    {product.sku}
                    {product.track_stock ? ` · ${product.stock} in stock` : ""}
                    {!product.track_stock && product.category
                        ? ` · ${product.category.name}`
                        : ""}
                </p>

                {/* Variant info (informasional, pemilihan varian dilakukan di modal saat klik Tambah) */}
                {hasActiveVariants && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {(product.variants ?? [])
                            .filter((v) => v.is_active)
                            .slice(0, 3)
                            .map((v) => (
                                <span
                                    key={v.id}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                >
                                    {v.name}
                                </span>
                            ))}
                    </div>
                )}

                {/* Info satuan dasar + kemasan tambahan — ringkas, klik tombol untuk pilih */}
                {hasUnits && !hasActiveVariants && (
                    <p className="mt-2 text-[10.5px] text-slate-400">
                        {product.unit || "Pcs"}
                        {packagingUnits.slice(0, 2).map((pu) => (
                            <span key={pu.id}> · {pu.name}</span>
                        ))}
                        {packagingUnits.length > 2 && <span> · +{packagingUnits.length - 2} lagi</span>}
                    </p>
                )}

                <div className="mt-auto pt-2.5">
                    {/* Tier price info — product-level atau variant */}
                    {(product.price_tiers?.length > 0 && !hasUnits && !hasActiveVariants) && (
                        <p className="mb-1 text-[10px] text-emerald-600 font-medium">
                            {(() => {
                                const sorted = [...product.price_tiers].sort((a, b) => a.min_qty - b.min_qty);
                                const lowest = sorted[0];
                                return lowest ? `${sorted.length} tier mulai ${lowest.min_qty}+ pcs` : null;
                            })()}
                        </p>
                    )}
                    {(hasActiveVariants && (product.variants ?? []).some((v) => v.price_tiers?.length > 0)) && (
                        <p className="mb-1 text-[10px] text-emerald-600 font-medium">
                            Ada harga grosir per variant
                        </p>
                    )}
                    {/* Harga + aksi tambah — baris tunggal ala mockup */}
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-semibold tabular-nums text-slate-900">
                            {fmt(product.sell_price)}
                            {hasUnits && !hasActiveVariants && (
                                <span className="ml-1 text-[10px] font-medium text-slate-400">
                                    /{product.unit || "Pcs"}
                                </span>
                            )}
                        </span>
                        <button
                            type="button"
                            onClick={handleAddClick}
                            disabled={isDisabled}
                            title={isDisabled ? "Tidak tersedia" : hasUnits ? "Pilih satuan" : "Tambah ke keranjang"}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${
                                isDisabled
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700"
                            }`}
                        >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal pilih satuan/kemasan — muncul di atas semua konten (overlay penuh, centered) */}
            {showUnitModal && (
                <UnitModal
                    product={product}
                    onClose={() => setShowUnitModal(false)}
                    onConfirm={(unit, qty) => {
                        onUnitClick?.(unit, qty);
                        setShowUnitModal(false);
                    }}
                />
            )}
        </div>
    );
}
