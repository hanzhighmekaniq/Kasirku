import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Check, Loader2, Lock, Package, ShoppingCart, X } from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/Components/ui/Button';
import CurrencyInput from '@/Components/ui/CurrencyInput';
import Field from '@/Components/ui/Field';
import Select from '@/Components/ui/Select';
import DatePicker from '@/Components/ui/DatePicker';
import TimePicker from '@/Components/ui/TimePicker';
import StockBucketPicker from '@/Components/ui/StockBucketPicker';

const TYPES = [
    { value: 'percentage', label: 'Persen (%)', hint: 'Diskon dalam persentase' },
    { value: 'fixed_amount', label: 'Nominal (Rp)', hint: 'Diskon dalam nominal tetap' },
    { value: 'buy_x_get_y', label: 'Beli X Gratis Y', hint: 'Buy X Get Y Free' },
    { value: 'bundle', label: 'Bundle / Paket', hint: 'Paket harga spesial' },
    { value: 'tiered', label: 'Harga Tiered', hint: 'Harga spesial jika beli >= jumlah tertentu' },
    { value: 'member_price', label: 'Harga Member', hint: 'Harga khusus untuk tier pelanggan tertentu' },
    { value: 'bogo', label: 'Beli X Gratis Produk', hint: 'Beli X gratis 1 produk tertentu' },
];

const SCOPES = [
    { value: 'item', label: 'Per Item', desc: 'Berlaku untuk item spesifik', icon: Package },
    { value: 'cart', label: 'Keranjang', desc: 'Berlaku untuk total belanja', icon: ShoppingCart },
];

/**
 * Cakupan yang didukung tiap tipe promo. Dipakai sebagai fallback kalau server
 * belum mengirim scopeSupport, dan harus sama dengan Promotion::SCOPE_SUPPORT.
 */
const DEFAULT_SCOPE_SUPPORT = {
    percentage: ['item', 'cart'],
    fixed_amount: ['item', 'cart'],
    buy_x_get_y: ['item'],
    bundle: ['item'],
    tiered: ['item'],
    member_price: ['item'],
    bogo: ['item'],
};

const DAYS = [
    { value: 'mon', label: 'Sen' },
    { value: 'tue', label: 'Sel' },
    { value: 'wed', label: 'Rab' },
    { value: 'thu', label: 'Kam' },
    { value: 'fri', label: 'Jum' },
    { value: 'sat', label: 'Sab' },
    { value: 'sun', label: 'Min' },
];

/** Kunci gabungan bucket, formatnya harus sama dengan yang dibuat backend. */
const bucketKey = (item) =>
    `${item.product_id}-${item.variant_id ?? ''}-${item.packaging_unit_id ?? ''}`;

/** "HH:mm" → Date (tanggalnya tidak dipakai, hanya jam & menit). */
function hourToDate(value) {
    if (!value) return null;
    const [h, m] = String(value).split(':');
    const d = new Date();
    d.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
    return d;
}

/** Date → "HH:mm" untuk kolom start_hour / end_hour di backend. */
function dateToHour(date) {
    return date ? format(date, 'HH:mm') : '';
}

export default function PromotionForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = 'Simpan',
    cancelHref,
    buckets = [],
    scopeSupport = {},
    customerTiers = [],
    promotion = null,
    formId = 'promotion-form',
}) {
    const supportMap = Object.keys(scopeSupport).length ? scopeSupport : DEFAULT_SCOPE_SUPPORT;
    const allowedScopes = supportMap[data.type] ?? ['item', 'cart'];
    const scopeIsAllowed = (scope) => allowedScopes.includes(scope);

    /**
     * Ganti tipe promo bisa membuat cakupan yang sedang dipilih jadi tidak
     * valid (mis. dari Persen/Keranjang ke Bundle yang hanya per item).
     * Cakupan digeser otomatis ke opsi pertama yang didukung supaya form tidak
     * pernah mengirim kombinasi yang ditolak server.
     */
    useEffect(() => {
        if (!scopeIsAllowed(data.scope)) {
            setData('scope', allowedScopes[0] ?? 'item');
        }
    }, [data.type]);

    const selectedItems = data.items || [];
    const selectedKeys = useMemo(
        () => selectedItems.map((item) => item.key ?? bucketKey(item)),
        [selectedItems],
    );

    // Bucket dicari ulang dari daftar opsi supaya label/harga selalu mengikuti
    // data produk terbaru, bukan snapshot saat promo dulu disimpan.
    const bucketByKey = useMemo(() => {
        const map = new Map();
        buckets.forEach((b) => map.set(b.key, b));
        return map;
    }, [buckets]);

    const addBucket = (bucket) => {
        if (selectedKeys.includes(bucket.key)) return;
        setData('items', [
            ...selectedItems,
            {
                key: bucket.key,
                product_id: bucket.product_id,
                variant_id: bucket.variant_id,
                packaging_unit_id: bucket.packaging_unit_id,
            },
        ]);
    };

    const removeBucket = (key) => {
        setData(
            'items',
            selectedItems.filter((item) => (item.key ?? bucketKey(item)) !== key),
        );
    };

    const toggleDay = (day) => {
        const current = data.applicable_days || [];
        setData(
            'applicable_days',
            current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
        );
    };

    /** Bucket produk gratis untuk BOGO, disimpan sebagai dua field terpisah. */
    const freeBucketKey = data.free_product_id
        ? `${data.free_product_id}-${data.free_variant_id || ''}-`
        : null;
    const freeBucket = freeBucketKey ? bucketByKey.get(freeBucketKey) : null;

    /**
     * Kelas input teks/number. Radius & fokus ring-nya disamakan dengan
     * komponen ui bersama (Select, CurrencyInput, DatePicker) supaya satu form
     * tidak mencampur dua gaya kontrol.
     */
    const inputCls = (field) =>
        `block w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
            errors[field]
                ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                : 'border-input focus:border-ring focus:ring-ring/20'
        }`;

    const showTierPrice = data.type === 'tiered' || data.type === 'member_price';
    const showMinQuantity = data.type === 'tiered';
    const showCustomerTier = data.type === 'member_price';
    const showFreeProduct = data.type === 'bogo';
    const showBuyQty = data.type === 'buy_x_get_y' || data.type === 'bogo';
    const showFreeQuantity = data.type === 'bogo' || data.type === 'buy_x_get_y';
    const showMaxDiscount = data.type === 'percentage';
    const showBundlePrice = data.type === 'bundle';
    const showProductPickerSection = data.scope === 'item';

    const typeHint = TYPES.find((t) => t.value === data.type)?.hint;

    const valueLabel = showBuyQty
        ? 'Beli Sebanyak'
        : showBundlePrice
          ? 'Harga per Item'
          : showTierPrice
            ? 'Harga Spesial'
            : 'Nilai Diskon';

    return (
        <>
            <form id={formId} onSubmit={onSubmit} className="space-y-5">
                <Field label="Nama Promo" required error={errors.name}>
                    <input
                        type="text"
                        value={data.name}
                        autoFocus
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="cth. Diskon 10% Minuman, Happy Hour"
                        className={inputCls('name')}
                    />
                </Field>

                {/* Tipe promo dipilih lebih dulu karena tipe-lah yang menentukan
                    cakupan mana yang tersedia. */}
                <Field label="Tipe Promo" required error={errors.type}>
                    <Select
                        options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
                        value={data.type}
                        onChange={(v) => setData('type', v)}
                        placeholder="Pilih tipe promo..."
                    />
                    {typeHint && (
                        <p className="mt-1.5 text-xs text-muted-foreground">{typeHint}</p>
                    )}
                </Field>

                {/* Cakupan — kartu, bukan dropdown, karena hanya 2 opsi dan
                    masing-masing butuh penjelasan singkat. Opsi yang tidak
                    didukung tipe terpilih tetap ditampilkan tapi dinonaktifkan,
                    supaya user tahu opsi itu ada dan mengerti alasannya. */}
                <Field label="Cakupan Promo" required error={errors.scope}>
                    <p className="mb-2 text-xs text-muted-foreground">
                        Per Item berlaku per baris item, Keranjang berlaku untuk total belanja.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {SCOPES.map((s) => {
                            const allowed = scopeIsAllowed(s.value);
                            const active = allowed && data.scope === s.value;
                            const Icon = s.icon;

                            return (
                                <button
                                    key={s.value}
                                    type="button"
                                    disabled={!allowed}
                                    onClick={() => allowed && setData('scope', s.value)}
                                    aria-pressed={active}
                                    title={
                                        allowed
                                            ? undefined
                                            : 'Tidak tersedia untuk tipe promo yang dipilih'
                                    }
                                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                        !allowed
                                            ? 'cursor-not-allowed border-dashed border-border bg-muted/40 opacity-60'
                                            : active
                                              ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                                              : 'border-border bg-card hover:border-primary/40'
                                    }`}
                                >
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                            active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {allowed ? (
                                            <Icon className="h-4 w-4" strokeWidth={1.8} />
                                        ) : (
                                            <Lock className="h-4 w-4" strokeWidth={1.8} />
                                        )}
                                    </span>
                                    <span className="min-w-0">
                                        <span
                                            className={`block text-sm font-semibold ${
                                                active
                                                    ? 'text-primary'
                                                    : allowed
                                                      ? 'text-foreground'
                                                      : 'text-muted-foreground'
                                            }`}
                                        >
                                            {s.label}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {allowed
                                                ? s.desc
                                                : 'Tidak tersedia untuk tipe ini'}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {/* Nilai diskon */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                        label={valueLabel}
                        required
                        error={showTierPrice ? errors.tier_price : errors.discount_value}
                    >
                        {data.type === 'percentage' ? (
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={data.discount_value}
                                    onChange={(e) => setData('discount_value', e.target.value)}
                                    placeholder="10"
                                    className={`${inputCls('discount_value')} pr-10`}
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted-foreground">
                                    %
                                </span>
                            </div>
                        ) : showTierPrice ? (
                            <CurrencyInput
                                value={data.tier_price}
                                onChange={(v) => setData('tier_price', v)}
                                placeholder="0"
                                error={!!errors.tier_price}
                            />
                        ) : showBuyQty ? (
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={data.discount_value}
                                    onChange={(e) => setData('discount_value', e.target.value)}
                                    placeholder="3"
                                    className={`${inputCls('discount_value')} pl-9`}
                                />
                                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted-foreground">
                                    x
                                </span>
                            </div>
                        ) : (
                            <CurrencyInput
                                value={data.discount_value}
                                onChange={(v) => setData('discount_value', v)}
                                placeholder="0"
                                error={!!errors.discount_value}
                            />
                        )}
                    </Field>
                </div>

                {/* Syarat berlaku — field yang muncul tergantung tipe promo */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Min. Pembelian" error={errors.min_purchase_amount}>
                        <CurrencyInput
                            value={data.min_purchase_amount}
                            onChange={(v) => setData('min_purchase_amount', v)}
                            placeholder="0"
                            error={!!errors.min_purchase_amount}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {data.scope === 'cart'
                                ? 'Minimum total belanja'
                                : 'Minimum belanja per item'}
                        </p>
                    </Field>

                    {showMaxDiscount && (
                        <Field label="Maks. Diskon" error={errors.max_discount_amount}>
                            <CurrencyInput
                                value={data.max_discount_amount}
                                onChange={(v) => setData('max_discount_amount', v)}
                                placeholder="0"
                                error={!!errors.max_discount_amount}
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Batas maksimal diskon
                            </p>
                        </Field>
                    )}

                    {showMinQuantity && (
                        <Field label="Min. Qty" required error={errors.min_quantity}>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={data.min_quantity}
                                onChange={(e) => setData('min_quantity', e.target.value)}
                                placeholder="cth. 3"
                                className={inputCls('min_quantity')}
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Jumlah minimum agar harga tier berlaku
                            </p>
                        </Field>
                    )}

                    {showCustomerTier && (
                        <Field label="Tier Pelanggan" required error={errors.customer_tier_id}>
                            <Select
                                options={customerTiers.map((t) => ({
                                    value: t.id,
                                    label: `Lvl ${t.rank} — ${t.name}`,
                                }))}
                                value={data.customer_tier_id}
                                onChange={(v) => setData('customer_tier_id', v)}
                                placeholder="Pilih tier..."
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Hanya berlaku untuk pelanggan tier ini
                            </p>
                        </Field>
                    )}

                    {showFreeQuantity && (
                        <Field label="Jumlah Gratis" error={errors.free_quantity}>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={data.free_quantity ?? ''}
                                onChange={(e) => setData('free_quantity', e.target.value)}
                                placeholder="1"
                                className={inputCls('free_quantity')}
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Berapa item gratis per kelipatan pembelian. Kosong = 1.
                            </p>
                        </Field>
                    )}
                </div>

                {/* Produk gratis BOGO — memakai picker yang sama dengan target
                    promo supaya varian & satuan bisa ditentukan dengan tepat. */}
                {showFreeProduct && (
                    <Field label="Produk Gratis" required error={errors.free_product_id}>
                        <p className="mb-2 text-xs text-muted-foreground">
                            Produk yang diberikan gratis. Bisa produk atau varian yang berbeda
                            dari yang dibeli.
                        </p>

                        {freeBucket ? (
                            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {freeBucket.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Rp {Number(freeBucket.sell_price).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData('free_product_id', '');
                                        setData('free_variant_id', '');
                                    }}
                                    aria-label="Hapus produk gratis"
                                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <X className="h-4 w-4" strokeWidth={2} />
                                </button>
                            </div>
                        ) : (
                            <StockBucketPicker
                                buckets={buckets}
                                onSelect={(bucket) => {
                                    setData('free_product_id', bucket.product_id);
                                    setData('free_variant_id', bucket.variant_id ?? '');
                                }}
                                allowParentSelection
                                parentOptionLabel="Produk tanpa varian tertentu"
                                placeholder="Pilih produk gratis..."
                            />
                        )}
                    </Field>
                )}

                {/* Periode */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Tanggal Mulai" error={errors.start_date}>
                        <DatePicker
                            value={data.start_date ? new Date(data.start_date) : null}
                            onChange={(d) => setData('start_date', d ? format(d, 'yyyy-MM-dd') : '')}
                            placeholder="Pilih tanggal mulai"
                        />
                    </Field>
                    <Field label="Tanggal Berakhir" error={errors.end_date}>
                        <DatePicker
                            value={data.end_date ? new Date(data.end_date) : null}
                            onChange={(d) => setData('end_date', d ? format(d, 'yyyy-MM-dd') : '')}
                            placeholder="Pilih tanggal berakhir"
                        />
                    </Field>
                </div>

                {/* Jam berlaku — pakai TimePicker yang sama dengan halaman lain,
                    bukan input[type=time] bawaan browser yang tampilannya beda
                    per-OS dan tidak ikut tema. */}
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-sm font-medium text-foreground">
                        Jam Berlaku{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                            (opsional — untuk flash sale)
                        </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Kosongkan jika promo berlaku sepanjang hari.
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Jam Mulai" error={errors.start_hour}>
                            <TimePicker
                                value={hourToDate(data.start_hour)}
                                onChange={(d) => setData('start_hour', dateToHour(d))}
                                placeholder="Pilih jam mulai"
                            />
                        </Field>
                        <Field label="Jam Selesai" error={errors.end_hour}>
                            <TimePicker
                                value={hourToDate(data.end_hour)}
                                onChange={(d) => setData('end_hour', dateToHour(d))}
                                placeholder="Pilih jam selesai"
                            />
                        </Field>
                    </div>

                    {/* Hari berlaku — pill toggle, bukan checkbox list, supaya
                        satu baris cukup dan pola mingguannya mudah dibaca. */}
                    <div className="mt-4 border-t border-border pt-4">
                        <p className="text-sm font-medium text-foreground">
                            Hari Berlaku{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                                (opsional)
                            </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {(data.applicable_days || []).length === 0
                                ? 'Semua hari — pilih hari tertentu untuk membatasi.'
                                : `Hanya berlaku ${(data.applicable_days || []).length} hari dalam seminggu.`}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {DAYS.map((d) => {
                                const active = (data.applicable_days || []).includes(d.value);

                                return (
                                    <button
                                        key={d.value}
                                        type="button"
                                        onClick={() => toggleDay(d.value)}
                                        aria-pressed={active}
                                        className={`min-w-[52px] rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                            active
                                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.applicable_days && (
                            <p className="mt-1.5 text-xs text-destructive">
                                {errors.applicable_days}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status & limit */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={!!data.is_active}
                            onClick={() => setData('is_active', !data.is_active)}
                            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                data.is_active ? 'bg-primary' : 'bg-muted'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                                    data.is_active ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Aktif</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Promo hanya tampil di kasir jika aktif.
                            </p>
                        </div>
                    </div>

                    <Field label="Limit Pemakaian" error={errors.max_usage}>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={data.max_usage ?? ''}
                            onChange={(e) => setData('max_usage', e.target.value)}
                            placeholder="0 = tanpa batas"
                            className={inputCls('max_usage')}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {Number(data.max_usage) > 0
                                ? `Promo berhenti setelah ${data.max_usage}x transaksi${promotion ? ` (sudah ${promotion.used_count ?? 0}x dipakai)` : ''}`
                                : 'Kosongkan atau 0 untuk tanpa batas'}
                        </p>
                    </Field>
                </div>

                {/* Target promo — hanya untuk cakupan per item. Memakai picker
                    bertingkat (produk → varian → satuan) yang sama dengan form
                    stok, supaya promo bisa dikunci ke varian atau satuan
                    tertentu, bukan hanya ke produk induk. */}
                {showProductPickerSection && (
                    <Field label="Produk Target" error={errors.items}>
                        <p className="mb-2 text-xs text-muted-foreground">
                            Pilih produk, varian, atau satuan spesifik. Kosongkan supaya promo
                            berlaku untuk semua produk.
                        </p>

                        {selectedItems.length > 0 && (
                            <div className="mb-3 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {selectedItems.length} target dipilih
                                </p>
                                {selectedItems.map((item) => {
                                    const key = item.key ?? bucketKey(item);
                                    const bucket = bucketByKey.get(key);

                                    return (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {bucket?.label ?? 'Produk tidak ditemukan'}
                                                </p>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                                    {bucket ? (
                                                        <>
                                                            <span>
                                                                Rp{' '}
                                                                {Number(
                                                                    bucket.sell_price,
                                                                ).toLocaleString('id-ID')}
                                                            </span>
                                                            {bucket.covers_all_variants && (
                                                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                                    Semua varian
                                                                </span>
                                                            )}
                                                            {bucket.unit_name && (
                                                                <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                                                                    {bucket.unit_name}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-destructive">
                                                            Produk mungkin sudah dihapus atau
                                                            dinonaktifkan
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeBucket(key)}
                                                aria-label="Hapus target promo"
                                                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <X className="h-4 w-4" strokeWidth={2} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <StockBucketPicker
                            buckets={buckets}
                            excludeKeys={selectedKeys}
                            onSelect={addBucket}
                            allowParentSelection
                            parentOptionLabel="Semua varian produk ini"
                            placeholder={
                                selectedItems.length > 0
                                    ? 'Tambah target lain...'
                                    : 'Pilih produk / varian / satuan'
                            }
                        />
                    </Field>
                )}

                {/* Aksi — desktop */}
                <div className="hidden justify-end gap-3 border-t border-border pt-4 sm:flex">
                    <Link
                        href={cancelHref}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                        Batal
                    </Link>
                    <Button type="submit" loading={processing}>
                        {submitLabel}
                    </Button>
                </div>
            </form>

            {/* Aksi — mobile: FAB, bukan tombol di header. Sama seperti form
                Pelanggan supaya tombol simpan selalu terjangkau jempol. */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:hidden">
                <Link
                    href={cancelHref}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-lg ring-1 ring-border transition hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/30"
                    title="Batal"
                >
                    <X className="h-5 w-5" strokeWidth={2} />
                </Link>
                <button
                    type="submit"
                    form={formId}
                    disabled={processing}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition hover:bg-primary/90 disabled:opacity-60"
                    title={submitLabel}
                >
                    {processing ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <Check className="h-6 w-6" strokeWidth={2.5} />
                    )}
                </button>
            </div>

            {/* Spacer supaya konten terakhir tidak tertutup FAB di mobile */}
            <div className="h-24 sm:hidden" />
        </>
    );
}
