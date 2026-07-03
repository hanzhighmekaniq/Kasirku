import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ purchase }) {
    const { flash } = usePage().props;
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { supplier, items, payments, user } = purchase;

    const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const fmtShort = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const fmtTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const handleStatus = (status) => {
        setProcessing(true);
        router.patch(route('admin.purchases.updateStatus', purchase.id), { status }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmingStatus(null); },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.purchases.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">{purchase.purchase_no}</h2>
                        <p className="text-sm text-slate-400">Detail Pembelian</p>
                    </div>
                </div>
            }
        >
            <Head title={`Pembelian ${purchase.purchase_no}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Status badges */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <StatusBadge status={purchase.status} />
                <PaymentBadge status={purchase.payment_status} />
                {purchase.status === 'draft' && (
                    <>
                        <button onClick={() => setConfirmingStatus('completed')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Selesaikan
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

                    {/* Info */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Informasi Pembelian</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoRow label="No. Faktur" value={purchase.purchase_no} />
                                <InfoRow label="Tanggal" value={fmtDate(purchase.purchase_date)} />
                                <InfoRow label="Supplier" value={supplier?.name ?? '-'} />
                                <InfoRow label="Dicatat oleh" value={user?.name ?? '-'} />
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Item Pembelian</h3>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-6 py-3 font-medium text-slate-500">#</th>
                                            <th className="px-6 py-3 font-medium text-slate-500">Produk</th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">Qty</th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">Harga</th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">Subtotal</th>
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
                                                <td className="px-6 py-3.5 text-right text-slate-600">{item.quantity}</td>
                                                <td className="px-6 py-3.5 text-right text-slate-600">{fmtRp(item.cost_price)}</td>
                                                <td className="px-6 py-3.5 text-right font-medium text-slate-800">{fmtRp(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Financial */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Rincian Biaya</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <Row label="Subtotal" value={fmtRp(purchase.subtotal)} />
                                {Number(purchase.discount_amount) > 0 && (
                                    <Row label="Diskon" value={`- ${fmtRp(purchase.discount_amount)}`} valueCls="text-red-500" />
                                )}
                                {Number(purchase.tax_amount) > 0 && (
                                    <Row label="Pajak" value={`+ ${fmtRp(purchase.tax_amount)}`} />
                                )}
                                {Number(purchase.shipping_amount) > 0 && (
                                    <Row label="Ongkir" value={`+ ${fmtRp(purchase.shipping_amount)}`} />
                                )}
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex items-center justify-between">
                                    <dt className="font-semibold text-slate-700">Grand Total</dt>
                                    <dd className="text-lg font-bold text-indigo-600">{fmtRp(purchase.grand_total)}</dd>
                                </div>
                                <div className="my-2 border-t border-slate-100" />
                                <Row label="Dibayar" value={fmtRp(purchase.paid_amount)} />
                                <div className="flex items-center justify-between text-sm">
                                    <dt className="font-medium text-slate-600">Sisa Bayar</dt>
                                    <dd className={`font-semibold ${Number(purchase.grand_total) - Number(purchase.paid_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {fmtRp(Number(purchase.grand_total) - Number(purchase.paid_amount))}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Payments */}
                    {payments && payments.length > 0 && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                                <h3 className="text-base font-semibold text-slate-900">Riwayat Pembayaran</h3>
                            </div>
                            <div className="divide-y divide-slate-100 p-4">
                                {payments.map((pay) => (
                                    <div key={pay.id} className="py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">{fmtShort(pay.paid_at)} {fmtTime(pay.paid_at)}</span>
                                            <span className="text-sm font-semibold text-emerald-600">{fmtRp(pay.amount)}</span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                                            <span>{pay.paymentMethod?.name ?? '-'}</span>
                                            {pay.reference_no && <span>• {pay.reference_no}</span>}
                                        </div>
                                        {pay.note && <p className="mt-1 text-xs text-slate-400 italic">{pay.note}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status history */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Status</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <InfoRow label="Status" value={<StatusBadge status={purchase.status} />} isRaw />
                                <InfoRow label="Pembayaran" value={<PaymentBadge status={purchase.payment_status} />} isRaw />
                                <InfoRow label="Dibuat" value={`${fmtDate(purchase.created_at)}`} />
                                {purchase.updated_at !== purchase.created_at && (
                                    <InfoRow label="Diupdate" value={`${fmtDate(purchase.updated_at)}`} />
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
                            {confirmingStatus === 'completed' ? 'Selesaikan Pembelian?' : 'Batalkan Pembelian?'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {confirmingStatus === 'completed'
                                ? 'Stok produk akan ditambahkan sesuai qty item. Tindakan ini tidak dapat dibatalkan.'
                                : 'Pembelian akan dibatalkan. Jika sudah selesai, stok produk akan dikurangi kembali.'}
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setConfirmingStatus(null)} disabled={processing} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">Batal</button>
                            <button onClick={() => handleStatus(confirmingStatus)} disabled={processing} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${confirmingStatus === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700' : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30 hover:from-red-600 hover:to-red-700'}`}>
                                {processing ? 'Memproses...' : confirmingStatus === 'completed' ? 'Ya, Selesaikan' : 'Ya, Batalkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

/* ── Helpers ── */
function InfoRow({ label, value, isRaw }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className={`text-right ${isRaw ? '' : 'font-medium text-slate-800'}`}>{value}</dd>
        </div>
    );
}

function Row({ label, value, valueCls = '' }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-slate-500">{label}</dt>
            <dd className={`font-medium text-slate-700 ${valueCls}`}>{value}</dd>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-slate-100 text-slate-600', completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600' };
    const label = { draft: 'Draft', completed: 'Selesai', cancelled: 'Dibatalkan' };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{label[status] ?? status}</span>;
}

function PaymentBadge({ status }) {
    const map = { unpaid: 'bg-rose-100 text-rose-600', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700' };
    const label = { unpaid: 'Belum Bayar', partial: 'Sebagian', paid: 'Lunas' };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{label[status] ?? status}</span>;
}
