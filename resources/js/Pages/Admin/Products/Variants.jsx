import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import Button from "@/Components/ui/Button";
import { Plus } from "lucide-react";

const inputCls =
    "block w-full rounded-xl border-border text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20";

function VariantForm({ product, variant, onClose, onSaved }) {
    const isEdit = !!variant;
    const { data, setData, post, put, processing, errors } = useForm({
        name: variant?.name || "",
        sku: variant?.sku || "",
        barcode: variant?.barcode || "",
        price: variant?.price ?? product.sell_price ?? "",
        cost_price: variant?.cost_price ?? product.cost_price ?? "",
        is_active: variant?.is_active ?? true,
        price_tiers: (variant?.price_tiers || []).map((t) => ({
            min_qty: t.min_qty,
            price: t.price,
        })),
        packaging_units: (variant?.packaging_units || []).map((pu) => ({
            name: pu.name,
            conversion_qty: pu.conversion_qty,
            sell_price: pu.sell_price,
            barcode: pu.barcode ?? "",
        })),
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(
                route("admin.products.variants.update", [
                    product.id,
                    variant.id,
                ]),
                { onSuccess: () => onSaved?.() },
            );
        } else {
            post(route("admin.products.variants.store", product.id), {
                onSuccess: () => onSaved?.(),
            });
        }
    };

    const margin = (Number(data.price) || 0) - (Number(data.cost_price) || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16">
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl sm:p-7 mb-10">
                <h3 className="text-base font-semibold text-foreground">
                    {isEdit ? "Edit Varian" : "Tambah Varian"}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Produk: {product.name}
                </p>

                <form onSubmit={submit} className="mt-5 space-y-5">
                    {/* Info Dasar */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Nama Varian{" "}
                                <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className={inputCls}
                                placeholder="Contoh: Large, Merah, Coklat"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                SKU <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.sku}
                                onChange={(e) =>
                                    setData("sku", e.target.value)
                                }
                                className={inputCls}
                                placeholder="SKU unik varian"
                            />
                            {errors.sku && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.sku}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Barcode
                            </label>
                            <input
                                type="text"
                                value={data.barcode}
                                onChange={(e) =>
                                    setData("barcode", e.target.value)
                                }
                                className={inputCls}
                                placeholder="Otomatis jika kosong"
                            />
                            {errors.barcode && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.barcode}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Harga */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Harga Jual{" "}
                                <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.price}
                                    onChange={(e) =>
                                        setData("price", e.target.value)
                                    }
                                    className={`${inputCls} pl-9`}
                                />
                            </div>
                            {errors.price && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.price}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Harga Beli
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.cost_price}
                                    onChange={(e) =>
                                        setData("cost_price", e.target.value)
                                    }
                                    className={`${inputCls} pl-9`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Margin
                            </label>
                            <div
                                className={`rounded-xl border px-3 py-2 ${margin < 0 ? "border-rose-200 bg-rose-50" : "border-success/20 bg-success/10"}`}
                            >
                                <div
                                    className={`text-sm font-bold ${margin < 0 ? "text-rose-700" : "text-emerald-800"}`}
                                >
                                    Rp {margin.toLocaleString("id-ID")}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setData("is_active", !data.is_active)
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${data.is_active ? "bg-primary-600" : "bg-slate-200"}`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ${data.is_active ? "translate-x-5" : "translate-x-0"}`}
                            />
                        </button>
                        <span className="text-sm font-medium text-foreground">
                            Aktif
                        </span>
                    </div>

                    {/* Grosir Bertingkat */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-sm font-semibold text-foreground">
                                    Grosir Bertingkat
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    Maks 5 tier · beli lebih banyak, harga
                                    lebih murah
                                </div>
                            </div>
                            {data.price_tiers.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData("price_tiers", [
                                            ...data.price_tiers,
                                            { min_qty: "", price: "" },
                                        ])
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-100"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                    >
                                        <path d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Tier
                                </button>
                            )}
                        </div>
                        {data.price_tiers.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic text-center py-3">
                                Belum ada tier grosir.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {data.price_tiers.map((t, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-12 gap-2 items-center"
                                    >
                                        <span className="col-span-2 inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 border border-primary-100 justify-self-start">
                                            Tier {i + 1}
                                        </span>
                                        <div className="col-span-4 relative">
                                            <input
                                                type="number"
                                                min="1"
                                                value={t.min_qty}
                                                onChange={(e) => {
                                                    const tiers = [
                                                        ...data.price_tiers,
                                                    ];
                                                    tiers[i] = {
                                                        ...tiers[i],
                                                        min_qty: e.target.value,
                                                    };
                                                    setData(
                                                        "price_tiers",
                                                        tiers,
                                                    );
                                                }}
                                                placeholder="Min qty"
                                                className="w-full rounded-lg border border-border px-2.5 py-1.5 pr-10 text-xs"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                {product.unit}
                                            </span>
                                        </div>
                                        <div className="col-span-5 relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={t.price}
                                                onChange={(e) => {
                                                    const tiers = [
                                                        ...data.price_tiers,
                                                    ];
                                                    tiers[i] = {
                                                        ...tiers[i],
                                                        price: e.target.value,
                                                    };
                                                    setData(
                                                        "price_tiers",
                                                        tiers,
                                                    );
                                                }}
                                                placeholder="Harga"
                                                className="w-full rounded-lg border border-border py-1.5 pl-8 pr-2 text-xs"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "price_tiers",
                                                    data.price_tiers.filter(
                                                        (_, j) => j !== i,
                                                    ),
                                                )
                                            }
                                            className="col-span-1 justify-self-end rounded p-1 text-rose-500 hover:bg-rose-50"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.7}
                                                stroke="currentColor"
                                            >
                                                <path d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Multi Satuan / Kemasan */}
                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-sm font-semibold text-foreground">
                                    Multi Satuan (Kemasan)
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    Cth: Dus berisi 12 {product.unit}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setData("packaging_units", [
                                        ...data.packaging_units,
                                        {
                                            name: "",
                                            conversion_qty: "",
                                            sell_price: "",
                                            barcode: "",
                                        },
                                    ])
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-100"
                            >
                                <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Kemasan
                            </button>
                        </div>
                        {data.packaging_units.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic text-center py-3">
                                Belum ada kemasan tambahan.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {data.packaging_units.map((pu, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-12 gap-2 items-center"
                                    >
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={pu.name}
                                                onChange={(e) => {
                                                    const units = [
                                                        ...data.packaging_units,
                                                    ];
                                                    units[i] = {
                                                        ...units[i],
                                                        name: e.target.value,
                                                    };
                                                    setData(
                                                        "packaging_units",
                                                        units,
                                                    );
                                                }}
                                                placeholder="Nama (Dus, Box)"
                                                className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs"
                                            />
                                        </div>
                                        <div className="col-span-2 relative">
                                            <input
                                                type="number"
                                                min="1"
                                                value={pu.conversion_qty}
                                                onChange={(e) => {
                                                    const units = [
                                                        ...data.packaging_units,
                                                    ];
                                                    units[i] = {
                                                        ...units[i],
                                                        conversion_qty:
                                                            e.target.value,
                                                    };
                                                    setData(
                                                        "packaging_units",
                                                        units,
                                                    );
                                                }}
                                                placeholder="12"
                                                className="w-full rounded-lg border border-border px-2.5 py-1.5 pr-8 text-xs"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                {product.unit}
                                            </span>
                                        </div>
                                        <div className="col-span-3 relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={pu.sell_price}
                                                onChange={(e) => {
                                                    const units = [
                                                        ...data.packaging_units,
                                                    ];
                                                    units[i] = {
                                                        ...units[i],
                                                        sell_price:
                                                            e.target.value,
                                                    };
                                                    setData(
                                                        "packaging_units",
                                                        units,
                                                    );
                                                }}
                                                placeholder="Harga"
                                                className="w-full rounded-lg border border-border py-1.5 pl-8 pr-2 text-xs"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={pu.barcode}
                                                onChange={(e) => {
                                                    const units = [
                                                        ...data.packaging_units,
                                                    ];
                                                    units[i] = {
                                                        ...units[i],
                                                        barcode: e.target.value,
                                                    };
                                                    setData(
                                                        "packaging_units",
                                                        units,
                                                    );
                                                }}
                                                placeholder="Barcode"
                                                className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "packaging_units",
                                                    data.packaging_units.filter(
                                                        (_, j) => j !== i,
                                                    ),
                                                )
                                            }
                                            className="col-span-1 justify-self-end rounded p-1 text-rose-500 hover:bg-rose-50"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.7}
                                                stroke="currentColor"
                                            >
                                                <path d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        {pu.conversion_qty > 0 &&
                                            pu.sell_price > 0 && (
                                                <div className="col-span-12 text-[11px] text-muted-foreground pl-1">
                                                    ≈{" "}
                                                    <span className="font-semibold text-success">
                                                        Rp{" "}
                                                        {Math.round(
                                                            pu.sell_price /
                                                                pu.conversion_qty,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}{" "}
                                                        / {product.unit}
                                                    </span>
                                                </div>
                                            )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="inline-flex justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                        >
                            Batal
                        </button>
                        <Button
                            type="submit"
                            loading={processing}
                        >
                            {isEdit
                                ? "Simpan Perubahan"
                                : "Tambah Varian"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function Variants({ product }) {
    const { flash } = usePage().props;
    const [showForm, setShowForm] = useState(false);
    const [editVariant, setEditVariant] = useState(null);
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const variants = product.variants || [];

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(
            route("admin.products.variants.destroy", [product.id, target.id]),
            {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    setTarget(null);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("admin.products.show", product.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Varian Produk
                            </h2>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            setEditVariant(null);
                            setShowForm(true);
                        }}
                        icon={Plus}
                    >
                        <span className="hidden sm:inline">Tambah Varian</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                </div>
            }
        >
            <Head title={`Varian - ${product.name}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {flash.error}
                </div>
            )}

            {/* Product summary card */}
            <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    {product.image ? (
                        <img
                            src={`/storage/${product.image}`}
                            alt={product.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover border border-border"
                        />
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-500/10">
                            <svg
                                className="h-7 w-7 text-primary-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                                />
                            </svg>
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                            {product.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span>
                                SKU:{" "}
                                <span className="font-mono font-medium text-foreground">
                                    {product.sku}
                                </span>
                            </span>
                            {product.barcode && (
                                <span>
                                    Barcode:{" "}
                                    <span className="font-mono font-medium text-foreground">
                                        {product.barcode}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="hidden sm:block text-right">
                        <p className="text-sm text-muted-foreground">Total Varian</p>
                        <p className="text-2xl font-bold text-primary-600">
                            {variants.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Variants table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {variants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <svg
                                className="h-8 w-8 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            Belum ada varian
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            Tambahkan varian untuk produk ini (contoh: Ukuran S,
                            M, L atau Warna Merah, Biru).
                        </p>
                        <Button
                            onClick={() => {
                                setEditVariant(null);
                                setShowForm(true);
                            }}
                            icon={Plus}
                            className="mt-5"
                        >
                            Tambah Varian
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        <th className="px-5 py-3.5">
                                            Nama Varian
                                        </th>
                                        <th className="px-5 py-3.5">SKU</th>
                                        <th className="px-5 py-3.5 hidden lg:table-cell">
                                            Barcode
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            Harga Beli
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            Harga Jual
                                        </th>
                                        <th className="px-5 py-3.5 text-center">
                                            Grosir
                                        </th>
                                        <th className="px-5 py-3.5 text-center">
                                            Kemasan
                                        </th>
                                        <th className="px-5 py-3.5 text-center">
                                            Status
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {variants.map((v) => (
                                        <tr
                                            key={v.id}
                                            className="transition hover:bg-muted/70"
                                        >
                                            <td className="px-5 py-4 font-medium text-foreground">
                                                {v.name}
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground font-mono text-xs">
                                                {v.sku}
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">
                                                {v.barcode || (
                                                    <span className="text-muted-foreground/50 italic text-xs">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right text-muted-foreground">
                                                {fmt(v.cost_price)}
                                            </td>
                                            <td className="px-5 py-4 text-right font-medium text-foreground">
                                                {fmt(v.price)}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {v.price_tiers?.length > 0 ? (
                                                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                                                        {v.price_tiers.length}{" "}
                                                        tier
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {v.packaging_units?.length >
                                                0 ? (
                                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                        {
                                                            v.packaging_units
                                                                .length
                                                        }{" "}
                                                        kemasan
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.is_active ? "bg-emerald-100 text-success" : "bg-muted text-muted-foreground"}`}
                                                >
                                                    {v.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditVariant(v);
                                                            setShowForm(true);
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                                        title="Edit"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.7}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setTarget(v)
                                                        }
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                        title="Hapus"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.7}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-border md:hidden">
                            {variants.map((v) => (
                                <div key={v.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-foreground">
                                                    {v.name}
                                                </p>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.is_active ? "bg-emerald-100 text-success" : "bg-muted text-muted-foreground"}`}
                                                >
                                                    {v.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                SKU: {v.sku}
                                                {v.barcode
                                                    ? ` · ${v.barcode}`
                                                    : ""}
                                            </p>
                                            <div className="mt-2 flex items-center gap-3 text-sm">
                                                <span className="font-semibold text-foreground">
                                                    {fmt(v.price)}
                                                </span>
                                                {Number(v.cost_price || 0) >
                                                    0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Beli:{" "}
                                                        {fmt(v.cost_price)}
                                                    </span>
                                                )}
                                            </div>
                                            {(v.price_tiers?.length > 0 ||
                                                v.packaging_units?.length >
                                                    0) && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {v.price_tiers?.length >
                                                        0 && (
                                                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                                                            {
                                                                v.price_tiers
                                                                    .length
                                                            }{" "}
                                                            grosir
                                                        </span>
                                                    )}
                                                    {v.packaging_units
                                                        ?.length > 0 && (
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                                            {
                                                                v.packaging_units
                                                                    .length
                                                            }{" "}
                                                            kemasan
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                setEditVariant(v);
                                                setShowForm(true);
                                            }}
                                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
                                        >
                                            <svg
                                                className="h-3.5 w-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.7}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                                />
                                            </svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setTarget(v)}
                                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                        >
                                            <svg
                                                className="h-3.5 w-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.7}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                />
                                            </svg>
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Form modal */}
            {showForm && (
                <VariantForm
                    product={product}
                    variant={editVariant}
                    onClose={() => {
                        setShowForm(false);
                        setEditVariant(null);
                    }}
                    onSaved={() => {
                        setShowForm(false);
                        setEditVariant(null);
                    }}
                />
            )}

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus varian?"
                description={
                    target
                        ? `Varian "${target.name}" akan dihapus permanen. Data grosir dan kemasan terkait juga akan dihapus.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
