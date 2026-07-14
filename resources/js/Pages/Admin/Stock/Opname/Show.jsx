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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">{opname.opname_no}</h2>
                        <p className="text-sm text-slate-400">Detail Opname Stok</p>
                    </div>
                </div>
            }
        >
            <Head title={`Opname ${opname.opname_no}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Status badge + actions */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={opname.status} />
                {(opname.status === 'draft' || opname.status === 'in_progress') && (
                    <>
                        <button
                            onClick={() => setConfirmingStatus('completed')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700"
                        >
                            <CheckCircle className="h-4 w-4" strokeWidth={2} />
                            Selesaikan
                        </button>
                        <button
                            onClick={() => setConfirmingStatus('cancelled')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-800">Informasi Opname</h3>
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
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-800">Item Opname</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50/60">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Produk</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Stok Sistem</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hitung Fisik</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Selisih</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Harga Modal</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nilai</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="transition hover:bg-slate-50/50">
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-400">{idx + 1}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                <p className="text-sm font-semibold text-slate-800">{item.product?.name}</p>
                                                <p className="text-xs text-slate-400">{item.product?.sku}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-500">{item.system_qty}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-800">{item.counted_qty}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.difference_qty > 0 ? 'bg-emerald-100 text-emerald-700' : item.difference_qty < 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {item.difference_qty > 0 ? '+' : ''}{item.difference_qty}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-400">{fmtCurrency(item.unit_cost || 0)}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                {(item.total_cost || 0) !== 0 ? (
                                                    <span className={`text-sm font-medium ${(item.difference_qty || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {(item.difference_qty || 0) < 0 ? '−' : '+'}{fmtCurrency(Math.abs(item.total_cost || 0))}
                                                    </span>
                                                ) : <span className="text-sm text-slate-400">—</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-400">{item.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-800">Ringkasan</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Item</dt>
                                    <dd className="font-medium text-slate-700">{items.length} produk</dd>
                                </div>
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-slate-700">Total Selisih</dt>
                                    <dd className={`text-lg font-bold ${totalDiff > 0 ? 'text-emerald-600' : totalDiff < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                        {totalDiff > 0 ? '+' : ''}{totalDiff}
                                    </dd>
                                </div>
                                {(totalLoss > 0 || totalGain > 0) && (
                                    <div className="my-2 border-t border-slate-100" />
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

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-800">Status</h3>
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${confirmingStatus === 'completed' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {confirmingStatus === 'completed'
                                    ? <CheckCircle className="h-6 w-6 text-emerald-600" strokeWidth={1.8} />
                                    : <XCircle className="h-6 w-6 text-red-600" strokeWidth={1.8} />
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-slate-900">
                                    {confirmingStatus === 'completed' ? 'Selesaikan Opname?' : 'Batalkan Opname?'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {confirmingStatus === 'completed'
                                        ? 'Stok produk akan disesuaikan sesuai selisih hitung fisik. Tindakan ini tidak dapat dibatalkan.'
                                        : 'Opname akan dibatalkan dan tidak ada perubahan stok.'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button onClick={() => setConfirmingStatus(null)} disabled={processing} className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">Batal</button>
                            <button
                                onClick={() => handleStatus(confirmingStatus)}
                                disabled={processing}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
                                    confirmingStatus === 'completed'
                                        ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700 focus:ring-emerald-500'
                                        : 'bg-red-600 shadow-red-600/30 hover:bg-red-700 focus:ring-red-500'
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
            <dt className="text-slate-500">{label}</dt>
            <dd className={`text-right ${isRaw ? '' : 'font-medium text-slate-800'}`}>{value}</dd>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600' };
    const label = { draft: 'Draft', in_progress: 'Dikerjakan', completed: 'Selesai', cancelled: 'Dibatalkan' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
            {label[status] ?? status}
        </span>
    );
}
