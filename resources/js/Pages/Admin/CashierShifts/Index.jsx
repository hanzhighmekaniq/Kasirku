import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";

const fmt = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const fmtDt = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "-";

const STATUS_CLS = {
    open: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
};
const STATUS_LBL = { open: "Berjalan", closed: "Tutup" };

export default function Index({
    shifts,
    activeShift,
    filters,
    canOpen,
    canManage,
}) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [status, setStatus] = useState(filters?.status ?? "");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [reopening, setReopening] = useState(null);

    const navigate = (newStatus, newSearch) => {
        router.get(
            route("admin.cashier-shifts.index"),
            { status: newStatus || undefined, search: newSearch || undefined },
            { preserveState: true, replace: true },
        );
    };

    const applyFilter = (s) => {
        setStatus(s);
        navigate(s, search);
    };

    const applySearch = (e) => {
        e.preventDefault();
        navigate(status, search);
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
        setReopening(shift.id);
        router.post(
            route("admin.cashier-shifts.reopen", shift.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setReopening(null),
            },
        );
    };

    const list = shifts?.data ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-slate-800">
                        Shift Kasir
                    </h2>
                    {canOpen && (
                        <Link
                            href={route("admin.cashier-shifts.create")}
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
                            Buka Shift
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Shift Kasir" />

            <div className="space-y-4">
                {activeShift && (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">
                                Shift Aktif:{" "}
                                <span className="font-mono">
                                    {activeShift.shift_no}
                                </span>
                            </p>
                            <p className="text-xs text-emerald-600">
                                Dibuka sejak {fmtDt(activeShift.opened_at)}
                            </p>
                        </div>
                        <Link
                            href={route(
                                "admin.cashier-shifts.show",
                                activeShift.id,
                            )}
                            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                            Lihat Detail
                        </Link>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <form
                        onSubmit={applySearch}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari no.shift / kasir..."
                            className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-200"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                        >
                            Cari
                        </button>
                    </form>

                    <div className="ml-auto flex items-center gap-1">
                        {[
                            ["", "Semua"],
                            ["open", "Berjalan"],
                            ["closed", "Tutup"],
                        ].map(([val, lbl]) => (
                            <button
                                key={val}
                                onClick={() => applyFilter(val)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                    status === val
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                                {lbl}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50">
                                <tr>
                                    {[
                                        "No. Shift",
                                        "Kasir",
                                        "Cabang",
                                        "Dibuka",
                                        "Ditutup",
                                        "Total Penjualan",
                                        "Status",
                                        "",
                                    ].map((h, i) => (
                                        <th
                                            key={i}
                                            className="px-4 py-3 text-xs font-semibold text-slate-500"
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
                                            colSpan={8}
                                            className="px-4 py-12 text-center text-sm text-slate-400"
                                        >
                                            Belum ada data shift
                                        </td>
                                    </tr>
                                ) : (
                                    list.map((shift) => (
                                        <tr
                                            key={shift.id}
                                            className="hover:bg-slate-50/60"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs font-medium text-slate-800">
                                                {shift.shift_no}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {shift.user?.name ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {shift.branch?.name ?? "Pusat"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {fmtDt(shift.opened_at)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {fmtDt(shift.closed_at)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700">
                                                {shift.status === "closed"
                                                    ? fmt(shift.total_sales)
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        STATUS_CLS[
                                                            shift.status
                                                        ] ??
                                                        "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    {STATUS_LBL[shift.status] ??
                                                        shift.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route(
                                                            "admin.cashier-shifts.show",
                                                            shift.id,
                                                        )}
                                                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                                                    >
                                                        Detail
                                                    </Link>
                                                    {canManage &&
                                                        shift.status ===
                                                            "closed" && (
                                                            <button
                                                                onClick={() =>
                                                                    handleReopen(
                                                                        shift,
                                                                    )
                                                                }
                                                                disabled={
                                                                    reopening ===
                                                                    shift.id
                                                                }
                                                                className="rounded-lg px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                                            >
                                                                {reopening ===
                                                                shift.id
                                                                    ? "..."
                                                                    : "Buka Ulang"}
                                                            </button>
                                                        )}
                                                    {canManage && (
                                                        <button
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    shift,
                                                                )
                                                            }
                                                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
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

                {(shifts?.last_page ?? 1) > 1 && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs">
                        <span className="text-slate-500">
                            {shifts.from}–{shifts.to} dari {shifts.total}
                        </span>
                        <div className="flex gap-1">
                            {(shifts.links ?? []).map((link, i) => (
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

            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onMouseDown={() => !deleting && setDeleteTarget(null)}
                >
                    <div
                        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-semibold text-slate-800">
                            Hapus Shift?
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Shift{" "}
                            <span className="font-mono font-semibold">
                                {deleteTarget.shift_no}
                            </span>{" "}
                            akan dihapus permanen.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
