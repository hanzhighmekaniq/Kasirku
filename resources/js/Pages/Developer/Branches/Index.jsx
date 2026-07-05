import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState, useEffect } from "react";

const STORE_TYPE = {
    retail: { label: "Retail", icon: "🏪", cls: "bg-blue-50 text-blue-700" },
    fnb: {
        label: "FnB / Cafe",
        icon: "☕",
        cls: "bg-orange-50 text-orange-700",
    },
    service: {
        label: "Service",
        icon: "✂️",
        cls: "bg-violet-50 text-violet-700",
    },
    rental: {
        label: "Rental",
        icon: "🔑",
        cls: "bg-yellow-50 text-yellow-700",
    },
    ticket: { label: "Tiket", icon: "🎟️", cls: "bg-rose-50 text-rose-700" },
    hospitality: {
        label: "Hospitality",
        icon: "🏨",
        cls: "bg-amber-50 text-amber-700",
    },
    parking: { label: "Parkir", icon: "🅿️", cls: "bg-slate-50 text-slate-700" },
    session: { label: "Session", icon: "🎮", cls: "bg-cyan-50 text-cyan-700" },
};

export default function Index({
    stores = [],
    branches = [],
    selectedStoreId = null,
}) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [filterStore, setFilterStore] = useState(
        selectedStoreId ? String(selectedStoreId) : "",
    );
    const [filterStatus, setFilterStatus] = useState("all");
    const [deleting, setDeleting] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Pre-select store from URL param
    useEffect(() => {
        if (selectedStoreId) setFilterStore(String(selectedStoreId));
    }, [selectedStoreId]);

    const stats = {
        all: branches.length,
        active: branches.filter((b) => b.is_active).length,
        inactive: branches.filter((b) => !b.is_active).length,
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return branches.filter((b) => {
            const matchSearch =
                !q ||
                b.name.toLowerCase().includes(q) ||
                (b.code || "").toLowerCase().includes(q) ||
                (b.phone || "").toLowerCase().includes(q) ||
                (b.store?.name || "").toLowerCase().includes(q);
            const matchStore =
                !filterStore || String(b.store_id) === filterStore;
            const matchStatus =
                filterStatus === "all" ||
                (filterStatus === "active" && b.is_active) ||
                (filterStatus === "inactive" && !b.is_active);
            return matchSearch && matchStore && matchStatus;
        });
    }, [branches, search, filterStore, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    useEffect(() => {
        setPage(1);
    }, [search, filterStore, filterStatus]);

    const selectedStore = stores.find((s) => String(s.id) === filterStore);

    const handleDelete = (b) => {
        if (!confirm(`Hapus cabang "${b.name}"?`)) return;
        setDeleting(b.id);
        const routeName = filterStore
            ? "developer.stores.branches.destroy"
            : "developer.stores.branches.destroy";
        const params = filterStore ? [filterStore, b.id] : [b.store_id, b.id];
        router.delete(route(routeName, params), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    const STATUS_CHIPS = [
        { key: "all", label: `Semua (${stats.all})` },
        { key: "active", label: `Aktif (${stats.active})` },
        { key: "inactive", label: `Nonaktif (${stats.inactive})` },
    ];

    const createRoute = filterStore
        ? route("developer.stores.branches.create", filterStore)
        : route("developer.branches.create");

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {selectedStore
                                ? selectedStore.name
                                : "Kelola Cabang"}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {filtered.length} cabang
                        </p>
                    </div>
                    <Link
                        href={createRoute}
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
            <Head
                title={
                    selectedStore
                        ? `Cabang — ${selectedStore.name}`
                        : "Semua Cabang"
                }
            />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <svg
                        className="h-4 w-4 shrink-0"
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
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
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

            {/* Search + Store Filter + Status Chips */}
            <div className="mb-5 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
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
                            placeholder="Cari cabang..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
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
                    <select
                        value={filterStore}
                        onChange={(e) => setFilterStore(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="">Semua Toko</option>
                        {stores.map((s) => (
                            <option key={s.id} value={s.id}>
                                {(STORE_TYPE[s.store_type] ?? {}).icon || "🏬"}{" "}
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap gap-2">
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
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {branches.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <span className="text-5xl mb-4">🏢</span>
                        <p className="text-base font-semibold text-slate-800">
                            Belum ada cabang
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            Tambahkan cabang dari halaman toko.
                        </p>
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
                                setFilterStore("");
                                setFilterStatus("all");
                            }}
                            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="w-[5%] px-4 py-2.5">
                                            #
                                        </th>
                                        <th className="w-[25%] px-4 py-2.5">
                                            Cabang
                                        </th>
                                        <th className="w-[20%] px-4 py-2.5">
                                            Toko
                                        </th>
                                        <th className="w-[12%] px-4 py-2.5 text-center">
                                            User
                                        </th>
                                        <th className="w-[12%] px-4 py-2.5 text-center">
                                            Status
                                        </th>
                                        <th className="w-[26%] px-4 py-2.5 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginated.map((b) => {
                                        const tm = STORE_TYPE[
                                            b.store?.store_type
                                        ] ?? {
                                            label: b.store?.store_type || "?",
                                            icon: "🏬",
                                            cls: "bg-slate-100 text-slate-600",
                                        };
                                        return (
                                            <tr
                                                key={b.id}
                                                className="group transition hover:bg-slate-50/60"
                                            >
                                                <td className="px-4 py-3">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                                                        {b.code?.charAt(0) ||
                                                            "?"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                        {b.name}
                                                    </p>
                                                    <p className="text-xs font-mono text-slate-400">
                                                        {b.code}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {b.store ? (
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm text-slate-800">
                                                                {b.store.name}
                                                            </p>
                                                            <span
                                                                className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tm.cls}`}
                                                            >
                                                                {tm.label}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-slate-600">
                                                    {b.employees_count ?? 0}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                                    >
                                                        {b.is_active
                                                            ? "Aktif"
                                                            : "Nonaktif"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={route(
                                                                "developer.stores.branches.show",
                                                                [
                                                                    b.store_id,
                                                                    b.id,
                                                                ],
                                                            )}
                                                            title="Detail"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={
                                                                    1.7
                                                                }
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
                                                                "developer.stores.branches.edit",
                                                                [
                                                                    b.store_id,
                                                                    b.id,
                                                                ],
                                                            )}
                                                            title="Edit"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={
                                                                    1.7
                                                                }
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
                                                            disabled={
                                                                deleting ===
                                                                b.id
                                                            }
                                                            title="Hapus"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={
                                                                    1.7
                                                                }
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                            <p className="text-xs text-slate-500">
                                Menampilkan{" "}
                                {filtered.length === 0 ? 0 : start + 1}-
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
