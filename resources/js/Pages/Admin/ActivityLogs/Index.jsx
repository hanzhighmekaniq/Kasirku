import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";

const LOG_NAME_LABELS = {
    shift: "Shift Kasir",
    sale: "Penjualan",
    purchase: "Pembelian",
    stock: "Inventaris",
    expense: "Pengeluaran",
    product: "Produk",
    system: "Sistem",
};
const LOG_NAME_COLORS = {
    shift: "bg-indigo-50 text-indigo-700",
    sale: "bg-emerald-50 text-emerald-700",
    purchase: "bg-blue-50 text-blue-700",
    stock: "bg-amber-50 text-amber-700",
    expense: "bg-red-50 text-red-700",
    product: "bg-violet-50 text-violet-700",
    system: "bg-slate-100 text-slate-600",
};

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "medium",
          })
        : "-";

export default function Index({
    logs,
    logNames,
    users,
    branches,
    filters,
    currentBranch,
}) {
    const [formFilters, setFormFilters] = useState({
        log_name: filters.log_name ?? "",
        user_id: filters.user_id ?? "",
        branch_id: filters.branch_id ?? "",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const apply = () => {
        const params = {};
        Object.entries(formFilters).forEach(([k, v]) => {
            if (v) params[k] = v;
        });
        router.get(route("admin.activity-logs.index"), params, {
            preserveState: true,
            replace: true,
        });
    };

    const clear = () => {
        setFormFilters({
            log_name: "",
            user_id: "",
            branch_id: "",
            date_from: "",
            date_to: "",
        });
        router.get(
            route("admin.activity-logs.index"),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const hasFilters =
        formFilters.log_name ||
        formFilters.user_id ||
        formFilters.branch_id ||
        formFilters.date_from ||
        formFilters.date_to;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Log Aktivitas
                        </h2>
                        {currentBranch && (
                            <p className="text-xs text-slate-400 mt-0.5">
                                Cabang:{" "}
                                <span className="font-medium text-slate-500">
                                    {currentBranch.name}
                                </span>
                            </p>
                        )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                        {logs.total} entri
                    </span>
                </div>
            }
        >
            <Head title="Log Aktivitas" />

            <div className="space-y-5">
                {/* Filters */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Filter
                        </h3>
                    </div>
                    <div className="flex flex-wrap items-end gap-3 p-4">
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500">
                                Modul
                            </label>
                            <select
                                value={formFilters.log_name}
                                onChange={(e) =>
                                    setFormFilters((prev) => ({
                                        ...prev,
                                        log_name: e.target.value,
                                    }))
                                }
                                className="rounded-lg border-slate-300 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">Semua Modul</option>
                                {logNames.map((name) => (
                                    <option key={name} value={name}>
                                        {LOG_NAME_LABELS[name] ?? name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500">
                                User
                            </label>
                            <select
                                value={formFilters.user_id}
                                onChange={(e) =>
                                    setFormFilters((prev) => ({
                                        ...prev,
                                        user_id: e.target.value,
                                    }))
                                }
                                className="rounded-lg border-slate-300 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">Semua User</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {branches && branches.length > 0 && (
                            <div>
                                <label className="mb-1 block text-[11px] font-medium text-slate-500">
                                    Cabang
                                </label>
                                <select
                                    value={formFilters.branch_id}
                                    onChange={(e) =>
                                        setFormFilters((prev) => ({
                                            ...prev,
                                            branch_id: e.target.value,
                                        }))
                                    }
                                    className="rounded-lg border-slate-300 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                >
                                    <option value="">Semua Cabang</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500">
                                Dari
                            </label>
                            <input
                                type="date"
                                value={formFilters.date_from}
                                onChange={(e) =>
                                    setFormFilters((prev) => ({
                                        ...prev,
                                        date_from: e.target.value,
                                    }))
                                }
                                className="rounded-lg border-slate-300 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500">
                                Sampai
                            </label>
                            <input
                                type="date"
                                value={formFilters.date_to}
                                onChange={(e) =>
                                    setFormFilters((prev) => ({
                                        ...prev,
                                        date_to: e.target.value,
                                    }))
                                }
                                className="rounded-lg border-slate-300 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={apply}
                                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 shadow-sm"
                            >
                                Terapkan
                            </button>
                            {hasFilters && (
                                <button
                                    onClick={clear}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Log Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Waktu
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Toko / Cabang
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Modul
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Deskripsi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
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
                                                Belum ada log aktivitas
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="transition hover:bg-slate-50/50"
                                        >
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                {fmtDate(log.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {log.user?.name ?? "System"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {log.store ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-600 truncate max-w-[100px]">
                                                            {log.store.name}
                                                        </span>
                                                        {log.branch && (
                                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 font-medium">
                                                                {
                                                                    log.branch
                                                                        .name
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${LOG_NAME_COLORS[log.log_name] ?? "bg-slate-100 text-slate-600"}`}
                                                >
                                                    {LOG_NAME_LABELS[
                                                        log.log_name
                                                    ] ??
                                                        log.log_name ??
                                                        "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-md">
                                                {log.description}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                        <p className="text-xs text-slate-500">
                            Menampilkan {logs.from}-{logs.to} dari {logs.total}{" "}
                            log
                        </p>
                        <div className="flex items-center gap-1">
                            {logs.links.map((link, i) => (
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
            </div>
        </AuthenticatedLayout>
    );
}
