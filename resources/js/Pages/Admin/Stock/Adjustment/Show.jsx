import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function Show({ adjustment }) {
    const { flash } = usePage().props;
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
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.stock-adjustments.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{adjustment.adjustment_no}</h2>
                        <p className="text-sm text-muted-foreground">Detail Penyesuaian Stok</p>
                    </div>
                </div>
            }
        >
            <Head title={`Penyesuaian ${adjustment.adjustment_no}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Status badge + actions */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={adjustment.status} />
                {adjustment.status === 'draft' && (
                    <>
                        <button
                            onClick={() => setConfirmingStatus('approved')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700"
                        >
                            <CheckCircle className="h-4 w-4" strokeWidth={2} />
                            Setujui
                        </button>
                        <button
                            onClick={() => setConfirmingStatus('rejected')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-card px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
                    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
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
                    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Item Penyesuaian</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produk</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok Sistem</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok Aktual</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selisih</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Harga Modal</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nilai</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="transition hover:bg-muted/50">
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{idx + 1}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                <p className="text-sm font-semibold text-foreground">{item.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{item.system_qty}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-foreground">{item.actual_qty}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.difference_qty > 0 ? 'bg-emerald-100 text-emerald-700' : item.difference_qty < 0 ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                                                    {item.difference_qty > 0 ? '+' : ''}{item.difference_qty}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{fmtCurrency(item.unit_cost || 0)}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                {(item.total_cost || 0) !== 0 ? (
                                                    <span className={`text-sm font-medium ${(item.difference_qty || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
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
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
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
                                    <dd className={`text-lg font-bold ${totalDiff > 0 ? 'text-emerald-600' : totalDiff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                        {totalDiff > 0 ? '+' : ''}{totalDiff}
                                    </dd>
                                </div>
                                {(totalLoss > 0 || totalGain > 0) && (
                                    <div className="my-2 border-t border-border" />
                                )}
                                {totalLoss > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-red-600">Total Kerugian</dt>
                                        <dd className="font-semibold text-red-600">{fmtCurrency(totalLoss)}</dd>
                                    </div>
                                )}
                                {totalGain > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-emerald-600">Total Penambahan</dt>
                                        <dd className="font-semibold text-emerald-600">{fmtCurrency(totalGain)}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${confirmingStatus === 'approved' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {confirmingStatus === 'approved'
                                    ? <CheckCircle className="h-6 w-6 text-emerald-600" strokeWidth={1.8} />
                                    : <XCircle className="h-6 w-6 text-red-600" strokeWidth={1.8} />
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-slate-900">
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
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
                                    confirmingStatus === 'approved'
                                        ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700 focus:ring-emerald-500'
                                        : 'bg-red-600 shadow-red-600/30 hover:bg-red-700 focus:ring-red-500'
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
    const map = { draft: 'bg-muted text-foreground', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600' };
    const label = { draft: 'Draft', approved: 'Disetujui', rejected: 'Ditolak' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-foreground'}`}>
            {label[status] ?? status}
        </span>
    );
}
