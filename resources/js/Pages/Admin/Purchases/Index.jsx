import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Dropdown from "@/Components/Dropdown";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export default function Index({ purchases, stats, storeType = "retail" }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const PAGE_TITLE = {
        retail: "Pembelian",
        fnb: "Pembelian Bahan Baku",
        rental: "Pembelian Unit",
        default: "Pembelian",
    };
    const pageTitle = PAGE_TITLE[storeType] ?? PAGE_TITLE.default;
    const addLabel = storeType === "fnb" ? "Bahan Baku" : "Pembelian";
    const searchPlaceholder =
        storeType === "fnb"
            ? "Cari no. faktur atau supplier bahan baku..."
            : "Cari no. faktur atau supplier...";

    const filtered = useMemo(() => {
        let list = [...purchases];
        const q = search.toLowerCase().trim();
        if (q)
            list = list.filter(
                (p) =>
                    p.purchase_no?.toLowerCase().includes(q) ||
                    p.supplier?.name?.toLowerCase().includes(q),
            );
        if (filterStatus !== "all")
            list = list.filter((p) => p.status === filterStatus);
        return list;
    }, [purchases, search, filterStatus]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setProcessing(true);
        router.delete(route("admin.purchases.destroy", deleteTarget.id), {
            onFinish: () => {
                setProcessing(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {pageTitle}
                    </h2>
                    <Link
                        href={route("admin.purchases.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">
                            Tambah {addLabel}
                        </span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title={pageTitle} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            {/* Summary cards */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label="Total" value={stats.total} color="slate" />
                <SummaryCard label="Draft" value={stats.draft} color="amber" />
                <SummaryCard
                    label="Selesai"
                    value={stats.completed}
                    color="emerald"
                />
                <SummaryCard
                    label="Belum Bayar"
                    value={stats.unpaid}
                    color="rose"
                />
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                            />
                        </div>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition hover:bg-slate-50">
                                    <span className={filterStatus !== "all" ? "text-slate-700" : "text-slate-400"}>
                                        {filterStatus === "draft" ? "Draft" : filterStatus === "completed" ? "Selesai" : filterStatus === "cancelled" ? "Dibatalkan" : "Semua Status"}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content width="48">
                                <button onClick={() => setFilterStatus("all")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${filterStatus === "all" ? "bg-primary-50 font-medium text-primary-600" : "text-slate-600 hover:bg-slate-50"}`}>Semua Status</button>
                                <button onClick={() => setFilterStatus("draft")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${filterStatus === "draft" ? "bg-primary-50 font-medium text-primary-600" : "text-slate-600 hover:bg-slate-50"}`}>Draft</button>
                                <button onClick={() => setFilterStatus("completed")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${filterStatus === "completed" ? "bg-primary-50 font-medium text-primary-600" : "text-slate-600 hover:bg-slate-50"}`}>Selesai</button>
                                <button onClick={() => setFilterStatus("cancelled")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${filterStatus === "cancelled" ? "bg-primary-50 font-medium text-primary-600" : "text-slate-600 hover:bg-slate-50"}`}>Dibatalkan</button>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan{" "}
                            <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
                            dari{" "}
                            <span className="font-semibold text-slate-700">{purchases.length}</span>{" "}
                            {pageTitle.toLowerCase()}
                        </p>
                    </div>
                </div>

                {/* Table (desktop) */}
                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                    No. Faktur
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                    Supplier
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                    Tanggal
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                                    Total
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                                    Dibayar
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                    Status
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                                    Bayar
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
                                                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0V6.75a2.25 2.25 0 00-2.25-2.25H5.25a2.25 2.25 0 00-2.25 2.25v.75"
                                            />
                                        </svg>
                                        <p className="text-sm font-medium text-slate-400">
                                            Belum ada data pembelian
                                        </p>
                                        <p className="mt-1 text-xs text-slate-300">
                                            Klik "Tambah {addLabel}" untuk
                                            memulai
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-800">
                                            {p.purchase_no}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            {p.supplier?.name ?? "-"}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            {new Date(
                                                p.purchase_date,
                                            ).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                                            Rp{" "}
                                            {Number(
                                                p.grand_total,
                                            ).toLocaleString("id-ID")}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-slate-600">
                                            Rp{" "}
                                            {Number(
                                                p.paid_amount,
                                            ).toLocaleString("id-ID")}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <PaymentBadge
                                                status={p.payment_status}
                                            />
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={route(
                                                        "admin.purchases.show",
                                                        p.id,
                                                    )}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                                                >
                                                    Detail
                                                </Link>
                                                {p.status === "draft" && (
                                                    <button
                                                        onClick={() =>
                                                            setDeleteTarget(p)
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

                {/* Mobile cards */}
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
                                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0V6.75a2.25 2.25 0 00-2.25-2.25H5.25a2.25 2.25 0 00-2.25 2.25v.75"
                            />
                        </svg>
                        <p className="text-sm font-medium text-slate-400">
                            Belum ada data pembelian
                        </p>
                    </div>
                ) : (
                    filtered.map((p) => (
                        <div
                            key={p.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        {p.purchase_no}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {p.supplier?.name ?? "-"}
                                    </p>
                                </div>
                                <StatusBadge status={p.status} />
                            </div>
                            <div className="mb-3 flex items-center justify-between text-xs">
                                <span className="text-slate-400">
                                    {new Date(
                                        p.purchase_date,
                                    ).toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                                <div className="text-right">
                                    <p className="font-medium text-slate-700">
                                        Rp{" "}
                                        {Number(p.grand_total).toLocaleString(
                                            "id-ID",
                                        )}
                                    </p>
                                    <PaymentBadge status={p.payment_status} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={route("admin.purchases.show", p.id)}
                                    className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Detail
                                </Link>
                                {p.status === "draft" && (
                                    <button
                                        onClick={() => setDeleteTarget(p)}
                                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            </div>

            <ConfirmDeleteModal
                open={!!deleteTarget}
                title="Hapus Pembelian?"
                description={`Pembelian ${deleteTarget?.purchase_no} akan dihapus permanen. Stok yang sudah ditambahkan akan dikurangi kembali.`}
                confirmLabel="Hapus Pembelian"
                processing={processing}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, color = "slate" }) {
    const colors = {
        slate: "bg-slate-50 text-slate-600",
        amber: "bg-amber-50 text-amber-600",
        emerald: "bg-emerald-50 text-emerald-600",
        rose: "bg-rose-50 text-rose-600",
    };
    const borders = {
        slate: "border-l-slate-400",
        amber: "border-l-amber-400",
        emerald: "border-l-emerald-400",
        rose: "border-l-rose-400",
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

function StatusBadge({ status }) {
    const map = {
        draft: "bg-slate-100 text-slate-600",
        completed: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-red-100 text-red-600",
    };
    const label = {
        draft: "Draft",
        completed: "Selesai",
        cancelled: "Dibatalkan",
    };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-600"}`}
        >
            {label[status] ?? status}
        </span>
    );
}

function PaymentBadge({ status }) {
    const map = {
        unpaid: "bg-rose-100 text-rose-600",
        partial: "bg-amber-100 text-amber-700",
        paid: "bg-emerald-100 text-emerald-700",
    };
    const label = {
        unpaid: "Belum Bayar",
        partial: "Sebagian",
        paid: "Lunas",
    };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-600"}`}
        >
            {label[status] ?? status}
        </span>
    );
}
