import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

const inputCls = 'block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

function formatRupiah(val) {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

export default function Edit({ purchase, suppliers, paymentMethods, storeType }) {
    const { data, setData, patch, processing, errors } = useForm({
        supplier_id: purchase.supplier_id || '',
        purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : '',
        discount_amount: purchase.discount_amount || '',
        tax_amount: purchase.tax_amount || '',
        shipping_amount: purchase.shipping_amount || '',
        payment_method_id: purchase.payments?.[0]?.payment_method_id || '',
        paid_amount: purchase.paid_amount || '',
    });

    const subtotal = useMemo(() => {
        return (purchase.items || []).reduce((sum, item) => {
            return sum + (item.quantity * item.cost_price);
        }, 0);
    }, [purchase.items]);

    const discount = parseFloat(data.discount_amount) || 0;
    const tax = parseFloat(data.tax_amount) || 0;
    const shipping = parseFloat(data.shipping_amount) || 0;
    const grandTotal = Math.max(0, subtotal - discount + tax + shipping);
    const paidAmount = parseFloat(data.paid_amount) || 0;
    const remaining = grandTotal - paidAmount;

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.purchases.update', purchase.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.purchases.show', purchase.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Edit Pembelian</h2>
                </div>
            }
        >
            <Head title={`Edit Pembelian - ${purchase.purchase_no}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Info */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Informasi Pembelian</h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            <span className="font-mono text-indigo-600">{purchase.purchase_no}</span> — Status: <span className="font-medium text-amber-600">Draft</span>
                        </p>
                    </div>
                    <form onSubmit={submit} className="p-6">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {/* Supplier */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">— Pilih Supplier —</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {errors.supplier_id && <p className="mt-1 text-xs text-red-500">{errors.supplier_id}</p>}
                            </div>

                            {/* Tanggal */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tanggal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.purchase_date}
                                    onChange={(e) => setData('purchase_date', e.target.value)}
                                    className={inputCls}
                                />
                                {errors.purchase_date && <p className="mt-1 text-xs text-red-500">{errors.purchase_date}</p>}
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Diskon</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.discount_amount}
                                    onChange={(e) => setData('discount_amount', e.target.value)}
                                    className={inputCls}
                                    placeholder="0"
                                />
                                {errors.discount_amount && <p className="mt-1 text-xs text-red-500">{errors.discount_amount}</p>}
                            </div>

                            {/* Tax */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Pajak</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.tax_amount}
                                    onChange={(e) => setData('tax_amount', e.target.value)}
                                    className={inputCls}
                                    placeholder="0"
                                />
                                {errors.tax_amount && <p className="mt-1 text-xs text-red-500">{errors.tax_amount}</p>}
                            </div>

                            {/* Shipping */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Ongkos Kirim</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.shipping_amount}
                                    onChange={(e) => setData('shipping_amount', e.target.value)}
                                    className={inputCls}
                                    placeholder="0"
                                />
                                {errors.shipping_amount && <p className="mt-1 text-xs text-red-500">{errors.shipping_amount}</p>}
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Metode Bayar</label>
                                <select
                                    value={data.payment_method_id}
                                    onChange={(e) => setData('payment_method_id', e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">— Pilih Metode —</option>
                                    {paymentMethods.map((pm) => (
                                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                                    ))}
                                </select>
                                {errors.payment_method_id && <p className="mt-1 text-xs text-red-500">{errors.payment_method_id}</p>}
                            </div>

                            {/* Paid Amount */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Jumlah Dibayar</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.paid_amount}
                                    onChange={(e) => setData('paid_amount', e.target.value)}
                                    className={inputCls}
                                    placeholder="0"
                                />
                                {errors.paid_amount && <p className="mt-1 text-xs text-red-500">{errors.paid_amount}</p>}
                            </div>
                        </div>

                        {/* Items (Read-only) */}
                        <div className="mt-8">
                            <div className="mb-3">
                                <h4 className="text-sm font-semibold text-slate-800">
                                    Item Pembelian <span className="text-xs font-normal text-slate-400">(read-only — tidak dapat diubah dari halaman ini)</span>
                                </h4>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50/60">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">#</th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Produk</th>
                                            <th className="w-24 px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Qty</th>
                                            <th className="w-36 px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Harga Beli</th>
                                            <th className="w-36 px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(purchase.items || []).map((item, idx) => (
                                            <tr key={item.id} className="bg-slate-50/30">
                                                <td className="px-3 py-2 text-xs text-slate-400">{idx + 1}</td>
                                                <td className="px-3 py-2 text-xs text-slate-600">{item.product?.name || '—'}</td>
                                                <td className="px-3 py-2 text-right text-xs text-slate-600">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right text-xs text-slate-600">{formatRupiah(item.cost_price)}</td>
                                                <td className="px-3 py-2 text-right text-xs font-medium text-slate-700">{formatRupiah(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-medium text-slate-700">{formatRupiah(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Diskon</span>
                                        <span className="font-medium text-rose-600">-{formatRupiah(discount)}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Pajak</span>
                                        <span className="font-medium text-slate-700">{formatRupiah(tax)}</span>
                                    </div>
                                )}
                                {shipping > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Ongkir</span>
                                        <span className="font-medium text-slate-700">{formatRupiah(shipping)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200 pt-2">
                                    <span className="font-semibold text-slate-800">Grand Total</span>
                                    <span className="text-lg font-bold text-indigo-600">{formatRupiah(grandTotal)}</span>
                                </div>
                                {paidAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Dibayar</span>
                                        <span className="font-medium text-emerald-600">{formatRupiah(paidAmount)}</span>
                                    </div>
                                )}
                                {paidAmount > 0 && remaining > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Sisa</span>
                                        <span className="font-medium text-rose-600">{formatRupiah(remaining)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link
                                href={route('admin.purchases.show', purchase.id)}
                                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                            >
                                {processing ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan Perubahan'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
