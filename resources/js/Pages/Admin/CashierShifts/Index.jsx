import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Dropdown from "@/Components/Dropdown";

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
    storeType = "retail",
}) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [status, setStatus] = useState(filters?.status ?? "");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [reopening, setReopening] = useState(null);

    const PAGE_LABEL = {
        retail: "Shift Kasir",
        fnb: "Shift Kasir",
        service: "Shift Layanan",
        rental: "Shift Staf",
        ticket: "Shift Operator",
        hospitality: "Shift Resepsionis",
        parking: "Shift Petugas",
        session: "Shift Operator",
    };
    const pageLabel = PAGE_LABEL[storeType] ?? "Shift Kasir";

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
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {pageLabel}
                    </h2>
                    {canOpen && (
                        <Link
                            href={route("admin.cashier-shifts.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            <span className="hidden sm:inline">Buka Shift</span>
                            <span className="sm:hidden">Buka</span>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={pageLabel} />

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

                {/* Table card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Toolbar */}
                    <div className="border-b border-slate-100 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                </span>
                                <form onSubmit={(e) => { e.preventDefault(); applySearch(e); }} className="flex-1">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari no. shift / kasir..."
                                        className="block w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    />
                                </form>
                            </div>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition hover:bg-slate-50">
                                        <span className={status ? "text-slate-700" : "text-slate-400"}>
                                            {status === "open" ? "Berjalan" : status === "closed" ? "Tutup" : "Semua Status"}
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="48">
                                    <button onClick={() => applyFilter("")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${!status ? "bg-indigo-50 font-medium text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>Semua</button>
                                    <button onClick={() => applyFilter("open")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${status === "open" ? "bg-indigo-50 font-medium text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>Berjalan</button>
                                    <button onClick={() => applyFilter("closed")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${status === "closed" ? "bg-indigo-50 font-medium text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>Tutup</button>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                        <div className="pt-4 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Menampilkan{" "}
                                <span className="font-semibold text-slate-700">{list.length}</span>{" "}
                                dari{" "}
                                <span className="font-semibold text-slate-700">{shifts.total}</span>{" "}
                                shift
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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

                    {(shifts?.last_page ?? 1) > 1 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-slate-500">
                                {shifts.total} shift &bull; Halaman{" "}
                                {shifts.current_page} dari{" "}
                                {shifts.last_page}
                            </span>
                            <div className="flex items-center gap-1">
                                {(shifts.links ?? []).map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || "#"}
                                        preserveScroll
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                            link.active
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : link.url
                                                  ? "text-slate-600 hover:bg-slate-100"
                                                  : "cursor-not-allowed text-slate-300"
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
