import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";

const fmt = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("id-ID", { dateStyle: "medium" })
        : "-";

const STATUS_CLS = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-500",
};
const STATUS_LBL = {
    pending: "Pending",
    approved: "Disetujui",
    paid: "Dibayar",
    cancelled: "Dibatalkan",
};

function StatCard({ label, value, color }) {
    const colors = {
        slate: "from-slate-500 to-slate-600",
        amber: "from-amber-500 to-orange-500",
        blue: "from-blue-500 to-indigo-600",
        emerald: "from-emerald-500 to-teal-500",
    };
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-4">
                <p className="text-xs font-medium text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
            </div>
            <div className={`h-1 bg-gradient-to-r ${colors[color]}`} />
        </div>
    );
}

export default function Index({
    commissions,
    employees,
    stats,
    filters,
    canApprove,
}) {
    const { flash } = usePage().props;
    const [updating, setUpdating] = useState(null);

    const applyFilter = (newFilters) => {
        router.get(
            route("admin.employee-commissions.index"),
            { ...filters, ...newFilters },
            { preserveState: true, replace: true },
        );
    };

    const updateStatus = (id, status) => {
        setUpdating(id);
        router.patch(
            route("admin.employee-commissions.update-status", id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setUpdating(null),
            },
        );
    };

    const list = commissions.data ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-slate-800">
                        Rekap Komisi Karyawan
                    </h2>
                </div>
            }
        >
            <Head title="Rekap Komisi" />

            <div className="space-y-5">
                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        label="Total Komisi"
                        value={fmt(stats?.total_all)}
                        color="slate"
                    />
                    <StatCard
                        label="Pending"
                        value={fmt(stats?.total_pending)}
                        color="amber"
                    />
                    <StatCard
                        label="Disetujui"
                        value={fmt(stats?.total_approved)}
                        color="blue"
                    />
                    <StatCard
                        label="Dibayar"
                        value={fmt(stats?.total_paid)}
                        color="emerald"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <select
                        value={filters.status ?? ""}
                        onChange={(e) =>
                            applyFilter({
                                status: e.target.value || undefined,
                            })
                        }
                        className="rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-200"
                    >
                        <option value="">Semua Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Disetujui</option>
                        <option value="paid">Dibayar</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>

                    <select
                        value={filters.employee_id ?? ""}
                        onChange={(e) =>
                            applyFilter({
                                employee_id: e.target.value || undefined,
                            })
                        }
                        className="rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-200"
                    >
                        <option value="">Semua Karyawan</option>
                        {employees.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={filters.from ?? ""}
                        onChange={(e) =>
                            applyFilter({ from: e.target.value || undefined })
                        }
                        className="rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-200"
                    />
                    <input
                        type="date"
                        value={filters.to ?? ""}
                        onChange={(e) =>
                            applyFilter({ to: e.target.value || undefined })
                        }
                        className="rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-200"
                    />

                    {(filters.status ||
                        filters.employee_id ||
                        filters.from ||
                        filters.to) && (
                        <button
                            onClick={() =>
                                router.get(
                                    route("admin.employee-commissions.index"),
                                )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100 bg-slate-50">
                            <tr>
                                {[
                                    "Karyawan",
                                    "No. Transaksi",
                                    "Tanggal",
                                    "Tipe",
                                    "Nominal",
                                    "Status",
                                    "",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-5 py-3 text-xs font-semibold text-slate-500"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {list.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-5 py-12 text-center text-sm text-slate-400"
                                    >
                                        Belum ada data komisi
                                    </td>
                                </tr>
                            ) : (
                                list.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="hover:bg-slate-50/60"
                                    >
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-slate-800">
                                                {c.employee?.name ?? "-"}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {c.employee?.position ?? ""}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 font-mono text-xs text-slate-600">
                                            {c.sale?.sale_no ?? "-"}
                                        </td>
                                        <td className="px-5 py-3 text-xs text-slate-500">
                                            {fmtDate(c.commission_date)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-xs text-slate-500">
                                                {c.type === "percent"
                                                    ? `${c.commission_rate}% dari ${fmt(c.base_amount)}`
                                                    : `Flat`}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-indigo-700">
                                            {fmt(c.commission_amount)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[c.status] ?? "bg-slate-100 text-slate-600"}`}
                                            >
                                                {STATUS_LBL[c.status] ??
                                                    c.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {canApprove &&
                                                c.status !== "cancelled" && (
                                                    <div className="flex items-center gap-1">
                                                        {c.status ===
                                                            "pending" && (
                                                            <button
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        c.id,
                                                                        "approved",
                                                                    )
                                                                }
                                                                disabled={
                                                                    updating ===
                                                                    c.id
                                                                }
                                                                className="rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                                            >
                                                                Setujui
                                                            </button>
                                                        )}
                                                        {c.status ===
                                                            "approved" && (
                                                            <button
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        c.id,
                                                                        "paid",
                                                                    )
                                                                }
                                                                disabled={
                                                                    updating ===
                                                                    c.id
                                                                }
                                                                className="rounded-lg px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                                            >
                                                                Bayar
                                                            </button>
                                                        )}
                                                        {(c.status ===
                                                            "pending" ||
                                                            c.status ===
                                                                "approved") && (
                                                            <button
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        c.id,
                                                                        "cancelled",
                                                                    )
                                                                }
                                                                disabled={
                                                                    updating ===
                                                                    c.id
                                                                }
                                                                className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                            >
                                                                Batal
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-3 lg:hidden">
                    {list.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400">
                            Belum ada data komisi
                        </div>
                    ) : (
                        list.map((c) => (
                            <div
                                key={c.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            {c.employee?.name ?? "-"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {c.employee?.position ?? ""}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[c.status] ?? "bg-slate-100 text-slate-600"}`}
                                    >
                                        {STATUS_LBL[c.status] ?? c.status}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-mono text-xs text-slate-500">
                                            {c.sale?.sale_no ?? "-"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {fmtDate(c.commission_date)}
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-indigo-700">
                                        {fmt(c.commission_amount)}
                                    </p>
                                </div>
                                {canApprove && c.status !== "cancelled" && (
                                    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                                        {c.status === "pending" && (
                                            <button
                                                onClick={() =>
                                                    updateStatus(
                                                        c.id,
                                                        "approved",
                                                    )
                                                }
                                                disabled={updating === c.id}
                                                className="flex-1 rounded-xl bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                            >
                                                Setujui
                                            </button>
                                        )}
                                        {c.status === "approved" && (
                                            <button
                                                onClick={() =>
                                                    updateStatus(c.id, "paid")
                                                }
                                                disabled={updating === c.id}
                                                className="flex-1 rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                            >
                                                Tandai Dibayar
                                            </button>
                                        )}
                                        {(c.status === "pending" ||
                                            c.status === "approved") && (
                                            <button
                                                onClick={() =>
                                                    updateStatus(
                                                        c.id,
                                                        "cancelled",
                                                    )
                                                }
                                                disabled={updating === c.id}
                                                className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-100 disabled:opacity-50"
                                            >
                                                Batal
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {(commissions.last_page ?? 1) > 1 && (
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs">
                        <span className="text-slate-500">
                            {commissions.from}–{commissions.to} dari{" "}
                            {commissions.total}
                        </span>
                        <div className="flex gap-1">
                            {(commissions.links ?? []).map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveState: true,
                                        })
                                    }
                                    className={`rounded-lg px-3 py-1.5 font-medium transition ${
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
            </div>
        </AuthenticatedLayout>
    );
}
