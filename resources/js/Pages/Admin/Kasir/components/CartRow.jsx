const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

/* ── tiny UI primitives ─────────────────────────────── */
function IconBtn({ onClick, title, children, red, amber }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg transition-all ${red
                ? "text-muted-foreground/60 hover:bg-red-500 hover:text-white hover:scale-110 hover:shadow-md active:scale-95"
                : amber
                    ? "text-muted-foreground/60 hover:bg-amber-500 hover:text-white hover:scale-110 hover:shadow-md active:scale-95"
                    : "text-muted-foreground/60 hover:bg-indigo-500 hover:text-white hover:scale-110 hover:shadow-md active:scale-95"
                }`}
        >
            {children}
        </button>
    );
}

/* ── Cart item row ───────────────────────────────────── */
export default function CartRow({ item, onQty, onRemove, productImage }) {
    const itemTotal = item.price * item.qty;
    const afterPromo = itemTotal - (item.promoDiscount ?? 0);
    const hasPromo = (item.promoDiscount ?? 0) > 0;

    return (
        <div className="group border border-border flex items-center gap-2.5 rounded-xl bg-card px-2.5 py-2.5 shadow-sm   hover:shadow-md   transition-all">
            {/* Product thumbnail */}
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-background border border-border">
                {productImage ? (
                    <img
                        src={productImage.startsWith('http') || productImage.startsWith('/') ? productImage : `/storage/${productImage}`}
                        alt={item.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                {/* Product name + unit/variant */}
                <div className="flex items-baseline gap-1.5">
                    <p className="truncate text-sm font-bold text-foreground leading-tight">
                        {item.name}
                    </p>
                    {item.variantName && (
                        <span className="shrink-0 text-[10px] font-semibold text-indigo-600">
                            {item.variantName}
                        </span>
                    )}
                    {item.packagingUnitName && (
                        <span className="shrink-0 text-[10px] font-semibold text-amber-600">
                            {item.packagingUnitName}
                        </span>
                    )}
                </div>

                {/* Price per unit */}
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {fmt(item.price)} × {item.qty}
                    <span className="mx-1 text-slate-300">=</span>
                    <span className="font-bold text-indigo-600">{fmt(hasPromo ? afterPromo : itemTotal)}</span>
                </p>

                {/* Promo discount inline */}
                {hasPromo && (
                    <div className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-emerald-500 to-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                        </svg>
                        {item.promoName}: -{fmt(item.promoDiscount)}
                    </div>
                )}

                {/* Modifiers */}
                {item.modifiers?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {item.modifiers.map((m, idx) => (
                            <span key={idx} className="inline-flex items-center gap-0.5 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                                +{m.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Note */}
                {item.note && (
                    <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-2 py-1.5">
                        <svg className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        <p className="text-[10px] italic text-amber-700 leading-relaxed">
                            "{item.note}"
                        </p>
                    </div>
                )}
            </div>

            {/* Quantity controls */}
            <div className="flex shrink-0 flex-col items-center gap-1.5 ">
                <div className="flex items-center gap-0.5 rounded-md bg-muted ring-1 ring-slate-200 p-0.5">
                    <IconBtn
                        onClick={() => item.qty <= 1 ? onRemove(item.cartId) : onQty(item.cartId, -1)}
                        title={item.qty <= 1 ? "Hapus" : "Kurangi"}
                        red={item.qty <= 1}
                    >
                        {item.qty <= 1 ? (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        ) : (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                        )}
                    </IconBtn>
                    <div className="flex h-6 min-w-[2rem] items-center justify-center rounded bg-card px-1 shadow-sm ring-1 ring-slate-200/50">
                        <span className="text-xs font-extrabold text-foreground">
                            {item.qty}
                        </span>
                    </div>
                    <IconBtn onClick={() => onQty(item.cartId, 1)} title="Tambah">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </IconBtn>
                </div>
            </div>
        </div>
    );
}
