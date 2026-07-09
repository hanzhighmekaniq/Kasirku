import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Field from "@/Components/ui/Field";
import SectionCard from "@/Components/ui/SectionCard";
import SearchableSelect from "@/Components/ui/SearchableSelect";

/* ── helpers ──────────────────────────────────────── */
const fmtRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const inputCls = (hasError = false) =>
    `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${
        hasError
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
    }`;

/* ── Product combobox ──────────────────────────────── */
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Cari {storeType === "fnb" ? "Bahan Baku" : "Produk"}
            </label>
            <div className="relative">
                <svg
                    className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400"
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
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
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
                <div className="absolute z-40 mt-1.5 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">
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
                                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                                    i === idx
                                        ? "bg-indigo-50"
                                        : "hover:bg-slate-50"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={`truncate font-medium ${i === idx ? "text-indigo-700" : "text-slate-800"}`}
                                    >
                                        {p.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {p.sku}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            (p.stock ?? 0) > 0
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-red-50 text-red-600"
                                        }`}
                                    >
                                        {p.stock ?? 0}{" "}
                                        {p.base_unit || unitLabel}
                                    </span>
                                    {p.cost_price > 0 && (
                                        <span className="text-xs text-slate-400">
                                            {fmtRp(p.cost_price)}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                    {products.length > 30 && (
                        <div className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400">
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
    paymentMethods,
    storeType,
    prefill,
}) {
    const { flash } = usePage().props;

    // Pending item state — terpisah dari form items
    const [pendingProduct, setPendingProduct] = useState(null);
    const [pendingQty, setPendingQty] = useState(1);
    const [pendingPrice, setPendingPrice] = useState("");
    const qtyRef = useRef(null);

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

    /* ── Pick product from combobox ── */
    const handlePick = (product) => {
        setPendingProduct(product);
        setPendingPrice(
            product.cost_price > 0 ? String(product.cost_price) : "",
        );
        setPendingQty(1);
        setTimeout(() => qtyRef.current?.focus(), 80);
    };

    /* ── Add pending item to list ── */
    const handleAdd = () => {
        if (!pendingProduct || !pendingQty || Number(pendingQty) < 1) return;
        const qty = Number(pendingQty);
        const price = Number(pendingPrice) || 0;

        // Merge jika produk sudah ada
        const existIdx = data.items.findIndex(
            (i) => i.product_id === pendingProduct.id,
        );
        if (existIdx >= 0) {
            const updated = [...data.items];
            updated[existIdx] = {
                ...updated[existIdx],
                quantity: updated[existIdx].quantity + qty,
            };
            setData("items", updated);
        } else {
            setData("items", [
                ...data.items,
                {
                    product_id: pendingProduct.id,
                    product_name: pendingProduct.name,
                    product_sku: pendingProduct.sku,
                    quantity: qty,
                    cost_price: price,
                },
            ]);
        }

        // Reset pending
        setPendingProduct(null);
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
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.purchases.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                        aria-label="Kembali"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">
                        Tambah Pembelian
                    </h2>
                </div>
            }
        >
            <Head title="Tambah Pembelian" />

            {flash?.error && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
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
                                    <input
                                        type="date"
                                        value={data.purchase_date}
                                        onChange={(e) =>
                                            setData(
                                                "purchase_date",
                                                e.target.value,
                                            )
                                        }
                                        className={inputCls(
                                            !!errors.purchase_date,
                                        )}
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
                                {/* Step 1: cari produk */}
                                <ProductCombobox
                                    products={products}
                                    storeType={storeType}
                                    onPick={handlePick}
                                    excludeIds={data.items.map(
                                        (i) => i.product_id,
                                    )}
                                />

                                {/* Step 2: isi qty + harga setelah pilih produk */}
                                {pendingProduct && (
                                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-indigo-800">
                                                    {pendingProduct.name}
                                                </p>
                                                <p className="text-xs text-indigo-500">
                                                    {pendingProduct.sku}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPendingProduct(null)
                                                }
                                                className="text-indigo-400 hover:text-indigo-600"
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
                                        </div>
                                        <div className="grid grid-cols-12 items-end gap-3">
                                            <div className="col-span-4 sm:col-span-3">
                                                <label className="mb-1 block text-xs font-semibold text-indigo-700">
                                                    Qty
                                                </label>
                                                <input
                                                    ref={qtyRef}
                                                    type="number"
                                                    value={pendingQty}
                                                    onChange={(e) =>
                                                        setPendingQty(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onKeyDown={handleAddKey}
                                                    min="1"
                                                    className="block w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                />
                                            </div>
                                            <div className="col-span-5 sm:col-span-5">
                                                <label className="mb-1 block text-xs font-semibold text-indigo-700">
                                                    Harga Beli / Satuan
                                                </label>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-indigo-400">
                                                        Rp
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={pendingPrice}
                                                        onChange={(e) =>
                                                            setPendingPrice(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={handleAddKey}
                                                        min="0"
                                                        placeholder="0"
                                                        className="block w-full rounded-xl border border-indigo-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-3 sm:col-span-4">
                                                <button
                                                    type="button"
                                                    onClick={handleAdd}
                                                    className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800"
                                                >
                                                    + Tambah
                                                </button>
                                            </div>
                                        </div>
                                        {pendingQty > 0 && pendingPrice > 0 && (
                                            <p className="mt-2 text-right text-xs text-indigo-600 font-medium">
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
                                    <p className="text-xs text-red-600">
                                        {typeof errors.items === "string"
                                            ? errors.items
                                            : "Minimal 1 item wajib ditambahkan"}
                                    </p>
                                )}

                                {/* Daftar item */}
                                {data.items.length === 0 ? (
                                    <div className="rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
                                        <svg
                                            className="mx-auto mb-3 h-10 w-10 text-slate-300"
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
                                        <p className="text-sm text-slate-400">
                                            Cari dan pilih produk di atas untuk
                                            menambahkan item
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    <th className="px-4 py-3">
                                                        Produk
                                                    </th>
                                                    <th className="px-4 py-3 text-center w-20">
                                                        Qty
                                                    </th>
                                                    <th className="px-4 py-3 text-right w-32">
                                                        Harga Beli
                                                    </th>
                                                    <th className="px-4 py-3 text-right w-28">
                                                        Subtotal
                                                    </th>
                                                    <th className="px-4 py-3 w-10" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {data.items.map((item, i) => (
                                                    <tr
                                                        key={i}
                                                        className="hover:bg-slate-50/70 transition"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-slate-800">
                                                                {
                                                                    item.product_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {
                                                                    item.product_sku
                                                                }
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
                                                                className="h-8 w-16 rounded-lg border border-slate-300 px-2 text-center text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 block mx-auto"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="relative">
                                                                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-slate-400">
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
                                                                    className="h-8 w-28 rounded-lg border border-slate-300 pl-7 pr-2 text-right text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
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
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
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
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                value={data[key]}
                                                onChange={(e) =>
                                                    setData(key, e.target.value)
                                                }
                                                min="0"
                                                placeholder="0"
                                                className={`${inputCls(!!errors[key])} pl-9`}
                                            />
                                        </div>
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
                                    <Field
                                        label="Metode Pembayaran"
                                        error={errors.payment_method_id}
                                    >
                                        <SearchableSelect
                                            options={paymentMethods}
                                            value={data.payment_method_id}
                                            onChange={(id) =>
                                                setData("payment_method_id", id)
                                            }
                                            placeholder="Pilih Metode"
                                            searchPlaceholder="Ketik nama metode…"
                                            error={!!errors.payment_method_id}
                                        />
                                    </Field>
                                    <Field
                                        label="Jumlah Dibayar"
                                        error={errors.paid_amount}
                                    >
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                value={data.paid_amount}
                                                onChange={(e) =>
                                                    setData(
                                                        "paid_amount",
                                                        e.target.value,
                                                    )
                                                }
                                                min="0"
                                                placeholder="0"
                                                className={`${inputCls(!!errors.paid_amount)} pl-9 pr-28`}
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
                                                className="absolute inset-y-1 right-1 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-40"
                                            >
                                                Bayar Lunas
                                            </button>
                                        </div>
                                    </Field>
                                </div>

                                {/* Payment indicator */}
                                {grandTotal > 0 && (
                                    <div
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
                                            paymentStatus === "paid"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : paymentStatus === "partial"
                                                  ? "bg-amber-50 text-amber-700"
                                                  : "bg-slate-50 text-slate-500"
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

                    {/* ── Sidebar ringkasan ── */}
                    <div className="space-y-5">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Item</dt>
                                    <dd className="font-medium text-slate-700">
                                        {data.items.length} produk
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Subtotal</dt>
                                    <dd className="font-medium text-slate-700">
                                        {fmtRp(subtotal)}
                                    </dd>
                                </div>
                                {Number(data.discount_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">
                                            Diskon
                                        </dt>
                                        <dd className="font-medium text-red-500">
                                            – {fmtRp(data.discount_amount)}
                                        </dd>
                                    </div>
                                )}
                                {Number(data.tax_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">
                                            Pajak
                                        </dt>
                                        <dd className="font-medium text-slate-700">
                                            + {fmtRp(data.tax_amount)}
                                        </dd>
                                    </div>
                                )}
                                {Number(data.shipping_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">
                                            Ongkir
                                        </dt>
                                        <dd className="font-medium text-slate-700">
                                            + {fmtRp(data.shipping_amount)}
                                        </dd>
                                    </div>
                                )}

                                <div className="border-t border-slate-100 pt-2.5">
                                    <div className="flex items-center justify-between">
                                        <dt className="font-semibold text-slate-700">
                                            Grand Total
                                        </dt>
                                        <dd className="text-lg font-bold text-indigo-600">
                                            {fmtRp(grandTotal)}
                                        </dd>
                                    </div>
                                </div>

                                {paidAmount > 0 && (
                                    <>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">
                                                Dibayar
                                            </dt>
                                            <dd className="font-semibold text-emerald-600">
                                                {fmtRp(paidAmount)}
                                            </dd>
                                        </div>
                                        {remaining > 0 && (
                                            <div className="flex justify-between">
                                                <dt className="font-semibold text-slate-700">
                                                    Sisa Bayar
                                                </dt>
                                                <dd className="font-bold text-amber-600">
                                                    {fmtRp(remaining)}
                                                </dd>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="pt-1">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                                            paymentStatus === "paid"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : paymentStatus === "partial"
                                                  ? "bg-amber-100 text-amber-700"
                                                  : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                paymentStatus === "paid"
                                                    ? "bg-emerald-500"
                                                    : paymentStatus ===
                                                        "partial"
                                                      ? "bg-amber-500"
                                                      : "bg-slate-400"
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

                        <div className="flex flex-col gap-2">
                            <button
                                type="submit"
                                disabled={processing || data.items.length === 0}
                                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan Pembelian"}
                            </button>
                            <Link
                                href={route("admin.purchases.index")}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>
                        </div>

                        {data.items.length === 0 && (
                            <p className="text-center text-xs text-slate-400">
                                Tambahkan minimal 1 item untuk menyimpan
                            </p>
                        )}
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
