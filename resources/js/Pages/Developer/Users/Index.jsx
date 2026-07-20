import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";

const STORE_TYPE = {
    retail: { icon: "🏪", color: "bg-blue-50 text-blue-700 ring-blue-100" },
    fnb: { icon: "☕", color: "bg-orange-50 text-orange-700 ring-orange-100" },
    service: {
        icon: "✂️",
        color: "bg-violet-50 text-violet-700 ring-violet-100",
    },
    rental: { icon: "🔑", color: "bg-amber-50 text-amber-700 ring-amber-100" },
    ticket: { icon: "🎟️", color: "bg-rose-50 text-rose-700 ring-rose-100" },
    hospitality: {
        icon: "🏨",
        color: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    parking: { icon: "🅿️", color: "bg-slate-50 text-slate-700 ring-slate-200" },
    session: { icon: "🎮", color: "bg-cyan-50 text-cyan-700 ring-cyan-100" },
    laundry: {
        icon: "👕",
        color: "bg-violet-50 text-violet-700 ring-violet-100",
    },
    minimarket: { icon: "🏪", color: "bg-blue-50 text-blue-700 ring-blue-100" },
    cafe: { icon: "☕", color: "bg-orange-50 text-orange-700 ring-orange-100" },
};

function ActionDropdown({ user, onDelete, deleting }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${open ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
            >
                <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 z-40 mt-1.5 w-44 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-[scaleIn_120ms_ease-out]">
                    <Link
                        href={route("developer.users.show", user.id)}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                    >
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
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        Detail
                    </Link>
                    <Link
                        href={route("developer.users.edit", user.id)}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-amber-50 hover:text-amber-700"
                    >
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
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                            />
                        </svg>
                        Edit
                    </Link>
                    <hr className="my-1 border-slate-100" />
                    <button
                        onClick={() => {
                            setOpen(false);
                            onDelete(user);
                        }}
                        disabled={deleting === user.id}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
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
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                        </svg>
                        {deleting === user.id ? "Menghapus..." : "Hapus"}
                    </button>
                </div>
            )}
        </div>
    );
}

function ConfirmModal({ user, onConfirm, onCancel, loading }) {
    if (!user) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-[slideUp_200ms_ease-out]">
                <div className="flex flex-col items-center px-6 pt-8 pb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                        <svg
                            className="h-7 w-7 text-red-500"
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
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-800">
                        Hapus User?
                    </h3>
                    <p className="mt-2 text-center text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">
                            {user.name}
                        </span>
                        <br />
                        <span className="text-xs text-slate-400">
                            {user.email}
                        </span>
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                        Tindakan ini tidak bisa dibatalkan.
                    </p>
                </div>
                <div className="flex border-t border-slate-100">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                        Batal
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className="opacity-25"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        className="opacity-75"
                                    />
                                </svg>
                                Menghapus...
                            </>
                        ) : (
                            "Ya, Hapus"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Index({ users, stores }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStore, setFilterStore] = useState("");
    const [deleting, setDeleting] = useState(null);
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 10;

    const filtered = users.filter((u) => {
        const matchSearch =
            !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchType =
            filterType === "all" ||
            (filterType === "developer" && u.is_developer) ||
            (filterType === "store_user" && !u.is_developer);
        const matchStore =
            !filterStore || u.stores?.some((s) => String(s.id) === filterStore);
        return matchSearch && matchType && matchStore;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    const stats = {
        all: users.length,
        developer: users.filter((u) => u.is_developer).length,
        store_user: users.filter((u) => !u.is_developer).length,
    };

    useEffect(() => {
        setPage(1);
    }, [search, filterType, filterStore]);

    const requestDelete = (user) => setConfirmTarget(user);

    const confirmDelete = () => {
        if (!confirmTarget) return;
        setDeleting(confirmTarget.id);
        router.delete(route("developer.users.destroy", confirmTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(null);
                setConfirmTarget(null);
            },
        });
    };

    const TYPE_CHIPS = [
        { key: "all", label: `Semua (${stats.all})` },
        { key: "developer", label: `Developer (${stats.developer})` },
        { key: "store_user", label: `Store User (${stats.store_user})` },
    ];

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Kelola User
                        </h2>
                        <p className="text-xs text-slate-500">
                            {users.length} user terdaftar
                        </p>
                    </div>
                    <Link
                        href={route("developer.users.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Tambah User
                    </Link>
                </div>
            }
        >
            <Head title="Kelola User" />

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
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm">
                        ✕
                    </span>
                    {flash.error}
                </div>
            )}

            {/* Search & Store filter row */}
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
                        placeholder="Cari nama atau email..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
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

                {/* Store filter dropdown */}
                {stores?.length > 0 && (
                    <div className="relative">
                        <select
                            value={filterStore}
                            onChange={(e) => setFilterStore(e.target.value)}
                            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-slate-700 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 cursor-pointer"
                        >
                            <option value="">Semua Toko</option>
                            {stores.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                    {s.name}
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
                )}
            </div>

            {/* Type filter chips */}
            <div className="mb-5 flex flex-wrap gap-2">
                {TYPE_CHIPS.map((chip) => (
                    <button
                        key={chip.key}
                        onClick={() => setFilterType(chip.key)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            filterType === chip.key
                                ? "bg-slate-900 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
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
                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                />
                            </svg>
                        </div>
                        <p className="mt-5 font-semibold text-slate-700">
                            Tidak ada user ditemukan
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            Coba ubah filter atau kata kunci pencarian.
                        </p>
                        {(search || filterType !== "all" || filterStore) && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setFilterType("all");
                                    setFilterStore("");
                                }}
                                className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <table className="w-full table-fixed text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-left">
                                    <th className="w-[34%] px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        User
                                    </th>
                                    <th className="w-[16%] px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Tipe
                                    </th>
                                    <th className="w-[32%] px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Toko & Peran
                                    </th>
                                    <th className="w-[18%] px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginated.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="group transition hover:bg-slate-50/80"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3.5">
                                                <span
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${u.is_developer ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gradient-to-br from-slate-400 to-slate-600"}`}
                                                >
                                                    {u.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-slate-800">
                                                        {u.name}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-400">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {u.is_developer ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
                                                    <span className="text-[10px]">
                                                        ⚡
                                                    </span>{" "}
                                                    Developer
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                                                    <span className="text-[10px]">
                                                        👤
                                                    </span>{" "}
                                                    Store User
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {u.is_developer ? (
                                                <span className="text-xs italic text-slate-400">
                                                    Akses semua toko
                                                </span>
                                            ) : u.stores?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {u.stores
                                                        .slice(0, 2)
                                                        .map((s) => (
                                                            <Link
                                                                key={s.id}
                                                                href={route(
                                                                    "developer.stores.show",
                                                                    s.id,
                                                                )}
                                                                className={`inline-flex max-w-[9rem] items-center gap-1 truncate rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition hover:shadow-sm ${(STORE_TYPE[s.store_type] ?? STORE_TYPE.retail).color}`}
                                                            >
                                                                <span>
                                                                    {
                                                                        (
                                                                            STORE_TYPE[
                                                                                s
                                                                                    .store_type
                                                                            ] ??
                                                                            STORE_TYPE.retail
                                                                        ).icon
                                                                    }
                                                                </span>
                                                                <span className="truncate">
                                                                    {s.name}
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    {u.stores.length > 2 && (
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                                            +
                                                            {u.stores.length -
                                                                2}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-slate-400">
                                                    Belum ada toko
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={route(
                                                        "developer.users.show",
                                                        u.id,
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
                                                        "developer.users.edit",
                                                        u.id,
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
                                                        requestDelete(u)
                                                    }
                                                    disabled={deleting === u.id}
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
                                dari {filtered.length} user
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

            <ConfirmModal
                user={confirmTarget}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmTarget(null)}
                loading={!!deleting}
            />

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-4px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(8px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </DeveloperLayout>
    );
}
