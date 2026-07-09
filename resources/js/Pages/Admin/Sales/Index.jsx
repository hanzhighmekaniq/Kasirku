import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import axios from "axios";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

/* ── Order type options per store type ───────────────── */
const ORDER_TYPE_OPTIONS = {
    retail: [
        { v: "takeaway", l: "Ambil" },
        { v: "delivery", l: "Antar" },
        { v: "wholesale", l: "Grosir" },
    ],
    fnb: [
        { v: "dine_in", l: "Dine-in" },
        { v: "takeaway", l: "Takeaway" },
        { v: "delivery", l: "Delivery" },
    ],
    service: [
        { v: "walk_in", l: "Walk-in" },
        { v: "booking", l: "Booking" },
        { v: "pickup_delivery", l: "Jemput & Antar" },
    ],
    rental: [
        { v: "per_hour", l: "Per Jam" },
        { v: "per_day", l: "Per Hari" },
        { v: "per_week", l: "Per Minggu" },
    ],
    ticket: [
        { v: "online", l: "Booking Online" },
        { v: "walk_in", l: "Walk-in" },
        { v: "group", l: "Group" },
    ],
    hospitality: [
        { v: "check_in", l: "Check-in" },
        { v: "reservation", l: "Reservasi" },
        { v: "short_stay", l: "Short Stay" },
    ],
    parking: [
        { v: "entry", l: "Masuk" },
        { v: "exit", l: "Keluar" },
        { v: "lost_ticket", l: "Tiket Hilang" },
    ],
    session: [
        { v: "postpaid", l: "Postpaid" },
        { v: "prepaid", l: "Prepaid" },
        { v: "booking", l: "Booking" },
    ],
};

/* ── Extra column config per store type ──────────────── */
const EXTRA_COL = {
    fnb: {
        header: "Meja",
        render: (s) =>
            s.table?.table_number ? `Meja ${s.table.table_number}` : "-",
    },
    rental: {
        header: "Tgl Kembali",
        render: (s) =>
            s.rent_end_at
                ? new Date(s.rent_end_at).toLocaleDateString("id-ID")
                : "-",
    },
    hospitality: {
        header: "Check-out",
        render: (s) =>
            s.rent_end_at
                ? new Date(s.rent_end_at).toLocaleDateString("id-ID")
                : "-",
    },
    parking: { header: "Plat Nomor", render: (s) => s.plate_number ?? "-" },
    session: { header: "Unit/Sesi", render: (s) => s.unit_name ?? "-" },
};

/* ── Extra status badge per store type ───────────────── */
function ExtraStatusBadge({ sale, storeType }) {
    if (storeType === "rental" && sale.rental_status) {
        const map = {
            active: "bg-blue-100 text-blue-700",
            returned: "bg-emerald-100 text-emerald-700",
            overdue: "bg-red-100 text-red-700",
            cancelled: "bg-slate-100 text-slate-500",
        };
        const label = {
            active: "🔑 Disewa",
            returned: "✅ Kembali",
            overdue: "⚠️ Telat",
            cancelled: "❌ Batal",
        };
        return (
            <span
                className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[sale.rental_status] ?? "bg-slate-100 text-slate-600"}`}
            >
                {label[sale.rental_status] ?? sale.rental_status}
            </span>
        );
    }
    if (storeType === "service" && sale.service_status) {
        const map = {
            waiting: "bg-amber-100 text-amber-700",
            in_progress: "bg-blue-100 text-blue-700",
            done: "bg-emerald-100 text-emerald-700",
        };
        const label = {
            waiting: "⏳ Antri",
            in_progress: "⚙️ Proses",
            done: "✅ Selesai",
        };
        return (
            <span
                className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[sale.service_status] ?? "bg-slate-100 text-slate-600"}`}
            >
                {label[sale.service_status] ?? sale.service_status}
            </span>
        );
    }
    if (storeType === "session" && sale.session_status) {
        const map = {
            running: "bg-blue-100 text-blue-700",
            ended: "bg-emerald-100 text-emerald-700",
        };
        const label = { running: "▶ Aktif", ended: "⏹ Selesai" };
        return (
            <span
                className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[sale.session_status] ?? "bg-slate-100 text-slate-600"}`}
            >
                {label[sale.session_status] ?? sale.session_status}
            </span>
        );
    }
    if (storeType === "hospitality" && sale.rental_status) {
        const map = {
            active: "bg-blue-100 text-blue-700",
            returned: "bg-emerald-100 text-emerald-700",
        };
        const label = { active: "🛏 Check-in", returned: "✅ Check-out" };
        return (
            <span
                className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[sale.rental_status] ?? "bg-slate-100 text-slate-600"}`}
            >
                {label[sale.rental_status] ?? sale.rental_status}
            </span>
        );
    }
    return null;
}

export default function Index({
    sales,
    stats,
    branches = [],
    currentBranchId = "",
    activeFilters = {},
    storeType = "retail",
}) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterOrderType, setFilterOrderType] = useState("all");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [printReceipt, setPrintReceipt] = useState(null);
    const [printLoading, setPrintLoading] = useState(false);

    // Derived from storeType
    const orderTypeOptions =
        ORDER_TYPE_OPTIONS[storeType] ?? ORDER_TYPE_OPTIONS.retail;
    const extraCol = EXTRA_COL[storeType] ?? null;

    // Page title per store type
    const PAGE_TITLE = {
        retail: "Penjualan",
        fnb: "Transaksi",
        service: "Transaksi Jasa",
        rental: "Transaksi Sewa",
        ticket: "Penjualan Tiket",
        hospitality: "Transaksi Penginapan",
        parking: "Transaksi Parkir",
        session: "Transaksi Sesi",
    };
    const pageTitle = PAGE_TITLE[storeType] ?? "Penjualan";

    // Server-side filter state
    const [filterBranch, setFilterBranch] = useState(
        activeFilters.branch_id || "",
    );
    const [dateFrom, setDateFrom] = useState(activeFilters.date_from || "");
    const [dateTo, setDateTo] = useState(activeFilters.date_to || "");
    const [filterPayment, setFilterPayment] = useState(
        activeFilters.payment_status || "all",
    );

    // Apply server-side filters via router
    const applyServerFilters = (params) => {
        const query = {};
        if (params.branch_id) query.branch_id = params.branch_id;
        if (params.date_from) query.date_from = params.date_from;
        if (params.date_to) query.date_to = params.date_to;
        if (params.payment_status && params.payment_status !== "all")
            query.payment_status = params.payment_status;
        router.get(route("admin.sales.index"), query, {
            preserveState: true,
            replace: true,
        });
    };

    const handleBranchChange = (v) => {
        setFilterBranch(v);
        applyServerFilters({
            branch_id: v,
            date_from: dateFrom,
            date_to: dateTo,
            payment_status: filterPayment,
        });
    };

    const handleDateChange = (key, v) => {
        const newFrom = key === "date_from" ? v : dateFrom;
        const newTo = key === "date_to" ? v : dateTo;
        if (key === "date_from") setDateFrom(v);
        else setDateTo(v);
        // Only apply if both dates are filled or both empty
        if (newFrom && newTo) {
            applyServerFilters({
                branch_id: filterBranch,
                date_from: newFrom,
                date_to: newTo,
                payment_status: filterPayment,
            });
        } else if (!newFrom && !newTo) {
            applyServerFilters({
                branch_id: filterBranch,
                date_from: "",
                date_to: "",
                payment_status: filterPayment,
            });
        }
    };

    const handlePaymentFilter = (v) => {
        setFilterPayment(v);
        applyServerFilters({
            branch_id: filterBranch,
            date_from: dateFrom,
            date_to: dateTo,
            payment_status: v,
        });
    };

    const hasActiveServerFilters =
        filterBranch || dateFrom || dateTo || filterPayment !== "all";

    const clearAllServerFilters = () => {
        setFilterBranch("");
        setDateFrom("");
        setDateTo("");
        setFilterPayment("all");
        applyServerFilters({
            branch_id: "",
            date_from: "",
            date_to: "",
            payment_status: "all",
        });
    };

    // Client-side filters (search, status, order type)
    const filtered = useMemo(() => {
        let list = [...sales];
        const q = search.toLowerCase().trim();
        if (q)
            list = list.filter(
                (s) =>
                    s.sale_no?.toLowerCase().includes(q) ||
                    s.customer?.name?.toLowerCase().includes(q) ||
                    s.user?.name?.toLowerCase().includes(q),
            );
        if (filterStatus !== "all")
            list = list.filter((s) => s.status === filterStatus);
        if (filterOrderType !== "all")
            list = list.filter((s) => s.order_type === filterOrderType);
        return list;
    }, [sales, search, filterStatus, filterOrderType]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setProcessing(true);
        router.delete(route("admin.sales.destroy", deleteTarget.id), {
            onFinish: () => {
                setProcessing(false);
                setDeleteTarget(null);
            },
        });
    };

    const handlePrint = async (saleId) => {
        setPrintLoading(true);
        try {
            const { data } = await axios.get(
                route("admin.sales.print", saleId),
                {
                    headers: {
                        Accept: "application/json",
                    },
                },
            );
            setPrintReceipt(data);
        } catch (e) {
            alert(
                "Gagal memuat data struk: " +
                    (e.response?.data?.message ?? e.message),
            );
        } finally {
            setPrintLoading(false);
        }
    };

    const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {pageTitle}
                    </h2>
                    <Link
                        href={route("admin.sales.create")}
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
                        Transaksi Baru
                    </Link>
                </div>
            }
        >
            <Head title="Penjualan" />

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
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                    label="Total Transaksi"
                    value={stats.total}
                    color="slate"
                />
                <SummaryCard
                    label="Selesai"
                    value={stats.completed}
                    color="emerald"
                />
                <SummaryCard label="Draft" value={stats.draft} color="amber" />
                <SummaryCard
                    label="Pendapatan"
                    value={fmtRp(stats.totalRevenue)}
                    color="indigo"
                />
            </div>

            {/* Search + client-side filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
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
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari no. struk, pelanggan, atau kasir..."
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                    <option value="all">Semua Status</option>
                    <option value="completed">Selesai</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Dibatalkan</option>
                </select>
                <select
                    value={filterOrderType}
                    onChange={(e) => setFilterOrderType(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                    <option value="all">Semua Tipe</option>
                    {orderTypeOptions.map((opt) => (
                        <option key={opt.v} value={opt.v}>
                            {opt.l}
                        </option>
                    ))}
                </select>
            </div>

            {/* Server-side filters: branch, date range, payment status */}
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
                {/* Branch filter */}
                {branches.length > 0 && (
                    <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                            Cabang
                        </label>
                        <select
                            value={filterBranch}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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

                {/* Date range */}
                <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                        Dari Tanggal
                    </label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) =>
                            handleDateChange("date_from", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>
                <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                        Sampai Tanggal
                    </label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) =>
                            handleDateChange("date_to", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                {/* Payment status filter */}
                <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                        Status Bayar
                    </label>
                    <select
                        value={filterPayment}
                        onChange={(e) => handlePaymentFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                        <option value="all">Semua</option>
                        <option value="paid">Lunas</option>
                        <option value="partial">Sebagian</option>
                        <option value="unpaid">Belum Bayar</option>
                    </select>
                </div>

                {/* Clear button */}
                {hasActiveServerFilters && (
                    <button
                        onClick={clearAllServerFilters}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                    >
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                        Reset
                    </button>
                )}
            </div>

            {/* Table (desktop) */}
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th className="px-5 py-3.5 font-medium text-slate-500">
                                No. Struk
                            </th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">
                                Cabang
                            </th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">
                                Kasir
                            </th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">
                                Pelanggan
                            </th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">
                                Tipe
                            </th>
                            {extraCol && (
                                <th className="px-5 py-3.5 font-medium text-slate-500">
                                    {extraCol.header}
                                </th>
                            )}
                            <th className="px-5 py-3.5 text-right font-medium text-slate-500">
                                Total
                            </th>
                            <th className="px-5 py-3.5 text-right font-medium text-slate-500">
                                Dibayar
                            </th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">
                                Status
                            </th>
                            {[
                                "rental",
                                "service",
                                "session",
                                "hospitality",
                            ].includes(storeType) && (
                                <th className="px-5 py-3.5 font-medium text-slate-500">
                                    Status Ops
                                </th>
                            )}
                            <th className="px-5 py-3.5 font-medium text-slate-500">
                                Bayar
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
                                    colSpan={
                                        10 +
                                        (extraCol ? 1 : 0) +
                                        ([
                                            "rental",
                                            "service",
                                            "session",
                                            "hospitality",
                                        ].includes(storeType)
                                            ? 1
                                            : 0)
                                    }
                                    className="px-5 py-16 text-center text-slate-400"
                                >
                                    <svg
                                        className="mx-auto mb-2 h-10 w-10 text-slate-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                        />
                                    </svg>
                                    Belum ada data penjualan
                                </td>
                            </tr>
                        ) : (
                            filtered.map((s) => (
                                <tr
                                    key={s.id}
                                    className="transition hover:bg-slate-50/50"
                                >
                                    <td className="px-5 py-3.5 font-medium text-slate-800">
                                        {s.sale_no}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">
                                        {s.branch?.name ?? "-"}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">
                                        {s.user?.name ?? "-"}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">
                                        {s.customer?.name ?? "Umum"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <OrderTypeBadge
                                            type={s.order_type}
                                            storeType={storeType}
                                        />
                                    </td>
                                    {extraCol && (
                                        <td className="px-5 py-3.5 text-slate-600 text-sm">
                                            {extraCol.render(s)}
                                        </td>
                                    )}
                                    <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                                        {fmtRp(s.grand_total)}
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-slate-600">
                                        {fmtRp(s.paid_amount)}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <StatusBadge status={s.status} />
                                    </td>
                                    {[
                                        "rental",
                                        "service",
                                        "session",
                                        "hospitality",
                                    ].includes(storeType) && (
                                        <td className="px-5 py-3.5">
                                            <ExtraStatusBadge
                                                sale={s}
                                                storeType={storeType}
                                            />
                                        </td>
                                    )}
                                    <td className="px-5 py-3.5">
                                        <PaymentBadge
                                            status={s.payment_status}
                                        />
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={route(
                                                    "admin.sales.show",
                                                    s.id,
                                                )}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                                            >
                                                <svg
                                                    className="h-3.5 w-3.5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.8}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                                Detail
                                            </Link>
                                            {s.status !== "draft" && (
                                                <Link
                                                    href={route(
                                                        "admin.sales.show",
                                                        {
                                                            sale: s.id,
                                                            switch: 1,
                                                        },
                                                    )}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 transition hover:bg-amber-50 hover:text-amber-800"
                                                    title="Ganti Pembayaran"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.8}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                                                        />
                                                    </svg>
                                                    Bayar
                                                </Link>
                                            )}
                                            <button
                                                onClick={() =>
                                                    handlePrint(s.id)
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800"
                                                title="Cetak Struk"
                                            >
                                                <svg
                                                    className="h-3.5 w-3.5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.8}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                                                    />
                                                </svg>
                                                Cetak
                                            </button>
                                            {s.status === "draft" && (
                                                <button
                                                    onClick={() =>
                                                        setDeleteTarget(s)
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.8}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                        />
                                                    </svg>
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

            {/* Cards (mobile) */}
            <div className="space-y-3 lg:hidden">
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 shadow-sm">
                        Belum ada data penjualan
                    </div>
                ) : (
                    filtered.map((s) => (
                        <div
                            key={s.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="mb-2 flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {s.sale_no}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {s.branch?.name ?? "-"} &middot;{" "}
                                        {s.user?.name ?? "-"}
                                    </p>
                                </div>
                                <StatusBadge status={s.status} />
                            </div>
                            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-slate-400">
                                        Tanggal
                                    </span>
                                    <p className="font-medium text-slate-700">
                                        {new Date(
                                            s.sale_date,
                                        ).toLocaleDateString("id-ID")}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">
                                        Total
                                    </span>
                                    <p className="font-medium text-slate-700">
                                        {fmtRp(s.grand_total)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Tipe</span>
                                    <p className="font-medium text-slate-700">
                                        <OrderTypeBadge
                                            type={s.order_type}
                                            storeType={storeType}
                                        />
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">
                                        Bayar
                                    </span>
                                    <p className="font-medium text-slate-700">
                                        <PaymentBadge
                                            status={s.payment_status}
                                        />
                                    </p>
                                </div>
                                {extraCol && (
                                    <div>
                                        <span className="text-slate-400">
                                            {extraCol.header}
                                        </span>
                                        <p className="font-medium text-slate-700">
                                            {extraCol.render(s)}
                                        </p>
                                    </div>
                                )}
                                {[
                                    "rental",
                                    "service",
                                    "session",
                                    "hospitality",
                                ].includes(storeType) && (
                                    <div>
                                        <span className="text-slate-400">
                                            Status Ops
                                        </span>
                                        <p className="font-medium text-slate-700">
                                            <ExtraStatusBadge
                                                sale={s}
                                                storeType={storeType}
                                            />
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={route("admin.sales.show", s.id)}
                                    className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Detail
                                </Link>
                                {s.status !== "draft" && (
                                    <Link
                                        href={route("admin.sales.show", {
                                            sale: s.id,
                                            switch: 1,
                                        })}
                                        className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                                        title="Ganti Pembayaran"
                                    >
                                        Bayar
                                    </Link>
                                )}
                                <button
                                    onClick={() => handlePrint(s.id)}
                                    className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                                >
                                    Cetak
                                </button>
                                {s.status === "draft" && (
                                    <button
                                        onClick={() => setDeleteTarget(s)}
                                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmDeleteModal
                open={!!deleteTarget}
                title="Hapus Penjualan?"
                description={`Penjualan ${deleteTarget?.sale_no} akan dihapus permanen. Stok yang sudah dikurangi akan dikembalikan.`}
                confirmLabel="Hapus Penjualan"
                processing={processing}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />

            {/* ── Print Receipt Modal ── */}
            {printReceipt && (
                <PrintReceiptModal
                    sale={printReceipt.sale}
                    storeName={printReceipt.storeName}
                    onClose={() => setPrintReceipt(null)}
                />
            )}

            {/* Loading overlay for print */}
            {printLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
                    <div className="rounded-2xl bg-white px-6 py-5 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <svg
                                className="h-5 w-5 animate-spin text-indigo-500"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            <span className="text-sm font-medium text-slate-600">
                                Memuat struk...
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, color = "slate" }) {
    const borders = {
        slate: "border-l-slate-400",
        emerald: "border-l-emerald-400",
        amber: "border-l-amber-400",
        indigo: "border-l-indigo-400",
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
    const label = { unpaid: "Belum Bayar", partial: "Sebagian", paid: "Lunas" };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-600"}`}
        >
            {label[status] ?? status}
        </span>
    );
}

function OrderTypeBadge({ type, storeType }) {
    const map = {
        // FnB
        dine_in: { label: "Dine In", cls: "bg-blue-100 text-blue-700" },
        takeaway: { label: "Takeaway", cls: "bg-orange-100 text-orange-700" },
        delivery: { label: "Delivery", cls: "bg-purple-100 text-purple-700" },
        // Retail
        wholesale: { label: "Grosir", cls: "bg-cyan-100 text-cyan-700" },
        // Service
        walk_in: { label: "Walk-in", cls: "bg-emerald-100 text-emerald-700" },
        booking: { label: "Booking", cls: "bg-violet-100 text-violet-700" },
        pickup_delivery: {
            label: "Jemput & Antar",
            cls: "bg-purple-100 text-purple-700",
        },
        // Rental
        per_hour: { label: "Per Jam", cls: "bg-amber-100 text-amber-700" },
        per_day: { label: "Per Hari", cls: "bg-amber-100 text-amber-700" },
        per_week: { label: "Per Minggu", cls: "bg-amber-100 text-amber-700" },
        // Ticket
        online: { label: "Online", cls: "bg-rose-100 text-rose-700" },
        group: { label: "Group", cls: "bg-pink-100 text-pink-700" },
        // Hospitality
        check_in: { label: "Check-in", cls: "bg-teal-100 text-teal-700" },
        reservation: {
            label: "Reservasi",
            cls: "bg-indigo-100 text-indigo-700",
        },
        short_stay: { label: "Short Stay", cls: "bg-sky-100 text-sky-700" },
        // Parking
        entry: { label: "Masuk", cls: "bg-slate-100 text-slate-700" },
        exit: { label: "Keluar", cls: "bg-slate-200 text-slate-600" },
        lost_ticket: { label: "Tiket Hilang", cls: "bg-red-100 text-red-600" },
        // Session
        postpaid: { label: "Postpaid", cls: "bg-indigo-100 text-indigo-700" },
        prepaid: { label: "Prepaid", cls: "bg-violet-100 text-violet-700" },
    };
    const config = map[type] ?? {
        label: type ?? "-",
        cls: "bg-slate-100 text-slate-600",
    };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${config.cls}`}
        >
            {config.label}
        </span>
    );
}

/* ── helper formatter ── */
const f = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

/* ── Print Receipt Modal ── */
function PrintReceiptModal({ sale, storeName, onClose }) {
    const date = sale.sale_date
        ? new Date(sale.sale_date).toLocaleString("id-ID")
        : "-";

    // Ekstrak konten struk biar bisa dipakai di screen + print tanpa duplikasi JSX
    const receiptContent = (
        <>
            <p className="text-center text-sm font-bold text-slate-900">
                {storeName}
            </p>
            <p className="mt-0.5 text-center text-slate-500">{sale.sale_no}</p>
            <p className="text-center text-slate-400">{date}</p>
            {sale.table && (
                <p className="text-center font-medium text-slate-600">
                    Meja {sale.table.table_number}
                </p>
            )}
            {sale.customer && !sale.delivery_address && (
                <p className="text-center text-slate-500">
                    Pelanggan: {sale.customer.name}
                </p>
            )}
            {sale.delivery_address && (
                <>
                    {(() => {
                        const addr = sale.delivery_address;
                        const nameMatch = addr.match(/^Penerima: (.+)\n/);
                        const name = nameMatch ? nameMatch[1] : null;
                        const cleanAddr = addr.replace(/^Penerima: .+\n/, "");
                        return (
                            <>
                                {name && (
                                    <p className="text-center font-medium text-slate-700">
                                        {name}
                                    </p>
                                )}
                                <p className="text-center text-slate-500">
                                    {cleanAddr}
                                </p>
                            </>
                        );
                    })()}
                </>
            )}
            {sale.order_type && (
                <p className="text-center text-[10px] uppercase tracking-wider text-slate-400">
                    {(() => {
                        const labels = {
                            dine_in: "Dine-in",
                            takeaway: "Takeaway",
                            delivery: "Delivery",
                            wholesale: "Grosir",
                            walk_in: "Walk-in",
                            booking: "Booking",
                            pickup_delivery: "Jemput & Antar",
                            per_hour: "Per Jam",
                            per_day: "Per Hari",
                            per_week: "Per Minggu",
                            online: "Online",
                            group: "Group",
                            check_in: "Check-in",
                            reservation: "Reservasi",
                            short_stay: "Short Stay",
                            entry: "Masuk",
                            exit: "Keluar",
                            lost_ticket: "Tiket Hilang",
                            postpaid: "Postpaid",
                            prepaid: "Prepaid",
                        };
                        return labels[sale.order_type] ?? sale.order_type;
                    })()}
                </p>
            )}

            <div className="my-3 border-t border-dashed border-slate-300" />

            {sale.items.map((item, i) => (
                <div key={i} className="mb-1">
                    <div className="flex justify-between">
                        <span className="text-slate-700">
                            {item.product?.name ?? "Produk"}
                        </span>
                        <span className="text-slate-800">
                            {f(item.subtotal)}
                        </span>
                    </div>
                    <span className="text-slate-400">
                        {item.quantity} × {f(item.price)}
                    </span>
                    {item.modifiers?.map((m, j) => (
                        <div key={j} className="pl-2 text-slate-400">
                            {m.name}{" "}
                            {(m.price_addition ?? 0) > 0 &&
                                `+${(m.price_addition ?? 0).toLocaleString("id-ID")}`}
                        </div>
                    ))}
                    {(item.promo_discount ?? 0) > 0 && (
                        <div className="pl-2 text-xs text-emerald-600">
                            Promo: -{f(item.promo_discount)}
                        </div>
                    )}
                </div>
            ))}

            <div className="my-3 border-t border-dashed border-slate-300" />

            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{f(sale.subtotal)}</span>
            </div>
            {(sale.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-{f(sale.discount_amount)}</span>
                </div>
            )}
            {(sale.tax_amount ?? 0) > 0 && (
                <div className="flex justify-between">
                    <span>Pajak</span>
                    <span>{f(sale.tax_amount)}</span>
                </div>
            )}
            {(sale.shipping_amount ?? 0) > 0 && (
                <div className="flex justify-between">
                    <span>Ongkir</span>
                    <span>{f(sale.shipping_amount)}</span>
                </div>
            )}

            <div className="mt-1 flex justify-between text-sm font-bold text-slate-900">
                <span>Total</span>
                <span>{f(sale.grand_total)}</span>
            </div>

            {sale.payments?.map((p, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                    <span>{p.paymentMethod?.name ?? "Pembayaran"}</span>
                    <span>{f(p.amount)}</span>
                </div>
            ))}
            {(sale.change_amount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                    <span>Kembalian</span>
                    <span>{f(sale.change_amount)}</span>
                </div>
            )}

            {sale.notes && (
                <>
                    <div className="my-3 border-t border-dashed border-slate-300" />
                    <p className="whitespace-pre-wrap text-center text-slate-500">
                        {sale.notes}
                    </p>
                </>
            )}

            <div className="my-3 border-t border-dashed border-slate-300" />
            <p className="text-center text-slate-400">
                Terima kasih atas kunjungan Anda
            </p>
            <p className="text-center text-[9px] text-slate-300">
                Dicetak: {new Date().toLocaleString("id-ID")}
            </p>
        </>
    );

    return (
        <>
            {/* CSS untuk layar vs print */}
            <style>{`
                @media screen {
                    .print-only-sales { display: none !important; }
                }
                @media print {
                    /* Sembunyikan semua direct-child body kecuali struk */
                    body > *:not(.print-only-sales) {
                        display: none !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .print-only-sales {
                        display: block !important;
                        width: 80mm !important;
                        margin: 0 auto !important;
                        padding: 15px 10px !important;
                        font-family: monospace !important;
                        font-size: 12px !important;
                        color: #1e293b !important;
                        background: white !important;
                    }
                    @page { margin: 0; size: 80mm auto; }
                }
            `}</style>

            {/* ─── Tampilan print — Portal langsung ke body agar tidak ada extra space ─── */}
            {ReactDOM.createPortal(
                <div className="print-only-sales">{receiptContent}</div>,
                document.body,
            )}

            {/* ─── Modal layar — lihat struk ─── */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <div className="relative w-full max-w-xs rounded-2xl bg-white shadow-2xl">
                    <div className="px-6 py-5 font-mono text-xs max-h-[70vh] overflow-y-auto">
                        {receiptContent}
                    </div>

                    <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                        >
                            Cetak Ulang
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            🖨️ Print
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
