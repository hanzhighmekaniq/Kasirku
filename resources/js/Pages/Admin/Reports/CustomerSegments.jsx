import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head } from "@inertiajs/react";

const fmt = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

const SEGMENT_COLORS = {
    Platinum: "text-violet-600 dark:text-violet-400",
    Gold: "text-yellow-600 dark:text-yellow-400",
    Silver: "text-gray-500 dark:text-gray-400",
    Bronze: "text-orange-600 dark:text-orange-400",
};

const SEGMENT_BG = {
    Platinum: "bg-violet-50 dark:bg-violet-900/20",
    Gold: "bg-yellow-50 dark:bg-yellow-900/20",
    Silver: "bg-gray-50 dark:bg-gray-800/40",
    Bronze: "bg-orange-50 dark:bg-orange-900/20",
};

export default function CustomerSegments({ segmentSummary, topSpenders, inactiveCount, totalCustomers }) {
    const segments = ["Platinum", "Gold", "Silver", "Bronze"];

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Segmentasi Pelanggan"
                    breadcrumbs={["Dashboard", "Laporan", "Segmentasi Pelanggan"]}
                    heading="Segmentasi Pelanggan"
                    description="Analisis segmentasi pelanggan berdasarkan total belanja."
                />
            }
        >
            <Head title="Segmentasi Pelanggan" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Pelanggan</div>
                        <div className="mt-1 text-2xl font-bold text-card-foreground">{totalCustomers}</div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tidak Aktif</div>
                        <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{inactiveCount}</div>
                    </div>
                    {segments.map((seg) => (
                        <div key={seg} className={`rounded-2xl border border-border p-4 shadow-sm ${SEGMENT_BG[seg]}`}>
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{seg}</div>
                            <div className={`mt-1 text-2xl font-bold ${SEGMENT_COLORS[seg]}`}>{segmentSummary[seg]?.count || 0}</div>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <h3 className="text-sm font-semibold text-card-foreground">Rincian Segment</h3>
                    </div>
                    <div className="hidden md:block">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 text-left font-semibold">Segment</th>
                                    <th className="px-5 py-3.5 text-right font-semibold">Jumlah</th>
                                    <th className="px-5 py-3.5 text-right font-semibold">Total Belanja</th>
                                    <th className="px-5 py-3.5 text-right font-semibold">Rata-rata</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {segments.map((seg) => (
                                    <tr key={seg} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className={`text-sm font-semibold ${SEGMENT_COLORS[seg]}`}>{seg}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-card-foreground">{segmentSummary[seg]?.count || 0}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-card-foreground">{fmt(segmentSummary[seg]?.total_spent || 0)}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-muted-foreground">{fmt(segmentSummary[seg]?.avg_spent || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="space-y-3 p-3 md:hidden">
                        {segments.map((seg) => (
                            <div key={seg} className={`rounded-xl border border-border p-4 ${SEGMENT_BG[seg]}`}>
                                <div className="flex justify-between">
                                    <span className={`text-sm font-semibold ${SEGMENT_COLORS[seg]}`}>{seg}</span>
                                    <span className="text-sm font-medium text-card-foreground">{segmentSummary[seg]?.count || 0} pelanggan</span>
                                </div>
                                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                                    <span>Total: {fmt(segmentSummary[seg]?.total_spent || 0)}</span>
                                    <span>Rata-rata: {fmt(segmentSummary[seg]?.avg_spent || 0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <h3 className="text-sm font-semibold text-card-foreground">Top 10 Pelanggan</h3>
                    </div>
                    <div className="hidden md:block">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 text-left font-semibold">#</th>
                                    <th className="px-5 py-3.5 text-left font-semibold">Nama</th>
                                    <th className="px-5 py-3.5 text-left font-semibold">No. HP</th>
                                    <th className="px-5 py-3.5 text-right font-semibold">Total Belanja</th>
                                    <th className="px-5 py-3.5 text-right font-semibold">Poin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {topSpenders.length === 0 ? (
                                    <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">Belum ada data pelanggan.</td></tr>
                                ) : (
                                    topSpenders.map((c, i) => (
                                        <tr key={c.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{i + 1}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-card-foreground">{c.name}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{c.phone || "-"}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-card-foreground">{fmt(c.total_spent)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-muted-foreground">{c.points}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="space-y-3 p-3 md:hidden">
                        {topSpenders.length === 0 ? (
                            <div className="py-16 text-center text-sm text-muted-foreground">Belum ada data pelanggan.</div>
                        ) : (
                            topSpenders.map((c, i) => (
                                <div key={c.id} className="rounded-xl border border-border bg-background p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-card-foreground">#{i + 1} {c.name}</span>
                                        <span className="text-sm font-bold text-card-foreground">{fmt(c.total_spent)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">{c.phone || "-"} &middot; {c.points} poin</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
