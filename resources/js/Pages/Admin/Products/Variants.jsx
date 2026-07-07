import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const inputCls =
    "block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function VariantForm({ product, variant, onClose, onSaved }) {
    const isEdit = !!variant;
    const { data, setData, post, put, processing, errors } = useForm({
        name: variant?.name || "",
        sku: variant?.sku || "",
        barcode: variant?.barcode || "",
        price: variant?.price ?? product.sell_price ?? "",
        cost_price: variant?.cost_price ?? product.cost_price ?? "",
        is_active: variant?.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(
                route("admin.products.variants.update", [
                    product.id,
                    variant.id,
                ]),
                {
                    onSuccess: () => onSaved?.(),
                },
            );
        } else {
            post(route("admin.products.variants.store", product.id), {
                onSuccess: () => onSaved?.(),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                <h3 className="text-base font-semibold text-slate-900">
                    {isEdit ? "Edit Varian" : "Tambah Varian"}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                    Produk: {product.name}
                </p>

                <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Nama Varian <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className={inputCls}
                            placeholder="Contoh: Large, Merah, dll"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                SKU <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.sku}
                                onChange={(e) => setData("sku", e.target.value)}
                                className={inputCls}
                                placeholder="SKU unik varian"
                            />
                            {errors.sku && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.sku}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Barcode
                            </label>
                            <input
                                type="text"
                                value={data.barcode}
                                onChange={(e) =>
                                    setData("barcode", e.target.value)
                                }
                                className={inputCls}
                                placeholder="Opsional"
                            />
                            {errors.barcode && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.barcode}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Harga Jual{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.price}
                                onChange={(e) =>
                                    setData("price", e.target.value)
                                }
                                className={inputCls}
                            />
                            {errors.price && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.price}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Harga Beli
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.cost_price}
                                onChange={(e) =>
                                    setData("cost_price", e.target.value)
                                }
                                className={inputCls}
                            />
                            {errors.cost_price && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.cost_price}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setData("is_active", !data.is_active)
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.is_active ? "bg-indigo-600" : "bg-slate-200"}`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.is_active ? "translate-x-5" : "translate-x-0"}`}
                            />
                        </button>
                        <span className="text-sm font-medium text-slate-700">
                            Aktif
                        </span>
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                        >
                            {processing
                                ? "Menyimpan..."
                                : isEdit
                                  ? "Simpan Perubahan"
                                  : "Tambah Varian"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

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
                            href={route("admin.products.index")}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
                            <h2 className="text-lg font-semibold text-slate-800">
                                Varian Produk
                            </h2>
                            <p className="text-sm text-slate-500">
                                {product.name} &middot; SKU: {product.sku}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setEditVariant(null);
                            setShowForm(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
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
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        <span className="hidden sm:inline">Tambah Varian</span>
                        <span className="sm:hidden">Tambah</span>
                    </button>
                </div>
            }
        >
            <Head title={`Varian - ${product.name}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            {/* Product summary card */}
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    {product.image ? (
                        <img
                            src={`/storage/${product.image}`}
                            alt={product.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover border border-slate-200"
                        />
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                            <svg
                                className="h-7 w-7 text-indigo-400"
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
                        <p className="font-semibold text-slate-800">
                            {product.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span>
                                Harga Jual:{" "}
                                <span className="font-medium text-slate-700">
                                    Rp{" "}
                                    {Number(
                                        product.sell_price || 0,
                                    ).toLocaleString("id-ID")}
                                </span>
                            </span>
                            <span>
                                Harga Beli:{" "}
                                <span className="font-medium text-slate-700">
                                    Rp{" "}
                                    {Number(
                                        product.cost_price || 0,
                                    ).toLocaleString("id-ID")}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className="hidden sm:block text-right">
                        <p className="text-sm text-slate-500">Total Varian</p>
                        <p className="text-2xl font-bold text-indigo-600">
                            {variants.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Variants table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {variants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                            <svg
                                className="h-8 w-8 text-slate-400"
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
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            Belum ada varian
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            Tambahkan varian untuk produk ini (contoh: Ukuran S,
                            M, L atau Warna Merah, Biru).
                        </p>
                        <button
                            onClick={() => {
                                setEditVariant(null);
                                setShowForm(true);
                            }}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
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
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                            Tambah Varian
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                                            Status
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {variants.map((v) => (
                                        <tr
                                            key={v.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4 font-medium text-slate-800">
                                                {v.name}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 font-mono text-xs">
                                                {v.sku}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 hidden lg:table-cell">
                                                {v.barcode || (
                                                    <span className="text-slate-300 italic text-xs">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right text-slate-500">
                                                Rp{" "}
                                                {Number(
                                                    v.cost_price || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-5 py-4 text-right font-medium text-slate-800">
                                                Rp{" "}
                                                {Number(
                                                    v.price || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
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
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
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
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
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
                        <div className="divide-y divide-slate-100 md:hidden">
                            {variants.map((v) => (
                                <div key={v.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-800">
                                                    {v.name}
                                                </p>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                                >
                                                    {v.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                SKU: {v.sku}
                                                {v.barcode
                                                    ? ` · ${v.barcode}`
                                                    : ""}
                                            </p>
                                            <div className="mt-2 flex items-center gap-3 text-sm">
                                                <span className="font-semibold text-slate-800">
                                                    Rp{" "}
                                                    {Number(
                                                        v.price || 0,
                                                    ).toLocaleString("id-ID")}
                                                </span>
                                                {Number(v.cost_price || 0) >
                                                    0 && (
                                                    <span className="text-xs text-slate-500">
                                                        Beli: Rp{" "}
                                                        {Number(
                                                            v.cost_price,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                setEditVariant(v);
                                                setShowForm(true);
                                            }}
                                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
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
                                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
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
                        ? `Varian "${target.name}" akan dihapus permanen.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
