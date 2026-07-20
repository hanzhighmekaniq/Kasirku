/**
 * ── Theme: Mini Preview Invoice / Struk ────────────────────────────
 */
export default function PreviewInvoice({ tokens }) {
    const t = tokens;
    const textPrimary = t.foreground || '#0F172A';
    const textMuted = t.mutedForeground || '#94A3B8';
    const textSecondary = t.mutedForeground || '#64748B';
    const divider = t.border || '#E2E8F0';

    return (
        <div
            className="flex h-full w-full items-center justify-center rounded-xl border p-3"
            style={{ background: t.background, borderColor: t.border }}
        >
            <div
                className="w-32 rounded-lg border p-2.5 font-mono shadow-sm"
                style={{ background: t.card, borderColor: t.border }}
            >
                <p className="text-center text-[9px] font-bold" style={{ color: textPrimary }}>
                    TOKO SIM-KASIR
                </p>
                <p className="text-center text-[7px]" style={{ color: textMuted }}>
                    SL-20260720-001
                </p>
                <div className="my-1.5 border-t border-dashed" style={{ borderColor: divider }} />
                <div className="space-y-0.5 text-[7px]" style={{ color: textSecondary }}>
                    <div className="flex justify-between">
                        <span>Kopi Susu x1</span>
                        <span>15.000</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Roti Bakar x2</span>
                        <span>20.000</span>
                    </div>
                </div>
                <div className="my-1.5 border-t border-dashed" style={{ borderColor: divider }} />
                <div className="flex justify-between text-[8px] font-bold" style={{ color: textPrimary }}>
                    <span>TOTAL</span>
                    <span>35.000</span>
                </div>
                <div
                    className="mt-1.5 rounded px-1 py-0.5 text-center text-[7px] font-bold text-white"
                    style={{ background: t.success || '#16A34A' }}
                >
                    LUNAS
                </div>
            </div>
        </div>
    );
}
