/**
 * ── Theme Picker: Mini Preview Invoice / Struk ───────────────────
 */
export default function PreviewInvoice({ tokens }) {
    const t = tokens;

    return (
        <div
            className="flex h-full w-full items-center justify-center rounded-xl border p-3"
            style={{ background: t.background, borderColor: t.border }}
        >
            <div
                className="w-32 rounded-lg border p-2.5 font-mono shadow-sm"
                style={{ background: t.card, borderColor: t.border }}
            >
                <p className="text-center text-[9px] font-bold" style={{ color: t.textPrimary }}>
                    TOKO SIM-KASIR
                </p>
                <p className="text-center text-[7px]" style={{ color: t.textMuted }}>
                    SL-20260720-001
                </p>
                <div className="my-1.5 border-t border-dashed" style={{ borderColor: t.divider }} />
                <div className="space-y-0.5 text-[7px]" style={{ color: t.textSecondary }}>
                    <div className="flex justify-between">
                        <span>Kopi Susu x1</span>
                        <span>15.000</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Roti Bakar x2</span>
                        <span>20.000</span>
                    </div>
                </div>
                <div className="my-1.5 border-t border-dashed" style={{ borderColor: t.divider }} />
                <div className="flex justify-between text-[8px] font-bold" style={{ color: t.textPrimary }}>
                    <span>TOTAL</span>
                    <span>35.000</span>
                </div>
                <div
                    className="mt-1.5 rounded px-1 py-0.5 text-center text-[7px] font-bold text-white"
                    style={{ background: t.success }}
                >
                    LUNAS
                </div>
            </div>
        </div>
    );
}
