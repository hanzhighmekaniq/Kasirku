import { fmt } from "./helpers";

/**
 * Product card — mengikuti desain index1.html: gambar 4/3, badge status di
 * pojok kiri atas, tombol "+" bulat di pojok kanan bawah gambar, info produk
 * ringkas di bawah. Klik tombol "+" TIDAK lagi membuka modal apa pun secara
 * lokal — semua keputusan modal (variant/unit/modifier/retail) diserahkan ke
 * parent lewat `onClick` (lihat useKasir.handleProductClick).
 */
export default function ProductCard({ product, onClick }) {
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
    const activeVariants = (product.variants ?? []).filter((v) => v.is_active);
    const hasActiveVariants = activeVariants.length > 0;
    const isLowStock =
        !hasRecipe &&
        product.track_stock &&
        product.stock > 0 &&
        product.stock <= 10;

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (isDisabled) return;
        onClick?.();
    };

    const priceBlock = hasActiveVariants ? (
        <div className="text-[12.5px] text-slate-500">
            Starting from{" "}
            <span className="font-semibold text-slate-900">
                {fmt(Math.min(...activeVariants.map((v) => Number(v.price))))}
            </span>
        </div>
    ) : (
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            {fmt(product.sell_price)}
            {hasUnits && (
                <span className="ml-1 text-[10px] font-medium text-slate-400">
                    /{product.unit || "Pcs"}
                </span>
            )}
        </span>
    );

    const unitEquations = hasUnits
        ? packagingUnits
              .filter((u) => u.conversion_qty)
              .map((u) => `1 ${u.name} = ${u.conversion_qty} ${product.unit || "pcs"}`)
        : [];

    return (
        <article
            className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white transition-all duration-300 ${
                isDisabled
                    ? "border-slate-200 opacity-60"
                    : "border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:border-slate-300"
            }`}
        >
            {/* Image area — aspek 4/3 ala index1.html */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                {product.image ? (
                    <img
                        src={`/storage/${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
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

                {/* Badge status — pojok kiri atas: Low stock > Has Variants > In Stock */}
                <div className="absolute top-3 left-3">
                    {isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Low stock
                        </span>
                    ) : hasActiveVariants ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            Has Variants
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            In Stock
                        </span>
                    )}
                </div>

                {/* Tombol "+" bulat, pojok kanan bawah — hover scale up, bg gelap */}
                <button
                    type="button"
                    onClick={handleAddClick}
                    disabled={isDisabled}
                    title={isDisabled ? "Tidak tersedia" : "Tambah ke keranjang"}
                    className={`absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-black/20 transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
                        isDisabled
                            ? "bg-slate-300 text-slate-400 cursor-not-allowed"
                            : "bg-slate-900 text-white hover:bg-black"
                    }`}
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>

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
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight text-slate-900">
                            {product.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">SKU · {product.sku}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                        {product.unit || "Pcs"}
                    </span>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        {priceBlock}
                        {unitEquations.length > 0 && (
                            <p className="mt-1 text-[11px] text-slate-500">
                                {unitEquations.join(" · ")}
                            </p>
                        )}
                        {(product.price_tiers?.length > 0 ||
                            activeVariants.some((v) => v.price_tiers?.length > 0)) && (
                            <p className="mt-1 text-[11px] font-medium text-emerald-600">
                                Ada harga grosir
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
