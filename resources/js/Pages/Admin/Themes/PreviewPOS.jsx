/**
 * ── Theme: Mini Preview POS (Product Grid + Cart) ─────────────────
 */
export default function PreviewPOS({ tokens }) {
    const t = tokens;
    const primaryHex = t.primary || '#4F46E5';
    const accentHex = t.accent || '#8B5CF6';
    const secondaryHex = t.secondary || '#64748B';
    const textPrimary = t.foreground || '#0F172A';
    const textSecondary = t.mutedForeground || '#64748B';

    const products = ['Kopi Susu', 'Roti Bakar', 'Es Teh'];
    const productColors = [primaryHex, accentHex, secondaryHex];

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
                            style={{ background: productColors[i] + '33' }}
                        />
                        <span className="truncate text-[8px] font-medium" style={{ color: textPrimary }}>
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
                    <span className="text-[8px] font-bold" style={{ color: textPrimary }}>
                        Keranjang
                    </span>
                </div>
                <div className="flex-1 space-y-1 p-1.5">
                    <div className="flex items-center justify-between text-[7px]" style={{ color: textSecondary }}>
                        <span>1x Kopi</span>
                        <span>15rb</span>
                    </div>
                    <div className="flex items-center justify-between text-[7px]" style={{ color: textSecondary }}>
                        <span>2x Roti</span>
                        <span>20rb</span>
                    </div>
                </div>
                <div
                    className="rounded-b-lg px-1.5 py-1.5 text-center text-[8px] font-bold text-white"
                    style={{ background: primaryHex }}
                >
                    Bayar 35rb
                </div>
            </div>
        </div>
    );
}
