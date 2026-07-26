import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import StockTabs from "@/Components/StockTabs";
import Button from "@/Components/ui/Button";
import { Plus } from "lucide-react";
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ wastes, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = wastes.filter((w) => {
        if (statusFilter && w.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!w.waste_no?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleDelete = () => {
        if (!confirmDelete) return;
        setProcessing(true);
        router.delete(route('admin.wastes.destroy', confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmDelete(null); },
        });
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const categoryLabel = {
        tumpahan: 'Tumpahan',
        kedaluwarsa: 'Kedaluwarsa',
        rusak: 'Rusak',
        hilang: 'Hilang',
        lainnya: 'Lainnya',
    };

    const totalCost = filtered.filter(w => w.status === 'approved').reduce((sum, w) => {
        return sum + (w.items?.reduce((s, i) => s + Number(i.total_cost || 0), 0) || 0);
    }, 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Stok
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Waste
                    </div>
                </div>
            }>
            <PageHeader
                title="Catat Waste"
                breadcrumbs={["Admin", "Stok", "Waste"]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Waste / Pemborosan
                        </span>
                    </>
                }
                description="Catat barang rusak, tumpah, atau kedaluwarsa."
                action={
                    <Button
                        as={Link}
                        href={route('admin.wastes.create')}
                        icon={Plus}
                    >
                        <span className="hidden sm:inline">Catat Waste</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                }
            />

            <StockTabs />

            <Head title="Catat Waste" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>
            )}

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard title="Total" value={stats.total} color="slate" />
                <StatCard title="Draft" value={stats.draft} color="amber" />
                <StatCard title="Disetujui" value={stats.approved} color="emerald" />
                <StatCard title="Ditolak" value={stats.rejected} color="red" />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari no. waste..." className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm shadow-sm transition outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
                    <option value="">Semua Status</option>
                    <option value="draft">Draft</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                            <tr>
                                <th className="px-6 py-3.5 font-semibold">No. Waste</th>
                                <th className="px-6 py-3.5 font-semibold">Tanggal</th>
                                <th className="px-6 py-3.5 font-semibold">Oleh</th>
                                <th className="px-6 py-3.5 font-semibold">Total Item</th>
                                <th className="px-6 py-3.5 font-semibold">Total Kerugian</th>
                                <th className="px-6 py-3.5 text-center font-semibold">Status</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-background">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">Tidak ada data waste.</td></tr>
                            ) : (
                                filtered.map((w) => {
                                    const itemTotal = w.items?.reduce((s, i) => s + Number(i.total_cost || 0), 0) || 0;
                                    return (
                                        <tr key={w.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="px-6 py-3.5">
                                                <Link href={route('admin.wastes.show', w.id)} className="font-semibold text-primary hover:text-primary/80">{w.waste_no}</Link>
                                            </td>
                                            <td className="px-6 py-3.5 text-foreground">{fmtDate(w.waste_date)}</td>
                                            <td className="px-6 py-3.5 text-foreground">{w.user?.name ?? '-'}</td>
                                            <td className="px-6 py-3.5 text-foreground">{w.items?.length ?? 0} item</td>
                                            <td className="px-6 py-3.5 font-medium text-destructive">{w.status === 'approved' ? fmtCurrency(itemTotal) : '-'}</td>
                                            <td className="px-6 py-3.5 text-center"><StatusBadge status={w.status} /></td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('admin.wastes.show', w.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Lihat Detail">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </Link>
                                                    {w.status === 'draft' && (
                                                        <button onClick={() => setConfirmDelete(w)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" title="Hapus">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirm delete modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => !processing && setConfirmDelete(null)}>
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-popover-foreground">Hapus Waste?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Waste <strong>{confirmDelete.waste_no}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setConfirmDelete(null)} disabled={processing} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">Batal</button>
                            <button onClick={handleDelete} disabled={processing} className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-md shadow-destructive/30 transition hover:bg-destructive/90 disabled:opacity-60">
                                {processing ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, color }) {
    const colors = { slate: 'border-border bg-card', amber: 'border-warning/20 bg-warning/10', emerald: 'border-success/20 bg-success/10', red: 'border-destructive/20 bg-destructive/10' };
    const textColors = { slate: 'text-foreground', amber: 'text-warning', emerald: 'text-success', red: 'text-destructive' };
    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${colors[color]}`}>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`mt-1 text-2xl font-bold ${textColors[color]}`}>{value}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-warning/10 text-warning', approved: 'bg-success/10 text-success', rejected: 'bg-destructive/10 text-destructive' };
    const label = { draft: 'Draft', approved: 'Disetujui', rejected: 'Ditolak' };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>{label[status] ?? status}</span>;
}
