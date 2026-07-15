import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

/* ── Order type options per store type — konsisten dengan Sales/Index.jsx ── */
const ORDER_TYPE_OPTIONS = {
    retail: [
        { v: 'takeaway', l: 'Ambil' },
        { v: 'delivery', l: 'Antar' },
        { v: 'wholesale', l: 'Grosir' },
    ],
    fnb: [
        { v: 'dine_in', l: 'Dine-in' },
        { v: 'takeaway', l: 'Takeaway' },
        { v: 'delivery', l: 'Delivery' },
    ],
    service: [
        { v: 'walk_in', l: 'Walk-in' },
        { v: 'booking', l: 'Booking' },
        { v: 'pickup_delivery', l: 'Jemput & Antar' },
    ],
    rental: [
        { v: 'per_hour', l: 'Per Jam' },
        { v: 'per_day', l: 'Per Hari' },
        { v: 'per_week', l: 'Per Minggu' },
    ],
    ticket: [
        { v: 'online', l: 'Booking Online' },
        { v: 'walk_in', l: 'Walk-in' },
        { v: 'group', l: 'Group' },
    ],
    hospitality: [
        { v: 'check_in', l: 'Check-in' },
        { v: 'reservation', l: 'Reservasi' },
        { v: 'short_stay', l: 'Short Stay' },
    ],
    parking: [
        { v: 'entry', l: 'Masuk' },
        { v: 'exit', l: 'Keluar' },
        { v: 'lost_ticket', l: 'Tiket Hilang' },
    ],
    session: [
        { v: 'postpaid', l: 'Postpaid' },
        { v: 'prepaid', l: 'Prepaid' },
        { v: 'booking', l: 'Booking' },
    ],
};

export default function Create({ products, customers, paymentMethods, tables, storeType = 'retail' }) {
    const { flash } = usePage().props;
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedQty, setSelectedQty] = useState(1);
    const [selectedPrice, setSelectedPrice] = useState('');

    const orderTypeOptions = ORDER_TYPE_OPTIONS[storeType] ?? ORDER_TYPE_OPTIONS.retail;

    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        table_id: '',
        sale_date: new Date().toISOString().split('T')[0],
        order_type: orderTypeOptions[0]?.v ?? 'takeaway',
        discount_amount: '',
        tax_amount: '',
        shipping_amount: '',
        payment_method_id: '',
        paid_amount: '',
        notes: '',
        items: [],
    });

    // Computed totals
    const subtotal = useMemo(() =>
        data.items.reduce((sum, item) => {
            const itemDiscount = item.discount_amount || 0;
            return sum + (item.quantity * item.price) - itemDiscount;
        }, 0),
    [data.items]);

    const grandTotal = subtotal
        - Number(data.discount_amount || 0)
        + Number(data.tax_amount || 0)
        + Number(data.shipping_amount || 0);

    const changeAmount = Math.max(0, Number(data.paid_amount || 0) - grandTotal);

    // Get stock for a product
    const getProductStock = (product) => {
        if (!product.stocks || product.stocks.length === 0) return 0;
        return product.stocks.reduce((sum, s) => sum + (s.quantity || 0) - (s.reserved_quantity || 0), 0);
    };

    // Add item to list
    const addItem = () => {
        if (!selectedProduct || !selectedQty || !selectedPrice) return;
        const product = products.find((p) => p.id === Number(selectedProduct));
        if (!product) return;

        // Check if already in cart
        const existingIdx = data.items.findIndex((i) => i.product_id === product.id);
        if (existingIdx >= 0) {
            const updated = [...data.items];
            updated[existingIdx] = {
                ...updated[existingIdx],
                quantity: updated[existingIdx].quantity + Number(selectedQty),
            };
            setData('items', updated);
        } else {
            setData('items', [...data.items, {
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                quantity: Number(selectedQty),
                price: Number(selectedPrice),
                discount_amount: 0,
                stock: getProductStock(product),
            }]);
        }
        setSelectedProduct('');
        setSelectedQty(1);
        setSelectedPrice('');
    };

    const removeItem = (idx) => {
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const updateItemField = (idx, field, value) => {
        const updated = [...data.items];
        updated[idx] = { ...updated[idx], [field]: Number(value) || 0 };
        setData('items', updated);
    };

    const submit = (e) => {
        e.preventDefault();
        if (data.items.length === 0) return;
        post(route('admin.sales.store'));
    };

    const selectedProductObj = products.find((p) => p.id === Number(selectedProduct));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.sales.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Transaksi Penjualan</h2>
                </div>
            }
        >
            <Head title="Transaksi Penjualan" />

            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                    {/* ── Main columns ── */}
                    <div className="space-y-5 lg:col-span-2">

                        {/* Info Dasar */}
                        <SectionCard title="Informasi Penjualan">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Tipe Pesanan" required error={errors.order_type}>
                                    <select value={data.order_type} onChange={(e) => setData('order_type', e.target.value)} className={inputCls(!!errors.order_type)}>
                                        {orderTypeOptions.map((opt) => (
                                            <option key={opt.v} value={opt.v}>{opt.l}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Tanggal" required error={errors.sale_date}>
                                    <input type="date" value={data.sale_date} onChange={(e) => setData('sale_date', e.target.value)} className={inputCls(!!errors.sale_date)} />
                                </Field>
                                <Field label="Pelanggan" error={errors.customer_id}>
                                    <select value={data.customer_id} onChange={(e) => setData('customer_id', e.target.value)} className={inputCls(!!errors.customer_id)}>
                                        <option value="">Umum (Tanpa Pelanggan)</option>
                                        {customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                                    </select>
                                </Field>
                                {data.order_type === 'dine_in' && (
                                    <Field label="Meja" error={errors.table_id}>
                                        <select value={data.table_id} onChange={(e) => setData('table_id', e.target.value)} className={inputCls(!!errors.table_id)}>
                                            <option value="">Pilih Meja</option>
                                            {tables.map((t) => <option key={t.id} value={t.id}>Meja {t.table_number} ({t.capacity} orang)</option>)}
                                        </select>
                                    </Field>
                                )}
                            </div>
                        </SectionCard>

                        {/* Items */}
                        <SectionCard title="Item Penjualan" subtitle="Pilih produk yang dijual">
                            <div className="space-y-4">
                                {/* Add item row */}
                                <div className="grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-12 sm:col-span-5">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Produk</label>
                                        <select value={selectedProduct} onChange={(e) => {
                                            setSelectedProduct(e.target.value);
                                            const p = products.find((x) => x.id === Number(e.target.value));
                                            if (p) setSelectedPrice(p.sell_price || '');
                                        }} className={inputCls(false)}>
                                            <option value="">Pilih Produk</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id} disabled={p.track_stock && getProductStock(p) <= 0}>
                                                    {p.name} ({p.sku}) {p.track_stock ? `- Stok: ${getProductStock(p)}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Qty</label>
                                        <input type="number" value={selectedQty} onChange={(e) => setSelectedQty(e.target.value)} min="1" className={inputCls(false)} />
                                    </div>
                                    <div className="col-span-5 sm:col-span-3">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Harga Jual</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                            <input type="number" value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)} min="0" className={`${inputCls(false)} pl-9`} />
                                        </div>
                                    </div>
                                    <div className="col-span-3 sm:col-span-2">
                                        <button type="button" onClick={addItem} disabled={!selectedProduct} className="w-full rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50">
                                            + Tambah
                                        </button>
                                    </div>
                                </div>

                                {errors.items && <p className="text-xs text-red-500">{typeof errors.items === 'string' ? errors.items : 'Minimal 1 item harus ditambahkan'}</p>}

                                {/* Items list */}
                                {data.items.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm text-slate-400">
                                        Belum ada item. Pilih produk di atas untuk menambahkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-slate-800">{item.product_name}</p>
                                                    <p className="text-xs text-slate-400">{item.product_sku} {item.stock !== undefined && `• Stok: ${item.stock}`}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="number" value={item.quantity} onChange={(e) => updateItemField(idx, 'quantity', e.target.value)} min="1" className="h-8 w-16 rounded-lg border border-slate-300 px-2 text-center text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                                                    <span className="text-xs text-slate-400">×</span>
                                                    <input type="number" value={item.price} onChange={(e) => updateItemField(idx, 'price', e.target.value)} min="0" className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                                                    <span className="w-24 text-right text-xs font-medium text-slate-700">Rp {((item.quantity * item.price) - (item.discount_amount || 0)).toLocaleString('id-ID')}</span>
                                                </div>
                                                <button type="button" onClick={() => removeItem(idx)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        {/* Rincian Biaya */}
                        <SectionCard title="Rincian Biaya">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Field label="Diskon" error={errors.discount_amount}>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                        <input type="number" value={data.discount_amount} onChange={(e) => setData('discount_amount', e.target.value)} min="0" placeholder="0" className={`${inputCls(!!errors.discount_amount)} pl-9`} />
                                    </div>
                                </Field>
                                <Field label="Pajak" error={errors.tax_amount}>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                        <input type="number" value={data.tax_amount} onChange={(e) => setData('tax_amount', e.target.value)} min="0" placeholder="0" className={`${inputCls(!!errors.tax_amount)} pl-9`} />
                                    </div>
                                </Field>
                                <Field label="Ongkir" error={errors.shipping_amount}>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                        <input type="number" value={data.shipping_amount} onChange={(e) => setData('shipping_amount', e.target.value)} min="0" placeholder="0" className={`${inputCls(!!errors.shipping_amount)} pl-9`} />
                                    </div>
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Pembayaran */}
                        <SectionCard title="Pembayaran">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Metode Pembayaran" error={errors.payment_method_id}>
                                    <select value={data.payment_method_id} onChange={(e) => setData('payment_method_id', e.target.value)} className={inputCls(!!errors.payment_method_id)}>
                                        <option value="">Pilih Metode</option>
                                        {paymentMethods.map((pm) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Jumlah Dibayar" required error={errors.paid_amount}>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                        <input type="number" value={data.paid_amount} onChange={(e) => setData('paid_amount', e.target.value)} min="0" placeholder="0" className={`${inputCls(!!errors.paid_amount)} pl-9`} />
                                    </div>
                                </Field>
                            </div>
                            <div className="mt-4">
                                <Field label="Catatan" error={errors.notes}>
                                    <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} placeholder="Catatan opsional..." className={inputCls(!!errors.notes)} />
                                </Field>
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-5">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-slate-500">Item</dt><dd className="font-medium text-slate-700">{data.items.length} produk</dd></div>
                                <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium text-slate-700">Rp {subtotal.toLocaleString('id-ID')}</dd></div>
                                {Number(data.discount_amount || 0) > 0 && (
                                    <div className="flex justify-between"><dt className="text-slate-500">Diskon</dt><dd className="font-medium text-red-500">- Rp {Number(data.discount_amount).toLocaleString('id-ID')}</dd></div>
                                )}
                                {Number(data.tax_amount || 0) > 0 && (
                                    <div className="flex justify-between"><dt className="text-slate-500">Pajak</dt><dd className="font-medium text-slate-700">+ Rp {Number(data.tax_amount).toLocaleString('id-ID')}</dd></div>
                                )}
                                {Number(data.shipping_amount || 0) > 0 && (
                                    <div className="flex justify-between"><dt className="text-slate-500">Ongkir</dt><dd className="font-medium text-slate-700">+ Rp {Number(data.shipping_amount).toLocaleString('id-ID')}</dd></div>
                                )}
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-slate-700">Grand Total</dt>
                                    <dd className="text-lg font-bold text-indigo-600">Rp {grandTotal.toLocaleString('id-ID')}</dd>
                                </div>
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Dibayar</dt>
                                    <dd className="font-medium text-slate-700">Rp {Number(data.paid_amount || 0).toLocaleString('id-ID')}</dd>
                                </div>
                                {changeAmount > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="font-medium text-slate-600">Kembalian</dt>
                                        <dd className="font-semibold text-emerald-600">Rp {changeAmount.toLocaleString('id-ID')}</dd>
                                    </div>
                                )}
                            </dl>
                        </SectionCard>

                        <div className="flex flex-col gap-2">
                            <button type="submit" disabled={processing || data.items.length === 0} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60">
                                {processing ? 'Menyimpan...' : 'Simpan Penjualan'}
                            </button>
                            <Link href={route('admin.sales.index')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

/* ── Reusable components ── */
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
            <label className="mb-1 block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function inputCls(hasError) {
    return `block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`;
}
