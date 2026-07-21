import { useState } from 'react';
import { X } from 'lucide-react';
import Button from "@/Components/ui/Button";

import CurrencyInput from '@/Components/ui/CurrencyInput';
import Field from '@/Components/ui/Field';
import Select from '@/Components/ui/Select';

const TYPES = [
    { value: 'percentage', label: 'Persen (%)', hint: 'Diskon dalam persentase' },
    { value: 'fixed_amount', label: 'Nominal (Rp)', hint: 'Diskon dalam nominal tetap' },
    { value: 'buy_x_get_y', label: 'Beli X Gratis Y', hint: 'Buy X Get Y Free' },
    { value: 'bundle', label: 'Bundle / Paket', hint: 'Paket harga spesial' },
    { value: 'tiered', label: 'Harga Tiered', hint: 'Harga spesial jika beli >= jumlah tertentu' },
    { value: 'member_price', label: 'Harga Member', hint: 'Harga khusus untuk tier pelanggan tertentu' },
    { value: 'bogo', label: 'Beli X Gratis Produk', hint: 'Beli X gratis 1 produk tertentu' },
];

const TIERS = [
    { value: '', label: '-- Pilih Tier --' },
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
    { value: 'platinum', label: 'Platinum' },
];

const SCOPES = [
    { value: 'item', label: 'Per Item', desc: 'Berlaku untuk item spesifik' },
    { value: 'cart', label: 'Keranjang', desc: 'Berlaku untuk total belanja' },
];

export default function PromotionForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = 'Simpan',
    cancelHref,
    products = [],
    promotion = null,
}) {
    const [productSearch, setProductSearch] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);

    const selectedIds = data.product_ids || [];
    const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

    const filteredProducts = products.filter((p) => {
        if (selectedIds.includes(p.id)) return false;
        const q = productSearch.trim().toLowerCase();
        if (!q) return true;
        return p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    });

    const addProduct = (id) => {
        setData('product_ids', [...selectedIds, id]);
        setProductSearch('');
    };

    const removeProduct = (id) => {
        setData('product_ids', selectedIds.filter((i) => i !== id));
    };

    const inputCls = (field) =>
        `block w-full rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition focus:ring-2 ${
            errors[field]
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-border focus:border-ring focus:ring-ring/20'
        }`;

    const showTierPrice = data.type === 'tiered' || data.type === 'member_price';
    const showMinQuantity = data.type === 'tiered';
    const showCustomerTier = data.type === 'member_price';
    const showFreeProduct = data.type === 'bogo';
    const showBuyQty = data.type === 'buy_x_get_y' || data.type === 'bogo';
    const showMaxDiscount = data.type === 'percentage';
    const showBundlePrice = data.type === 'bundle';
    const showProductPickerSection = data.scope === 'item';

    const typeHint = TYPES.find((t) => t.value === data.type)?.hint;

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Nama Promo */}
            <Field label="Nama Promo" required error={errors.name}>
                <input
                    type="text"
                    value={data.name}
                    autoFocus
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="cth. Diskon 10% Minuman, Happy Hour"
                    className={`mt-1.5 ${inputCls('name')}`}
                />
            </Field>

            {/* Scope */}
            <div>
                <label className="block text-sm font-medium text-foreground">
                    Cakupan Promo <span className="text-destructive">*</span>
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Per Item = berlaku per item | Keranjang = berlaku untuk total belanja
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                    {SCOPES.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setData('scope', s.value)}
                            className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                                data.scope === s.value
                                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                                    : 'border-border bg-card hover:border-border'
                            }`}
                        >
                            <p className={`text-sm font-semibold ${data.scope === s.value ? 'text-primary-700' : 'text-foreground'}`}>
                                {s.label}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                        </button>
                    ))}
                </div>
                {errors.scope && <p className="mt-1.5 text-sm text-destructive">{errors.scope}</p>}
            </div>

            {/* Tipe & Nilai */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tipe Promo" required error={errors.type}>
                    <div className="mt-1.5">
                        <Select
                            options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
                            value={data.type}
                            onChange={(v) => setData('type', v)}
                            placeholder="Pilih tipe promo..."
                        />
                    </div>
                    {typeHint && <p className="mt-1 text-xs text-muted-foreground">{typeHint}</p>}
                </Field>

                <Field
                    label={
                        showBuyQty
                            ? 'Beli Sebanyak'
                            : showBundlePrice
                              ? 'Harga per Item'
                              : showTierPrice
                                ? 'Harga Spesial'
                                : 'Nilai Diskon'
                    }
                    required
                    error={showTierPrice ? errors.tier_price : errors.discount_value}
                >
                    <div className="mt-1.5">
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
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
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
                                    className={`${inputCls('discount_value')} pl-10`}
                                />
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
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
                    </div>
                </Field>
            </div>

            {/* Kondisional fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Min. Pembelian" error={errors.min_purchase_amount}>
                    <div className="mt-1.5">
                        <CurrencyInput
                            value={data.min_purchase_amount}
                            onChange={(v) => setData('min_purchase_amount', v)}
                            placeholder="0"
                            error={!!errors.min_purchase_amount}
                        />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {data.scope === 'cart' ? 'Minimum total belanja' : 'Minimum belanja per item'}
                    </p>
                </Field>

                {showMaxDiscount && (
                    <Field label="Maks. Diskon" error={errors.max_discount_amount}>
                        <div className="mt-1.5">
                            <CurrencyInput
                                value={data.max_discount_amount}
                                onChange={(v) => setData('max_discount_amount', v)}
                                placeholder="0"
                                error={!!errors.max_discount_amount}
                            />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Batas maksimal diskon</p>
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
                            className={`mt-1.5 ${inputCls('min_quantity')}`}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Jumlah minimum agar harga tier berlaku
                        </p>
                    </Field>
                )}

                {showCustomerTier && (
                    <Field label="Tier Pelanggan" required error={errors.customer_tier}>
                        <div className="mt-1.5">
                            <Select
                                options={TIERS.map((t) => ({ value: t.value, label: t.label }))}
                                value={data.customer_tier}
                                onChange={(v) => setData('customer_tier', v)}
                                placeholder="Pilih tier..."
                            />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Hanya berlaku untuk pelanggan tier ini
                        </p>
                    </Field>
                )}

                {showFreeProduct && (
                    <Field label="Produk Gratis" required error={errors.free_product_id}>
                        <div className="mt-1.5">
                            <Select
                                options={products.map((p) => ({
                                    value: p.id,
                                    label: `${p.name} (Rp ${Number(p.sell_price).toLocaleString('id-ID')})`,
                                }))}
                                value={data.free_product_id}
                                onChange={(v) => setData('free_product_id', v)}
                                placeholder="Pilih produk gratis..."
                            />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Produk yang diberikan gratis
                        </p>
                    </Field>
                )}
            </div>

            {/* Flash Sale Time Window */}
            <div>
                <p className="block text-sm font-medium text-foreground">
                    Jam Berlaku{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                        (opsional — untuk flash sale)
                    </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Kosongkan jika promo berlaku sepanjang hari
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                    <Field label="Jam Mulai" error={errors.start_hour}>
                        <input
                            type="time"
                            value={data.start_hour}
                            onChange={(e) => setData('start_hour', e.target.value)}
                            className={`mt-1.5 ${inputCls('start_hour')}`}
                        />
                    </Field>
                    <Field label="Jam Selesai" error={errors.end_hour}>
                        <input
                            type="time"
                            value={data.end_hour}
                            onChange={(e) => setData('end_hour', e.target.value)}
                            className={`mt-1.5 ${inputCls('end_hour')}`}
                        />
                    </Field>
                </div>
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tanggal Mulai" error={errors.start_date}>
                    <input
                        type="date"
                        value={data.start_date}
                        onChange={(e) => setData('start_date', e.target.value)}
                        className={`mt-1.5 ${inputCls('start_date')}`}
                    />
                </Field>
                <Field label="Tanggal Berakhir" error={errors.end_date}>
                    <input
                        type="date"
                        value={data.end_date}
                        onChange={(e) => setData('end_date', e.target.value)}
                        className={`mt-1.5 ${inputCls('end_date')}`}
                    />
                </Field>
            </div>

            {/* Aktif toggle & Limit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setData('is_active', !data.is_active)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            data.is_active ? 'bg-primary-600' : 'bg-slate-200'
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-lg ring-0 transition duration-200 ease-in-out ${
                                data.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                    <div>
                        <p className="text-sm font-medium text-foreground">Aktif</p>
                        <p className="text-xs text-muted-foreground">Promo akan tampil di POS jika aktif</p>
                    </div>
                </div>

                <Field label="Limit Pemakaian" error={errors.max_usage}>
                    <div className="mt-1.5">
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={data.max_usage ?? ''}
                            onChange={(e) => setData('max_usage', e.target.value)}
                            placeholder="0 = tanpa batas"
                            className={inputCls('max_usage')}
                        />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {Number(data.max_usage) > 0
                            ? `Promo berhenti setelah ${data.max_usage}x transaksi${promotion ? ` (sudah ${promotion.used_count ?? 0}x dipakai)` : ''}`
                            : 'Kosongkan atau 0 untuk tanpa batas'}
                    </p>
                </Field>
            </div>

            {/* Product Selection — only for scope=item */}
            {showProductPickerSection && (
                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Produk{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                            (opsional — kosongkan untuk berlaku umum)
                        </span>
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Pilih produk spesifik, atau kosongkan jika promo berlaku untuk semua produk.
                    </p>

                    {selectedProducts.length > 0 && (
                        <div className="mt-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                {selectedProducts.length} produk dipilih
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedProducts.map((p) => (
                                    <span
                                        key={p.id}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-100 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                                    >
                                        <span className="max-w-[120px] truncate">{p.name}</span>
                                        <span className="text-primary-400">
                                            Rp {Number(p.sell_price).toLocaleString('id-ID')}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeProduct(p.id)}
                                            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary-200 hover:text-primary-800"
                                        >
                                            <X className="h-3 w-3" strokeWidth={2} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() => setShowProductPicker(!showProductPicker)}
                            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary-400 hover:text-primary-600"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            {selectedProducts.length > 0 ? 'Tambah Produk Lain' : 'Pilih Produk'}
                        </button>

                        {showProductPicker && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-border">
                                <div className="border-b border-border bg-muted/50 p-3">
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        placeholder="Cari produk..."
                                        className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {filteredProducts.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            {products.length === 0
                                                ? 'Tidak ada produk aktif'
                                                : 'Produk tidak ditemukan'}
                                        </div>
                                    ) : (
                                        filteredProducts.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => addProduct(p.id)}
                                                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-primary-50"
                                            >
                                                <div>
                                                    <p className="font-medium text-foreground">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.sku} • Rp{' '}
                                                        {Number(p.sell_price).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                                <svg
                                                    className="h-4 w-4 text-muted-foreground"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 4.5v15m7.5-7.5h-15"
                                                    />
                                                </svg>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <a
                    href={cancelHref}
                    className="inline-flex justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                    Batal
                </a>
                <Button
                    type="submit"
                    loading={processing}
                >
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
