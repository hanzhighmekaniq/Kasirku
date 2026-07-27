import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { Check, Loader2, Trash2, X } from 'lucide-react';
import StockBucketPicker, { BucketItemLabel } from '@/Components/ui/StockBucketPicker';
import NumberInput from '@/Components/ui/NumberInput';
import { purchaseUnitHint, usesUnitConversion } from '@/Utils/unitConversion';

export default function Create({ buckets = [], currentBranchId = null }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        adjustment_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: '',
        items: [],
    });

    const usedKeys = useMemo(() => new Set(data.items.map((i) => i.key)), [data.items]);

    /**
     * Satu item = satu bucket (produk + variant + satuan) di cabang aktif,
     * bukan satu produk. Tanpa variant_id/packaging_unit_id, seluruh koreksi
     * akan mendarat di bucket dasar yang untuk produk bervariant tidak pernah
     * dipakai berjualan.
     */
    const addItem = (bucket) => {
        if (usedKeys.has(bucket.key)) return;

        const currentStock = bucket.stock_by_branch?.[String(currentBranchId)] ?? 0;

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
            system_qty: currentStock === 0 ? '' : currentStock,
            actual_qty: currentStock === 0 ? '' : currentStock,
            unit_cost: Number(bucket.cost_price) || 0,
            notes: '',
        }]);
    };

    const removeItem = (idx) => {
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...data.items];
        let finalValue = value;
        if (field !== 'notes') {
            finalValue = value === '' ? '' : (Number(value) >= 0 ? Number(value) : 0);
        }
        updated[idx] = { ...updated[idx], [field]: finalValue };
        setData('items', updated);
    };

    const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const totalDiff = useMemo(() =>
        data.items.reduce((sum, item) => sum + (item.actual_qty - item.system_qty), 0),
    [data.items]);

    const totalLoss = useMemo(() =>
        data.items.reduce((sum, item) => {
            const diff = item.actual_qty - item.system_qty;
            return sum + (diff < 0 ? Math.abs(diff) * item.unit_cost : 0);
        }, 0),
    [data.items]);

    const totalGain = useMemo(() =>
        data.items.reduce((sum, item) => {
            const diff = item.actual_qty - item.system_qty;
            return sum + (diff > 0 ? diff * item.unit_cost : 0);
        }, 0),
    [data.items]);

    const submit = (e) => {
        e.preventDefault();
        if (data.items.length === 0) return;
        post(route('admin.stock-adjustments.store'));
    };

    return (
        <AuthenticatedLayout
            backUrl={route('admin.stock-adjustments.index')}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Stok
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Buat Penyesuaian
                    </div>
                </div>
            }
        >
            <Head title="Buat Penyesuaian Stok" />
            <PageHeader
                title="Buat Penyesuaian Stok"
                breadcrumbs={["Admin", "Stok", "Penyesuaian Stok", "Buat"]}
                heading={
                    <>
                        Buat{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Penyesuaian Stok
                        </span>
                    </>
                }
                description="Cocokkan stok sistem dengan hasil hitung fisik."
                backUrl={route('admin.stock-adjustments.index')}
            />

            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{flash.error}</div>
            )}

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Main */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* Info */}
                        <SectionCard title="Informasi Penyesuaian">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Tanggal" required error={errors.adjustment_date}>
                                    <input type="date" required value={data.adjustment_date} onChange={(e) => setData('adjustment_date', e.target.value)} className={inputCls(!!errors.adjustment_date)} />
                                </Field>
                                <div />
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Alasan" hint="Opsional" error={errors.reason}>
                                    <input type="text" value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="Contoh: Kerusakan, Selisih audit..." className={inputCls(!!errors.reason)} />
                                </Field>
                                <Field label="Catatan" hint="Opsional" error={errors.notes}>
                                    <input type="text" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Catatan tambahan..." className={inputCls(!!errors.notes)} />
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Items */}
                        <SectionCard title="Item Penyesuaian" required subtitle="Masukkan stok sistem dan stok aktual. Minimal 1 item.">
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
                                        Stok disimpan terpisah per variant dan per satuan — pilih yang
                                        persis mau dikoreksi.
                                    </p>
                                </div>

                                {errors.items && <p className="text-xs text-destructive">{typeof errors.items === 'string' ? errors.items : 'Minimal 1 item harus ditambahkan'}</p>}

                                {data.items.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                                        Belum ada item. Pilih produk di atas untuk menambahkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.items.map((item, idx) => {
                                            const diff = item.actual_qty - item.system_qty;
                                            return (
                                                <div key={item.key} className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <BucketItemLabel item={item} />
                                                        <button type="button" onClick={() => removeItem(idx)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                                                        </button>
                                                    </div>
                                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="mb-1 block text-xs text-muted-foreground">
                                                                Stok Sistem <span className="text-destructive">*</span>
                                                            </label>
                                                            <NumberInput required placeholder="0" value={item.system_qty} onChange={(e) => updateItem(idx, 'system_qty', e.target.value)} min="0" className="h-9 px-2 text-center text-xs" />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs text-muted-foreground">
                                                                Stok Aktual <span className="text-destructive">*</span>
                                                            </label>
                                                            <NumberInput required placeholder="0" value={item.actual_qty} onChange={(e) => updateItem(idx, 'actual_qty', e.target.value)} min="0" className="h-9 px-2 text-center text-xs" />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs text-muted-foreground">Selisih</label>
                                                            <div className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold ${diff > 0 ? 'bg-success/10 text-success' : diff < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                                                {diff > 0 ? '+' : ''}{diff}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Bahan baku berkonversi: stok disimpan
                                                        per satuan pakai, jadi input di atas
                                                        juga dalam satuan itu. Tidak berlaku saat
                                                        bucket-nya satuan kemasan — di situ angka
                                                        dihitung dalam satuan kemasan itu sendiri. */}
                                                    {!item.packaging_unit_id && usesUnitConversion(item) && (
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            Semua angka dalam <strong>{item.base_unit}</strong>
                                                            {purchaseUnitHint(item, item.actual_qty) && (
                                                                <> · aktual {purchaseUnitHint(item, item.actual_qty)}</>
                                                            )}
                                                        </p>
                                                    )}
                                                    {item.packaging_unit_id && (
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            Semua angka dalam <strong>{item.unit_name}</strong>
                                                            {item.conversion_qty
                                                                ? ` (1 ${item.unit_name} = ${item.conversion_qty} ${item.unit || 'pcs'})`
                                                                : ''}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">
                                                            Modal: {fmtCurrency(item.unit_cost)}/{item.unit_name ?? item.base_unit ?? item.unit ?? 'unit'}
                                                        </span>
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
                                    {totalDiff > 0 ? 'Stok akan bertambah jika disetujui' : totalDiff < 0 ? 'Stok akan berkurang jika disetujui' : 'Tidak ada selisih'}
                                </p>
                            </dl>
                        </SectionCard>

                        {/* Aksi desktop — di mobile digantikan FAB di bawah */}
                        <div className="hidden flex-col gap-2 sm:flex">
                            <button type="submit" disabled={processing || data.items.length === 0} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-60">
                                {processing ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                            </button>
                            <Link href={route('admin.stock-adjustments.index')} className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-muted">
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>

                {/* FAB — mobile only */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:hidden">
                    <Link
                        href={route('admin.stock-adjustments.index')}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-lg ring-1 ring-border transition hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/30"
                        title="Batal"
                    >
                        <X className="h-5 w-5" strokeWidth={2} />
                    </Link>
                    <button
                        type="submit"
                        disabled={processing || data.items.length === 0}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition hover:bg-primary/90 disabled:opacity-60"
                        title="Simpan Penyesuaian"
                    >
                        {processing ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Check className="h-6 w-6" strokeWidth={2.5} />
                        )}
                    </button>
                </div>

                {/* Spacer supaya konten tidak tertutup FAB di mobile */}
                <div className="h-24 sm:hidden" />
            </form>
        </AuthenticatedLayout>
    );
}

/**
 * Kartu section.
 *
 * Sengaja TANPA `overflow-hidden`: dropdown pemilih produk di dalamnya
 * diposisikan `absolute`, dan `overflow-hidden` akan memotongnya di batas
 * kartu berapa pun z-index-nya — clipping terjadi sebelum z-index dievaluasi.
 * Sudut membulat header tetap rapi lewat `rounded-t-2xl` pada headernya
 * sendiri, jadi tidak ada yang dikorbankan.
 */
function SectionCard({ title, subtitle, required, children }) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="rounded-t-2xl border-b border-border bg-muted/50 px-6 py-5">
                <h3 className="text-base font-semibold text-foreground">
                    {title} {required && <span className="text-destructive">*</span>}
                </h3>
                {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, required, hint, error, children }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
                {label} {required && <span className="text-destructive">*</span>}
                {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}

// `border` (lebar) wajib ditulis — tanpa itu `border-input` hanya menyetel
// warna sementara lebarnya tetap 0, jadi border tidak pernah tampil. Padding
// juga tidak ada sebelumnya, sehingga teks input menempel ke tepi.
function inputCls(hasError) {
    return `block w-full rounded-xl border bg-background py-2.5 px-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 ${hasError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input focus:border-ring focus:ring-ring/20'}`;
}
