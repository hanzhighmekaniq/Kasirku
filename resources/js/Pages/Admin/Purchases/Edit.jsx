import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useMemo, useRef, useState } from "react";
import Field from "@/Components/ui/Field";
import SectionCard from "@/Components/ui/SectionCard";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import Button from "@/Components/ui/Button";
import { ProductCombobox } from "./Create";

/* ── helpers ──────────────────────────────────────── */
const fmtRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const inputCls = (hasError = false) =>
    `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${
        hasError
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-border focus:border-ring focus:ring-ring/20"
    }`;

export default function Edit({
    purchase,
    suppliers,
    products,
    paymentMethods,
    storeType,
}) {
    const { flash } = usePage().props;

    // Pending item
    const [pendingProduct, setPendingProduct] = useState(null);
    const [pendingVariantId, setPendingVariantId] = useState("");
    const [pendingUnitId, setPendingUnitId] = useState("");
    const [pendingQty, setPendingQty] = useState(1);
    const [pendingPrice, setPendingPrice] = useState("");
    const qtyRef = useRef(null);

    const pendingVariant = useMemo(
        () =>
            pendingProduct?.variants?.find(
                (v) => String(v.id) === String(pendingVariantId),
            ) ?? null,
        [pendingProduct, pendingVariantId],
    );

    const pendingUnits = useMemo(() => {
        if (!pendingProduct) return [];
        if (pendingProduct.is_variant) {
            return pendingVariant?.packaging_units ?? [];
        }
        return pendingProduct.packaging_units ?? [];
    }, [pendingProduct, pendingVariant]);

    const pendingUnit = useMemo(
        () => pendingUnits.find((u) => String(u.id) === String(pendingUnitId)) ?? null,
        [pendingUnits, pendingUnitId],
    );

    const pendingBucketStock = useMemo(() => {
        if (!pendingProduct) return null;
        if (pendingUnit) return pendingUnit.stock ?? 0;
        if (pendingProduct.is_variant) return pendingVariant?.stock ?? 0;
        return pendingProduct.stock ?? 0;
    }, [pendingProduct, pendingVariant, pendingUnit]);

    const { data, setData, patch, processing, errors } = useForm({
        supplier_id: purchase.supplier_id ?? "",
        purchase_date: purchase.purchase_date?.slice(0, 10) ?? "",
        discount_amount:
            purchase.discount_amount > 0
                ? String(purchase.discount_amount)
                : "",
        tax_amount: purchase.tax_amount > 0 ? String(purchase.tax_amount) : "",
        shipping_amount:
            purchase.shipping_amount > 0
                ? String(purchase.shipping_amount)
                : "",
        payment_method_id: purchase.payments?.[0]?.payment_method_id ?? "",
        paid_amount:
            purchase.paid_amount > 0 ? String(purchase.paid_amount) : "",
        items: (purchase.items ?? []).map((item) => ({
            product_id: item.product_id,
            product_name: item.product?.name ?? "",
            product_sku: item.product?.sku ?? "",
            variant_id: item.variant_id ?? null,
            variant_name: item.variant?.name ?? null,
            packaging_unit_id: item.packaging_unit_id ?? null,
            unit_name: item.unit_name ?? item.packaging_unit?.name ?? null,
            quantity: item.quantity,
            cost_price: item.cost_price,
        })),
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

    /* ── Item actions ── */
    const handlePick = (product) => {
        setPendingProduct(product);
        setPendingVariantId("");
        setPendingUnitId("");
        setPendingPrice(
            product.cost_price > 0 ? String(product.cost_price) : "",
        );
        setPendingQty(1);
        if (!product.is_variant) {
            setTimeout(() => qtyRef.current?.focus(), 80);
        }
    };

    const handlePickVariant = (variantId) => {
        setPendingVariantId(variantId);
        setPendingUnitId("");
        setTimeout(() => qtyRef.current?.focus(), 80);
    };

    const handleAdd = () => {
        if (!pendingProduct || !pendingQty || Number(pendingQty) < 1) return;
        if (pendingProduct.is_variant && !pendingVariantId) return;

        const qty = Number(pendingQty);
        const price = Number(pendingPrice) || 0;
        const variantId = pendingVariantId ? Number(pendingVariantId) : null;
        const unitId = pendingUnitId ? Number(pendingUnitId) : null;

        const newItem = {
            product_id: pendingProduct.id,
            product_name: pendingProduct.name,
            product_sku: pendingProduct.sku,
            variant_id: variantId,
            variant_name: pendingVariant?.name ?? null,
            packaging_unit_id: unitId,
            unit_name: pendingUnit?.name ?? null,
            quantity: qty,
            cost_price: price,
        };

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

        setPendingProduct(null);
        setPendingVariantId("");
        setPendingUnitId("");
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
        updated[i] = {
            ...updated[i],
            [field]: field === "quantity" ? Number(val) || 0 : Number(val) || 0,
        };
        setData("items", updated);
    };

    const submit = (e) => {
        e.preventDefault();
        if (!data.items.length) return;
        patch(route("admin.purchases.update", purchase.id));
    };

    return (
        <AuthenticatedLayout
            
            header={
                <div className="leading-tight"
            
            backUrl={route("admin.purchases.show", purchase.id)}>
                    <div className="text-sm font-semibold text-foreground">
                        Pembelian
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        purchase.purchase_no
                    </div>
                </div>
            }>
            <PageHeader
                title={`Edit ${purchase.purchase_no}`}
                breadcrumbs={["Admin", "Pembelian", purchase.purchase_no]}
                heading={
                    <>
                        Edit{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pembelian
                        </span>
                    </>
                }
                description="Ubah data pembelian stok dari supplier."
                
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
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Main */}
                    <div className="space-y-5 lg:col-span-2">
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

                        {/* Items — EDITABLE */}
                        <SectionCard
                            title="Item Pembelian"
                            subtitle="Tambah, ubah, atau hapus item pembelian"
                        >
                            <div className="space-y-4">
                                <ProductCombobox
                                    products={products}
                                    storeType={storeType}
                                    onPick={handlePick}
                                />

                                {pendingProduct && (
                                    <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-primary-800">
                                                    {pendingProduct.name}
                                                </p>
                                                <p className="text-xs text-primary-500">
                                                    {pendingProduct.sku}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPendingProduct(null)
                                                }
                                                className="text-primary-400 hover:text-primary-600"
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

                                        {pendingProduct.is_variant && (
                                            <div className="mb-3">
                                                <label className="mb-1 block text-xs font-semibold text-primary-700">
                                                    Variant{" "}
                                                    <span className="text-red-400">
                                                        *
                                                    </span>
                                                </label>
                                                <SearchableSelect
                                                    options={
                                                        pendingProduct.variants ??
                                                        []
                                                    }
                                                    value={pendingVariantId}
                                                    onChange={handlePickVariant}
                                                    placeholder="Pilih Variant"
                                                    searchPlaceholder="Ketik nama variant…"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {pendingUnits.length > 0 &&
                                            (!pendingProduct.is_variant ||
                                                pendingVariantId) && (
                                                <div className="mb-3">
                                                    <label className="mb-1 block text-xs font-semibold text-primary-700">
                                                        Satuan
                                                    </label>
                                                    <SearchableSelect
                                                        options={[
                                                            {
                                                                id: "",
                                                                name: "Pcs (satuan dasar)",
                                                            },
                                                            ...pendingUnits,
                                                        ]}
                                                        value={pendingUnitId}
                                                        onChange={
                                                            setPendingUnitId
                                                        }
                                                        placeholder="Pcs (satuan dasar)"
                                                        searchPlaceholder="Ketik nama satuan…"
                                                    />
                                                </div>
                                            )}

                                        {pendingBucketStock !== null && (
                                            <p className="mb-3 text-xs text-primary-600">
                                                Stok saat ini:{" "}
                                                <span className="font-semibold">
                                                    {pendingBucketStock}
                                                </span>{" "}
                                                {pendingUnit?.name ?? "pcs"}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-12 items-end gap-3">
                                            <div className="col-span-4 sm:col-span-3">
                                                <label className="mb-1 block text-xs font-semibold text-primary-700">
                                                    Qty{" "}
                                                    {pendingUnit
                                                        ? `(${pendingUnit.name})`
                                                        : ""}
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
                                                    className="block w-full rounded-xl border border-primary-300 bg-card px-3 py-2 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
                                                />
                                            </div>
                                            <div className="col-span-5 sm:col-span-5">
                                                <label className="mb-1 block text-xs font-semibold text-primary-700">
                                                    Harga Beli / Satuan
                                                </label>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-primary-400">
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
                                                        className="block w-full rounded-xl border border-primary-300 bg-card py-2 pl-8 pr-3 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-3 sm:col-span-4">
                                                <button
                                                    type="button"
                                                    onClick={handleAdd}
                                                    disabled={
                                                        pendingProduct.is_variant &&
                                                        !pendingVariantId
                                                    }
                                                    className="w-full rounded-xl bg-primary-600 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 active:bg-primary-800 disabled:opacity-40"
                                                >
                                                    + Tambah
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {errors.items && (
                                    <p className="text-xs text-destructive">
                                        Minimal 1 item wajib ditambahkan
                                    </p>
                                )}

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
                                            Cari dan pilih produk untuk
                                            menambahkan item
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-2xl border border-border">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                                            <tbody className="divide-y divide-border">
                                                {data.items.map((item, i) => (
                                                    <tr
                                                        key={i}
                                                        className="transition hover:bg-muted/70"
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
                                                                className="mx-auto block h-8 w-16 rounded-lg border border-border px-2 text-center text-xs focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                                                                    className="h-8 w-28 rounded-lg border border-border pl-7 pr-2 text-right text-xs focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                                    {
                                        key: "discount_amount",
                                        label: "Diskon",
                                    },
                                    { key: "tax_amount", label: "Pajak" },
                                    {
                                        key: "shipping_amount",
                                        label: "Ongkir",
                                    },
                                ].map(({ key, label }) => (
                                    <Field
                                        key={key}
                                        label={label}
                                        error={errors[key]}
                                    >
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
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
                            subtitle="Isi jika sudah ada pembayaran."
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
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
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
                                                className="absolute inset-y-1 right-1 rounded-lg bg-success/100 px-3 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-40"
                                            >
                                                Bayar Lunas
                                            </button>
                                        </div>
                                    </Field>
                                </div>
                                {grandTotal > 0 && (
                                    <div
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
                                            paymentStatus === "paid"
                                                ? "bg-success/10 text-success"
                                                : paymentStatus === "partial"
                                                  ? "bg-amber-50 text-amber-700"
                                                  : "bg-muted text-muted-foreground"
                                        }`}
                                    >
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

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Item</dt>
                                    <dd className="font-medium text-foreground">
                                        {data.items.length} produk
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
                                        <dd className="text-lg font-bold text-primary-600">
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
                                            <dd className="font-semibold text-emerald-600">
                                                {fmtRp(paidAmount)}
                                            </dd>
                                        </div>
                                        {remaining > 0 && (
                                            <div className="flex justify-between">
                                                <dt className="font-semibold text-foreground">
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
                                                ? "bg-emerald-100 text-success"
                                                : paymentStatus === "partial"
                                                  ? "bg-amber-100 text-amber-700"
                                                  : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                paymentStatus === "paid"
                                                    ? "bg-success/100"
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
                            <Button
                                type="submit"
                                loading={processing}
                                disabled={data.items.length === 0}
                                className="w-full"
                            >
                                Simpan Perubahan
                            </Button>
                            <Link
                                href={route(
                                    "admin.purchases.show",
                                    purchase.id,
                                )}
                                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-muted"
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
