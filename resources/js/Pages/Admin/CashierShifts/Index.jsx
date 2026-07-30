import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    Building2,
    Check,
    ChevronDown,
    Clock,
    Eye,
    Filter,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    User,
} from "lucide-react";
import Button from "@/Components/ui/Button";
import Dropdown from "@/Components/Dropdown";
import CheckboxTile from "@/Components/ui/CheckboxTile";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const fmt = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const fmtDt = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "-";

const STATUS_CFG = {
    open: { label: "Berjalan", cls: "bg-success/10 text-success", dot: "bg-success" },
    closed: {
        label: "Tutup",
        cls: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
    },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] ?? {
        label: status,
        cls: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

export default function Index({
    shifts,
    activeShift,
    filters,
    branches = [],
    canOpen,
    canManage,
    storeType = "retail",
}) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [status, setStatus] = useState(filters?.status ?? "");

    /* ── Filter cabang ────────────────────────────────────────
     * Default semua cabang terpilih. Saat semua terpilih, parameter
     * branch_ids tidak dikirim supaya URL tetap bersih dan sama dengan
     * perilaku "tanpa filter" di server.
     */
    const allBranchIds = branches.map((b) => b.id);
    const [branchIds, setBranchIds] = useState(
        (filters?.branch_ids ?? []).length > 0
            ? (filters.branch_ids ?? []).map(Number)
            : allBranchIds,
    );

    const toggleBranch = (branchId) => {
        setBranchIds((prev) =>
            prev.includes(branchId)
                ? prev.filter((id) => id !== branchId)
                : [...prev, branchId],
        );
    };

    const allBranchesSelected =
        branches.length > 0 && branchIds.length === branches.length;

    const branchSummary = allBranchesSelected
        ? "Semua Cabang"
        : branchIds.length === 0
            ? "Pilih Cabang"
            : branchIds.length === 1
                ? (branches.find((b) => b.id === branchIds[0])?.name ??
                    "1 Cabang")
                : `${branchIds.length} Cabang`;
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

    const navigate = ({
        status: newStatus = status,
        search: newSearch = search,
        branchIds: newBranchIds = branchIds,
    } = {}) => {
        const params = {
            status: newStatus || undefined,
            search: newSearch || undefined,
        };

        // Kirim branch_ids hanya saat sebagian cabang dipilih.
        if (
            branches.length > 0 &&
            newBranchIds.length > 0 &&
            newBranchIds.length < branches.length
        ) {
            params.branch_ids = newBranchIds;
        }

        router.get(route("admin.cashier-shifts.index"), params, {
            preserveState: true,
            replace: true,
        });
    };

    const applyFilter = (s) => {
        setStatus(s);
        navigate({ status: s });
    };

    const applySearch = (e) => {
        e.preventDefault();
        navigate();
    };

    const applyBranchFilter = () => {
        // Tidak ada cabang terpilih sama artinya dengan semua cabang, jadi
        // pilihan dikembalikan ke semua agar tabel tidak tampak kosong.
        const effective = branchIds.length === 0 ? allBranchIds : branchIds;
        setBranchIds(effective);
        navigate({ branchIds: effective });
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
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Shift
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <PageHeader
                title={pageLabel}
                breadcrumbs={["Admin", "Shift"]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {pageLabel}
                        </span>
                    </>
                }
                description="Pantau, buka, dan tutup shift kasir atau layanan."
                action={
                    canOpen && (
                        <Button as={Link} href={route("admin.cashier-shifts.create")} icon={Plus}>
                            <span className="hidden sm:inline">Buka Shift</span>
                            <span className="sm:hidden">Buka</span>
                        </Button>
                    )
                }
            />

            <div className="space-y-4">
                {activeShift && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-success/20 bg-success/10 px-5 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <Clock className="h-5 w-5 shrink-0 text-success" strokeWidth={1.8} />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-success">
                                    Shift Aktif:{" "}
                                    <span className="font-mono">
                                        {activeShift.shift_no}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Dibuka sejak {fmtDt(activeShift.opened_at)}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route(
                                "admin.cashier-shifts.show",
                                activeShift.id,
                            )}
                            className="rounded-lg border border-success/30 bg-card px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10"
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
                                    <Search className="h-4 w-4" strokeWidth={1.8} />
                                </span>
                                <form onSubmit={(e) => { e.preventDefault(); applySearch(e); }} className="flex-1">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari no. shift / kasir..."
                                        className="block w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                    />
                                </form>
                            </div>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex w-full items-center justify-between gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-sm transition hover:bg-muted sm:w-auto sm:justify-start">
                                        <span className={status ? "text-foreground" : "text-muted-foreground"}>
                                            {status === "open" ? "Berjalan" : status === "closed" ? "Tutup" : "Semua Status"}
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="48">
                                    <button onClick={() => applyFilter("")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${!status ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}>Semua</button>
                                    <button onClick={() => applyFilter("open")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${status === "open" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}>Berjalan</button>
                                    <button onClick={() => applyFilter("closed")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${status === "closed" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}>Tutup</button>
                                </Dropdown.Content>
                            </Dropdown>

                            {/* Filter cabang — hanya untuk owner/admin yang boleh
                                melihat shift seluruh cabang. */}
                            {canManage && branches.length > 1 && (
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-sm transition hover:bg-muted sm:w-auto sm:justify-start">
                                            <span className="inline-flex items-center gap-2">
                                                <Filter className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                                <span
                                                    className={
                                                        allBranchesSelected
                                                            ? "text-muted-foreground"
                                                            : "text-foreground"
                                                    }
                                                >
                                                    {branchSummary}
                                                </span>
                                            </span>
                                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content
                                        align="left"
                                        width="64"
                                        contentClasses="p-3 bg-card border-border shadow-xl"
                                    >
                                        {/* stopPropagation supaya panel tidak tertutup
                                            tiap kali checkbox diklik. */}
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex flex-col gap-3"
                                        >
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    Pilih Cabang
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        setBranchIds(
                                                            allBranchesSelected
                                                                ? []
                                                                : allBranchIds,
                                                        )
                                                    }
                                                    className="text-[11px] font-semibold text-primary transition hover:underline"
                                                >
                                                    {allBranchesSelected
                                                        ? "Kosongkan"
                                                        : "Pilih semua"}
                                                </button>
                                            </div>
                                            <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                                                {branches.map((b) => {
                                                    const isSelected =
                                                        branchIds.includes(b.id);
                                                    return (
                                                        <CheckboxTile
                                                            key={b.id}
                                                            checked={isSelected}
                                                            onChange={() =>
                                                                toggleBranch(b.id)
                                                            }
                                                            label={b.name}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={applyBranchFilter}
                                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
                                        >
                                            <Check className="h-4 w-4" strokeWidth={2.2} />
                                            Terapkan Filter
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
                            <p className="text-xs text-muted-foreground">
                                Menampilkan{" "}
                                <span className="font-semibold text-foreground">{list.length}</span>{" "}
                                dari{" "}
                                <span className="font-semibold text-foreground">{shifts.total}</span>{" "}
                                shift
                                {canManage && branches.length > 1 && (
                                    <>
                                        {" "}&bull;{" "}
                                        <span className="font-semibold text-foreground">
                                            {branchSummary}
                                        </span>
                                    </>
                                )}
                            </p>
                            {canManage && !allBranchesSelected && branches.length > 1 && (
                                <button
                                    onClick={() => {
                                        setBranchIds(allBranchIds);
                                        navigate({ branchIds: allBranchIds });
                                    }}
                                    className="text-xs font-medium text-muted-foreground transition hover:text-foreground hover:underline"
                                >
                                    Tampilkan semua cabang
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Desktop Table */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">No. Shift</th>
                                    <th className="px-4 py-3 text-left font-semibold">Kasir</th>
                                    <th className="px-4 py-3 text-left font-semibold">Cabang</th>
                                    <th className="px-4 py-3 text-left font-semibold">Dibuka</th>
                                    <th className="px-4 py-3 text-left font-semibold">Ditutup</th>
                                    <th className="px-4 py-3 text-right font-semibold">Total Penjualan</th>
                                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                                    <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-16">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
                                                    <Clock className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-foreground">
                                                    Belum ada data shift
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Shift akan muncul di sini setelah dibuka.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    list.map((shift) => (
                                        <tr
                                            key={shift.id}
                                            className="transition hover:bg-[rgb(var(--color-table-hover))]"
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
                                            <td className="px-4 py-3 text-right font-medium text-foreground">
                                                {shift.status === "closed"
                                                    ? fmt(shift.total_sales)
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={shift.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route(
                                                            "admin.cashier-shifts.show",
                                                            shift.id,
                                                        )}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                                                    </Link>
                                                    {canManage &&
                                                        shift.status === "closed" && (
                                                            <button
                                                                onClick={() => handleReopen(shift)}
                                                                disabled={reopening === shift.id}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-success/10 hover:text-success disabled:opacity-50"
                                                                title="Buka Ulang"
                                                            >
                                                                <RotateCcw
                                                                    className={`h-4 w-4 ${reopening === shift.id ? "animate-spin" : ""}`}
                                                                    strokeWidth={1.8}
                                                                />
                                                            </button>
                                                        )}
                                                    {canManage && (
                                                        <button
                                                            onClick={() => setDeleteTarget(shift)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
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

                    {/* Mobile Cards */}
                    <div className="divide-y divide-border md:hidden">
                        {list.length === 0 ? (
                            <div className="flex flex-col items-center px-4 py-14 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
                                    <Clock className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                                </div>
                                <p className="mt-4 text-sm font-medium text-foreground">
                                    Belum ada data shift
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Shift akan muncul di sini setelah dibuka.
                                </p>
                            </div>
                        ) : (
                            list.map((shift) => (
                                <div
                                    key={shift.id}
                                    onClick={() =>
                                        router.visit(
                                            route("admin.cashier-shifts.show", shift.id),
                                        )
                                    }
                                    className="cursor-pointer bg-background p-4 transition active:bg-muted/50"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-mono text-xs font-semibold text-primary">
                                                {shift.shift_no}
                                            </p>
                                            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                                <span className="truncate">
                                                    {shift.user?.name ?? "-"}
                                                </span>
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                                                <span className="truncate">
                                                    {shift.branch?.name ?? "Pusat"}
                                                </span>
                                            </p>
                                        </div>
                                        <StatusBadge status={shift.status} />
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="text-muted-foreground">Dibuka</p>
                                            <p className="mt-0.5 font-medium text-foreground">
                                                {fmtDt(shift.opened_at)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-muted-foreground">Ditutup</p>
                                            <p className="mt-0.5 font-medium text-foreground">
                                                {fmtDt(shift.closed_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Total Penjualan
                                            </p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {shift.status === "closed"
                                                    ? fmt(shift.total_sales)
                                                    : "-"}
                                            </p>
                                        </div>
                                        <div
                                            className="flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Link
                                                href={route(
                                                    "admin.cashier-shifts.show",
                                                    shift.id,
                                                )}
                                                className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                                            >
                                                <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                                                Detail
                                            </Link>
                                            {canManage && shift.status === "closed" && (
                                                <button
                                                    onClick={() => handleReopen(shift)}
                                                    disabled={reopening === shift.id}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition hover:bg-success/20 disabled:opacity-50"
                                                >
                                                    <RotateCcw
                                                        className={`h-3.5 w-3.5 ${reopening === shift.id ? "animate-spin" : ""}`}
                                                        strokeWidth={1.8}
                                                    />
                                                    Buka
                                                </button>
                                            )}
                                            {canManage && (
                                                <button
                                                    onClick={() => setDeleteTarget(shift)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/20"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
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

            <ConfirmDeleteModal
                open={!!deleteTarget}
                title="Hapus Shift?"
                description={`Shift ${deleteTarget?.shift_no ?? ""} akan dihapus permanen.`}
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
