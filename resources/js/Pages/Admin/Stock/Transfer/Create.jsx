import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { ArrowLeft, Boxes, ChevronDown, Plus, Search, Trash2 } from 'lucide-react';
import Select from '@/Components/ui/Select';

export default function Create({ products, branches }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        from_branch_id: '',
        to_branch_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
    });

    const [prodDropdownOpen, setProdDropdownOpen] = useState(false);
    const [prodSearch, setProdSearch] = useState('');
    const prodDropdownRef = useRef(null);
    const prodSearchRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (prodDropdownRef.current && !prodDropdownRef.current.contains(e.target)) {
                setProdDropdownOpen(false);
                setProdSearch('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (prodDropdownOpen && prodSearchRef.current) {
            prodSearchRef.current.focus();
        }
    }, [prodDropdownOpen]);

    const availableProducts = useMemo(
        () => products.filter((p) => !data.items.some((i) => i.product_id === p.id)),
        [products, data.items],
    );

    const filteredProds = useMemo(() => {
        if (!prodSearch) return availableProducts;
        const q = prodSearch.toLowerCase();
        return availableProducts.filter(
            (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q),
        );
    }, [availableProducts, prodSearch]);

    const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

    const getStock = (productId) => {
        if (!data.from_branch_id) return null;
        const product = products.find((p) => p.id === productId);
        if (!product?.stocks) return null;
        const stock = product.stocks.find(
            (s) => String(s.branch_id) === String(data.from_branch_id),
        );
        return stock ? stock.quantity : 0;
    };

    const addItem = (productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        const currentStock = getStock(productId);
        setData('items', [
            ...data.items,
            {
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku || '',
                quantity: 1,
                stock_at_branch: currentStock ?? 0,
                notes: '',
            },
        ]);
    };

    const removeItem = (idx) => {
        setData(
            'items',
            data.items.filter((_, i) => i !== idx),
        );
    };

    const updateItem = (idx, field, value) => {
        const updated = data.items.map((item, i) =>
            i === idx ? { ...item, [field]: value } : item,
        );
        setData('items', updated);
    };

    const totalQty = data.items.reduce((s, i) => s + Number(i.quantity || 0), 0);

    const submit = (e) => {
        e.preventDefault();
        if (data.items.length === 0) return;
        post(route('admin.stock-transfers.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.stock-transfers.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Buat Transfer Stok</h2>
                </div>
            }
        >
            <Head title="Buat Transfer Stok" />

            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            {errors.items && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {typeof errors.items === 'string' ? errors.items : 'Gagal menyimpan transfer.'}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Main */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* Info */}
                        <SectionCard title="Informasi Transfer">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Cabang Asal" required error={errors.from_branch_id}>
                                    <Select
                                        options={branchOptions}
                                        value={data.from_branch_id}
                                        onChange={(v) => setData('from_branch_id', String(v))}
                                        placeholder="Pilih cabang asal..."
                                    />
                                </Field>
                                <Field label="Cabang Tujuan" required error={errors.to_branch_id}>
                                    <Select
                                        options={branchOptions}
                                        value={data.to_branch_id}
                                        onChange={(v) => setData('to_branch_id', String(v))}
                                        placeholder="Pilih cabang tujuan..."
                                    />
                                </Field>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Tanggal Transfer" required error={errors.transfer_date}>
                                    <input
                                        type="date"
                                        value={data.transfer_date}
                                        onChange={(e) => setData('transfer_date', e.target.value)}
                                        className={inputCls(!!errors.transfer_date)}
                                    />
                                </Field>
                                <Field label="Catatan" error={errors.notes}>
                                    <input
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Catatan tambahan..."
                                        className={inputCls(!!errors.notes)}
                                    />
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Items */}
                        <SectionCard title="Item Transfer" subtitle="Pilih produk dan jumlah yang akan ditransfer">
                            <div className="space-y-4">
                                {/* Add item row */}
                                <div className="flex items-end gap-3">
                                    <div className="relative flex-1" ref={prodDropdownRef}>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Produk</label>
                                        <button
                                            type="button"
                                            onClick={() => { setProdDropdownOpen(!prodDropdownOpen); setProdSearch(''); }}
                                            className="flex w-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                                        >
                                            <Boxes className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
                                            <span className="flex-1 truncate text-left">{data.items.length > 0 ? 'Pilih produk lain...' : 'Pilih Produk'}</span>
                                            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${prodDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                                        </button>
                                        {prodDropdownOpen && (
                                            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
                                                <div className="border-b border-slate-100 p-3">
                                                    <div className="relative">
                                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                                                        <input
                                                            ref={prodSearchRef}
                                                            type="text"
                                                            value={prodSearch}
                                                            onChange={(e) => setProdSearch(e.target.value)}
                                                            placeholder="Cari nama atau SKU..."
                                                            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-72 overflow-y-auto p-1.5">
                                                    {filteredProds.length === 0 ? (
                                                        <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada produk ditemukan.</p>
                                                    ) : (
                                                        filteredProds.map((p) => {
                                                            const stock = getStock(p.id);
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => { addItem(p.id); setProdDropdownOpen(false); setProdSearch(''); }}
                                                                    className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                                                                >
                                                                    <span className="block truncate font-medium text-slate-700">{p.name}</span>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-slate-400">{p.sku}</span>
                                                                        {data.from_branch_id && (
                                                                            <span className="text-xs text-slate-400">
                                                                                Stok: {stock ?? 0}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

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
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                                                    </button>
                                                </div>
                                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1 block text-xs text-slate-500">
                                                            Jumlah Transfer
                                                            {data.from_branch_id && (
                                                                <span className="ml-1 font-normal text-slate-400">
                                                                    (Stok: {item.stock_at_branch})
                                                                </span>
                                                            )}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                            min="1"
                                                            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs text-slate-500">Catatan Item</label>
                                                        <input
                                                            type="text"
                                                            value={item.notes}
                                                            onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                                                            placeholder="Opsional..."
                                                            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                        />
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
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Item</dt>
                                    <dd className="font-medium text-slate-700">{data.items.length} produk</dd>
                                </div>
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-slate-700">Total Qty</dt>
                                    <dd className="text-lg font-bold text-slate-800">{totalQty}</dd>
                                </div>
                            </dl>
                        </SectionCard>

                        <div className="flex flex-col gap-2">
                            <button
                                type="submit"
                                disabled={processing || data.items.length === 0}
                                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Transfer'}
                            </button>
                            <Link
                                href={route('admin.stock-transfers.index')}
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

function SectionCard({ title, subtitle, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
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
