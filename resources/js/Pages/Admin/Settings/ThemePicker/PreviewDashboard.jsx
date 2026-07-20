/**
 * ── Theme Picker: Mini Preview Dashboard ─────────────────────────
 *
 * Miniatur kartu statistik + tabel ala Dashboard sungguhan, dirender
 * dengan CSS variable tema aktif secara langsung (inline style),
 * TIDAK memakai class Tailwind `bg-primary-*` dkk supaya preview
 * tetap akurat walau dipakai di luar konteks <html> yang di-theme-i
 * (misal saat preview template LAIN yang belum aktif dipilih user).
 */
export default function PreviewDashboard({ tokens }) {
    const t = tokens;
    const stats = [
        { label: 'Penjualan Hari Ini', value: 'Rp 2.450.000', color: t.primary['600'] },
        { label: 'Transaksi', value: '48', color: t.success },
        { label: 'Stok Menipis', value: '3 item', color: t.warning },
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
                        <p className="truncate text-[9px] font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>
                            {s.label}
                        </p>
                        <p className="mt-1 text-sm font-bold" style={{ color: s.color }}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-hidden rounded-lg border" style={{ background: t.card, borderColor: t.border }}>
                <div className="flex items-center justify-between px-2.5 py-2" style={{ background: t.tableHeader, borderBottom: `1px solid ${t.border}` }}>
                    <span className="text-[10px] font-semibold" style={{ color: t.textPrimary }}>
                        Transaksi Terbaru
                    </span>
                    <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                        style={{ background: t.primary['600'] }}
                    >
                        Lihat Semua
                    </span>
                </div>
                {['SL-001 · 08:12', 'SL-002 · 08:20', 'SL-003 · 08:35'].map((row, i) => (
                    <div
                        key={row}
                        className="flex items-center justify-between px-2.5 py-1.5 text-[10px]"
                        style={{
                            background: i % 2 === 0 ? t.tableRow : t.tableHover,
                            color: t.textSecondary,
                        }}
                    >
                        <span>{row}</span>
                        <span className="font-semibold" style={{ color: t.textPrimary }}>
                            Rp {(45 + i * 10)}.000
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
