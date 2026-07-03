import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

export default function AllIndex({ branches, stores = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedStore, setSelectedStore] = useState("");
    const [storeSearch, setStoreSearch] = useState("");
    const { data, setData, post, processing, errors, reset } = useForm({
        code: "",
        name: "",
        phone: "",
        address: "",
        is_active: true,
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return branches;
        return branches.filter(
            (b) =>
                b.name.toLowerCase().includes(q) ||
                (b.code || "").toLowerCase().includes(q) ||
                (b.store?.name || "").toLowerCase().includes(q) ||
                (b.phone || "").toLowerCase().includes(q),
        );
    }, [branches, search]);

    const filteredStores = storeSearch.trim()
        ? stores.filter(
              (s) =>
                  s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                  s.code.toLowerCase().includes(storeSearch.toLowerCase()),
          )
        : stores;

    const handleDelete = (branch) => {
        if (!confirm(`Hapus cabang "${branch.name}"?`)) return;
        setDeleting(branch.id);
        router.delete(
            route("developer.stores.branches.destroy", [
                branch.store_id,
                branch,
            ]),
            {
                preserveScroll: true,
                onFinish: () => setDeleting(null),
            },
        );
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Semua Cabang
                        </h2>
                        <p className="text-xs text-slate-500">
                            {branches.length} cabang dari semua toko
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setShowCreate(true);
                            reset();
                            setSelectedStore("");
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
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
                        Tambah Cabang
                    </button>
                </div>
            }
        >
            <Head title="Semua Cabang" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    {flash.success}
                </div>
            )}

            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                    {flash.error}
                </div>
            )}

            {/* Search */}
            {branches.length > 0 && (
                <div className="mb-4">
                    <div className="relative max-w-sm">
                        <svg
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                            />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari cabang atau toko..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        />
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {!showCreate && branches.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <span className="text-5xl mb-4">🏢</span>
                        <p className="text-base font-semibold text-slate-800">
                            Belum ada cabang
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            Tambahkan cabang untuk setiap toko yang sudah
                            dibuat.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5">Kode</th>
                                    <th className="px-5 py-3.5">Nama Cabang</th>
                                    <th className="px-5 py-3.5">Toko</th>
                                    <th className="px-5 py-3.5">Telepon</th>
                                    <th className="px-5 py-3.5 text-center">
                                        Penjualan
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
                                {filtered.map((b) => (
                                    <tr
                                        key={b.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                                            {b.code}
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-slate-800">
                                            {b.name}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Link
                                                href={route(
                                                    "developer.stores.branches.index",
                                                    b.store_id,
                                                )}
                                                className="text-emerald-600 hover:underline"
                                            >
                                                {b.store?.name ?? "—"}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {b.phone || "—"}
                                        </td>
                                        <td className="px-5 py-4 text-center text-slate-600">
                                            {b.sales_count ?? 0}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                            >
                                                {b.is_active
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={route(
                                                        "developer.stores.branches.edit",
                                                        [b.store_id, b],
                                                    )}
                                                    title="Edit"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
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
                                                        handleDelete(b)
                                                    }
                                                    disabled={deleting === b.id}
                                                    title="Hapus"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
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

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-16">
                    <div
                        className="fixed inset-0 bg-black/30"
                        onClick={() => setShowCreate(false)}
                    />
                    <div className="relative z-10 mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Tambah Cabang Baru
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih toko tujuan untuk cabang ini
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Store Selector */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Pilih Toko{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                {!selectedStore ? (
                                    <div>
                                        <div className="relative">
                                            <svg
                                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                                />
                                            </svg>
                                            <input
                                                type="text"
                                                value={storeSearch}
                                                onChange={(e) =>
                                                    setStoreSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Cari toko..."
                                                className="block w-full rounded-lg border-slate-300 py-1.5 pl-9 pr-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                            />
                                        </div>
                                        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
                                            {filteredStores.length > 0 ? (
                                                filteredStores.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedStore(
                                                                s.id,
                                                            );
                                                            setStoreSearch("");
                                                        }}
                                                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-emerald-50 transition border-b border-slate-100 last:border-0"
                                                    >
                                                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                                                            {s.code?.charAt(
                                                                0,
                                                            ) ?? "?"}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-700 truncate">
                                                                {s.name}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {s.code}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="px-3 py-3 text-center text-sm text-slate-400">
                                                    Tidak ditemukan
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                                        <span className="text-sm font-medium text-emerald-700">
                                            {stores.find(
                                                (s) => s.id === selectedStore,
                                            )?.name ?? "Toko"}
                                        </span>
                                        <button
                                            onClick={() => setSelectedStore("")}
                                            className="ml-auto text-emerald-400 hover:text-red-500"
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
                                )}
                            </div>

                            {/* Branch Form — only shown after store selected */}
                            {selectedStore && (
                                <div className="border-t border-slate-100 pt-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                                Kode Cabang{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.code}
                                                onChange={(e) =>
                                                    setData(
                                                        "code",
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                className="block w-full rounded-lg border-slate-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                placeholder="cth. BR001"
                                            />
                                            {errors.code && (
                                                <p className="mt-1 text-xs text-red-500">
                                                    {errors.code}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                                Nama Cabang{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        "name",
                                                        e.target.value,
                                                    )
                                                }
                                                className="block w-full rounded-lg border-slate-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                placeholder="cth. Cabang Pusat"
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-xs text-red-500">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                                Telepon
                                            </label>
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={(e) =>
                                                    setData(
                                                        "phone",
                                                        e.target.value,
                                                    )
                                                }
                                                className="block w-full rounded-lg border-slate-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                placeholder="08xxxxxxxxxx"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                                Alamat
                                            </label>
                                            <input
                                                type="text"
                                                value={data.address}
                                                onChange={(e) =>
                                                    setData(
                                                        "address",
                                                        e.target.value,
                                                    )
                                                }
                                                className="block w-full rounded-lg border-slate-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                placeholder="Jl. Contoh No. 1"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreate(false);
                                                setSelectedStore("");
                                            }}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            disabled={
                                                !selectedStore || processing
                                            }
                                            onClick={() => {
                                                post(
                                                    route(
                                                        "developer.stores.branches.store",
                                                        selectedStore,
                                                    ),
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setShowCreate(
                                                                false,
                                                            );
                                                            reset();
                                                            setSelectedStore(
                                                                "",
                                                            );
                                                        },
                                                    },
                                                );
                                            }}
                                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {processing
                                                ? "Menyimpan..."
                                                : "Simpan Cabang"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DeveloperLayout>
    );
}
