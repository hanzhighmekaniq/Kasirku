import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function Index({ branches = [], stores = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [filterStore, setFilterStore] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [deleting, setDeleting] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 10;

    const q = search.trim().toLowerCase();
    const filtered = branches.filter((b) => {
        const matchSearch =
            !q ||
            b.name.toLowerCase().includes(q) ||
            b.code.toLowerCase().includes(q) ||
            (b.store?.name ?? "").toLowerCase().includes(q);
        const matchStore =
            filterStore === "all" || String(b.store?.id) === filterStore;
        const matchStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && b.is_active) ||
            (filterStatus === "inactive" && !b.is_active);
        return matchSearch && matchStore && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    const stats = {
        all: branches.length,
        active: branches.filter((b) => b.is_active).length,
        inactive: branches.filter((b) => !b.is_active).length,
    };

    useEffect(() => {
        setPage(1);
    }, [search, filterStore, filterStatus]);

    function handleDelete(b) {
        if (
            !confirm(
                `Hapus cabang "${b.name}"? Data terkait akan ikut terhapus.`,
            )
        )
            return;
        setDeleting(b.id);
        router.delete(route("developer.branches.destroy", b.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    }

    const STATUS_CHIPS = [
        { key: "all", label: `Semua (${stats.all})` },
        { key: "active", label: `Aktif (${stats.active})` },
        { key: "inactive", label: `Nonaktif (${stats.inactive})` },
    ];

    const storeOptions = [
        { key: "all", label: "Semua Toko" },
        ...stores.map((s) => ({
            key: String(s.id),
            label: `${s.name}`,
        })),
    ];

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Kelola Cabang
                        </h2>
                        <p className="text-xs text-slate-500">
                            {branches.length} cabang
                        </p>
                    </div>
                    <Link
                        href={route("developer.branches.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
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
                    </Link>
                </div>
            }
        >
            <Head title="Kelola Cabang" />

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
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                    </svg>
                    {flash.error}
                </div>
            )}

            {/* Search & Store filter */}
            <div className="mb-3 flex flex-col gap-3 sm:flex-row">
                {/* Search */}
                <div className="relative flex-1">
                    <svg
                        className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama, kode, atau toko..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth={2.5}
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

                {/* Store dropdown */}
                <div className="relative">
                    <select
                        value={filterStore}
                        onChange={(e) => setFilterStore(e.target.value)}
                        className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                    >
                        {storeOptions.map((t) => (
                            <option key={t.key} value={t.key}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                    <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                    </svg>
                </div>
            </div>

            {/* Status filter chips */}
            <div className="mb-5 flex flex-wrap gap-2">
                {STATUS_CHIPS.map((chip) => (
                    <button
                        key={chip.key}
                        onClick={() => setFilterStatus(chip.key)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            filterStatus === chip.key
                                ? "bg-slate-900 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {branches.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-4xl">
                            🏢
                        </div>
                        <p className="mt-5 text-base font-semibold text-slate-800">
                            Belum ada cabang
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Mulai dengan menambahkan cabang pertama.
                        </p>
                        <Link
                            href={route("developer.branches.create")}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:to-teal-700"
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
                        </Link>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
                            <svg
                                className="h-10 w-10 text-slate-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                        </div>
                        <p className="mt-5 font-semibold text-slate-700">
                            Tidak ada cabang ditemukan
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            Coba ubah filter atau kata kunci pencarian.
                        </p>
                        <button
                            onClick={() => {
                                setSearch("");
                                setFilterStore("all");
                                setFilterStatus("all");
                            }}
                            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    <>
                        <table className="w-full table-fixed text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="w-[36%] px-5 py-3.5">
                                        Cabang
                                    </th>
                                    <th className="w-[20%] px-5 py-3.5">
                                        Toko
                                    </th>
                                    <th className="w-[12%] px-5 py-3.5 text-center">
                                        Status
                                    </th>
                                    <th className="w-[32%] px-5 py-3.5 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginated.map((b) => (
                                    <tr
                                        key={b.id}
                                        className="group transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">
                                                    🏢
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {b.name}
                                                    </p>
                                                    <p className="text-xs font-mono text-slate-400">
                                                        {b.code}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-slate-600">
                                                {b.store?.name ?? "-"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    b.is_active
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
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
                                                        "developer.branches.show",
                                                        b.id,
                                                    )}
                                                    title="Detail"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.7}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                    </svg>
                                                </Link>
                                                <Link
                                                    href={route(
                                                        "developer.branches.edit",
                                                        b.id,
                                                    )}
                                                    title="Edit"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
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
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
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

                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                            <p className="text-xs text-slate-500">
                                Menampilkan{" "}
                                {filtered.length === 0 ? 0 : start + 1}–
                                {Math.min(start + perPage, filtered.length)}{" "}
                                dari {filtered.length} cabang
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={page === 1}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Sebelumnya
                                </button>
                                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
                                    disabled={page === totalPages}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DeveloperLayout>
    );
}
