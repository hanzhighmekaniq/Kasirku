/**
 * ── Theme: Mini Preview Dashboard ─────────────────────────────────
 * Token mapping: shadcn/ui format (flat hex values).
 * primary, accent = hex string (bukan scale object).
 */
export default function PreviewDashboard({ tokens }) {
    const t = tokens;
    const primaryHex = t.primary || '#4F46E5';
    const textPrimary = t.foreground || '#0F172A';
    const textMuted = t.mutedForeground || '#94A3B8';
    const textSecondary = t.mutedForeground || '#64748B';
    const tableHeader = t.muted || t.card || '#F8FAFC';
    const tableRow = t.card || '#FFFFFF';
    const tableHover = t.muted || '#F1F5F9';

    const stats = [
        { label: 'Penjualan Hari Ini', value: 'Rp 2.450.000', color: primaryHex },
        { label: 'Transaksi', value: '48', color: t.success || '#16A34A' },
        { label: 'Stok Menipis', value: '3 item', color: t.warning || '#F59E0B' },
    ];

    return (
        <div
            className="flex h-full w-full flex-col gap-3 rounded-xl border p-3"
            style={{ background: t.background, borderColor: t.border }}
        >
            <div className="grid grid-cols-3 gap-2">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="rounded-lg border p-2.5"
                        style={{ background: t.card, borderColor: t.border }}
                    >
                        <p className="truncate text-[9px] font-semibold uppercase tracking-wide" style={{ color: textMuted }}>
                            {s.label}
                        </p>
                        <p className="mt-1 text-sm font-bold" style={{ color: s.color }}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-hidden rounded-lg border" style={{ background: t.card, borderColor: t.border }}>
                <div className="flex items-center justify-between px-2.5 py-2" style={{ background: tableHeader, borderBottom: `1px solid ${t.border}` }}>
                    <span className="text-[10px] font-semibold" style={{ color: textPrimary }}>
                        Transaksi Terbaru
                    </span>
                    <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                        style={{ background: primaryHex }}
                    >
                        Lihat Semua
                    </span>
                </div>
                {['SL-001 · 08:12', 'SL-002 · 08:20', 'SL-003 · 08:35'].map((row, i) => (
                    <div
                        key={row}
                        className="flex items-center justify-between px-2.5 py-1.5 text-[10px]"
                        style={{
                            background: i % 2 === 0 ? tableRow : tableHover,
                            color: textSecondary,
                        }}
                    >
                        <span>{row}</span>
                        <span className="font-semibold" style={{ color: textPrimary }}>
                            Rp {(45 + i * 10)}.000
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
