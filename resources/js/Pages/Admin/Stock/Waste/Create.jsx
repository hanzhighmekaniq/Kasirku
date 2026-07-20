import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const WASTE_CATEGORIES = [
    { value: 'tumpahan', label: 'Tumpahan' },
    { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
    { value: 'rusak', label: 'Rusak' },
    { value: 'hilang', label: 'Hilang' },
    { value: 'lainnya', label: 'Lainnya' },
];

export default function Create({ products }) {
    const { flash } = usePage().props;
    const [selectedProduct, setSelectedProduct] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        waste_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
    });

    const addItem = () => {
        if (!selectedProduct) return;
        const product = products.find((p) => p.id === Number(selectedProduct));
        if (!product) return;
        if (data.items.some((i) => i.product_id === product.id)) return;

        setData('items', [...data.items, {
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            quantity: 1,
            unit_cost: Number(product.cost_price) || 0,
            waste_category: 'lainnya',
            notes: '',
        }]);
        setSelectedProduct('');
    };

    const removeItem = (idx) => {
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...data.items];
        updated[idx] = { ...updated[idx], [field]: value };
        setData('items', updated);
    };

    const totalCost = useMemo(() =>
        data.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost)), 0),
    [data.items]);

    const totalQty = useMemo(() =>
        data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [data.items]);

    const submit = (e) => {
        e.preventDefault();
        if (data.items.length === 0) return;
        post(route('admin.wastes.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.wastes.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Catat Waste</h2>
                </div>
            }
        >
            <Head title="Catat Waste" />

            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Main */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* Info */}
                        <SectionCard title="Informasi Waste">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Tanggal" required error={errors.waste_date}>
                                    <input type="date" value={data.waste_date} onChange={(e) => setData('waste_date', e.target.value)} className={inputCls(!!errors.waste_date)} />
                                </Field>
                            </div>
                            <div className="mt-4">
                                <Field label="Catatan" error={errors.notes}>
                                    <input type="text" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Catatan tambahan..." className={inputCls(!!errors.notes)} />
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Items */}
                        <SectionCard title="Item Waste" subtitle="Pilih produk dan masukkan jumlah yang terbuang">
                            <div className="space-y-4">
                                {/* Add item row */}
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Produk / Bahan Baku</label>
                                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className={inputCls(false)}>
                                            <option value="">Pilih Produk</option>
                                            {products.filter((p) => !data.items.some((i) => i.product_id === p.id)).map((p) => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="button" onClick={addItem} disabled={!selectedProduct} className="rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-600 transition hover:bg-primary-100 disabled:opacity-50">
                                        + Tambah
                                    </button>
                                </div>

                                {errors.items && <p className="text-xs text-red-500">{typeof errors.items === 'string' ? errors.items : 'Minimal 1 item harus ditambahkan'}</p>}

                                {data.items.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm text-slate-400">
                                        Belum ada item. Pilih produk di atas untuk menambahkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.items.map((item, idx) => (
                                            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{item.product_name}</p>
                                                        <p className="text-xs text-slate-400">{item.product_sku}</p>
                                                    </div>
                                                    <button type="button" onClick={() => removeItem(idx)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                                <div className="mt-3 grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs text-slate-500">Jumlah</label>
                                                        <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value) || 0)} min="1" className="h-9 w-full rounded-lg border border-slate-300 px-2 text-center text-xs focus:border-primary-500 focus:ring-2 focus:ring-primary-200" />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs text-slate-500">Kategori</label>
                                                        <select value={item.waste_category} onChange={(e) => updateItem(idx, 'waste_category', e.target.value)} className="h-9 w-full rounded-lg border border-slate-300 px-2 text-xs focus:border-primary-500 focus:ring-2 focus:ring-primary-200">
                                                            {WASTE_CATEGORIES.map((c) => (
                                                                <option key={c.value} value={c.value}>{c.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs text-slate-500">Catatan</label>
                                                        <input type="text" value={item.notes} onChange={(e) => updateItem(idx, 'notes', e.target.value)} placeholder="Opsional" className="h-9 w-full rounded-lg border border-slate-300 px-2 text-xs focus:border-primary-500 focus:ring-2 focus:ring-primary-200" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-slate-500">Item</dt><dd className="font-medium text-slate-700">{data.items.length} produk</dd></div>
                                <div className="flex justify-between"><dt className="text-slate-500">Total Qty</dt><dd className="font-medium text-slate-700">{totalQty} unit</dd></div>
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-slate-700">Estimasi Kerugian</dt>
                                    <dd className="text-lg font-bold text-red-600">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalCost)}
                                    </dd>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Stok akan dikurangi otomatis jika disetujui.
                                </p>
                            </dl>
                        </SectionCard>

                        <div className="flex flex-col gap-2">
                            <button type="submit" disabled={processing || data.items.length === 0} className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60">
                                {processing ? 'Menyimpan...' : 'Simpan Waste'}
                            </button>
                            <Link href={route('admin.wastes.index')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
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
            <label className="mb-1 block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function inputCls(hasError) {
    return `block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`;
}
