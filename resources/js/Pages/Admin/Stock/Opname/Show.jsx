import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function Show({ opname }) {
    const { flash } = usePage().props;
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { items, user } = opname;

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
        router.patch(route('admin.stock-opnames.updateStatus', opname.id), { status }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmingStatus(null); },
        });
    };

    const totalDiff = items.reduce((sum, item) => sum + (item.difference_qty || 0), 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.stock-opnames.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{opname.opname_no}</h2>
                        <p className="text-sm text-muted-foreground">Detail Opname Stok</p>
                    </div>
                </div>
            }
        >
            <Head title={`Opname ${opname.opname_no}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>
            )}

            {/* Status badge + actions */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={opname.status} />
                {(opname.status === 'draft' || opname.status === 'in_progress') && (
                    <>
                        <button
                            onClick={() => setConfirmingStatus('completed')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-success px-3.5 py-2 text-sm font-semibold text-success-foreground shadow-md shadow-success/30 transition hover:bg-success/90"
                        >
                            <CheckCircle className="h-4 w-4" strokeWidth={2} />
                            Selesaikan
                        </button>
                        <button
                            onClick={() => setConfirmingStatus('cancelled')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-card px-3.5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                        >
                            <XCircle className="h-4 w-4" strokeWidth={2} />
                            Batalkan
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
                            <h3 className="text-sm font-semibold text-foreground">Informasi Opname</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoRow label="No. Opname" value={opname.opname_no} />
                                <InfoRow label="Tanggal" value={fmtDate(opname.opname_date)} />
                                <InfoRow label="Oleh" value={user?.name ?? '—'} />
                                {opname.notes && <InfoRow label="Catatan" value={opname.notes} />}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Item Opname</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">#</th>
                                        <th className="px-4 py-3 text-left font-semibold">Produk</th>
                                        <th className="px-4 py-3 text-right font-semibold">Stok Sistem</th>
                                        <th className="px-4 py-3 text-right font-semibold">Hitung Fisik</th>
                                        <th className="px-4 py-3 text-center font-semibold">Selisih</th>
                                        <th className="px-4 py-3 text-right font-semibold">Harga Modal</th>
                                        <th className="px-4 py-3 text-right font-semibold">Nilai</th>
                                        <th className="px-4 py-3 text-left font-semibold">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{idx + 1}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <p className="font-semibold text-foreground">{item.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{item.system_qty}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">{item.counted_qty}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.difference_qty > 0 ? 'bg-success/10 text-success' : item.difference_qty < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                                    {item.difference_qty > 0 ? '+' : ''}{item.difference_qty}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{fmtCurrency(item.unit_cost || 0)}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {(item.total_cost || 0) !== 0 ? (
                                                    <span className={`font-medium ${(item.difference_qty || 0) < 0 ? 'text-destructive' : 'text-success'}`}>
                                                        {(item.difference_qty || 0) < 0 ? '−' : '+'}{fmtCurrency(Math.abs(item.total_cost || 0))}
                                                    </span>
                                                ) : <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{item.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                <InfoRow label="Status" value={<StatusBadge status={opname.status} />} isRaw />
                                <InfoRow label="Dibuat" value={fmtDate(opname.created_at)} />
                                {opname.updated_at !== opname.created_at && (
                                    <InfoRow label="Diupdate" value={fmtDate(opname.updated_at)} />
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
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${confirmingStatus === 'completed' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                                {confirmingStatus === 'completed'
                                    ? <CheckCircle className="h-6 w-6 text-success" strokeWidth={1.8} />
                                    : <XCircle className="h-6 w-6 text-destructive" strokeWidth={1.8} />
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-popover-foreground">
                                    {confirmingStatus === 'completed' ? 'Selesaikan Opname?' : 'Batalkan Opname?'}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {confirmingStatus === 'completed'
                                        ? 'Stok produk akan disesuaikan sesuai selisih hitung fisik. Tindakan ini tidak dapat dibatalkan.'
                                        : 'Opname akan dibatalkan dan tidak ada perubahan stok.'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button onClick={() => setConfirmingStatus(null)} disabled={processing} className="inline-flex justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60">Batal</button>
                            <button
                                onClick={() => handleStatus(confirmingStatus)}
                                disabled={processing}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
                                    confirmingStatus === 'completed'
                                        ? 'bg-success text-success-foreground shadow-success/30 hover:bg-success/90 focus:ring-success'
                                        : 'bg-destructive text-destructive-foreground shadow-destructive/30 hover:bg-destructive/90 focus:ring-destructive'
                                }`}
                            >
                                {processing ? 'Memproses...' : confirmingStatus === 'completed' ? 'Ya, Selesaikan' : 'Ya, Batalkan'}
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
    const map = { draft: 'bg-warning/10 text-warning', in_progress: 'bg-primary/10 text-primary', completed: 'bg-success/10 text-success', cancelled: 'bg-destructive/10 text-destructive' };
    const label = { draft: 'Draft', in_progress: 'Dikerjakan', completed: 'Selesai', cancelled: 'Dibatalkan' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
            {label[status] ?? status}
        </span>
    );
}
