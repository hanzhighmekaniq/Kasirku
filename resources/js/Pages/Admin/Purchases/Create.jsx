import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Package, X } from "lucide-react";
import Field from "@/Components/ui/Field";
import SectionCard from "@/Components/ui/SectionCard";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import Select from "@/Components/ui/Select";
import CurrencyInput from "@/Components/ui/CurrencyInput";
import StockBucketPicker, {
    BucketItemLabel,
} from "@/Components/ui/StockBucketPicker";
import Button from "@/Components/ui/Button";
import DatePicker from "@/Components/ui/DatePicker";
import { format } from "date-fns";
import {
    baseUnitLabel,
    usesUnitConversion,
} from "@/Utils/unitConversion";

/* ── helpers ──────────────────────────────────────── */
const fmtRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const inputCls = (hasError = false) =>
    `block w-full rounded-xl border bg-background text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${hasError
        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
        : "border-input focus:border-ring focus:ring-ring/20"
    }`;

/* ── Product combobox ──────────────────────────────────
 * Dipertahankan karena masih dipakai halaman Edit pembelian. Form Create
 * sudah pindah ke StockBucketPicker yang memilih produk → varian → satuan
 * dalam satu alur.
 */
export function ProductCombobox({
    products,
    storeType,
    onPick,
    excludeIds = [],
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [idx, setIdx] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const unitLabel = storeType === "fnb" ? "stok" : "pcs";

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const excludeSet = new Set(excludeIds.map(String));
        const available = products.filter((p) => !excludeSet.has(String(p.id)));
        if (!q) return available.slice(0, 30);
        return available
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.sku && p.sku.toLowerCase().includes(q)),
            )
            .slice(0, 30);
    }, [query, products, excludeIds]);

    // Close on outside click
    useEffect(() => {
        const fn = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            )
                setOpen(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    const pick = (p) => {
        onPick(p);
        setQuery("");
        setOpen(false);
        setIdx(0);
    };

    const onKey = (e) => {
        if (!open) {
            if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIdx((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[idx]) pick(filtered[idx]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
                Cari {storeType === "fnb" ? "Bahan Baku" : "Produk"}
            </label>
            <div className="relative">
                <svg
                    className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                        setIdx(0);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKey}
                    placeholder={`Ketik nama atau SKU ${storeType === "fnb" ? "bahan baku" : "produk"}…`}
                    className={`${inputCls()} pl-10 pr-9`}
                    autoComplete="off"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            inputRef.current?.focus();
                        }}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-muted-foreground"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-40 mt-1.5 max-h-72 w-full overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Produk tidak ditemukan
                        </div>
                    ) : (
                        filtered.map((p, i) => (
                            <button
                                key={p.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()} // prevent blur sebelum pick
                                onClick={() => pick(p)}
                                onMouseEnter={() => setIdx(i)}
                                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${i === idx
                                    ? "bg-primary/10"
                                    : "hover:bg-muted"
                                    }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={`truncate font-medium ${i === idx ? "text-primary" : "text-foreground"}`}
                                    >
                                        {p.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {p.sku}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${(p.stock ?? 0) > 0
                                            ? "bg-success/10 text-success"
                                            : "bg-destructive/10 text-destructive"
                                            }`}
                                    >
                                        {p.stock ?? 0}{" "}
                                        {p.base_unit || unitLabel}
                                    </span>
                                    {p.cost_price > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {fmtRp(p.cost_price)}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                    {products.length > 30 && (
                        <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
                            Ketik untuk menyaring lebih lanjut
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Main Create page ──────────────────────────────── */
export default function Create({
    suppliers,
    products,
    buckets = [],
    paymentMethods,
    storeType,
    prefill,
    currentBranchId = null,
}) {
    const { flash } = usePage().props;

    /* ── Item yang sedang disiapkan ────────────────────────
     * Picker memilih satu bucket (produk + varian + satuan) sekaligus, jadi
     * tidak ada lagi state variant/unit terpisah yang harus disinkronkan.
     */
    const [pendingBucket, setPendingBucket] = useState(null);
    const [pendingQty, setPendingQty] = useState(1);
    const [pendingPrice, setPendingPrice] = useState("");
    const qtyRef = useRef(null);

    const pendingBucketStock = useMemo(() => {
        if (!pendingBucket || currentBranchId === null) return null;
        return pendingBucket.stock_by_branch?.[String(currentBranchId)] ?? 0;
    }, [pendingBucket, currentBranchId]);

    const { data, setData, post, processing, errors } = useForm({
        supplier_id: prefill?.supplier_id ? String(prefill.supplier_id) : "",
        purchase_date: new Date().toISOString().slice(0, 10),
        discount_amount: "",
        tax_amount: "",
        shipping_amount: "",
        payment_method_id: "",
        paid_amount: "",
        items: prefill?.product_id
            ? [
                {
                    product_id: prefill.product_id,
                    product_name: prefill.product_name,
                    product_sku: prefill.product_sku,
                    quantity: 1,
                    cost_price: prefill.cost_price || 0,
                    variant_id: prefill.variant_id ?? null,
                    variant_name: prefill.variant_name ?? null,
                    packaging_unit_id: prefill.packaging_unit_id ?? null,
                    unit_name: prefill.unit_name ?? null,
                },
            ]
            : [],
    });

    /* ── Totals ── */
    const subtotal = useMemo(
        () => data.items.reduce((s, i) => s + i.quantity * i.cost_price, 0),
        [data.items],
    );
    const grandTotal =
        subtotal -
        Number(data.discount_amount || 0) +
        Number(data.tax_amount || 0) +
        Number(data.shipping_amount || 0);
    const paidAmount = Number(data.paid_amount || 0);
    const remaining = grandTotal - paidAmount;
    const paymentStatus =
        paidAmount >= grandTotal && grandTotal > 0
            ? "paid"
            : paidAmount > 0
                ? "partial"
                : "unpaid";

    /* ── Pilih bucket dari picker ── */
    const handlePickBucket = (bucket) => {
        setPendingBucket(bucket);
        setPendingPrice(bucket.cost_price > 0 ? String(bucket.cost_price) : "");
        setPendingQty(1);
        setTimeout(() => qtyRef.current?.focus(), 80);
    };

    /* ── Tambahkan item yang disiapkan ke daftar ── */
    const handleAdd = () => {
        if (!pendingBucket || !pendingQty || Number(pendingQty) < 1) return;

        const qty = Number(pendingQty);
        const price = Number(pendingPrice) || 0;

        const newItem = {
            product_id: pendingBucket.product_id,
            product_name: pendingBucket.product_name,
            product_sku: pendingBucket.product_sku,
            variant_id: pendingBucket.variant_id ?? null,
            variant_name: pendingBucket.variant_name ?? null,
            packaging_unit_id: pendingBucket.packaging_unit_id ?? null,
            unit_name: pendingBucket.unit_name ?? null,
            conversion_qty: pendingBucket.conversion_qty ?? null,
            unit: pendingBucket.unit ?? null,
            base_unit: pendingBucket.base_unit ?? null,
            base_unit_conversion: pendingBucket.base_unit_conversion ?? null,
            type: pendingBucket.type ?? null,
            quantity: qty,
            cost_price: price,
        };

        // Merge kalau bucket yang sama sudah ada di daftar.
        const existIdx = data.items.findIndex(
            (i) =>
                i.product_id === newItem.product_id &&
                (i.variant_id ?? null) === (newItem.variant_id ?? null) &&
                (i.packaging_unit_id ?? null) === (newItem.packaging_unit_id ?? null),
        );
        if (existIdx >= 0) {
            const updated = [...data.items];
            updated[existIdx] = {
                ...updated[existIdx],
                quantity: updated[existIdx].quantity + qty,
            };
            setData("items", updated);
        } else {
            setData("items", [...data.items, newItem]);
        }

        setPendingBucket(null);
        setPendingQty(1);
        setPendingPrice("");
    };

    const handleAddKey = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    const removeItem = (i) =>
        setData(
            "items",
            data.items.filter((_, idx) => idx !== i),
        );

    const updateItem = (i, field, val) => {
        const updated = [...data.items];
        updated[i] = { ...updated[i], [field]: Number(val) || 0 };
        setData("items", updated);
    };

    const submit = (e) => {
        e.preventDefault();
        if (!data.items.length) return;
        post(route("admin.purchases.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Pembelian
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }
        >
            <div className="mx-auto max-w-5xl space-y-6 pb-24 sm:pb-8">
                <PageHeader
                    title="Tambah Pembelian"
                    breadcrumbs={["Admin", "Pembelian", "Tambah"]}
                    heading={
                        <>
                            Tambah{" "}
                            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                                Pembelian
                            </span>
                        </>
                    }
                    description="Catat pembelian stok dari supplier, pantau status pembayaran, dan penerimaan barang."
                    backUrl={route("admin.purchases.index")}
                />

            {flash?.error && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                    </svg>
                    {flash.error}
                </div>
            )}

            <form onSubmit={submit}>
                {/* items-start diperlukan agar kolom ringkasan bisa sticky —
                    default stretch membuat tinggi kolom penuh sehingga tidak
                    ada ruang untuk menempel. */}
                <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-3">
                    {/* ── Kolom utama ── */}
                    <div className="space-y-2 lg:col-span-2">
                        {/* Info dasar */}
                        <SectionCard title="Informasi Pembelian">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field
                                    label="Supplier"
                                    required
                                    error={errors.supplier_id}
                                >
                                    <SearchableSelect
                                        options={suppliers}
                                        value={data.supplier_id}
                                        onChange={(id) =>
                                            setData("supplier_id", id)
                                        }
                                        placeholder="Pilih Supplier"
                                        searchPlaceholder="Ketik nama supplier…"
                                        error={!!errors.supplier_id}
                                        required
                                    />
                                </Field>
                                <Field
                                    label="Tanggal Pembelian"
                                    required
                                    error={errors.purchase_date}
                                >
                                    <DatePicker
                                        value={data.purchase_date ? new Date(data.purchase_date) : null}
                                        onChange={(d) => setData("purchase_date", d ? format(d, 'yyyy-MM-dd') : '')}
                                        placeholder="Pilih tanggal pembelian"
                                    />
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Items */}
                        <SectionCard
                            title="Item Pembelian"
                            subtitle={
                                storeType === "fnb"
                                    ? "Pilih bahan baku yang dibeli dari supplier"
                                    : "Pilih produk yang dibeli dari supplier"
                            }
                        >
                            <div className="space-y-4">
                                {/* Langkah 1: pilih bucket produk → varian → satuan */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                                        {storeType === "fnb"
                                            ? "Cari Bahan Baku"
                                            : "Cari Produk"}
                                    </label>
                                    <StockBucketPicker
                                        buckets={buckets}
                                        branchId={currentBranchId}
                                        onSelect={handlePickBucket}
                                        placeholder={
                                            storeType === "fnb"
                                                ? "Pilih bahan baku / varian / satuan"
                                                : "Pilih produk / varian / satuan"
                                        }
                                    />
                                </div>

                                {/* Langkah 2: isi qty + harga beli */}
                                {pendingBucket && (
                                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <BucketItemLabel item={pendingBucket} />
                                            <button
                                                type="button"
                                                onClick={() => setPendingBucket(null)}
                                                aria-label="Batalkan pilihan"
                                                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <X className="h-4 w-4" strokeWidth={2} />
                                            </button>
                                        </div>

                                        {pendingBucketStock !== null && (
                                            <p className="mb-3 text-xs text-muted-foreground">
                                                Stok saat ini:{" "}
                                                <span className="font-semibold text-foreground">
                                                    {pendingBucketStock}
                                                </span>{" "}
                                                {pendingBucket.unit_name ??
                                                    pendingBucket.unit ??
                                                    "pcs"}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                                            <div className="sm:col-span-3">
                                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                                    Qty
                                                    {pendingBucket.unit_name
                                                        ? ` (${pendingBucket.unit_name})`
                                                        : ""}
                                                </label>
                                                <input
                                                    ref={qtyRef}
                                                    type="number"
                                                    value={pendingQty}
                                                    onChange={(e) =>
                                                        setPendingQty(e.target.value)
                                                    }
                                                    onKeyDown={handleAddKey}
                                                    min="1"
                                                    className={`${inputCls()} px-3.5 py-2.5`}
                                                />
                                            </div>
                                            <div className="sm:col-span-5">
                                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                                    Harga Beli / Satuan
                                                </label>
                                                <CurrencyInput
                                                    value={pendingPrice}
                                                    onChange={setPendingPrice}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="sm:col-span-4">
                                                <Button
                                                    type="button"
                                                    onClick={handleAdd}
                                                    className="w-full"
                                                >
                                                    Tambah Item
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Bahan baku berkonversi dicatat per
                                            satuan beli tapi disimpan per satuan
                                            pakai — tunjukkan hasilnya sebelum
                                            disimpan supaya tidak terasa ganjil. */}
                                        {usesUnitConversion(pendingBucket) &&
                                            Number(pendingQty) > 0 && (
                                                <p className="mt-3 text-xs text-muted-foreground">
                                                    Masuk stok:{" "}
                                                    <strong className="text-foreground">
                                                        {baseUnitLabel(
                                                            pendingBucket,
                                                            pendingQty,
                                                        )}
                                                    </strong>
                                                    {Number(pendingPrice) > 0 && (
                                                        <>
                                                            {" · Modal ≈ "}
                                                            <strong className="text-foreground">
                                                                {fmtRp(
                                                                    Number(pendingPrice) /
                                                                    Number(pendingBucket.base_unit_conversion),
                                                                )}
                                                                /{pendingBucket.base_unit}
                                                            </strong>
                                                        </>
                                                    )}
                                                </p>
                                            )}

                                        {pendingQty > 0 && pendingPrice > 0 && (
                                            <p className="mt-2 text-right text-xs font-medium text-foreground">
                                                Subtotal:{" "}
                                                {fmtRp(
                                                    Number(pendingQty) *
                                                    Number(pendingPrice),
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {errors.items && (
                                    <p className="text-xs text-destructive">
                                        {typeof errors.items === "string"
                                            ? errors.items
                                            : "Minimal 1 item wajib ditambahkan"}
                                    </p>
                                )}

                                {/* Daftar item */}
                                {data.items.length === 0 ? (
                                    <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
                                        <svg
                                            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.3}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                                            />
                                        </svg>
                                        <p className="text-sm text-muted-foreground">
                                            Cari dan pilih produk di atas untuk
                                            menambahkan item
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                                        <table className="w-full text-sm">
                                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold">
                                                        Produk
                                                    </th>
                                                    <th className="px-4 py-3 text-center w-20 font-semibold">
                                                        Qty
                                                    </th>
                                                    <th className="px-4 py-3 text-right w-32 font-semibold">
                                                        Harga Beli
                                                    </th>
                                                    <th className="px-4 py-3 text-right w-28 font-semibold">
                                                        Subtotal
                                                    </th>
                                                    <th className="px-4 py-3 w-10 text-left font-semibold" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-background">
                                                {data.items.map((item, i) => (
                                                    <tr
                                                        key={i}
                                                        className="transition hover:bg-[rgb(var(--color-table-hover))]"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-foreground">
                                                                {
                                                                    item.product_name
                                                                }
                                                                {item.variant_name && (
                                                                    <span className="text-muted-foreground">
                                                                        {" "}
                                                                        —{" "}
                                                                        {
                                                                            item.variant_name
                                                                        }
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    item.product_sku
                                                                }
                                                                {item.unit_name && (
                                                                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                                                                        {
                                                                            item.unit_name
                                                                        }
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        i,
                                                                        "quantity",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                min="1"
                                                                className="mx-auto block h-8 w-16 rounded-lg border border-input bg-background px-2 text-center text-xs text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="relative">
                                                                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-muted-foreground">
                                                                    Rp
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        item.cost_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateItem(
                                                                            i,
                                                                            "cost_price",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    min="0"
                                                                    className="h-8 w-28 rounded-lg border border-input bg-background pl-7 pr-2 text-right text-xs text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                                                            {fmtRp(
                                                                item.quantity *
                                                                item.cost_price,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeItem(
                                                                        i,
                                                                    )
                                                                }
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M6 18L18 6M6 6l12 12"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        {/* Biaya tambahan */}
                        <SectionCard
                            title="Rincian Biaya"
                            subtitle="Diskon, pajak, dan ongkos kirim (opsional)"
                        >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {[
                                    { key: "discount_amount", label: "Diskon" },
                                    { key: "tax_amount", label: "Pajak" },
                                    { key: "shipping_amount", label: "Ongkir" },
                                ].map(({ key, label }) => (
                                    <Field
                                        key={key}
                                        label={label}
                                        error={errors[key]}
                                    >
                                        <CurrencyInput
                                            value={data[key]}
                                            onChange={(v) => setData(key, v)}
                                            placeholder="0"
                                            error={!!errors[key]}
                                        />
                                    </Field>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Pembayaran */}
                        <SectionCard
                            title="Pembayaran"
                            subtitle="Isi jika sudah ada pembayaran. Kosongkan jika bayar nanti."
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Metode pembayaran jumlahnya sedikit, jadi
                                        pakai Select tanpa search. Panelnya juga
                                        otomatis membuka ke atas kalau ruang di
                                        bawah kurang. */}
                                    <Field
                                        label="Metode Pembayaran"
                                        error={errors.payment_method_id}
                                    >
                                        <Select
                                            options={paymentMethods}
                                            value={data.payment_method_id}
                                            onChange={(id) =>
                                                setData("payment_method_id", id)
                                            }
                                            placeholder="Pilih Metode"
                                            error={errors.payment_method_id}
                                        />
                                    </Field>
                                    <Field
                                        label="Jumlah Dibayar"
                                        error={errors.paid_amount}
                                    >
                                        <CurrencyInput
                                            value={data.paid_amount}
                                            onChange={(v) =>
                                                setData("paid_amount", v)
                                            }
                                            placeholder="0"
                                            error={!!errors.paid_amount}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "paid_amount",
                                                    grandTotal > 0
                                                        ? String(grandTotal)
                                                        : "",
                                                )
                                            }
                                            disabled={grandTotal <= 0}
                                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Isi Lunas ({fmtRp(grandTotal)})
                                        </button>
                                    </Field>
                                </div>

                                {/* Payment indicator */}
                                {grandTotal > 0 && (
                                    <div
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${paymentStatus === "paid"
                                            ? "bg-success/10 text-success"
                                            : paymentStatus === "partial"
                                                ? "bg-warning/10 text-warning"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {paymentStatus === "paid" && (
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        )}
                                        {paymentStatus === "partial" && (
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        )}
                                        {paymentStatus === "unpaid" && (
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                                />
                                            </svg>
                                        )}
                                        <span>
                                            {paymentStatus === "paid" &&
                                                "Pembayaran lunas"}
                                            {paymentStatus === "partial" &&
                                                `Sisa bayar: ${fmtRp(remaining)}`}
                                            {paymentStatus === "unpaid" &&
                                                "Belum ada pembayaran"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── Sidebar ringkasan ──
                        Sticky di desktop supaya total tetap terlihat saat
                        daftar item panjang dan halaman digulir. */}
                    <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Item</dt>
                                    <dd className="font-medium text-foreground">
                                        {data.items.length}{" "}
                                        {storeType === "fnb"
                                            ? "bahan baku"
                                            : "produk"}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Subtotal</dt>
                                    <dd className="font-medium text-foreground">
                                        {fmtRp(subtotal)}
                                    </dd>
                                </div>
                                {Number(data.discount_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Diskon
                                        </dt>
                                        <dd className="font-medium text-destructive">
                                            – {fmtRp(data.discount_amount)}
                                        </dd>
                                    </div>
                                )}
                                {Number(data.tax_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Pajak
                                        </dt>
                                        <dd className="font-medium text-foreground">
                                            + {fmtRp(data.tax_amount)}
                                        </dd>
                                    </div>
                                )}
                                {Number(data.shipping_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Ongkir
                                        </dt>
                                        <dd className="font-medium text-foreground">
                                            + {fmtRp(data.shipping_amount)}
                                        </dd>
                                    </div>
                                )}

                                <div className="border-t border-border pt-2.5">
                                    <div className="flex items-center justify-between">
                                        <dt className="font-semibold text-foreground">
                                            Grand Total
                                        </dt>
                                        <dd className="text-lg font-bold text-primary">
                                            {fmtRp(grandTotal)}
                                        </dd>
                                    </div>
                                </div>

                                {paidAmount > 0 && (
                                    <>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                Dibayar
                                            </dt>
                                            <dd className="font-semibold text-success">
                                                {fmtRp(paidAmount)}
                                            </dd>
                                        </div>
                                        {remaining > 0 && (
                                            <div className="flex justify-between">
                                                <dt className="font-semibold text-foreground">
                                                    Sisa Bayar
                                                </dt>
                                                <dd className="font-bold text-warning">
                                                    {fmtRp(remaining)}
                                                </dd>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="pt-1">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${paymentStatus === "paid"
                                            ? "bg-success/10 text-success"
                                            : paymentStatus === "partial"
                                                ? "bg-warning/10 text-warning"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${paymentStatus === "paid"
                                                ? "bg-success"
                                                : paymentStatus ===
                                                    "partial"
                                                    ? "bg-warning"
                                                    : "bg-muted-foreground"
                                                }`}
                                        />
                                        {paymentStatus === "paid" && "LUNAS"}
                                        {paymentStatus === "partial" &&
                                            "SEBAGIAN"}
                                        {paymentStatus === "unpaid" &&
                                            "BELUM BAYAR"}
                                    </span>
                                </div>
                            </dl>
                        </SectionCard>

                        {/* Sticky Action Bar */}
                        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 p-4 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:p-0">
                            <div className="mx-auto flex max-w-5xl justify-end gap-3 sm:mx-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    as={Link}
                                    href={route("admin.purchases.index")}
                                    className="w-full sm:w-auto"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    loading={processing}
                                    disabled={data.items.length === 0}
                                    className="w-full sm:w-auto"
                                >
                                    Simpan Pembelian
                                </Button>
                            </div>
                        </div>

                        {data.items.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground">
                                Tambahkan minimal 1 item untuk menyimpan
                            </p>
                        )}
                    </div>
                </div>
            </form>
            </div>
        </AuthenticatedLayout>
    );
}
