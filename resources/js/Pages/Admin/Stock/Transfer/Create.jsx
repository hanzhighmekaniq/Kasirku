import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { AlertTriangle, Check, Loader2, Trash2, X } from 'lucide-react';
import Select from '@/Components/ui/Select';
import StockBucketPicker, { BucketItemLabel } from '@/Components/ui/StockBucketPicker';
import NumberInput from '@/Components/ui/NumberInput';
import { purchaseUnitHint, usesUnitConversion } from '@/Utils/unitConversion';
import DatePicker from "@/Components/ui/DatePicker";
import { format } from "date-fns";

export default function Create({ buckets = [], branches, currentBranchId = null }) {
    const { data, setData, post, processing, errors } = useForm({
        from_branch_id: currentBranchId ? String(currentBranchId) : '',
        to_branch_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
    });

    const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

    const usedKeys = useMemo(() => new Set(data.items.map((i) => i.key)), [data.items]);

    const stockAt = (bucket, branchId) =>
        branchId ? (bucket.stock_by_branch?.[String(branchId)] ?? 0) : 0;

    /**
     * Satu item = satu bucket (produk + variant + satuan) di cabang asal,
     * bukan satu produk. Transfer yang hanya mengirim product_id akan
     * memindahkan bucket dasar, yang untuk produk bervariant kosong.
     */
    const addItem = (bucket) => {
        if (usedKeys.has(bucket.key)) return;

        setData('items', [
            ...data.items,
            {
                key: bucket.key,
                product_id: bucket.product_id,
                variant_id: bucket.variant_id,
                packaging_unit_id: bucket.packaging_unit_id,
                product_name: bucket.product_name,
                product_sku: bucket.sku || '',
                variant_name: bucket.variant_name,
                unit_name: bucket.unit_name,
                conversion_qty: bucket.conversion_qty,
                // Disalin supaya baris item bisa menampilkan satuan tanpa
                // mencari ulang produknya di daftar.
                type: bucket.type,
                unit: bucket.unit,
                base_unit: bucket.base_unit,
                base_unit_conversion: bucket.base_unit_conversion,
                // stok per cabang disimpan utuh
                stock_by_branch: bucket.stock_by_branch,
                quantity: '',
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
        const updated = data.items.map((item, i) => {
            if (i !== idx) return item;
            let finalValue = value;
            if (field === 'quantity') {
                finalValue = value === '' ? '' : (Number(value) >= 0 ? Number(value) : 0);
            }
            return { ...item, [field]: finalValue };
        });
        setData('items', updated);
    };

    const totalQty = data.items.reduce((s, i) => s + Number(i.quantity || 0), 0);

    const sameBranch =
        !!data.from_branch_id &&
        String(data.from_branch_id) === String(data.to_branch_id);

    // Qty melebihi stok cabang asal akan ditolak backend saat diproses —
    // ditandai lebih awal supaya ketahuan sebelum disimpan.
    const overStockCount = data.items.filter(
        (i) =>
            data.from_branch_id &&
            Number(i.quantity || 0) > stockAt(i, data.from_branch_id),
    ).length;

    const canSubmit =
        !processing &&
        data.items.length > 0 &&
        !sameBranch &&
        !!data.from_branch_id &&
        !!data.to_branch_id;

    const submit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        post(route('admin.stock-transfers.store'));
    };

    return (
        <AuthenticatedLayout
            backUrl={route('admin.stock-transfers.index')}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Stok
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Buat Transfer
                    </div>
                </div>
            }
        >
            <Head title="Buat Transfer Stok" />
            <PageHeader
                title="Buat Transfer Stok"
                breadcrumbs={["Admin", "Stok", "Transfer Stok", "Buat"]}
                heading={
                    <>
                        Buat{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Transfer Stok
                        </span>
                    </>
                }
                description="Pindahkan stok dari satu cabang ke cabang lain."
                backUrl={route('admin.stock-transfers.index')}
            />

            {errors.items && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
                                        disabled={!!currentBranchId}
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
                                    <DatePicker
                                        value={data.transfer_date ? new Date(data.transfer_date) : null}
                                        onChange={(d) => setData('transfer_date', d ? format(d, 'yyyy-MM-dd') : '')}
                                        placeholder="Pilih tanggal transfer"
                                    />
                                </Field>
                                <Field label="Catatan" hint="Opsional" error={errors.notes}>
                                    <input
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Catatan tambahan..."
                                        className={inputCls(!!errors.notes)}
                                    />
                                </Field>
                            </div>

                            {/* Backend memvalidasi `different:from_branch_id` — dicegat di
                                sini supaya tidak perlu gagal dulu di server. */}
                            {sameBranch && (
                                <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-destructive">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>Cabang tujuan harus berbeda dari cabang asal.</span>
                                </p>
                            )}
                        </SectionCard>

                        {/* Items */}
                        <SectionCard title="Item Transfer" required subtitle="Pilih produk dan jumlah yang akan ditransfer. Minimal 1 item.">
                            <div className="space-y-4">
                                {/* Add item row */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">
                                        Produk / Variant / Satuan
                                    </label>
                                    <StockBucketPicker
                                        buckets={buckets}
                                        branchId={data.from_branch_id}
                                        excludeKeys={usedKeys}
                                        onSelect={addItem}
                                        disabled={!data.from_branch_id}
                                        placeholder={
                                            data.from_branch_id
                                                ? 'Pilih produk / variant / satuan'
                                                : 'Pilih cabang asal dulu'
                                        }
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {data.from_branch_id
                                            ? 'Stok disimpan terpisah per variant dan per satuan — pilih yang persis mau dipindahkan.'
                                            : 'Stok berbeda-beda tiap cabang, jadi cabang asal harus ditentukan lebih dulu.'}
                                    </p>
                                </div>

                                {data.items.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/50 py-8 text-center text-sm text-muted-foreground">
                                        Belum ada item. Pilih produk di atas untuk menambahkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.items.map((item, idx) => {
                                        const stokCabang = stockAt(item, data.from_branch_id);
                                        const isOver =
                                            !!data.from_branch_id &&
                                            Number(item.quantity || 0) > stokCabang;
                                        return (
                                            <div key={item.key} className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <BucketItemLabel item={item} />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                                                    </button>
                                                </div>
                                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1 block text-xs text-muted-foreground">
                                                            Jumlah Transfer <span className="text-destructive">*</span>
                                                            {/* Satuan kemasan dihitung per kemasan;
                                                                bahan baku berkonversi per satuan pakai. */}
                                                            {item.packaging_unit_id ? (
                                                                <span className="ml-1 font-normal">({item.unit_name})</span>
                                                            ) : usesUnitConversion(item) ? (
                                                                <span className="ml-1 font-normal">({item.base_unit})</span>
                                                            ) : null}
                                                            {data.from_branch_id && (
                                                                <span className="ml-1 font-normal text-muted-foreground">
                                                                    (Stok: {stokCabang})
                                                                </span>
                                                            )}
                                                        </label>
                                                        <NumberInput
                                                            required
                                                            placeholder="0"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                            min="1"
                                                            className={`h-9 px-3 text-sm transition ${
                                                                isOver
                                                                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                                                                    : 'focus:border-ring focus:ring-ring/20'
                                                            }`}
                                                        />
                                                        {isOver && (
                                                            <p className="mt-1 flex items-start gap-1.5 text-[11px] font-medium text-destructive">
                                                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                                                <span>Melebihi stok cabang asal ({stokCabang}).</span>
                                                            </p>
                                                        )}
                                                        {!item.packaging_unit_id && purchaseUnitHint(item, item.quantity) && (
                                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                                {purchaseUnitHint(item, item.quantity)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs text-muted-foreground">
                                                            Catatan Item{" "}
                                                            <span className="font-normal">(Opsional)</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={item.notes}
                                                            onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                                                            placeholder="Opsional..."
                                                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                                        />
                                                    </div>
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
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Item</dt>
                                    <dd className="font-medium text-foreground">{data.items.length} produk</dd>
                                </div>
                                <div className="my-2 border-t border-border" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-foreground">Total Qty</dt>
                                    <dd className="text-lg font-bold text-foreground">{totalQty}</dd>
                                </div>
                                {overStockCount > 0 && (
                                    <p className="flex items-start gap-1.5 pt-1 text-xs font-medium text-destructive">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>{overStockCount} item melebihi stok cabang asal.</span>
                                    </p>
                                )}
                            </dl>
                        </SectionCard>

                        {/* Aksi desktop — di mobile digantikan FAB di bawah */}
                        <div className="hidden flex-col gap-2 sm:flex">
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-60"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Transfer'}
                            </button>
                            <Link
                                href={route('admin.stock-transfers.index')}
                                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>

                {/* FAB — mobile only */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:hidden">
                    <Link
                        href={route('admin.stock-transfers.index')}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-lg ring-1 ring-border transition hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/30"
                        title="Batal"
                    >
                        <X className="h-5 w-5" strokeWidth={2} />
                    </Link>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition hover:bg-primary/90 disabled:opacity-60"
                        title="Simpan Transfer"
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
 * Sengaja TANPA `overflow-hidden`: pemilih produk dan `Select` cabang di
 * dalamnya diposisikan `absolute`, dan `overflow-hidden` akan memotongnya di
 * batas kartu berapa pun z-index-nya — clipping terjadi sebelum z-index
 * dievaluasi. Sudut membulat header tetap rapi lewat `rounded-t-2xl`.
 */
function SectionCard({ title, subtitle, required, children }) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="rounded-t-2xl border-b border-border bg-muted/50 px-6 py-4">
                <h3 className="text-sm font-semibold text-foreground">
                    {title} {required && <span className="text-destructive">*</span>}
                </h3>
                {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
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
