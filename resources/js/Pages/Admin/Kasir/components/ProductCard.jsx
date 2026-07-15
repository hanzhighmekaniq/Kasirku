import { useState } from "react";

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

    // Segmented "kemasan" selector — default selalu unit dasar produk.
    // selectedUnit === null artinya unit dasar (eceran).
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [showUnitSheet, setShowUnitSheet] = useState(false);

    // Maks 2 kemasan tambahan ditampilkan sebagai pill (+ unit dasar = 3 pill).
    // Sisanya digulung ke chip "+N" yang membuka sheet pilihan.
    const MAX_VISIBLE_UNITS = 2;
    const visibleUnits = packagingUnits.slice(0, MAX_VISIBLE_UNITS);
    const overflowUnits = packagingUnits.slice(MAX_VISIBLE_UNITS);

    const selectedPrice = selectedUnit
        ? Number(selectedUnit.sell_price)
        : Number(product.sell_price);

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (isDisabled) return;
        if (hasActiveVariants) {
            // Produk dengan varian/modifier: biarkan flow modal existing menangani
            onClick?.();
        } else if (selectedUnit) {
            onUnitClick?.(selectedUnit);
        } else {
            onClick?.();
        }
    };

    return (
        <div
            className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
                isDisabled
                    ? "border-slate-200 opacity-60"
                    : "border-slate-200 hover:border-indigo-300 hover:shadow-lg"
            }`}
        >
            {/* Image area — hanya visual, tidak menambahkan ke keranjang */}
            <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                {product.image ? (
                    <img
                        src={`/storage/${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg
                            className="h-16 w-16 text-slate-300"
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

                {/* Stock badge - top left */}
                {!hasRecipe && product.track_stock && !isOut && (
                    <div className="absolute top-2 left-2 rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                        ● Stok {product.stock}
                    </div>
                )}

                {/* "Stok Menipis" badge takes priority over category badge */}
                {!hasRecipe && product.track_stock && product.stock > 0 && product.stock <= 10 ? (
                    <div className="absolute top-2 right-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        ⚠ Stok Menipis
                    </div>
                ) : (
                    product.category && (
                        <div className="absolute top-2 right-2 rounded-full bg-slate-800/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-sm">
                            {product.category.name}
                        </div>
                    )
                )}

                {/* Disabled overlay */}
                {isDisabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                        <div className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white shadow-lg">
                            <span className="text-sm">HABIS</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Info area */}
            <div className="flex flex-1 flex-col p-3">
                {/* Brand/Category (small gray text) */}
                {product.category && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {product.category.name}
                    </p>
                )}

                {/* Product name — hanya visual */}
                <p className="mt-1 line-clamp-2 text-sm font-bold leading-tight text-slate-900">
                    {product.name}
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

                <div className="mt-auto pt-3">
                    {/* Kemasan selector — segmented pill group, default = unit dasar */}
                    {hasUnits && !hasActiveVariants && (
                        <div className="mb-2 space-y-1.5">
                            <p className="text-xs font-semibold text-slate-500">
                                KEMASAN
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUnit(null);
                                    }}
                                    disabled={isDisabled}
                                    className={`rounded-lg border px-2.5 py-1.5 text-center transition ${
                                        !selectedUnit
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                                    }`}
                                >
                                    <p className="text-[10px] font-bold leading-none">
                                        {product.unit || "Pcs"}
                                    </p>
                                </button>
                                {visibleUnits.map((pu) => (
                                    <button
                                        key={pu.id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedUnit(pu);
                                        }}
                                        disabled={isDisabled}
                                        className={`rounded-lg border px-2.5 py-1.5 text-center transition ${
                                            selectedUnit?.id === pu.id
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                                        }`}
                                    >
                                        <p className="text-[10px] font-bold leading-none">
                                            {pu.name}
                                        </p>
                                    </button>
                                ))}
                                {overflowUnits.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowUnitSheet(true);
                                        }}
                                        disabled={isDisabled}
                                        className={`rounded-lg border px-2.5 py-1.5 text-center transition ${
                                            selectedUnit &&
                                            overflowUnits.some((u) => u.id === selectedUnit.id)
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-dashed border-slate-300 bg-white text-slate-500 hover:border-slate-400"
                                        }`}
                                    >
                                        <p className="text-[10px] font-bold leading-none">
                                            {selectedUnit &&
                                            overflowUnits.some((u) => u.id === selectedUnit.id)
                                                ? selectedUnit.name
                                                : `+${overflowUnits.length}`}
                                        </p>
                                    </button>
                                )}
                            </div>
                            {selectedUnit && (
                                <p className="text-[9px] text-slate-400">
                                    1 {selectedUnit.name} = {selectedUnit.conversion_qty}{" "}
                                    {product.unit || "pcs"}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Harga sesuai kemasan yang dipilih (atau harga dasar jika ada varian) */}
                    {!hasActiveVariants && (
                        <div className="mb-2">
                            <p className="text-xs font-semibold text-slate-500">
                                HARGA
                            </p>
                            <p className="text-lg font-extrabold text-slate-900">
                                {fmt(selectedPrice)}
                                {selectedUnit && (
                                    <span className="ml-1 text-xs font-medium text-slate-400">
                                        / {selectedUnit.name}
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Satu-satunya aksi yang menambah ke keranjang */}
                    <button
                        type="button"
                        onClick={handleAddClick}
                        disabled={isDisabled}
                        className={`w-full rounded-lg py-2 text-center text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                            isDisabled
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-slate-800 text-white hover:bg-slate-900"
                        }`}
                    >
                        {isDisabled ? (
                            "Tidak Tersedia"
                        ) : (
                            <>
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                                    />
                                </svg>
                                Tambah
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Sheet picker — sisa kemasan yang tidak muat sebagai pill.
                Mobile: slide-up dari bawah. Desktop (sm+): dialog center. */}
            {showUnitSheet && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowUnitSheet(false);
                    }}
                >
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10 w-full max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-w-sm sm:rounded-2xl sm:p-5"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500">
                                    PILIH KEMASAN
                                </p>
                                <p className="text-sm font-bold text-slate-900 line-clamp-1">
                                    {product.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowUnitSheet(false)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {overflowUnits.map((pu) => (
                                <button
                                    key={pu.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedUnit(pu);
                                        setShowUnitSheet(false);
                                    }}
                                    className={`rounded-xl border p-3 text-left transition ${
                                        selectedUnit?.id === pu.id
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                                    }`}
                                >
                                    <p className="text-sm font-bold leading-none">
                                        {pu.name}
                                    </p>
                                    <p
                                        className={`mt-1 text-xs font-semibold ${
                                            selectedUnit?.id === pu.id
                                                ? "text-white/80"
                                                : "text-slate-500"
                                        }`}
                                    >
                                        {fmt(pu.sell_price)}
                                    </p>
                                    <p
                                        className={`mt-0.5 text-[10px] ${
                                            selectedUnit?.id === pu.id
                                                ? "text-white/60"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        1 {pu.name} = {pu.conversion_qty} {product.unit || "pcs"}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
