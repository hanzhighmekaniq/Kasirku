import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ transfer }) {
    const { flash } = usePage().props;
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { items, user, fromBranch, toBranch } = transfer;

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const handleStatus = (status) => {
        setProcessing(true);
        router.patch(route('admin.stock-transfers.updateStatus', transfer.id), { status }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmingStatus(null); },
        });
    };

    const statusMessages = {
        in_transit: 'Transfer akan ditandai sebagai dalam perjalanan.',
        received: 'Stok akan dipindahkan dari cabang asal ke cabang tujuan. Tindakan ini tidak dapat dibatalkan.',
        cancelled: 'Transfer akan dibatalkan. Jika sudah dalam perjalanan, tidak ada perubahan stok.',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.stock-transfers.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">{transfer.transfer_no}</h2>
                        <p className="text-sm text-slate-400">Detail Transfer Stok</p>
                    </div>
                </div>
            }
        >
            <Head title={`Transfer ${transfer.transfer_no}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Status badge + actions */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <StatusBadge status={transfer.status} />
                {transfer.status === 'pending' && (
                    <>
                        <button onClick={() => setConfirmingStatus('in_transit')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:from-blue-600 hover:to-blue-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                            Kirim
                        </button>
                        <button onClick={() => setConfirmingStatus('cancelled')} className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            Batalkan
                        </button>
                    </>
                )}
                {transfer.status === 'in_transit' && (
                    <>
                        <button onClick={() => setConfirmingStatus('received')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Terima
                        </button>
                        <button onClick={() => setConfirmingStatus('cancelled')} className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            Batalkan
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Main */}
                <div className="space-y-5 lg:col-span-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Informasi Transfer</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoRow label="No. Transfer" value={transfer.transfer_no} />
                                <InfoRow label="Tanggal" value={fmtDate(transfer.transfer_date)} />
                                <InfoRow label="Cabang Asal" value={fromBranch?.name ?? '-'} />
                                <InfoRow label="Cabang Tujuan" value={toBranch?.name ?? '-'} />
                                <InfoRow label="Oleh" value={user?.name ?? '-'} />
                                {transfer.notes && <InfoRow label="Catatan" value={transfer.notes} />}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Item Transfer</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-3 font-medium text-slate-500">#</th>
                                        <th className="px-6 py-3 font-medium text-slate-500">Produk</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Jumlah</th>
                                        <th className="px-6 py-3 font-medium text-slate-500">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="transition hover:bg-slate-50/50">
                                            <td className="px-6 py-3.5 text-slate-400">{idx + 1}</td>
                                            <td className="px-6 py-3.5">
                                                <p className="font-medium text-slate-800">{item.product?.name}</p>
                                                <p className="text-xs text-slate-400">{item.product?.sku}</p>
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-semibold text-indigo-600">{item.quantity}</td>
                                            <td className="px-6 py-3.5 text-xs text-slate-400">{item.notes || '-'}</td>
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
                            <h3 className="text-base font-semibold text-slate-900">Ringkasan</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between"><dt className="text-slate-500">Item</dt><dd className="font-medium text-slate-700">{items.length} produk</dd></div>
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-slate-700">Total Qty</dt>
                                    <dd className="text-lg font-bold text-indigo-600">
                                        {items.reduce((sum, item) => sum + item.quantity, 0)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Status</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <InfoRow label="Status" value={<StatusBadge status={transfer.status} />} isRaw />
                                <InfoRow label="Dibuat" value={fmtDate(transfer.created_at)} />
                                {transfer.updated_at !== transfer.created_at && (
                                    <InfoRow label="Diupdate" value={fmtDate(transfer.updated_at)} />
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
                        <h3 className="text-lg font-semibold text-slate-900">
                            {confirmingStatus === 'in_transit' && 'Kirim Transfer?'}
                            {confirmingStatus === 'received' && 'Terima Transfer?'}
                            {confirmingStatus === 'cancelled' && 'Batalkan Transfer?'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{statusMessages[confirmingStatus]}</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setConfirmingStatus(null)} disabled={processing} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                            <button onClick={() => handleStatus(confirmingStatus)} disabled={processing} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${confirmingStatus === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700'}`}>
                                {processing ? 'Memproses...' : 'Ya, Lanjutkan'}
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
    const map = { pending: 'bg-slate-100 text-slate-600', in_transit: 'bg-blue-100 text-blue-700', received: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600' };
    const label = { pending: 'Pending', in_transit: 'Dalam Perjalanan', received: 'Diterima', cancelled: 'Dibatalkan' };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{label[status] ?? status}</span>;
}
