/**
 * ── Theme Picker: Mini Preview POS (Product Grid + Cart) ─────────
 */
export default function PreviewPOS({ tokens }) {
    const t = tokens;
    const products = ['Kopi Susu', 'Roti Bakar', 'Es Teh'];

    return (
        <div
            className="flex h-full w-full gap-2 rounded-xl border p-2.5"
            style={{ background: t.background, borderColor: t.border }}
        >
            {/* Product grid */}
            <div className="grid flex-1 grid-cols-3 gap-1.5">
                {products.map((p, i) => (
                    <div
                        key={p}
                        className="flex flex-col items-center justify-center gap-1 rounded-lg border p-1.5"
                        style={{ background: t.card, borderColor: t.border }}
                    >
                        <div
                            className="h-6 w-6 rounded-md"
                            style={{ background: i === 0 ? t.primary['200'] : i === 1 ? t.accent['200'] : t.secondary['200'] }}
                        />
                        <span className="truncate text-[8px] font-medium" style={{ color: t.textPrimary }}>
                            {p}
                        </span>
                    </div>
                ))}
            </div>

            {/* Cart panel */}
            <div
                className="flex w-20 shrink-0 flex-col rounded-lg border"
                style={{ background: t.card, borderColor: t.border }}
            >
                <div className="border-b px-1.5 py-1.5" style={{ borderColor: t.border }}>
                    <span className="text-[8px] font-bold" style={{ color: t.textPrimary }}>
                        Keranjang
                    </span>
                </div>
                <div className="flex-1 space-y-1 p-1.5">
                    <div className="flex items-center justify-between text-[7px]" style={{ color: t.textSecondary }}>
                        <span>1x Kopi</span>
                        <span>15rb</span>
                    </div>
                    <div className="flex items-center justify-between text-[7px]" style={{ color: t.textSecondary }}>
                        <span>2x Roti</span>
                        <span>20rb</span>
                    </div>
                </div>
                <div
                    className="rounded-b-lg px-1.5 py-1.5 text-center text-[8px] font-bold text-white"
                    style={{ background: t.primary['600'] }}
                >
                    Bayar 35rb
                </div>
            </div>
        </div>
    );
}
