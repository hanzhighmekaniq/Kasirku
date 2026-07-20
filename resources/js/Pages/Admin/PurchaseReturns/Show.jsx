import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const STATUS_CONFIG = {
    completed: { label: 'Selesai',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    cancelled: { label: 'Dibatalkan', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.completed;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

const PAGE_TITLE = {
    retail: 'Retur Pembelian',
    fnb: 'Retur Bahan Baku',
    rental: 'Retur Pembelian Unit',
};

export default function Show({ purchaseReturn, storeType = 'retail' }) {
    const pageTitle = PAGE_TITLE[storeType] ?? 'Retur Pembelian';
    const [processing, setProcessing] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const handleCancel = () => {
        setProcessing(true);
        router.patch(route('admin.purchase-returns.updateStatus', purchaseReturn.id), { status: 'cancelled' }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setShowCancelModal(false); },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.purchase-returns.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-800">Detail {pageTitle}</h2>
                        <StatusBadge status={purchaseReturn.status} />
                    </div>
                </div>
            }
        >
            <Head title={`${pageTitle} ${purchaseReturn.return_no}`} />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">{purchaseReturn.return_no}</h3>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    Dibuat oleh {purchaseReturn.user?.name || 'System'} • {formatDateTime(purchaseReturn.created_at)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {purchaseReturn.status === 'completed' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={processing}
                                        className="inline-flex items-center rounded-xl bg-slate-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-600 disabled:opacity-60"
                                    >
                                        Batalkan Retur
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pembelian Asal</p>
                                <Link
                                    href={route('admin.purchases.show', purchaseReturn.purchase_id)}
                                    className="mt-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
                                >
                                    {purchaseReturn.purchase?.purchase_no || '-'}
                                </Link>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Supplier</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{purchaseReturn.supplier?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tanggal Retur</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(purchaseReturn.return_date)}</p>
                            </div>
                        </div>
                        {purchaseReturn.notes && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Catatan</p>
                                <p className="mt-1 text-sm text-slate-700">{purchaseReturn.notes}</p>
                            </div>
                        )}

                        {/* Payment impact info */}
                        {purchaseReturn.status === 'completed' && (
                            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                                <div className="flex items-start gap-2">
                                    <svg className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">Dampak ke Pembayaran</p>
                                        <p className="mt-1 text-sm text-amber-700">
                                            Total retur sebesar <strong>{formatRupiah(purchaseReturn.total_amount)}</strong> telah dikurangi dari jumlah yang dibayar pada pembelian asal.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {purchaseReturn.status === 'cancelled' && (
                            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                                <div className="flex items-start gap-2">
                                    <svg className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Retur Dibatalkan</p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Retur ini dibatalkan. Stok dan pembayaran telah dikembalikan ke kondisi semula.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Item yang Diretur</h3>
                    </div>
                    <div className="p-6">
                        {/* Desktop */}
                        <div className="hidden sm:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-3 text-left text-xs font-semibold text-slate-500">Produk</th>
                                        <th className="pb-3 text-center text-xs font-semibold text-slate-500">Qty</th>
                                        <th className="pb-3 text-right text-xs font-semibold text-slate-500">Harga Satuan</th>
                                        <th className="pb-3 text-right text-xs font-semibold text-slate-500">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {purchaseReturn.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-3">
                                                <p className="font-medium text-slate-800">{item.product?.name || '-'}</p>
                                                <p className="text-xs text-slate-400">{item.product?.sku}</p>
                                                {item.reason && <p className="mt-0.5 text-xs text-amber-600 italic">Alasan: {item.reason}</p>}
                                            </td>
                                            <td className="py-3 text-center font-medium text-slate-700">{item.quantity}</td>
                                            <td className="py-3 text-right text-slate-600">{formatRupiah(item.cost_price)}</td>
                                            <td className="py-3 text-right font-medium text-slate-800">{formatRupiah(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="space-y-3 sm:hidden">
                            {purchaseReturn.items.map((item) => (
                                <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                                    <p className="text-sm font-medium text-slate-800">{item.product?.name || '-'}</p>
                                    <p className="text-xs text-slate-400">{item.product?.sku}</p>
                                    {item.reason && <p className="mt-1 text-xs text-amber-600 italic">Alasan: {item.reason}</p>}
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="text-slate-500">×{item.quantity} @ {formatRupiah(item.cost_price)}</span>
                                        <span className="font-semibold text-slate-800">{formatRupiah(item.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">Total Retur</span>
                                <span className="text-lg font-bold text-primary-600">{formatRupiah(purchaseReturn.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDeleteModal
                open={showCancelModal}
                title={`Batalkan retur ${purchaseReturn.return_no}?`}
                description="Stok akan dikembalikan dan pembayaran pada pembelian asal akan dipulihkan. Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Ya, Batalkan Retur"
                processing={processing}
                onConfirm={handleCancel}
                onClose={() => setShowCancelModal(false)}
            />
        </AuthenticatedLayout>
    );
}
