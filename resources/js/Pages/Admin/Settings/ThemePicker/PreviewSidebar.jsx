/**
 * ── Theme Picker: Mini Preview Sidebar ───────────────────────────
 *
 * Miniatur sidebar navigasi memakai token tema aktif (bukan
 * AuthenticatedLayout sungguhan — sengaja dibuat versi ringkas
 * supaya render instan tanpa data toko/permission sungguhan).
 */
export default function PreviewSidebar() {
    const items = [
        { label: 'Dashboard', active: true },
        { label: 'Kasir / POS', active: false },
        { label: 'Produk', active: false },
        { label: 'Pelanggan', active: false },
        { label: 'Laporan', active: false },
    ];

    return (
        <div
            className="flex h-full w-full flex-col overflow-hidden rounded-xl border"
            style={{ background: 'rgb(var(--color-sidebar))', borderColor: 'rgb(var(--color-border))' }}
        >
            <div
                className="flex items-center gap-2 border-b px-3 py-3"
                style={{ borderColor: 'rgb(var(--color-border))' }}
            >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
                    S
                </div>
                <span className="text-sm font-bold" style={{ color: 'rgb(var(--color-sidebar-text))' }}>
                    SIM-KASIR
                </span>
            </div>
            <div className="flex-1 space-y-1 p-2">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="rounded-lg px-3 py-2 text-xs font-medium"
                        style={
                            item.active
                                ? { background: 'rgb(var(--color-primary-600))', color: '#fff' }
                                : { color: 'rgb(var(--color-text-secondary))' }
                        }
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
