import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "-";

const STATUS_CONFIG = {
    completed: {
        label: "Selesai",
        color: "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
    },
    cancelled: {
        label: "Dibatalkan",
        color: "bg-slate-100 text-slate-500",
        dot: "bg-slate-400",
    },
    draft: {
        label: "Draft",
        color: "bg-amber-100 text-amber-700",
        dot: "bg-amber-500",
    },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

export default function Index({ saleReturns }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filtered = useMemo(() => {
        let list = [...(saleReturns ?? [])];
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter(
                (r) =>
                    (r.return_no ?? "").toLowerCase().includes(q) ||
                    (r.sale?.sale_no ?? "").toLowerCase().includes(q) ||
                    (r.customer?.name ?? "").toLowerCase().includes(q),
            );
        }
        if (statusFilter !== "all")
            list = list.filter((r) => r.status === statusFilter);
        return list;
    }, [saleReturns, search, statusFilter]);

    const stats = useMemo(() => {
        const data = saleReturns ?? [];
        return {
            total: data.length,
            completed: data.filter((r) => r.status === "completed").length,
            cancelled: data.filter((r) => r.status === "cancelled").length,
            totalAmount: data
                .filter((r) => r.status === "completed")
                .reduce((sum, r) => sum + parseFloat(r.total_amount ?? 0), 0),
        };
    }, [saleReturns]);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.sale-returns.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-slate-800">
                        Retur Penjualan
                    </h2>
                    <Link
                        href={route("admin.sale-returns.create")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
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
                        Buat Retur
                    </Link>
                </div>
            }
        >
            <Head title="Retur Penjualan" />

            <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryCard
                        label="Total Retur"
                        value={stats.total}
                        color="indigo"
                    />
                    <SummaryCard
                        label="Selesai"
                        value={stats.completed}
                        color="emerald"
                    />
                    <SummaryCard
                        label="Dibatalkan"
                        value={stats.cancelled}
                        color="slate"
                    />
                    <SummaryCard
                        label="Total Nilai"
                        value={fmtRp(stats.totalAmount)}
                        color="amber"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                            placeholder="Cari retur / penjualan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-xl border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <div className="flex items-center gap-1 sm:ml-auto">
                        {["all", "completed", "cancelled"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                                    statusFilter === s
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                                {s === "all"
                                    ? "Semua"
                                    : s === "completed"
                                      ? "Selesai"
                                      : "Dibatalkan"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                        No. Retur
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                        Penjualan Asal
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                        Pelanggan
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                        Items
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                        Tanggal
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-16 text-center"
                                        >
                                            <svg
                                                className="mx-auto mb-3 h-12 w-12 text-slate-300"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                                />
                                            </svg>
                                            <p className="text-sm font-medium text-slate-400">
                                                Belum ada retur penjualan
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((retur) => (
                                        <tr
                                            key={retur.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-800">
                                                {retur.return_no}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">
                                                {retur.sale?.sale_no ?? "-"}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500">
                                                {retur.customer?.name ?? "-"}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">
                                                {retur.item_count ?? "-"}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                                                {fmtRp(retur.total_amount)}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500">
                                                {fmtDate(retur.return_date)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <StatusBadge
                                                    status={retur.status}
                                                />
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route(
                                                            "admin.sale-returns.show",
                                                            retur.id,
                                                        )}
                                                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                                                    >
                                                        Detail
                                                    </Link>
                                                    {retur.status !==
                                                        "completed" && (
                                                        <button
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    retur,
                                                                )
                                                            }
                                                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                                                        >
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile */}
                <div className="space-y-3 lg:hidden">
                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
                            <svg
                                className="mx-auto mb-3 h-12 w-12 text-slate-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                />
                            </svg>
                            <p className="text-sm font-medium text-slate-400">
                                Belum ada retur penjualan
                            </p>
                        </div>
                    ) : (
                        filtered.map((retur) => (
                            <div
                                key={retur.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {retur.return_no}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {retur.sale?.sale_no ?? "-"} ·{" "}
                                            {retur.customer?.name ?? "-"}
                                        </p>
                                    </div>
                                    <StatusBadge status={retur.status} />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                        {retur.item_count} item
                                    </span>
                                    <span className="font-semibold text-slate-700">
                                        {fmtRp(retur.total_amount)}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                    {fmtDate(retur.return_date)}
                                </p>
                                <div className="mt-3 flex items-center justify-end gap-1">
                                    <Link
                                        href={route(
                                            "admin.sale-returns.show",
                                            retur.id,
                                        )}
                                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                                    >
                                        Detail
                                    </Link>
                                    {retur.status !== "completed" && (
                                        <button
                                            onClick={() =>
                                                setDeleteTarget(retur)
                                            }
                                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Delete Modal */}
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
                                Hapus Retur?
                            </h3>
                            <p className="mb-5 text-center text-sm text-slate-500">
                                Retur{" "}
                                <span className="font-medium text-slate-700">
                                    {deleteTarget.return_no}
                                </span>{" "}
                                akan dihapus permanen.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleting}
                                    className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600"
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

function SummaryCard({ label, value, color = "slate" }) {
    const borders = {
        indigo: "border-l-indigo-400",
        emerald: "border-l-emerald-400",
        slate: "border-l-slate-400",
        amber: "border-l-amber-400",
    };
    return (
        <div
            className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${borders[color] ?? ""}`}
        >
            <p className="text-xs font-medium text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
        </div>
    );
}
