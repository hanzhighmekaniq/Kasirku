import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

function inputCls(hasError = false) {
    return `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${
        hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
    }`;
}

function SectionCard({ title, subtitle, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

export default function Edit({ purchase, suppliers, paymentMethods, storeType }) {
    const { flash } = usePage().props;

    const { data, setData, patch, processing, errors } = useForm({
        supplier_id:      purchase.supplier_id ?? '',
        purchase_date:    purchase.purchase_date?.slice(0, 10) ?? '',
        discount_amount:  purchase.discount_amount > 0 ? String(purchase.discount_amount) : '',
        tax_amount:       purchase.tax_amount > 0 ? String(purchase.tax_amount) : '',
        shipping_amount:  purchase.shipping_amount > 0 ? String(purchase.shipping_amount) : '',
        payment_method_id: purchase.payments?.[0]?.payment_method_id ?? '',
        paid_amount:      purchase.paid_amount > 0 ? String(purchase.paid_amount) : '',
    });

    const items = purchase.items ?? [];

    const subtotal   = useMemo(() => items.reduce((s, i) => s + Number(i.quantity) * Number(i.cost_price), 0), [items]);
    const grandTotal = subtotal
        - Number(data.discount_amount || 0)
        + Number(data.tax_amount || 0)
        + Number(data.shipping_amount || 0);
    const paidAmount  = Number(data.paid_amount || 0);
    const remaining   = grandTotal - paidAmount;
    const paymentStatus =
        paidAmount >= grandTotal && grandTotal > 0 ? 'paid'
        : paidAmount > 0 ? 'partial'
        : 'unpaid';

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.purchases.update', purchase.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.purchases.show', purchase.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                        aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Edit Pembelian</h2>
                        <p className="text-sm text-slate-400">{purchase.purchase_no}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit ${purchase.purchase_no}`} />

            {flash?.error && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {flash.error}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <div className="space-y-5 lg:col-span-2">

                        {/* Info dasar */}
                        <SectionCard title="Informasi Pembelian">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Supplier" required error={errors.supplier_id}>
                                    <select value={data.supplier_id} onChange={(e) => setData('supplier_id', e.target.value)} className={inputCls(!!errors.supplier_id)}>
                                        <option value="">Pilih Supplier</option>
                                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Tanggal Pembelian" required error={errors.purchase_date}>
                                    <input type="date" value={data.purchase_date} onChange={(e) => setData('purchase_date', e.target.value)} className={inputCls(!!errors.purchase_date)} />
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Items — read-only */}
                        <SectionCard title="Item Pembelian" subtitle="Item pembelian tidak dapat diubah di sini.">
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="px-4 py-3">Produk</th>
                                            <th className="px-4 py-3 text-center w-20">Qty</th>
                                            <th className="px-4 py-3 text-right w-32">Harga Beli</th>
                                            <th className="px-4 py-3 text-right w-28">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, i) => (
                                            <tr key={item.id || i}>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-slate-800">{item.product?.name}</p>
                                                    <p className="text-xs text-slate-400">{item.product?.sku}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{fmtRp(item.cost_price)}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-700">{fmtRp(item.quantity * item.cost_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* Biaya tambahan */}
                        <SectionCard title="Rincian Biaya" subtitle="Diskon, pajak, dan ongkos kirim (opsional)">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {[
                                    { key: 'discount_amount', label: 'Diskon' },
                                    { key: 'tax_amount', label: 'Pajak' },
                                    { key: 'shipping_amount', label: 'Ongkir' },
                                ].map(({ key, label }) => (
                                    <Field key={key} label={label} error={errors[key]}>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                            <input type="number" value={data[key]} onChange={(e) => setData(key, e.target.value)}
                                                min="0" placeholder="0" className={`${inputCls(!!errors[key])} pl-9`} />
                                        </div>
                                    </Field>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Pembayaran */}
                        <SectionCard title="Pembayaran" subtitle="Isi jika sudah ada pembayaran.">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field label="Metode Pembayaran" error={errors.payment_method_id}>
                                        <select value={data.payment_method_id} onChange={(e) => setData('payment_method_id', e.target.value)} className={inputCls(!!errors.payment_method_id)}>
                                            <option value="">Pilih Metode</option>
                                            {paymentMethods.map((pm) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Jumlah Dibayar" error={errors.paid_amount}>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                            <input
                                                type="number"
                                                value={data.paid_amount}
                                                onChange={(e) => setData('paid_amount', e.target.value)}
                                                min="0" placeholder="0"
                                                className={`${inputCls(!!errors.paid_amount)} pl-9 pr-28`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setData('paid_amount', grandTotal > 0 ? String(grandTotal) : '')}
                                                disabled={grandTotal <= 0}
                                                className="absolute inset-y-1 right-1 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-40"
                                            >
                                                Bayar Lunas
                                            </button>
                                        </div>
                                    </Field>
                                </div>
                                {grandTotal > 0 && (
                                    <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
                                        paymentStatus === 'paid'    ? 'bg-emerald-50 text-emerald-700' :
                                        paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700' :
                                                                       'bg-slate-50 text-slate-500'
                                    }`}>
                                        <span>
                                            {paymentStatus === 'paid'    && 'Pembayaran lunas'}
                                            {paymentStatus === 'partial' && `Sisa bayar: ${fmtRp(remaining)}`}
                                            {paymentStatus === 'unpaid'  && 'Belum ada pembayaran'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Item</dt>
                                    <dd className="font-medium text-slate-700">{items.length} produk</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Subtotal</dt>
                                    <dd className="font-medium text-slate-700">{fmtRp(subtotal)}</dd>
                                </div>
                                {Number(data.discount_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Diskon</dt>
                                        <dd className="font-medium text-red-500">– {fmtRp(data.discount_amount)}</dd>
                                    </div>
                                )}
                                {Number(data.tax_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Pajak</dt>
                                        <dd className="font-medium text-slate-700">+ {fmtRp(data.tax_amount)}</dd>
                                    </div>
                                )}
                                {Number(data.shipping_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Ongkir</dt>
                                        <dd className="font-medium text-slate-700">+ {fmtRp(data.shipping_amount)}</dd>
                                    </div>
                                )}
                                <div className="border-t border-slate-100 pt-2.5">
                                    <div className="flex items-center justify-between">
                                        <dt className="font-semibold text-slate-700">Grand Total</dt>
                                        <dd className="text-lg font-bold text-indigo-600">{fmtRp(grandTotal)}</dd>
                                    </div>
                                </div>
                                {paidAmount > 0 && (
                                    <>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Dibayar</dt>
                                            <dd className="font-semibold text-emerald-600">{fmtRp(paidAmount)}</dd>
                                        </div>
                                        {remaining > 0 && (
                                            <div className="flex justify-between">
                                                <dt className="font-semibold text-slate-700">Sisa Bayar</dt>
                                                <dd className="font-bold text-amber-600">{fmtRp(remaining)}</dd>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="pt-1">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                                        paymentStatus === 'paid'    ? 'bg-emerald-100 text-emerald-700' :
                                        paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                                                                       'bg-slate-100 text-slate-500'
                                    }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${
                                            paymentStatus === 'paid' ? 'bg-emerald-500' : paymentStatus === 'partial' ? 'bg-amber-500' : 'bg-slate-400'
                                        }`} />
                                        {paymentStatus === 'paid'    && 'LUNAS'}
                                        {paymentStatus === 'partial' && 'SEBAGIAN'}
                                        {paymentStatus === 'unpaid'  && 'BELUM BAYAR'}
                                    </span>
                                </div>
                            </dl>
                        </SectionCard>

                        <div className="flex flex-col gap-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                            <Link
                                href={route('admin.purchases.show', purchase.id)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
