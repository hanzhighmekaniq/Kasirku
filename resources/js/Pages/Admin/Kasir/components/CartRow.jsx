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
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                red
                    ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                    : amber
                      ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                      : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
        >
            {children}
        </button>
    );
}

/* ── Cart item row ───────────────────────────────────── */
export default function CartRow({ item, onQty, onRemove }) {
    const itemTotal = item.price * item.qty;
    const afterPromo = itemTotal - (item.promoDiscount ?? 0);
    return (
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-2.5 py-2">
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {item.name}
                </p>
                {item.variantName && (
                    <p className="text-xs text-slate-400">{item.variantName}</p>
                )}
                {item.modifiers?.length > 0 && (
                    <p className="text-xs text-slate-400">
                        {item.modifiers.map((m) => m.name).join(", ")}
                    </p>
                )}
                {item.note && (
                    <p className="text-xs italic text-slate-400">
                        "{item.note}"
                    </p>
                )}
                <p className="mt-0.5 text-[11px] font-semibold text-indigo-600">
                    {fmt(item.price)} × {item.qty} = {fmt(itemTotal)}
                </p>
                {(item.promoDiscount ?? 0) > 0 && (
                    <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 6h.008v.008H6V6z"
                            />
                        </svg>
                        {item.promoName}: -{fmt(item.promoDiscount)}
                    </p>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <IconBtn onClick={() => onQty(item.cartId, -1)} title="Kurangi">
                    <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 12h-15"
                        />
                    </svg>
                </IconBtn>
                <span className="w-6 text-center text-sm font-semibold text-slate-800">
                    {item.qty}
                </span>
                <IconBtn onClick={() => onQty(item.cartId, 1)} title="Tambah">
                    <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                </IconBtn>
                <IconBtn
                    onClick={() => onRemove(item.cartId)}
                    title="Hapus"
                    red
                >
                    <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </IconBtn>
            </div>
        </div>
    );
}
