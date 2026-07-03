import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;

const STATUS_MAP = {
    open: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
};
const STATUS_LABEL = {
    open: "Berjalan",
    closed: "Tutup",
};

function SummaryCard({ icon, label, value, accent }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 px-5 py-4">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}
                >
                    <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                    >
                        {icon}
                    </svg>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-400">
                        {label}
                    </p>
                    <p className="text-lg font-bold text-slate-800">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default function Index({ shifts, activeShift, filters, canOpenShift }) {
    const { auth } = usePage().props;
    const isAdmin = (auth?.roles ?? []).some(r => ['owner','admin','supervisor'].includes(r)) || ['owner','admin','supervisor'].includes(auth?.role);

    const [statusFilter, setStatusFilter] = useState(filters.status ?? "");
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [reopeningId, setReopeningId] = useState(null);

    const filtered = useMemo(() => {
        let list = [...(shifts.data ?? [])];
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter(
                (s) =>
                    (s.shift_no ?? "").toLowerCase().includes(q) ||
                    (s.user?.name ?? "").toLowerCase().includes(q) ||
                    (s.branch?.name ?? "").toLowerCase().includes(q),
            );
        }
        if (statusFilter) {
            list = list.filter((s) => s.status === statusFilter);
        }
        return list;
    }, [shifts.data, search, statusFilter]);

    const applyServerFilter = (status) => {
        setStatusFilter(status);
        router.get(
            route("admin.cashier-shifts.index"),
            { status: status || undefined },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.cashier-shifts.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const handleReopen = (shift) => {
        setReopeningId(shift.id);
        router.post(
            route("admin.cashier-shifts.reopen", shift.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setReopeningId(null),
            },
        );
    };

    const openCount = (shifts.data ?? []).filter(
        (s) => s.status === "open",
    ).length;

    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
              })
            : "-";

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Shift Kasir
                    </h2>
                    {canOpenShift && (
                        <Link
                            href={route("admin.cashier-shifts.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
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
                            Buka Shift
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Shift Kasir" />

            <div className="space-y-5">
                {/* Active Shift Banner */}
                {activeShift && (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
                                <svg
                                    className="h-5 w-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.8}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-800">
                                    Shift Aktif: {activeShift.shift_no}
                                </p>
                                <p className="text-xs text-emerald-600">
                                    Dibuka sejak{" "}
                                    {formatDate(activeShift.opened_at)}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route(
                                "admin.cashier-shifts.show",
                                activeShift.id,
                            )}
                            className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                            Lihat Shift
                        </Link>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <SummaryCard
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        }
                        label="Total Shift"
                        value={shifts.total}
                        accent="from-indigo-500 to-violet-600"
                    />
                    <SummaryCard
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        }
                        label="Shift Berjalan"
                        value={openCount}
                        accent="from-emerald-500 to-teal-500"
                    />
                    <SummaryCard
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                        }
                        label="Shift Selesai"
                        value={shifts.total - openCount}
                        accent="from-slate-500 to-slate-600"
                    />
                    <SummaryCard
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        }
                        label="Bisa Buka Shift"
                        value={canOpenShift ? "Ya" : "Tidak"}
                        accent="from-amber-500 to-orange-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <div className="relative w-full max-w-xs">
                        <svg
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                        <input
                            type="text"
                            placeholder="Cari shift / kasir..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-xl border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        {["", "open", "closed"].map((s) => (
                            <button
                                key={s}
                                onClick={() => applyServerFilter(s)}
                                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                                    statusFilter === s
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                                {s === ""
                                    ? "Semua"
                                    : s === "open"
                                      ? "Berjalan"
                                      : "Tutup"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th className="px-5 py-3.5 font-medium text-slate-500">
                                    No. Shift
                                </th>
                                <th className="px-5 py-3.5 font-medium text-slate-500">
                                    Kasir
                                </th>
                                <th className="px-5 py-3.5 font-medium text-slate-500">
                                    Cabang
                                </th>
                                <th className="px-5 py-3.5 font-medium text-slate-500">
                                    Dibuka
                                </th>
                                <th className="px-5 py-3.5 font-medium text-slate-500">
                                    Ditutup
                                </th>
                                <th className="px-5 py-3.5 text-right font-medium text-slate-500">
                                    Total Penjualan
                                </th>
                                <th className="px-5 py-3.5 font-medium text-slate-500">
                                    Status
                                </th>
                                <th className="px-5 py-3.5 text-right font-medium text-slate-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-16 text-center text-slate-400"
                                    >
                                        <svg
                                            className="mx-auto mb-3 h-10 w-10 text-slate-300"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <p className="text-sm">
                                            Belum ada data shift
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((shift) => (
                                    <tr
                                        key={shift.id}
                                        className="transition hover:bg-slate-50/50"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="font-medium text-slate-800">
                                                {shift.shift_no}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            {shift.user?.name ?? "-"}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">
                                            {shift.branch?.name ?? "-"}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {formatDate(shift.opened_at)}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {formatDate(shift.closed_at)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                                            {shift.status === "closed"
                                                ? fmtRp(shift.total_sales)
                                                : "-"}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${
                                                    STATUS_MAP[shift.status] ??
                                                    "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {STATUS_LABEL[shift.status] ??
                                                    shift.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={route(
                                                        "admin.cashier-shifts.show",
                                                        shift.id,
                                                    )}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800"
                                                >
                                                    Detail
                                                </Link>

                                                {/* Admin actions */}
                                                {isAdmin && (
                                                    <>
                                                        {shift.status ===
                                                            "closed" && (
                                                            <button
                                                                onClick={() =>
                                                                    handleReopen(
                                                                        shift,
                                                                    )
                                                                }
                                                                disabled={
                                                                    reopeningId ===
                                                                    shift.id
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
                                                            >
                                                                {reopeningId ===
                                                                shift.id
                                                                    ? "..."
                                                                    : "Buka Ulang"}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    shift,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-3 lg:hidden">
                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 shadow-sm">
                            <svg
                                className="mx-auto mb-3 h-10 w-10 text-slate-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-sm">Belum ada data shift</p>
                        </div>
                    ) : (
                        filtered.map((shift) => (
                            <div
                                key={shift.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {shift.shift_no}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {shift.user?.name ?? "-"}
                                            {shift.branch?.name
                                                ? ` · ${shift.branch.name}`
                                                : ""}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${
                                            STATUS_MAP[shift.status] ??
                                            "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {STATUS_LABEL[shift.status] ??
                                            shift.status}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                                    <span>
                                        Buka: {formatDate(shift.opened_at)}
                                    </span>
                                    {shift.closed_at && (
                                        <span>
                                            Tutup: {formatDate(shift.closed_at)}
                                        </span>
                                    )}
                                </div>
                                {shift.status === "closed" && (
                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                        {fmtRp(shift.total_sales)}
                                    </p>
                                )}
                                <div className="mt-3 flex items-center justify-end gap-1">
                                    <Link
                                        href={route(
                                            "admin.cashier-shifts.show",
                                            shift.id,
                                        )}
                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800"
                                    >
                                        Detail
                                    </Link>
                                    {isAdmin && shift.status === "closed" && (
                                        <button
                                            onClick={() => handleReopen(shift)}
                                            disabled={reopeningId === shift.id}
                                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
                                        >
                                            {reopeningId === shift.id
                                                ? "..."
                                                : "Buka Ulang"}
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button
                                            onClick={() =>
                                                setDeleteTarget(shift)
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {shifts.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                        <p className="text-xs text-slate-500">
                            Menampilkan {shifts.from}-{shifts.to} dari{" "}
                            {shifts.total} shift
                        </p>
                        <div className="flex items-center gap-1">
                            {shifts.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveState: true,
                                            replace: true,
                                        })
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                        link.active
                                            ? "bg-indigo-100 text-indigo-700"
                                            : link.url
                                              ? "text-slate-500 hover:bg-slate-100"
                                              : "cursor-default text-slate-300"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteTarget && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                        onMouseDown={() => !deleting && setDeleteTarget(null)}
                    >
                        <div
                            className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <svg
                                className="mx-auto mb-4 h-12 w-12 text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                            <h3 className="mb-2 text-center text-base font-semibold text-slate-900">
                                Hapus Shift?
                            </h3>
                            <p className="mb-5 text-center text-sm text-slate-500">
                                Shift{" "}
                                <span className="font-medium text-slate-700">
                                    {deleteTarget.shift_no}
                                </span>{" "}
                                akan dihapus permanen. Transaksi terkait akan
                                dilepas dari shift ini.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleting}
                                    className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600 disabled:opacity-50"
                                >
                                    {deleting ? "Menghapus..." : "Hapus"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
