import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import StockBucketPicker, { BucketItemLabel } from '@/Components/ui/StockBucketPicker';
import { purchaseUnitHint, usesUnitConversion } from '@/Utils/unitConversion';

const WASTE_CATEGORIES = [
    { value: 'tumpahan', label: 'Tumpahan' },
    { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
    { value: 'rusak', label: 'Rusak' },
    { value: 'hilang', label: 'Hilang' },
    { value: 'lainnya', label: 'Lainnya' },
];

export default function Create({ buckets = [], currentBranchId = null }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        waste_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
    });

    const usedKeys = useMemo(() => new Set(data.items.map((i) => i.key)), [data.items]);

    /**
     * Satu item = satu bucket (produk + variant + satuan) di cabang aktif.
     * Pembuangan yang hanya mengirim product_id akan mengurangi bucket dasar,
     * yang untuk produk bervariant tidak pernah dipakai berjualan.
     */
    const addItem = (bucket) => {
        if (usedKeys.has(bucket.key)) return;

        setData('items', [...data.items, {
            key: bucket.key,
            product_id: bucket.product_id,
            variant_id: bucket.variant_id,
            packaging_unit_id: bucket.packaging_unit_id,
            product_name: bucket.product_name,
            product_sku: bucket.sku,
            variant_name: bucket.variant_name,
            unit_name: bucket.unit_name,
            conversion_qty: bucket.conversion_qty,
            // Disalin supaya baris item bisa menampilkan satuan tanpa
            // mencari ulang produknya di daftar.
            type: bucket.type,
            unit: bucket.unit,
            base_unit: bucket.base_unit,
            base_unit_conversion: bucket.base_unit_conversion,
            stock: bucket.stock_by_branch?.[String(currentBranchId)] ?? 0,
            quantity: 1,
            unit_cost: Number(bucket.cost_price) || 0,
            waste_category: 'lainnya',
            notes: '',
        }]);
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
                    <Link href={route('admin.wastes.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Catat Waste</h2>
                </div>
            }
        >
            <Head title="Catat Waste" />

            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{flash.error}</div>
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
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">
                                        Produk / Variant / Satuan
                                    </label>
                                    <StockBucketPicker
                                        buckets={buckets}
                                        branchId={currentBranchId}
                                        excludeKeys={usedKeys}
                                        onSelect={addItem}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Stok disimpan terpisah per variant dan per satuan — pilih
                                        yang persis terbuang.
                                    </p>
                                </div>

                                {errors.items && <p className="text-xs text-destructive">{typeof errors.items === 'string' ? errors.items : 'Minimal 1 item harus ditambahkan'}</p>}

                                {data.items.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/50 py-8 text-center text-sm text-muted-foreground">
                                        Belum ada item. Pilih produk di atas untuk menambahkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.items.map((item, idx) => (
                                            <div key={item.key} className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <BucketItemLabel item={item} />
                                                    <button type="button" onClick={() => removeItem(idx)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                                <div className="mt-3 grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs text-muted-foreground">
                                                            Jumlah <span className="text-destructive">*</span>
                                                            {/* Satuan kemasan dihitung per kemasan;
                                                                bahan baku berkonversi per satuan pakai. */}
                                                            {item.packaging_unit_id ? (
                                                                <span className="ml-1 font-normal">({item.unit_name})</span>
                                                            ) : usesUnitConversion(item) ? (
                                                                <span className="ml-1 font-normal">({item.base_unit})</span>
                                                            ) : null}
                                                            <span className="ml-1 font-normal">(Stok: {item.stock})</span>
                                                        </label>
                                                        <input type="number" required value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value) || 0)} min="1" className={`h-9 w-full rounded-lg border bg-background px-2 text-center text-xs text-foreground outline-none transition focus:ring-2 ${Number(item.quantity) > Number(item.stock) ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input focus:border-ring focus:ring-ring/20'}`} />
                                                        {Number(item.quantity) > Number(item.stock) && (
                                                            <p className="mt-1 text-[11px] font-medium text-destructive">
                                                                Melebihi stok ({item.stock}).
                                                            </p>
                                                        )}
                                                        {!item.packaging_unit_id && purchaseUnitHint(item, item.quantity) && (
                                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                                {purchaseUnitHint(item, item.quantity)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs text-muted-foreground">Kategori</label>
                                                        <select value={item.waste_category} onChange={(e) => updateItem(idx, 'waste_category', e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
                                                            {WASTE_CATEGORIES.map((c) => (
                                                                <option key={c.value} value={c.value}>{c.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs text-muted-foreground">Catatan</label>
                                                        <input type="text" value={item.notes} onChange={(e) => updateItem(idx, 'notes', e.target.value)} placeholder="Opsional" className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
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
                                <div className="flex justify-between"><dt className="text-muted-foreground">Item</dt><dd className="font-medium text-foreground">{data.items.length} produk</dd></div>
                                <div className="flex justify-between"><dt className="text-muted-foreground">Total Qty</dt><dd className="font-medium text-foreground">{totalQty} unit</dd></div>
                                <div className="my-2 border-t border-border" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-foreground">Estimasi Kerugian</dt>
                                    <dd className="text-lg font-bold text-destructive">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalCost)}
                                    </dd>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Stok akan dikurangi otomatis jika disetujui.
                                </p>
                            </dl>
                        </SectionCard>

                        <div className="flex flex-col gap-2">
                            <button type="submit" disabled={processing || data.items.length === 0} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-60">
                                {processing ? 'Menyimpan...' : 'Simpan Waste'}
                            </button>
                            <Link href={route('admin.wastes.index')} className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-muted">
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

/**
 * Kartu section.
 *
 * Sengaja TANPA `overflow-hidden`: dropdown pemilih bucket di dalamnya
 * diposisikan `absolute`, dan `overflow-hidden` akan memotongnya di batas
 * kartu berapa pun z-index-nya. Sudut membulat header dijaga `rounded-t-2xl`.
 */
function SectionCard({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="rounded-t-2xl border-b border-border bg-muted/50 px-6 py-5">
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
