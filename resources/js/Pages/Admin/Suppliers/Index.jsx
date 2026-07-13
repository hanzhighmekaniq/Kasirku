import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Eye } from "lucide-react";

export default function Index({ suppliers, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = suppliers.filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            s.name.toLowerCase().includes(q) ||
            (s.code ?? "").toLowerCase().includes(q) ||
            (s.phone ?? "").includes(q) ||
            (s.email ?? "").toLowerCase().includes(q) ||
            (s.contact_person ?? "").toLowerCase().includes(q)
        );
    });

    const handleDelete = () => {
        if (!confirmDelete) return;
        setProcessing(true);
        router.delete(route("admin.suppliers.destroy", confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setConfirmDelete(null);
            },
        });
    };

    const fmtCurrency = (v) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(v || 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Supplier
                        </h2>
                    </div>
                    <Link
                        href={route("admin.suppliers.create")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
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
                        Tambah Supplier
                    </Link>
                </div>
            }
        >
            <Head title="Supplier" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.errors && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {typeof flash.errors === "object"
                        ? Object.values(flash.errors).flat().join(". ")
                        : flash.errors}
                </div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">
                        Total Supplier
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                        {stats.total}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">
                        Total Produk
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                        {stats.total_products}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-blue-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">
                        Total Pembelian
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                        {stats.total_purchases}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">
                        Nilai Pembelian
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                        {fmtCurrency(stats.total_purchase_value)}
                    </p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg
                                    className="h-4 w-4"
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
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, kode, telepon, email..."
                                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan{" "}
                            <span className="font-semibold text-slate-700">
                                {filtered.length}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-slate-700">
                                {suppliers.length}
                            </span>{" "}
                            supplier
                        </p>
                    </div>
                </div>

                {filtered.length === 0 ? (
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
                                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {search
                                ? "Supplier tidak ditemukan"
                                : "Belum ada supplier"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {search
                                ? "Coba kata kunci lain."
                                : "Mulai dengan menambahkan supplier pertama."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    <th className="px-6 py-3.5 font-medium text-slate-500">
                                        Supplier
                                    </th>
                                    <th className="px-6 py-3.5 font-medium text-slate-500">
                                        Kontak
                                    </th>
                                    <th className="px-6 py-3.5 font-medium text-slate-500">
                                        Telepon
                                    </th>
                                    <th className="px-6 py-3.5 text-center font-medium text-slate-500">
                                        Produk
                                    </th>
                                    <th className="px-6 py-3.5 text-center font-medium text-slate-500">
                                        Pembelian
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-medium text-slate-500">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="transition hover:bg-slate-50/50"
                                    >
                                        <td className="px-6 py-3.5">
                                            <Link
                                                href={route(
                                                    "admin.suppliers.show",
                                                    s.id,
                                                )}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
                                                    {s.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 hover:text-indigo-600 transition">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {s.code}
                                                    </p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            {s.contact_person || (
                                                <span className="text-slate-300">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            {s.phone ? (
                                                <a
                                                    href={`tel:${s.phone}`}
                                                    className="hover:text-indigo-600 transition"
                                                >
                                                    {s.phone}
                                                </a>
                                            ) : (
                                                <span className="text-slate-300">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className="inline-flex min-w-[28px] justify-center rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                                {s.products_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className="inline-flex min-w-[28px] justify-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                                {s.purchases_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={route(
                                                        "admin.suppliers.show",
                                                        s.id,
                                                    )}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-5 w-5" strokeWidth={1.8} />
                                                </Link>
                                                <Link
                                                    href={route(
                                                        "admin.suppliers.edit",
                                                        s.id,
                                                    )}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
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
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        setConfirmDelete(s)
                                                    }
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
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
                )}
            </div>

            {/* Confirm delete modal */}
            {confirmDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onMouseDown={() => !processing && setConfirmDelete(null)}
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    <div
                        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-slate-900">
                            Hapus Supplier?
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Supplier <strong>{confirmDelete.name}</strong> (
                            {confirmDelete.code}) akan dihapus permanen.{" "}
                            {confirmDelete.purchases_count > 0 &&
                                "Supplier ini memiliki data pembelian."}
                        </p>
                        {confirmDelete.purchases_count > 0 && (
                            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                Supplier ini memiliki{" "}
                                {confirmDelete.purchases_count} pembelian dan
                                tidak dapat dihapus.
                            </p>
                        )}
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                disabled={processing}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={
                                    processing ||
                                    confirmDelete.purchases_count > 0
                                }
                                className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/30 transition hover:from-red-600 hover:to-red-700 disabled:opacity-60"
                            >
                                {processing ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
