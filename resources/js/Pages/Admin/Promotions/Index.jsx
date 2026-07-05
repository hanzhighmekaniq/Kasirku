import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const TYPE_LABELS = {
    percentage: "Persen",
    fixed_amount: "Nominal",
    buy_x_get_y: "Beli X Gratis Y",
    bundle: "Bundle",
    tiered: "Harga Tiered",
    member_price: "Harga Member",
    bogo: "Beli X Gratis Produk",
};

const TYPE_COLORS = {
    percentage: "bg-amber-50 text-amber-700",
    fixed_amount: "bg-emerald-50 text-emerald-700",
    buy_x_get_y: "bg-sky-50 text-sky-700",
    bundle: "bg-violet-50 text-violet-700",
    tiered: "bg-cyan-50 text-cyan-700",
    member_price: "bg-pink-50 text-pink-700",
    bogo: "bg-orange-50 text-orange-700",
};

const SCOPE_META = {
    item: { label: "Per Item", icon: "📦", color: "bg-blue-50 text-blue-700" },
    cart: {
        label: "Keranjang",
        icon: "🛒",
        color: "bg-purple-50 text-purple-700",
    },
};

function formatDiscount(promo) {
    if (promo.type === "percentage") return `${Number(promo.discount_value)}%`;
    if (promo.type === "fixed_amount")
        return `Rp ${Number(promo.discount_value).toLocaleString("id-ID")}`;
    if (promo.type === "tiered" || promo.type === "member_price")
        return `Rp ${Number(promo.tier_price || 0).toLocaleString("id-ID")}`;
    if (promo.type === "bogo" || promo.type === "buy_x_get_y")
        return `Beli ${promo.discount_value} gratis 1`;
    return promo.discount_value;
}

function PromoStatus({ promo }) {
    const now = new Date();
    const start = promo.start_date ? new Date(promo.start_date) : null;
    const end = promo.end_date ? new Date(promo.end_date) : null;

    if (!promo.is_active) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Nonaktif
            </span>
        );
    }
    if (start && start > now) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                Terjadwal
            </span>
        );
    }
    if (end && end < now) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Berakhir
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif
        </span>
    );
}

function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function statCount(list, fn) {
    return (list || []).filter(fn).length;
}

export default function Index({ promotions }) {
    const { auth } = usePage().props;
    // Pakai permission, bukan nama role
    const canManage = (auth.permissions ?? []).includes('promotion.create');
    const promos = promotions || [];

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const now = new Date();

    const filtered = useMemo(() => {
        let list = [...promos];
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.code.toLowerCase().includes(q) ||
                    (TYPE_LABELS[p.type] || "").toLowerCase().includes(q),
            );
        }
        if (filterType !== "all") {
            list = list.filter((p) => p.type === filterType);
        }
        if (filterStatus === "active") {
            list = list.filter((p) => {
                if (!p.is_active) return false;
                const s = p.start_date ? new Date(p.start_date) : null;
                const e = p.end_date ? new Date(p.end_date) : null;
                if (s && s > now) return false;
                if (e && e < now) return false;
                return true;
            });
        } else if (filterStatus === "scheduled") {
            list = list.filter(
                (p) =>
                    p.is_active && p.start_date && new Date(p.start_date) > now,
            );
        } else if (filterStatus === "ended") {
            list = list.filter(
                (p) => p.is_active && p.end_date && new Date(p.end_date) < now,
            );
        } else if (filterStatus === "inactive") {
            list = list.filter((p) => !p.is_active);
        }
        return list;
    }, [promos, search, filterType, filterStatus]);

    const activeCount = statCount(promos, (p) => {
        if (!p.is_active) return false;
        const s = p.start_date ? new Date(p.start_date) : null;
        const e = p.end_date ? new Date(p.end_date) : null;
        if (s && s > now) return false;
        if (e && e < now) return false;
        return true;
    });

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.promotions.destroy", target.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setTarget(null);
            },
        });
    };

    const hasFilters = filterType !== "all" || filterStatus !== "all" || search;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Promo
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {activeCount} promo aktif · {promos.length} total
                        </p>
                    </div>
                    {canManage && (
                        <Link
                            href={route("admin.promotions.create")}
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
                            <span className="hidden sm:inline">
                                Tambah Promo
                            </span>
                            <span className="sm:hidden">Tambah</span>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Promo" />

            <div className="space-y-5">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-2xl font-bold text-slate-800">
                            {promos.length}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Total</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 shadow-sm">
                        <p className="text-2xl font-bold text-emerald-700">
                            {activeCount}
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">Aktif</p>
                    </div>
                    <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3 shadow-sm">
                        <p className="text-2xl font-bold text-sky-700">
                            {statCount(
                                promos,
                                (p) =>
                                    p.is_active &&
                                    p.start_date &&
                                    new Date(p.start_date) > now,
                            )}
                        </p>
                        <p className="text-xs text-sky-600 mt-0.5">Terjadwal</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 shadow-sm">
                        <p className="text-2xl font-bold text-amber-700">
                            {new Set(promos.map((p) => p.type)).size}
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">Tipe</p>
                    </div>
                </div>

                {/* Table Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-48">
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
                                    placeholder="Cari promo..."
                                    className="block w-full rounded-lg border-slate-300 py-1.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                            {/* Type filter */}
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="rounded-lg border-slate-300 py-1.5 text-xs font-medium text-slate-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="all">Semua Tipe</option>
                                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                            {/* Status filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) =>
                                    setFilterStatus(e.target.value)
                                }
                                className="rounded-lg border-slate-300 py-1.5 text-xs font-medium text-slate-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="scheduled">Terjadwal</option>
                                <option value="ended">Berakhir</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </div>
                        <p className="text-xs text-slate-400">
                            {filtered.length} promo{hasFilters && " ditemukan"}
                        </p>
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
                                        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 6h.008v.008H6V6z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-slate-800">
                                {hasFilters
                                    ? "Promo tidak ditemukan"
                                    : "Belum ada promo"}
                            </h3>
                            <p className="mt-1 max-w-sm text-sm text-slate-500">
                                {hasFilters
                                    ? "Coba ubah filter atau kata kunci."
                                    : "Buat promo pertama untuk menarik pelanggan."}
                            </p>
                            {!hasFilters && canManage && (
                                <Link
                                    href={route("admin.promotions.create")}
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
                                    Tambah Promo
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="px-5 py-3">Promo</th>
                                            <th className="px-5 py-3">Tipe</th>
                                            <th className="px-5 py-3">
                                                Cakupan
                                            </th>
                                            <th className="px-5 py-3">
                                                Diskon
                                            </th>
                                            <th className="px-5 py-3">
                                                Periode
                                            </th>
                                            <th className="px-5 py-3 text-center">
                                                Status
                                            </th>
                                            {canManage && (
                                                <th className="px-5 py-3 text-right">
                                                    Aksi
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map((promo) => (
                                            <tr
                                                key={promo.id}
                                                className="transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-sm">
                                                            {SCOPE_META[
                                                                promo.scope
                                                            ]?.icon ?? "🏷️"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-slate-800">
                                                                {promo.name}
                                                            </p>
                                                            <p className="text-xs text-slate-400 font-mono">
                                                                {promo.code}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[promo.type] || "bg-slate-100 text-slate-600"}`}
                                                    >
                                                        {TYPE_LABELS[
                                                            promo.type
                                                        ] || promo.type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${(SCOPE_META[promo.scope] ?? {}).color || "bg-slate-100 text-slate-600"}`}
                                                    >
                                                        {SCOPE_META[promo.scope]
                                                            ?.label ??
                                                            promo.scope}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="font-semibold text-slate-800">
                                                        {formatDiscount(promo)}
                                                    </span>
                                                    {promo.products_count >
                                                        0 && (
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {
                                                                promo.products_count
                                                            }{" "}
                                                            produk
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                                                    {formatDate(
                                                        promo.start_date,
                                                    )}{" "}
                                                    —{" "}
                                                    {formatDate(promo.end_date)}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <PromoStatus
                                                        promo={promo}
                                                    />
                                                </td>
                                                {canManage && (
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link
                                                                href={route(
                                                                    "admin.promotions.edit",
                                                                    promo.id,
                                                                )}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
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
                                                                    setTarget(
                                                                        promo,
                                                                    )
                                                                }
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
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
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="divide-y divide-slate-100 md:hidden">
                                {filtered.map((promo) => (
                                    <div key={promo.id} className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-slate-800 truncate">
                                                    {promo.name}
                                                </p>
                                                <p className="text-xs text-slate-400 font-mono">
                                                    {promo.code}
                                                </p>
                                            </div>
                                            <PromoStatus promo={promo} />
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[promo.type] || "bg-slate-100 text-slate-600"}`}
                                            >
                                                {TYPE_LABELS[promo.type] ||
                                                    promo.type}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${(SCOPE_META[promo.scope] ?? {}).color || "bg-slate-100 text-slate-600"}`}
                                            >
                                                {SCOPE_META[promo.scope]
                                                    ?.label ?? promo.scope}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {formatDiscount(promo)}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-xs text-slate-400">
                                            {formatDate(promo.start_date)} —{" "}
                                            {formatDate(promo.end_date)}
                                        </p>
                                        {promo.products_count > 0 && (
                                            <p className="mt-1 text-xs text-slate-400">
                                                {promo.products_count} produk
                                            </p>
                                        )}
                                        {canManage && (
                                            <div className="mt-3 flex justify-end gap-1">
                                                <Link
                                                    href={route(
                                                        "admin.promotions.edit",
                                                        promo.id,
                                                    )}
                                                    className="rounded-lg border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        setTarget(promo)
                                                    }
                                                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus promo?"
                description={
                    target
                        ? `Promo "${target.name}" akan dihapus permanen.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
