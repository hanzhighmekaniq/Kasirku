import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ supplier, recentPurchases, products, purchaseStats }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('purchases');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fmtCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    const totalPaid = Number(supplier.purchases_sum_paid_amount || 0);
    const totalUnpaid = Number(supplier.purchases_sum_grand_total || 0) - totalPaid;

    const handleDelete = () => {
        setProcessing(true);
        router.delete(route('admin.suppliers.destroy', supplier.id), {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmDelete(false); },
        });
    };

    const purchaseStatus = (s) => {
        const map = { draft: 'bg-slate-100 text-slate-600', pending: 'bg-amber-100 text-amber-700', partial: 'bg-blue-100 text-blue-700', paid: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600' };
        const label = { draft: 'Draft', pending: 'Belum Bayar', partial: 'Bayar Sebagian', paid: 'Lunas', cancelled: 'Dibatalkan' };
        return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[s] ?? 'bg-slate-100 text-slate-600'}`}>{label[s] ?? s}</span>;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.suppliers.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
                                {supplier.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold text-slate-800 truncate">{supplier.name}</h2>
                                <p className="text-sm text-slate-400">{supplier.code} &middot; {supplier.purchases_count ?? 0} pembelian</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.suppliers.edit', supplier.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            Edit
                        </Link>
                        {(!supplier.purchases_count || supplier.purchases_count === 0) && (
                            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                Hapus
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Supplier: ${supplier.name}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Main content */}
                <div className="space-y-5 lg:col-span-2">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <MiniStat title="Pembelian" value={supplier.purchases_count ?? 0} color="emerald" />
                        <MiniStat title="Total Belanja" value={fmtCurrency(supplier.purchases_sum_grand_total)} color="blue" />
                        <MiniStat title="Sudah Dibayar" value={fmtCurrency(totalPaid)} color="slate" />
                        <MiniStat title="Belum Dibayar" value={fmtCurrency(totalUnpaid)} color={totalUnpaid > 0 ? 'red' : 'slate'} />
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                                <h3 className="text-sm font-semibold text-slate-900">Informasi Kontak</h3>
                            </div>
                            <div className="p-6">
                                <dl className="space-y-3 text-sm">
                                    <InfoRow label="Telepon" value={supplier.phone ? <a href={`tel:${supplier.phone}`} className="text-indigo-600 hover:text-indigo-800 transition">{supplier.phone}</a> : <span className="text-slate-300">-</span>} />
                                    <InfoRow label="Email" value={supplier.email ? <a href={`mailto:${supplier.email}`} className="text-indigo-600 hover:text-indigo-800 transition truncate block max-w-[200px] text-right">{supplier.email}</a> : <span className="text-slate-300">-</span>} />
                                    <InfoRow label="Kontak Person" value={supplier.contact_person || <span className="text-slate-300">-</span>} />
                                </dl>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                                <h3 className="text-sm font-semibold text-slate-900">Alamat</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-slate-600 leading-relaxed">{supplier.address || <span className="text-slate-300 italic">Belum diisi</span>}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs: Purchases / Products */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex border-b border-slate-100">
                            <button onClick={() => setActiveTab('purchases')} className={`flex-1 px-6 py-3.5 text-sm font-medium transition ${activeTab === 'purchases' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                Riwayat Pembelian
                            </button>
                            <button onClick={() => setActiveTab('products')} className={`flex-1 px-6 py-3.5 text-sm font-medium transition ${activeTab === 'products' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                Produk ({products.length})
                            </button>
                        </div>

                        {activeTab === 'purchases' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-6 py-3 font-medium text-slate-500">No. Pembelian</th>
                                            <th className="px-6 py-3 font-medium text-slate-500">Tanggal</th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">Total</th>
                                            <th className="px-6 py-3 text-center font-medium text-slate-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentPurchases.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">Belum ada riwayat pembelian.</td></tr>
                                        ) : (
                                            recentPurchases.map((p) => (
                                                <tr key={p.id} className="transition hover:bg-slate-50/50">
                                                    <td className="px-6 py-3.5">
                                                        <Link href={route('admin.purchases.show', p.id)} className="font-semibold text-indigo-600 hover:text-indigo-800">{p.purchase_no}</Link>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-slate-600">{fmtDate(p.purchase_date)}</td>
                                                    <td className="px-6 py-3.5 text-right font-medium text-slate-800">{fmtCurrency(p.grand_total)}</td>
                                                    <td className="px-6 py-3.5 text-center">{purchaseStatus(p.payment_status || p.status)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-6 py-3 font-medium text-slate-500">Produk</th>
                                            <th className="px-6 py-3 font-medium text-slate-500">SKU</th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">Harga Beli</th>
                                            <th className="px-6 py-3 text-center font-medium text-slate-500">Stok</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">Tidak ada produk dari supplier ini.</td></tr>
                                        ) : (
                                            products.map((p) => (
                                                <tr key={p.id} className="transition hover:bg-slate-50/50">
                                                    <td className="px-6 py-3.5 font-medium text-slate-800">{p.name}</td>
                                                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{p.sku}</td>
                                                    <td className="px-6 py-3.5 text-right text-slate-600">{fmtCurrency(p.cost_price)}</td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        <span className={`inline-flex min-w-[28px] justify-center rounded-lg px-2 py-0.5 text-xs font-semibold ${(p.stocks_sum_quantity ?? 0) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                            {p.stocks_sum_quantity ?? 0}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-900">Detail Supplier</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-3 text-sm">
                                <InfoRow label="Kode" value={<span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{supplier.code}</span>} />
                                <InfoRow label="Nama" value={supplier.name} />
                                <InfoRow label="Produk" value={<span className="font-semibold text-blue-600">{supplier.products_count ?? 0}</span>} />
                                <InfoRow label="Pembelian" value={<span className="font-semibold text-emerald-600">{supplier.purchases_count ?? 0}</span>} />
                                <div className="my-2 border-t border-slate-100" />
                                <InfoRow label="Dibuat" value={fmtDate(supplier.created_at)} />
                                {supplier.updated_at !== supplier.created_at && (
                                    <InfoRow label="Diupdate" value={fmtDate(supplier.updated_at)} />
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Purchase stats by status */}
                    {Object.keys(purchaseStats).length > 0 && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                                <h3 className="text-sm font-semibold text-slate-900">Status Pembelian</h3>
                            </div>
                            <div className="p-6">
                                <dl className="space-y-2.5 text-sm">
                                    {Object.entries(purchaseStats).map(([status, data]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <dt>{purchaseStatus(status)}</dt>
                                            <dd className="font-medium text-slate-700">{data.total} &middot; {fmtCurrency(data.total_value)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm delete modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => !processing && setConfirmDelete(false)}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900">Hapus Supplier?</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Supplier <strong>{supplier.name}</strong> ({supplier.code}) akan dihapus permanen.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setConfirmDelete(false)} disabled={processing} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                            <button onClick={handleDelete} disabled={processing} className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/30 transition hover:from-red-600 hover:to-red-700 disabled:opacity-60">
                                {processing ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function MiniStat({ title, value, color }) {
    const colors = { emerald: 'border-emerald-200 bg-emerald-50', blue: 'border-blue-200 bg-blue-50', slate: 'border-slate-200 bg-white', red: 'border-red-200 bg-red-50' };
    const textColors = { emerald: 'text-emerald-700', blue: 'text-blue-700', slate: 'text-slate-800', red: 'text-red-600' };
    return (
        <div className={`rounded-2xl border p-4 shadow-sm ${colors[color]}`}>
            <p className="text-xs font-medium text-slate-400">{title}</p>
            <p className={`mt-1 text-lg font-bold ${textColors[color]}`}>{value}</p>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-700">{value}</dd>
        </div>
    );
}
