const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtShort = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "Jt";
    if (n >= 1000) return (n / 1000).toFixed(0) + "Rb";
    return String(n);
};

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
    const hasUnits = (product.packaging_units ?? []).length > 0;
    const hasActiveVariants = (product.variants ?? []).filter(v => v.is_active).length > 0;

    return (
        <div
            className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 ${
                isDisabled
                    ? "border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed"
                    : "border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 cursor-pointer"
            }`}
        >
            {/* Image area with gradient overlay */}
            <button
                type="button"
                onClick={onClick}
                disabled={isDisabled}
                className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100"
            >
                {product.image ? (
                    <>
                        <img
                            src={`/storage/${product.image}`}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {/* Gradient overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-50">
                        <div className="rounded-2xl bg-white/80 p-3 shadow-inner">
                            <svg
                                className="h-12 w-12 text-slate-300"
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
                    </div>
                )}

                {/* Stock badge with modern design */}
                {!hasRecipe && product.track_stock && !isOut && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-md backdrop-blur-sm border border-slate-200">
                        <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {product.stock}
                    </div>
                )}

                {/* Disabled overlay with blur */}
                {isDisabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
                        <div className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 shadow-xl">
                            <p className="text-xs font-bold text-white tracking-wide">
                                {isIngredientOut ? "🍽️ Bahan Habis" : "❌ Stok Habis"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick add indicator */}
                {!isDisabled && !hasActiveVariants && !hasUnits && (
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <div className="bg-gradient-to-t from-indigo-600 to-indigo-500 py-2 text-center">
                            <p className="text-xs font-bold text-white">Tap untuk tambah</p>
                        </div>
                    </div>
                )}
            </button>

            {/* Info area with better spacing */}
            <div className="flex flex-1 flex-col p-3 bg-gradient-to-b from-white to-slate-50/50">
                {/* Product name with better typography */}
                <button
                    type="button"
                    onClick={onClick}
                    disabled={isDisabled}
                    className="text-left group-hover:text-indigo-600 transition-colors"
                >
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                        {product.name}
                    </p>
                </button>

                {/* Variant badges with modern design */}
                {hasActiveVariants && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {(product.variants ?? []).filter(v => v.is_active).slice(0, 2).map((v) => (
                            <span key={v.id} className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-indigo-500 to-indigo-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                                <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                                {v.name}
                            </span>
                        ))}
                        {(product.variants ?? []).filter(v => v.is_active).length > 2 && (
                            <span className="inline-flex items-center rounded-md bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                +{(product.variants ?? []).filter(v => v.is_active).length - 2}
                            </span>
                        )}
                    </div>
                )}

                {/* Unit Selector — Modern Card Style */}
                {hasUnits ? (
                    <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-1.5">
                            {/* Base unit (eceran) */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick?.();
                                }}
                                disabled={isDisabled}
                                className="group/unit relative overflow-hidden rounded-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-2 text-center transition-all duration-200 hover:border-indigo-400 hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-indigo-500/0 group-hover/unit:from-indigo-400/10 group-hover/unit:to-indigo-500/20 transition-all" />
                                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">{product.unit || "Ecer"}</p>
                                <p className="text-sm font-extrabold text-indigo-600 leading-tight mt-0.5">
                                    {hasActiveVariants ? "Pilih →" : fmtShort(product.sell_price)}
                                </p>
                            </button>
                            {/* Packaging units */}
                            {(product.packaging_units ?? []).map((pu) => (
                                <button
                                    key={pu.id}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUnitClick?.(pu);
                                    }}
                                    disabled={isDisabled}
                                    className="group/unit relative overflow-hidden rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-2 text-center transition-all duration-200 hover:border-emerald-400 hover:shadow-lg hover:scale-105 active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-emerald-500/0 group-hover/unit:from-emerald-400/10 group-hover/unit:to-emerald-500/20 transition-all" />
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">{pu.name}</p>
                                    <p className="text-sm font-extrabold text-emerald-600 leading-tight mt-0.5">{fmtShort(pu.sell_price)}</p>
                                </button>
                            ))}
                        </div>
                        {/* Conversion hint with icon */}
                        <div className="flex flex-wrap gap-1">
                            {(product.packaging_units ?? []).map((pu) => (
                                <span key={pu.id} className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[8px] font-semibold text-slate-600 shadow-sm">
                                    <svg className="h-2 w-2 text-emerald-500" fill="currentColor" viewBox="0 0 8 8"><path d="M4 0L1 3h2v2h2V3h2L4 0z"/><path d="M0 4l3 3V5h2v2h-2l3 3 3-3H7V5h2V3L6 0 3 3h2v2H3z" opacity="0.5"/></svg>
                                    1 {pu.name} = {pu.conversion_qty} {product.unit || "pcs"}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Single price (no packaging units) - Modern display */
                    !hasActiveVariants && (
                        <div className="mt-3 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-2 shadow-md">
                            <p className="text-center text-base font-extrabold text-white tracking-tight">
                                {fmt(product.sell_price)}
                            </p>
                        </div>
                    )
                )}

                {/* Footer info with modern badges */}
                <div className="mt-auto pt-3 flex items-center justify-between">
                    {hasRecipe ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700 shadow-sm">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                            </svg>
                            {product.recipes.length} bahan
                        </span>
                    ) : product.track_stock && isOut ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-1 text-[10px] font-bold text-red-600 shadow-sm">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            Habis
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
