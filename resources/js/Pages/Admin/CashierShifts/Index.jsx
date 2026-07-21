import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Button from "@/Components/ui/Button";
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
    open: "bg-emerald-100 text-success",
    closed: "bg-muted text-muted-foreground",
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
                    <h2 className="text-lg font-semibold text-foreground">
                        {pageLabel}
                    </h2>
                    {canOpen && (
                        <Button as={Link} href={route("admin.cashier-shifts.create")} icon={Plus}>
                            <span className="hidden sm:inline">Buka Shift</span>
                            <span className="sm:hidden">Buka</span>
                        </Button>
                    )}
                </div>
            }
        >
            <Head title={pageLabel} />

            <div className="space-y-4">
                {activeShift && (
                    <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-success/10 px-5 py-3">
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
                            className="rounded-lg border border-emerald-300 bg-card px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10"
                        >
                            Lihat Detail
                        </Link>
                    </div>
                )}

                {/* Table card */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {/* Toolbar */}
                    <div className="border-b border-border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                </span>
                                <form onSubmit={(e) => { e.preventDefault(); applySearch(e); }} className="flex-1">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari no. shift / kasir..."
                                        className="block w-full rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                    />
                                </form>
                            </div>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-sm transition hover:bg-muted">
                                        <span className={status ? "text-foreground" : "text-muted-foreground"}>
                                            {status === "open" ? "Berjalan" : status === "closed" ? "Tutup" : "Semua Status"}
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="48">
                                    <button onClick={() => applyFilter("")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${!status ? "bg-primary-50 font-medium text-primary-600" : "text-muted-foreground hover:bg-muted"}`}>Semua</button>
                                    <button onClick={() => applyFilter("open")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${status === "open" ? "bg-primary-50 font-medium text-primary-600" : "text-muted-foreground hover:bg-muted"}`}>Berjalan</button>
                                    <button onClick={() => applyFilter("closed")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${status === "closed" ? "bg-primary-50 font-medium text-primary-600" : "text-muted-foreground hover:bg-muted"}`}>Tutup</button>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                        <div className="pt-4 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Menampilkan{" "}
                                <span className="font-semibold text-foreground">{list.length}</span>{" "}
                                dari{" "}
                                <span className="font-semibold text-foreground">{shifts.total}</span>{" "}
                                shift
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                                            className="px-4 py-3 text-xs font-semibold text-muted-foreground"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {list.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-12 text-center text-sm text-muted-foreground"
                                        >
                                            Belum ada data shift
                                        </td>
                                    </tr>
                                ) : (
                                    list.map((shift) => (
                                        <tr
                                            key={shift.id}
                                            className="hover:bg-muted/50"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                                                {shift.shift_no}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {shift.user?.name ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {shift.branch?.name ?? "Pusat"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {fmtDt(shift.opened_at)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {fmtDt(shift.closed_at)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
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
                                                        "bg-muted text-muted-foreground"
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
                                                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
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
                                                                className="rounded-lg px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-success/10 disabled:opacity-50"
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
                                                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
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
                        <div className="flex flex-col gap-3 border-t border-border px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-muted-foreground">
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
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : link.url
                                                  ? "text-muted-foreground hover:bg-muted"
                                                  : "cursor-not-allowed text-muted-foreground/50"
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
                        className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-semibold text-foreground">
                            Hapus Shift?
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Shift{" "}
                            <span className="font-mono font-semibold">
                                {deleteTarget.shift_no}
                            </span>{" "}
                            akan dihapus permanen.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
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
