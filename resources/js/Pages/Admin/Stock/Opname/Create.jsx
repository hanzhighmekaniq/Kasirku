import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function Create({ products }) {
    const { flash } = usePage().props;
    const [selectedProduct, setSelectedProduct] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        opname_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
    });

    const addItem = () => {
        if (!selectedProduct) return;
        const product = products.find((p) => p.id === Number(selectedProduct));
        if (!product) return;
        if (data.items.some((i) => i.product_id === product.id)) return;

        const currentStock = product.stocks?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;

        setData('items', [...data.items, {
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            system_qty: currentStock,
            counted_qty: currentStock,
            unit_cost: Number(product.cost_price) || 0,
            notes: '',
        }]);
        setSelectedProduct('');
    };

    const removeItem = (idx) => {
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...data.items];
        updated[idx] = { ...updated[idx], [field]: field === 'notes' ? value : (Number(value) || 0) };
        setData('items', updated);
    };

    const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const totalDiff = useMemo(() =>
        data.items.reduce((sum, item) => sum + (item.counted_qty - item.system_qty), 0),
    [data.items]);

    const totalLoss = useMemo(() =>
        data.items.reduce((sum, item) => {
            const diff = item.counted_qty - item.system_qty;
            return sum + (diff < 0 ? Math.abs(diff) * item.unit_cost : 0);
        }, 0),
    [data.items]);

    const totalGain = useMemo(() =>
        data.items.reduce((sum, item) => {
            const diff = item.counted_qty - item.system_qty;
            return sum + (diff > 0 ? diff * item.unit_cost : 0);
        }, 0),
    [data.items]);

    const submit = (e) => {
        e.preventDefault();
        if (data.items.length === 0) return;
        post(route('admin.stock-opnames.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.stock-opnames.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Kembali">
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Buat Opname Stok</h2>
                </div>
            }
        >
            <Head title="Buat Opname Stok" />

            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{flash.error}</div>
            )}

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Main */}
                    <div className="space-y-5 lg:col-span-2">
                        <SectionCard title="Informasi Opname">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Tanggal" required error={errors.opname_date}>
                                    <input type="date" value={data.opname_date} onChange={(e) => setData('opname_date', e.target.value)} className={inputCls(!!errors.opname_date)} />
                                </Field>
                                <div />
                            </div>
                            <div className="mt-4">
                                <Field label="Catatan" error={errors.notes}>
                                    <input type="text" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Catatan opname..." className={inputCls(!!errors.notes)} />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionCard title="Item Opname" subtitle="Hitung fisik dan masukkan jumlah aktual">
                            <div className="space-y-4">
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="mb-1 block text-sm font-medium text-foreground">Produk</label>
                                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className={inputCls(false)}>
                                            <option value="">Pilih Produk</option>
                                            {products.filter((p) => !data.items.some((i) => i.product_id === p.id)).map((p) => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="button" onClick={addItem} disabled={!selectedProduct} className="rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50">
                                        + Tambah
                                    </button>
                                </div>

                                {errors.items && <p className="text-xs text-destructive">{typeof errors.items === 'string' ? errors.items : 'Minimal 1 item harus ditambahkan'}</p>}

                                {data.items.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                                        Belum ada item. Pilih produk di atas untuk menambahkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.items.map((item, idx) => {
                                            const diff = item.counted_qty - item.system_qty;
                                            return (
                                                <div key={idx} className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                                                            <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                                                        </div>
                                                        <button type="button" onClick={() => removeItem(idx)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                                                        </button>
                                                    </div>
                                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="mb-1 block text-xs text-muted-foreground">Stok Sistem</label>
                                                            <input type="number" value={item.system_qty} onChange={(e) => updateItem(idx, 'system_qty', e.target.value)} min="0" className="h-9 w-full rounded-lg border border-input bg-background px-2 text-center text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs text-muted-foreground">Hitung Fisik</label>
                                                            <input type="number" value={item.counted_qty} onChange={(e) => updateItem(idx, 'counted_qty', e.target.value)} min="0" className="h-9 w-full rounded-lg border border-input bg-background px-2 text-center text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs text-muted-foreground">Selisih</label>
                                                            <div className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold ${diff > 0 ? 'bg-success/10 text-success' : diff < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                                                {diff > 0 ? '+' : ''}{diff}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Modal: {fmtCurrency(item.unit_cost)}/unit</span>
                                                        {diff !== 0 && (
                                                            <span className={`font-medium ${diff < 0 ? 'text-destructive' : 'text-success'}`}>
                                                                {diff < 0 ? '-' : '+'}{fmtCurrency(Math.abs(diff) * item.unit_cost)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-muted-foreground">Item</dt><dd className="font-medium text-foreground">{data.items.length} produk</dd></div>
                                <div className="my-2 border-t border-border" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-foreground">Total Selisih</dt>
                                    <dd className={`text-lg font-bold ${totalDiff > 0 ? 'text-success' : totalDiff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        {totalDiff > 0 ? '+' : ''}{totalDiff}
                                    </dd>
                                </div>
                                {(totalLoss > 0 || totalGain > 0) && (
                                    <div className="my-2 border-t border-border" />
                                )}
                                {totalLoss > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-destructive">Nilai Kerugian</dt>
                                        <dd className="font-semibold text-destructive">{fmtCurrency(totalLoss)}</dd>
                                    </div>
                                )}
                                {totalGain > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-success">Nilai Penambahan</dt>
                                        <dd className="font-semibold text-success">{fmtCurrency(totalGain)}</dd>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {totalDiff > 0 ? 'Stok akan bertambah jika diselesaikan' : totalDiff < 0 ? 'Stok akan berkurang jika diselesaikan' : 'Tidak ada selisih'}
                                </p>
                            </dl>
                        </SectionCard>

                        <div className="flex flex-col gap-2">
                            <button type="submit" disabled={processing || data.items.length === 0} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-60">
                                {processing ? 'Menyimpan...' : 'Simpan Opname'}
                            </button>
                            <Link href={route('admin.stock-opnames.index')} className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-muted">
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
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-6 py-5">
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}

function inputCls(hasError) {
    return `block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 ${hasError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}`;
}
