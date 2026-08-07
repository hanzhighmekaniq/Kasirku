import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Show({ adjustment }) {
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { items, user } = adjustment;

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const totalLoss = items.reduce((sum, item) => {
        const diff = item.difference_qty || 0;
        return sum + (diff < 0 ? Math.abs(diff) * (item.unit_cost || 0) : 0);
    }, 0);
    const totalGain = items.reduce((sum, item) => {
        const diff = item.difference_qty || 0;
        return sum + (diff > 0 ? diff * (item.unit_cost || 0) : 0);
    }, 0);

    const handleStatus = (status) => {
        setProcessing(true);
        router.patch(route('admin.stock-adjustments.updateStatus', adjustment.id), { status }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmingStatus(null); },
        });
    };

    const totalDiff = items.reduce((sum, item) => sum + (item.difference_qty || 0), 0);

    return (
        <AuthenticatedLayout
            backUrl={route('admin.stock-adjustments.index')}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Stok
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Detail Penyesuaian
                    </div>
                </div>
            }
        >
            <Head title={`Penyesuaian ${adjustment.adjustment_no}`} />
            <PageHeader
                title={`Penyesuaian ${adjustment.adjustment_no}`}
                breadcrumbs={["Admin", "Stok", "Penyesuaian Stok", "Detail"]}
                heading={
                    <>
                        Detail{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {adjustment.adjustment_no}
                        </span>
                    </>
                }
                description="Rincian selisih stok sistem terhadap hasil hitung fisik."
                backUrl={route('admin.stock-adjustments.index')}
            />

            {/* Status badge + actions */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={adjustment.status} />
                {adjustment.status === 'draft' && (
                    <>
                        <button
                            onClick={() => setConfirmingStatus('approved')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-success px-3.5 py-2 text-sm font-semibold text-success-foreground shadow-md shadow-success/30 transition hover:bg-success/90"
                        >
                            <CheckCircle className="h-4 w-4" strokeWidth={2} />
                            Setujui
                        </button>
                        <button
                            onClick={() => setConfirmingStatus('rejected')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-card px-3.5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                        >
                            <XCircle className="h-4 w-4" strokeWidth={2} />
                            Tolak
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Main */}
                <div className="space-y-5 lg:col-span-2">
                    {/* Info */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Informasi Penyesuaian</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoRow label="No. Penyesuaian" value={adjustment.adjustment_no} />
                                <InfoRow label="Tanggal" value={fmtDate(adjustment.adjustment_date)} />
                                <InfoRow label="Oleh" value={user?.name ?? '—'} />
                                {adjustment.reason && <InfoRow label="Alasan" value={adjustment.reason} />}
                                {adjustment.notes && <InfoRow label="Catatan" value={adjustment.notes} />}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Item Penyesuaian</h3>
                        </div>
                        {/* Desktop table — 8 kolom, di mobile diganti kartu di bawah */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold">#</th>
                                        <th className="px-5 py-3 text-left font-semibold">Produk</th>
                                        <th className="px-5 py-3 text-left font-semibold">Stok Sistem</th>
                                        <th className="px-5 py-3 text-left font-semibold">Stok Aktual</th>
                                        <th className="px-5 py-3 text-left font-semibold">Selisih</th>
                                        <th className="px-5 py-3 text-left font-semibold">Harga Modal</th>
                                        <th className="px-5 py-3 text-left font-semibold">Nilai</th>
                                        <th className="px-5 py-3 text-left font-semibold">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{idx + 1}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                <p className="text-sm font-semibold text-foreground">{item.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{item.system_qty}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-foreground">{item.actual_qty}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.difference_qty > 0 ? 'bg-success/10 text-success' : item.difference_qty < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                                    {item.difference_qty > 0 ? '+' : ''}{item.difference_qty}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{fmtCurrency(item.unit_cost || 0)}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                {(item.total_cost || 0) !== 0 ? (
                                                    <span className={`text-sm font-medium ${(item.difference_qty || 0) < 0 ? 'text-destructive' : 'text-success'}`}>
                                                        {(item.difference_qty || 0) < 0 ? '−' : '+'}{fmtCurrency(Math.abs(item.total_cost || 0))}
                                                    </span>
                                                ) : <span className="text-sm text-muted-foreground">—</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{item.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards — angka Selisih ditonjolkan karena itu
                            inti dari satu baris penyesuaian. */}
                        <div className="divide-y divide-border md:hidden">
                            {items.map((item, idx) => {
                                const diff = item.difference_qty || 0;
                                return (
                                    <div key={item.id} className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    <span className="text-muted-foreground">{idx + 1}. </span>
                                                    {item.product?.name}
                                                </p>
                                                <p className="truncate font-mono text-xs text-muted-foreground">{item.product?.sku}</p>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${diff > 0 ? 'bg-success/10 text-success' : diff < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                                {diff > 0 ? '+' : ''}{diff}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-stretch gap-2 text-center">
                                            <div className="flex-1 rounded-lg border border-border px-2 py-1.5">
                                                <p className="text-[10px] text-muted-foreground">Stok Sistem</p>
                                                <p className="mt-0.5 text-sm font-semibold text-foreground">{item.system_qty}</p>
                                            </div>
                                            <div className="flex items-center text-sm font-semibold text-muted-foreground">&rarr;</div>
                                            <div className="flex-1 rounded-lg border border-border px-2 py-1.5">
                                                <p className="text-[10px] text-muted-foreground">Stok Aktual</p>
                                                <p className="mt-0.5 text-sm font-semibold text-foreground">{item.actual_qty}</p>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <span className="text-muted-foreground">
                                                Modal {fmtCurrency(item.unit_cost || 0)}
                                            </span>
                                            {(item.total_cost || 0) !== 0 && (
                                                <span className={`font-semibold ${diff < 0 ? 'text-destructive' : 'text-success'}`}>
                                                    {diff < 0 ? '−' : '+'}{fmtCurrency(Math.abs(item.total_cost || 0))}
                                                </span>
                                            )}
                                        </div>

                                        {item.notes && (
                                            <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Ringkasan</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Item</dt>
                                    <dd className="font-medium text-foreground">{items.length} produk</dd>
                                </div>
                                <div className="my-2 border-t border-border" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-foreground">Total Selisih</dt>
                                    <dd className={`text-lg font-bold ${totalDiff > 0 ? 'text-success' : totalDiff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        {totalDiff > 0 ? '+' : ''}{totalDiff}
                                    </dd>
                                </div>
                                {(totalLoss > 0 || totalGain > 0) && (
                                    <div className="my-2 border-t border-border" />
                                )}
                                {totalLoss > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-destructive">Total Kerugian</dt>
                                        <dd className="font-semibold text-destructive">{fmtCurrency(totalLoss)}</dd>
                                    </div>
                                )}
                                {totalGain > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-success">Total Penambahan</dt>
                                        <dd className="font-semibold text-success">{fmtCurrency(totalGain)}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Status</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <InfoRow label="Status" value={<StatusBadge status={adjustment.status} />} isRaw />
                                <InfoRow label="Dibuat" value={fmtDate(adjustment.created_at)} />
                                {adjustment.updated_at !== adjustment.created_at && (
                                    <InfoRow label="Diupdate" value={fmtDate(adjustment.updated_at)} />
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm status modal */}
            {confirmingStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => !processing && setConfirmingStatus(null)}>
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${confirmingStatus === 'approved' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                                {confirmingStatus === 'approved'
                                    ? <CheckCircle className="h-6 w-6 text-success" strokeWidth={1.8} />
                                    : <XCircle className="h-6 w-6 text-destructive" strokeWidth={1.8} />
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-popover-foreground">
                                    {confirmingStatus === 'approved' ? 'Setujui Penyesuaian?' : 'Tolak Penyesuaian?'}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {confirmingStatus === 'approved'
                                        ? 'Stok produk akan disesuaikan sesuai selisih. Tindakan ini tidak dapat dibatalkan.'
                                        : 'Penyesuaian akan ditolak dan tidak ada perubahan stok.'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button onClick={() => setConfirmingStatus(null)} disabled={processing} className="inline-flex justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60">Batal</button>
                            <button
                                onClick={() => handleStatus(confirmingStatus)}
                                disabled={processing}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
                                    confirmingStatus === 'approved'
                                        ? 'bg-success text-success-foreground shadow-success/30 hover:bg-success/90 focus:ring-success'
                                        : 'bg-destructive text-destructive-foreground shadow-destructive/30 hover:bg-destructive/90 focus:ring-destructive'
                                }`}
                            >
                                {processing ? 'Memproses...' : confirmingStatus === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function InfoRow({ label, value, isRaw }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={`text-right ${isRaw ? '' : 'font-medium text-foreground'}`}>{value}</dd>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-warning/10 text-warning', approved: 'bg-success/10 text-success', rejected: 'bg-destructive/10 text-destructive' };
    const label = { draft: 'Draft', approved: 'Disetujui', rejected: 'Ditolak' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
            {label[status] ?? status}
        </span>
    );
}
