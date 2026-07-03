import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ waste }) {
    const { flash } = usePage().props;
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { items, user } = waste;

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const handleStatus = (status) => {
        setProcessing(true);
        router.patch(route('admin.wastes.updateStatus', waste.id), { status }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmingStatus(null); },
        });
    };

    const categoryLabel = {
        tumpahan: 'Tumpahan',
        kedaluwarsa: 'Kedaluwarsa',
        rusak: 'Rusak',
        hilang: 'Hilang',
        lainnya: 'Lainnya',
    };

    const totalCost = items.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.wastes.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">{waste.waste_no}</h2>
                        <p className="text-sm text-slate-400">Detail Catat Waste</p>
                    </div>
                </div>
            }
        >
            <Head title={`Waste ${waste.waste_no}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Status badge + actions */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <StatusBadge status={waste.status} />
                {waste.status === 'draft' && (
                    <>
                        <button onClick={() => setConfirmingStatus('approved')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Setujui
                        </button>
                        <button onClick={() => setConfirmingStatus('rejected')} className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            Tolak
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
                            <h3 className="text-base font-semibold text-slate-900">Informasi Waste</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoRow label="No. Waste" value={waste.waste_no} />
                                <InfoRow label="Tanggal" value={fmtDate(waste.waste_date)} />
                                <InfoRow label="Oleh" value={user?.name ?? '-'} />
                                {waste.notes && <InfoRow label="Catatan" value={waste.notes} />}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Item Waste</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-3 font-medium text-slate-500">#</th>
                                        <th className="px-6 py-3 font-medium text-slate-500">Produk</th>
                                        <th className="px-6 py-3 text-center font-medium text-slate-500">Jumlah</th>
                                        <th className="px-6 py-3 text-center font-medium text-slate-500">Kategori</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Harga Unit</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Total</th>
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
                                            <td className="px-6 py-3.5 text-center font-medium text-red-600">{item.quantity}</td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className="inline-flex rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                    {categoryLabel[item.waste_category] ?? item.waste_category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right text-slate-600">{fmtCurrency(item.unit_cost)}</td>
                                            <td className="px-6 py-3.5 text-right font-medium text-red-600">{fmtCurrency(item.total_cost)}</td>
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
                                <div className="flex justify-between"><dt className="text-slate-500">Total Qty</dt><dd className="font-medium text-slate-700">{totalQty} unit</dd></div>
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-slate-700">Total Kerugian</dt>
                                    <dd className="text-lg font-bold text-red-600">{fmtCurrency(totalCost)}</dd>
                                </div>
                                {waste.status === 'approved' && (
                                    <p className="text-xs text-emerald-600">Stok telah dikurangi.</p>
                                )}
                                {waste.status === 'draft' && (
                                    <p className="text-xs text-slate-400">Stok akan dikurangi saat disetujui.</p>
                                )}
                            </dl>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Status</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <InfoRow label="Status" value={<StatusBadge status={waste.status} />} isRaw />
                                <InfoRow label="Dibuat" value={fmtDate(waste.created_at)} />
                                {waste.updated_at !== waste.created_at && (
                                    <InfoRow label="Diupdate" value={fmtDate(waste.updated_at)} />
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
                            {confirmingStatus === 'approved' ? 'Setujui Waste?' : 'Tolak Waste?'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {confirmingStatus === 'approved'
                                ? 'Stok produk akan dikurangi sesuai jumlah waste. Tindakan ini tidak dapat dibatalkan.'
                                : 'Waste akan ditolak dan tidak ada perubahan stok.'}
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setConfirmingStatus(null)} disabled={processing} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                            <button onClick={() => handleStatus(confirmingStatus)} disabled={processing} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${confirmingStatus === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700' : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30 hover:from-red-600 hover:to-red-700'}`}>
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
        <div className="flex justify-between">
            <dt className="text-slate-500">{label}</dt>
            <dd className={isRaw ? '' : 'text-right font-medium text-slate-700'}>{value}</dd>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-slate-100 text-slate-600', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600' };
    const label = { draft: 'Draft', approved: 'Disetujui', rejected: 'Ditolak' };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{label[status] ?? status}</span>;
}
