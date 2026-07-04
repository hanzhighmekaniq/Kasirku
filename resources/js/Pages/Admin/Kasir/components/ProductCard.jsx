const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

/* ── Product card ────────────────────────────────────── */
export default function ProductCard({ product, onClick }) {
    const isOut = product.track_stock && product.stock <= 0;

    // Cek stok bahan baku jika produk punya resep
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

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className={`group relative flex flex-col rounded-2xl border text-left transition-all ${
                isDisabled
                    ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                    : "border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100 active:scale-95"
            }`}
        >
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-t-2xl bg-slate-100">
                {product.image ? (
                    <img
                        src={`/storage/${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <svg
                        className="h-8 w-8 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.3}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                        />
                    </svg>
                )}
            </div>
            <div className="p-2.5">
                <p className="line-clamp-2 text-xs font-medium leading-tight text-slate-800">
                    {product.name}
                </p>
                {/* Badge varian */}
                {(product.variants ?? []).filter(v => v.is_active).length > 0 && (
                    <div className="mb-1 flex flex-wrap gap-1">
                        {(product.variants ?? []).filter(v => v.is_active).slice(0, 3).map((v) => (
                            <span key={v.id} className="inline-flex rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600 ring-1 ring-indigo-100">
                                {v.name}
                            </span>
                        ))}
                        {(product.variants ?? []).filter(v => v.is_active).length > 3 && (
                            <span className="inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                                +{(product.variants ?? []).filter(v => v.is_active).length - 3}
                            </span>
                        )}
                    </div>
                )}
                {/* Harga — range jika ada variant */}
                {(product.variants ?? []).filter(v => v.is_active).length > 0 ? (() => {
                    const prices = product.variants.filter(v => v.is_active).map(v => Number(v.price));
                    const minP = Math.min(...prices);
                    const maxP = Math.max(...prices);
                    return (
                        <p className="mt-1 text-sm font-bold text-indigo-600">
                            {minP === maxP ? fmt(minP) : `${fmt(minP)} – ${fmt(maxP)}`}
                        </p>
                    );
                })() : (
                    <p className="mt-1 text-sm font-bold text-indigo-600">
                        {fmt(product.sell_price)}
                    </p>
                )}
                {hasRecipe ? (
                    <p className="text-xs text-amber-600">
                        🧪 {product.recipes.length} bahan
                    </p>
                ) : (
                    product.track_stock && (
                        <p
                            className={`text-xs ${product.stock <= product.stock_minimum ? "text-red-500" : "text-slate-400"}`}
                        >
                            Stok: {product.stock}
                        </p>
                    )
                )}
            </div>
            {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/10">
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {isIngredientOut ? "Bahan Habis" : "Habis"}
                    </span>
                </div>
            )}
        </button>
    );
}
