import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import SelectDropdown from "@/Components/ui/SelectDropdown";

const STORE_TYPE = {
    retail: { label: "Retail", icon: "🏪", cls: "bg-blue-50 text-blue-700" },
    fnb: { label: "FnB", icon: "☕", cls: "bg-amber-50 text-amber-700" },
    service: {
        label: "Service",
        icon: "✂️",
        cls: "bg-violet-50 text-violet-700",
    },
    rental: {
        label: "Rental",
        icon: "🔑",
        cls: "bg-orange-50 text-orange-700",
    },
    ticket: { label: "Tiket", icon: "🎫", cls: "bg-pink-50 text-pink-700" },
    hospitality: {
        label: "Hospitality",
        icon: "🏨",
        cls: "bg-teal-50 text-teal-700",
    },
    laundry: { label: "Laundry", icon: "👕", cls: "bg-cyan-50 text-cyan-700" },
    parking: { label: "Parkir", icon: "🅿️", cls: "bg-gray-50 text-gray-700" },
    session: { label: "Sesi", icon: "🖥️", cls: "bg-primary-50 text-primary-700" },
};

const PLAN_BADGE = {
    free: { label: "Free", cls: "bg-slate-100 text-slate-600" },
    basic: { label: "Basic", cls: "bg-emerald-50 text-emerald-700" },
    pro: { label: "Pro", cls: "bg-amber-50 text-amber-700" },
    enterprise: { label: "Enterprise", cls: "bg-purple-50 text-purple-700" },
};

export default function Index({ stores, storeTypes }) {
    const { flash } = usePage().props;
    const [deleting, setDeleting] = useState(null);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const perPage = 10;

    /* ── Filter logic ──────────────────────────────────── */
    const filtered = stores.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch =
            !search ||
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            (s.owner_names ?? "").toLowerCase().includes(q) ||
            (s.owners ?? []).some((o) =>
                (o.name ?? "").toLowerCase().includes(q),
            );
        const matchType = filterType === "all" || s.store_type === filterType;
        const matchFilter =
            filter === "all" ||
            (filter === "active" && s.is_active) ||
            (filter === "inactive" && !s.is_active) ||
            (filter === "has_owner" && s.has_owner) ||
            (filter === "no_owner" && !s.has_owner);
        return matchSearch && matchType && matchFilter;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    const stats = {
        all: stores.length,
        active: stores.filter((s) => s.is_active).length,
        inactive: stores.filter((s) => !s.is_active).length,
        has_owner: stores.filter((s) => s.has_owner).length,
        no_owner: stores.filter((s) => !s.has_owner).length,
    };

    useEffect(() => {
        setPage(1);
    }, [search, filterType, filter]);

    const handleDelete = (store) => {
        if (
            !confirm(
                `Hapus toko "${store.name}"? Semua data terkait akan ikut terhapus.`,
            )
        )
            return;
        setDeleting(store.id);
        router.delete(route("developer.stores.destroy", store.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    const FILTER_CHIPS = [
        { key: "all", label: `Semua (${stats.all})` },
        { key: "active", label: `Aktif (${stats.active})` },
        { key: "inactive", label: `Nonaktif (${stats.inactive})` },
        { key: "has_owner", label: `Punya Owner (${stats.has_owner})` },
        { key: "no_owner", label: `Belum Ada (${stats.no_owner})` },
    ];

    const typeOptions = [
        { key: "all", label: "Semua Tipe" },
        ...(storeTypes ?? []).map((t) => ({
            key: t.code,
            label: (t.icon ?? "🏬") + " " + (t.label ?? t.code),
        })),
    ];

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Kelola Toko
                        </h2>
                        <p className="text-xs text-slate-500">
                            {stores.length} toko
                        </p>
                    </div>
                    <Link
                        href={route("developer.stores.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
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
                        Tambah Toko
                    </Link>
                </div>
            }
        >
            <Head title="Kelola Toko" />

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

            {/* ── Filter Bar ─────────────────────────── */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                        placeholder="Cari toko, kode, atau owner..."
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

                {/* Type dropdown */}
                <SelectDropdown
                    value={filterType}
                    options={typeOptions.map(t => ({ value: t.key, label: t.label }))}
                    onChange={(v) => setFilterType(v)}
                    placeholder="Semua Tipe"
                />
            </div>

            {/* ── Status Chips ───────────────────────── */}
            <div className="mb-5 flex flex-wrap gap-2">
                {FILTER_CHIPS.map((chip) => (
                    <button
                        key={chip.key}
                        onClick={() => setFilter(chip.key)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            filter === chip.key
                                ? "bg-slate-900 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            {/* ── Table ──────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-4xl">
                            🏬
                        </div>
                        <p className="mt-5 text-base font-semibold text-slate-800">
                            {stores.length === 0
                                ? "Belum ada toko"
                                : "Tidak ada toko ditemukan"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            {stores.length === 0
                                ? "Mulai dengan menambahkan toko pertama."
                                : "Coba ubah filter atau kata kunci pencarian."}
                        </p>
                        {stores.length === 0 ? (
                            <Link
                                href={route("developer.stores.create")}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-700"
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
                                Tambah Toko
                            </Link>
                        ) : (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setFilterType("all");
                                    setFilter("all");
                                }}
                                className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="w-[24%] px-5 py-3.5">
                                            Toko
                                        </th>
                                        <th className="w-[11%] px-5 py-3.5">
                                            Tipe
                                        </th>
                                        <th className="w-[16%] px-5 py-3.5">
                                            Owner
                                        </th>
                                        <th className="w-[9%] px-5 py-3.5">
                                            Plan
                                        </th>
                                        <th className="w-[8%] px-5 py-3.5 text-center">
                                            User
                                        </th>
                                        <th className="w-[8%] px-5 py-3.5 text-center">
                                            Cabang
                                        </th>
                                        <th className="w-[9%] px-5 py-3.5 text-center">
                                            Status
                                        </th>
                                        <th className="w-[15%] px-5 py-3.5 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginated.map((s) => {
                                        const tm = STORE_TYPE[s.store_type] ?? {
                                            label: s.store_type ?? "-",
                                            icon: "🏬",
                                            cls: "bg-slate-50 text-slate-500",
                                        };
                                        const pb =
                                            PLAN_BADGE[s.plan] ??
                                            PLAN_BADGE.free;
                                        const owners = s.owners ?? [];
                                        const showOwners = owners.slice(0, 1);
                                        const extraCount = owners.length - 1;

                                        return (
                                            <tr
                                                key={s.id}
                                                className="group transition hover:bg-slate-50/70"
                                            >
                                                {/* Toko */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-lg">
                                                            {tm.icon}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={route(
                                                                    "developer.stores.show",
                                                                    s.id,
                                                                )}
                                                                className="text-sm font-semibold text-slate-800 transition hover:text-primary-600 truncate block"
                                                            >
                                                                {s.name}
                                                            </Link>
                                                            <p className="font-mono text-[11px] text-slate-400">
                                                                {s.code}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Tipe */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tm.cls}`}
                                                    >
                                                        {tm.label}
                                                    </span>
                                                </td>

                                                {/* Owner */}
                                                <td className="px-5 py-4">
                                                    {owners.length > 0 ? (
                                                        <div className="space-y-0.5">
                                                            {showOwners.map(
                                                                (o) => (
                                                                    <div
                                                                        key={
                                                                            o.id
                                                                        }
                                                                        className="min-w-0"
                                                                    >
                                                                        <p className="text-xs font-medium text-slate-700 truncate">
                                                                            {
                                                                                o.name
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                ),
                                                            )}
                                                            {extraCount > 0 && (
                                                                <span className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
                                                                    +
                                                                    {extraCount}{" "}
                                                                    lainnya
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs italic text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Plan */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${pb.cls}`}
                                                    >
                                                        {pb.label}
                                                    </span>
                                                </td>

                                                {/* User */}
                                                <td className="px-5 py-4 text-center">
                                                    <span className="text-sm font-medium text-slate-600">
                                                        {s.users_count}
                                                    </span>
                                                </td>

                                                {/* Cabang */}
                                                <td className="px-5 py-4 text-center">
                                                    <span className="text-sm font-medium text-slate-600">
                                                        {s.branches_count}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4 text-center">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                                            s.is_active
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-slate-100 text-slate-500"
                                                        }`}
                                                    >
                                                        {s.is_active
                                                            ? "Aktif"
                                                            : "Nonaktif"}
                                                    </span>
                                                </td>

                                                {/* Aksi */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={route(
                                                                "developer.stores.show",
                                                                s.id,
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
                                                                "developer.stores.edit",
                                                                s.id,
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
                                                                handleDelete(s)
                                                            }
                                                            disabled={
                                                                deleting ===
                                                                s.id
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

                        {/* ── Pagination ───────────────── */}
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                            <p className="text-xs text-slate-500">
                                Menampilkan{" "}
                                {filtered.length === 0 ? 0 : start + 1}–
                                {Math.min(start + perPage, filtered.length)}{" "}
                                dari {filtered.length} toko
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
