import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import * as ReactDOM from "react-dom";
import PGPaymentModal from "@/Pages/Admin/PGPaymentModal";
import BarcodeScanner from "@/Components/BarcodeScanner";

import useKasir from "./useKasir";
import IconBtn from "./components/IconBtn";
import ModifierModal from "./components/ModifierModal";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";
import HistoryPanel from "./components/HistoryPanel";
import ProductCard from "./components/ProductCard";
import CartRow from "./components/CartRow";

export default function Kasir(props) {
    const k = useKasir(props);
    const {
        tables,
        categories,
        paymentMethods,
        pgMethods = [],
        storeType,
        storeName,
        receiptFooter,
        activeShift,
    } = props;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Kasir
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => k.setShowHistory(true)}
                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <svg
                                className={`h-5 w-5 ${k.historyPrintLoading ? "animate-spin text-indigo-600" : "text-slate-400"}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                {k.historyPrintLoading ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                )}
                            </svg>
                            Riwayat
                        </button>
                        <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-500 sm:inline">
                            {storeType
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Kasir" />

            <div className="flex h-[calc(100vh-7.5rem)] gap-4 overflow-hidden">
                {/* ── LEFT: Product panel ── */}
                <div className="flex p-4 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {!activeShift ? (
                        <div className="m-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-5 shadow-sm">
                            <div className="flex  items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
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
                                                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">
                                            Belum Ada Shift Aktif
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            Anda harus membuka shift sebelum
                                            melakukan transaksi.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={route("admin.cashier-shifts.create")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:from-amber-600 hover:to-orange-600"
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
                                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Buka Shift
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                                        <svg
                                            className="h-4 w-4 text-white"
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
                                        <p className="text-sm font-medium text-emerald-800">
                                            Shift Aktif:{" "}
                                            <span className="font-semibold">
                                                {activeShift.shift_no}
                                            </span>
                                        </p>
                                        <p className="text-xs text-emerald-600">
                                            Kas awal:{" "}
                                            {k.fmt(activeShift.opening_cash)}
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
                                    Detail Shift
                                </Link>
                            </div>
                        </div>
                    )}
                    {/* Search + barcode */}
                    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                    />
                                </svg>
                            </span>
                            <input
                                ref={k.barcodeRef}
                                type="text"
                                value={k.search}
                                onChange={(e) => k.setSearch(e.target.value)}
                                placeholder="Cari produk atau scan barcode..."
                                className="block w-full rounded-xl border-slate-300 pl-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <button
                            onClick={() => k.setShowScanner(true)}
                            className="shrink-0 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition"
                            title="Scan Barcode"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Category chips */}
                    <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-3 py-2.5 scrollbar-thin">
                        <button
                            onClick={() => k.setActiveCat("")}
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${!k.activeCat ? "bg-indigo-500 text-white shadow" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                            Semua
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() =>
                                    k.setActiveCat(
                                        String(c.id) === k.activeCat
                                            ? ""
                                            : String(c.id),
                                    )
                                }
                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${String(c.id) === k.activeCat ? "bg-indigo-500 text-white shadow" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            >
                                {c.name}{" "}
                                <span className="opacity-60">
                                    ({c.products_count})
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {k.filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <svg
                                    className="mb-3 h-12 w-12 text-slate-200"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                                    />
                                </svg>
                                <p className="text-sm text-slate-400">
                                    {k.search
                                        ? "Produk tidak ditemukan."
                                        : "Tidak ada produk."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {k.filtered.map((p) => (
                                    <ProductCard
                                        key={p.id}
                                        product={p}
                                        onClick={() => k.handleProductClick(p)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Cart + summary ── */}
                <div
                    className={`flex w-80 shrink-0 gap-1 flex-col xl:w-96 md:relative md:flex max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-80 max-md:bg-white max-md:shadow-2xl max-md:transition-transform max-md:duration-300 sm:max-md:w-96 ${k.cartPanelOpen ? "max-md:translate-x-0" : "max-md:translate-x-full max-md:hidden"}`}
                >
                    {/* Order options */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex border-b border-slate-100">
                            {k.orderOpts.map((o) => (
                                <button
                                    key={o.v}
                                    onClick={() => k.handleOrderTypeChange(o.v)}
                                    className={`flex-1 py-2.5 text-xs font-semibold transition ${k.orderType === o.v ? "bg-indigo-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                                >
                                    {o.l}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 p-3">
                            {/* Table selector — searchable dropdown */}
                            {(k.isCafe || k.isBooth || k.isHospitality) &&
                                k.orderType === "dine_in" &&
                                tables.length > 0 && (
                                    <div className="w-full relative">
                                        {k.selectedTable ? (
                                            /* Show selected table */
                                            <div
                                                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${
                                                    !k.selectedTable
                                                        ? "border-amber-400 bg-amber-50"
                                                        : "border-indigo-200 bg-indigo-50"
                                                }`}
                                            >
                                                <svg
                                                    className="h-3.5 w-3.5 text-indigo-500 shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                                                    />
                                                </svg>
                                                <span className="text-xs font-medium text-indigo-700">
                                                    Meja{" "}
                                                    {
                                                        tables.find(
                                                            (t) =>
                                                                String(t.id) ===
                                                                String(
                                                                    k.selectedTable,
                                                                ),
                                                        )?.table_number
                                                    }
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        k.setSelectedTable("");
                                                        k.setTableSearch("");
                                                    }}
                                                    className="ml-auto shrink-0 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 transition"
                                                >
                                                    <svg
                                                        className="h-3 w-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={2.5}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            /* Search input */
                                            <div className="relative">
                                                <svg
                                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                                    />
                                                </svg>
                                                <input
                                                    ref={k.tableInputRef}
                                                    type="text"
                                                    placeholder="Cari meja..."
                                                    value={k.tableSearch}
                                                    onFocus={(e) => {
                                                        const r =
                                                            e.target.getBoundingClientRect();
                                                        k.setTableDropdownPos({
                                                            top: r.bottom + 4,
                                                            left: r.left,
                                                            width: r.width,
                                                        });
                                                        k.setShowTableDropdown(
                                                            true,
                                                        );
                                                    }}
                                                    onChange={(e) => {
                                                        k.setTableSearch(
                                                            e.target.value,
                                                        );
                                                        if (
                                                            !k.showTableDropdown
                                                        ) {
                                                            const r =
                                                                e.target.getBoundingClientRect();
                                                            k.setTableDropdownPos(
                                                                {
                                                                    top:
                                                                        r.bottom +
                                                                        4,
                                                                    left: r.left,
                                                                    width: r.width,
                                                                },
                                                            );
                                                        }
                                                        k.setShowTableDropdown(
                                                            true,
                                                        );
                                                    }}
                                                    className={`w-full rounded-xl border py-1.5 pl-8 pr-2 text-xs focus:ring-2 focus:ring-indigo-200 outline-none ${
                                                        !k.selectedTable
                                                            ? "border-amber-400 bg-amber-50 focus:border-amber-500"
                                                            : "border-slate-300 focus:border-indigo-500"
                                                    }`}
                                                />
                                            </div>
                                        )}

                                        {/* Warning kalau belum pilih meja */}
                                        {k.orderType === "dine_in" &&
                                            !k.selectedTable && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    ⚠ Pilih meja untuk dine-in
                                                </p>
                                            )}

                                        {/* Dropdown list — fixed positioned */}
                                        {k.showTableDropdown &&
                                            !k.selectedTable &&
                                            ReactDOM.createPortal(
                                                <div
                                                    ref={k.tableDropdownRef}
                                                    className="z-[9999] max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
                                                    style={{
                                                        position: "fixed",
                                                        top: k.tableDropdownPos
                                                            .top,
                                                        left: k.tableDropdownPos
                                                            .left,
                                                        width: k
                                                            .tableDropdownPos
                                                            .width,
                                                    }}
                                                >
                                                    {(() => {
                                                        const q = k.tableSearch
                                                            .toLowerCase()
                                                            .trim();
                                                        const filtered =
                                                            tables.filter(
                                                                (t) =>
                                                                    !q ||
                                                                    String(
                                                                        t.table_number,
                                                                    ).includes(
                                                                        q,
                                                                    ) ||
                                                                    String(
                                                                        t.capacity,
                                                                    ).includes(
                                                                        q,
                                                                    ),
                                                            );
                                                        if (
                                                            filtered.length ===
                                                            0
                                                        ) {
                                                            return (
                                                                <p className="px-3 py-3 text-center text-xs text-slate-400">
                                                                    Tidak ada
                                                                    meja
                                                                </p>
                                                            );
                                                        }
                                                        return filtered.map(
                                                            (t) => {
                                                                return (
                                                                    <button
                                                                        key={
                                                                            t.id
                                                                        }
                                                                        onClick={() => {
                                                                            k.setSelectedTable(
                                                                                t.id,
                                                                            );
                                                                            k.setShowTableDropdown(
                                                                                false,
                                                                            );
                                                                            k.setTableSearch(
                                                                                "",
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-indigo-50"
                                                                    >
                                                                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                                                                            {
                                                                                t.table_number
                                                                            }
                                                                        </span>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-medium text-slate-700">
                                                                                Meja{" "}
                                                                                {
                                                                                    t.table_number
                                                                                }
                                                                            </p>
                                                                            <p className="text-[10px] text-slate-400">
                                                                                Kapasitas{" "}
                                                                                {
                                                                                    t.capacity
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            },
                                                        );
                                                    })()}
                                                </div>,
                                                document.body,
                                            )}
                                    </div>
                                )}

                            {/* Customer selector (searchable) */}
                            <div className="relative flex-1">
                                {k.selectedCustomer ? (
                                    /* Show selected customer with clear button */
                                    <div className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5">
                                        <svg
                                            className="h-3.5 w-3.5 text-indigo-500 shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                            />
                                        </svg>
                                        <span className="text-xs font-medium text-indigo-700 truncate">
                                            {
                                                k.customers.find(
                                                    (c) =>
                                                        String(c.id) ===
                                                        String(
                                                            k.selectedCustomer,
                                                        ),
                                                )?.name
                                            }
                                        </span>
                                        <button
                                            onClick={() => {
                                                k.setSelectedCustomer("");
                                                k.setCustomerSearch("");
                                            }}
                                            className="ml-auto shrink-0 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 transition"
                                        >
                                            <svg
                                                className="h-3 w-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2.5}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    /* Search input */
                                    <div className="relative">
                                        <svg
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                            />
                                        </svg>
                                        <input
                                            ref={k.customerInputRef}
                                            type="text"
                                            placeholder="Cari pelanggan..."
                                            value={k.customerSearch}
                                            onFocus={(e) => {
                                                const r =
                                                    e.target.getBoundingClientRect();
                                                k.setCustomerDropdownPos({
                                                    top: r.bottom + 4,
                                                    left: r.left,
                                                    width: r.width,
                                                });
                                                k.setShowCustomerDropdown(true);
                                            }}
                                            onChange={(e) => {
                                                k.setCustomerSearch(
                                                    e.target.value,
                                                );
                                                if (!k.showCustomerDropdown) {
                                                    const r =
                                                        e.target.getBoundingClientRect();
                                                    k.setCustomerDropdownPos({
                                                        top: r.bottom + 4,
                                                        left: r.left,
                                                        width: r.width,
                                                    });
                                                }
                                                k.setShowCustomerDropdown(true);
                                            }}
                                            className="w-full rounded-xl border border-slate-300 py-1.5 pl-8 pr-2 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Customer tier badge */}
                            {k.selectedCustomer &&
                                (() => {
                                    const cust = k.customers.find(
                                        (c) =>
                                            String(c.id) ===
                                            String(k.selectedCustomer),
                                    );
                                    return cust ? (
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${k.TIER_COLORS[cust.tier] ?? k.TIER_COLORS.bronze}`}
                                        >
                                            {cust.tier} ·{" "}
                                            {k.fmtShort(cust.points)} pts
                                        </span>
                                    ) : null;
                                })()}

                            {/* Dropdown list — fixed positioned to escape overflow-hidden */}
                            {k.showCustomerDropdown &&
                                !k.selectedCustomer &&
                                ReactDOM.createPortal(
                                    <div
                                        ref={k.customerDropdownRef}
                                        className="z-[9999] max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
                                        style={{
                                            position: "fixed",
                                            top: k.customerDropdownPos.top,
                                            left: k.customerDropdownPos.left,
                                            width: k.customerDropdownPos.width,
                                        }}
                                    >
                                        {/* "Umum" option */}
                                        <button
                                            onClick={() => {
                                                k.setSelectedCustomer("");
                                                k.setShowCustomerDropdown(
                                                    false,
                                                );
                                                k.setCustomerSearch("");
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 transition border-b border-slate-100"
                                        >
                                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                                                U
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-700">
                                                    Umum
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    Tanpa pelanggan
                                                </p>
                                            </div>
                                        </button>
                                        {/* Quick Add Pelanggan Baru */}
                                        <div className="border-b border-slate-100 py-1">
                                            {!k.quickAddOpen ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        k.setQuickAddOpen(true)
                                                    }
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 transition font-medium"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5"
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
                                                    Pelanggan Baru
                                                </button>
                                            ) : (
                                                <div className="px-3 py-2 space-y-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Nama pelanggan..."
                                                        value={k.quickAddName}
                                                        onChange={(e) =>
                                                            k.setQuickAddName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="block w-full rounded-lg border-slate-300 py-1.5 px-2 text-xs shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Telepon (opsional)"
                                                        value={k.quickAddPhone}
                                                        onChange={(e) =>
                                                            k.setQuickAddPhone(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="block w-full rounded-lg border-slate-300 py-1.5 px-2 text-xs shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                !k.quickAddName.trim() ||
                                                                k.quickAdding
                                                            }
                                                            onClick={async () => {
                                                                k.setQuickAdding(
                                                                    true,
                                                                );
                                                                try {
                                                                    const {
                                                                        data,
                                                                    } =
                                                                        await axios.post(
                                                                            route(
                                                                                "admin.customers.store",
                                                                            ),
                                                                            {
                                                                                name: k.quickAddName.trim(),
                                                                                phone:
                                                                                    k.quickAddPhone.trim() ||
                                                                                    null,
                                                                                email: null,
                                                                                address:
                                                                                    null,
                                                                            },
                                                                            {
                                                                                headers:
                                                                                    {
                                                                                        "X-Inertia":
                                                                                            "false",
                                                                                        Accept: "application/json",
                                                                                    },
                                                                            },
                                                                        );
                                                                    if (
                                                                        data.customer
                                                                    ) {
                                                                        k.setCustomers(
                                                                            (
                                                                                prev,
                                                                            ) => [
                                                                                data.customer,
                                                                                ...prev,
                                                                            ],
                                                                        );
                                                                        k.setSelectedCustomer(
                                                                            data
                                                                                .customer
                                                                                .id,
                                                                        );
                                                                        if (
                                                                            k.orderType ===
                                                                            "delivery"
                                                                        )
                                                                            k.setDeliveryCustomerName(
                                                                                data
                                                                                    .customer
                                                                                    .name,
                                                                            );
                                                                        if (
                                                                            k.orderType ===
                                                                            "takeaway"
                                                                        )
                                                                            k.setTakeawayCustomerName(
                                                                                data
                                                                                    .customer
                                                                                    .name,
                                                                            );
                                                                        k.setShowCustomerDropdown(
                                                                            false,
                                                                        );
                                                                    }
                                                                    k.setQuickAddOpen(
                                                                        false,
                                                                    );
                                                                    k.setQuickAddName(
                                                                        "",
                                                                    );
                                                                    k.setQuickAddPhone(
                                                                        "",
                                                                    );
                                                                } catch (err) {
                                                                    alert(
                                                                        "Gagal: " +
                                                                            (err
                                                                                .response
                                                                                ?.data
                                                                                ?.message ||
                                                                                err.message),
                                                                    );
                                                                } finally {
                                                                    k.setQuickAdding(
                                                                        false,
                                                                    );
                                                                }
                                                            }}
                                                            className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                                        >
                                                            {k.quickAdding
                                                                ? "Menyimpan..."
                                                                : "Simpan"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                k.setQuickAddOpen(
                                                                    false,
                                                                );
                                                                k.setQuickAddName(
                                                                    "",
                                                                );
                                                                k.setQuickAddPhone(
                                                                    "",
                                                                );
                                                            }}
                                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {(() => {
                                            const q = k.customerSearch
                                                .toLowerCase()
                                                .trim();
                                            const filtered = k.customers.filter(
                                                (c) =>
                                                    !q ||
                                                    c.name
                                                        ?.toLowerCase()
                                                        .includes(q) ||
                                                    c.phone?.includes(q) ||
                                                    c.code
                                                        ?.toLowerCase()
                                                        .includes(q),
                                            );
                                            if (filtered.length === 0) {
                                                return (
                                                    <p className="px-3 py-3 text-center text-xs text-slate-400">
                                                        Tidak ditemukan
                                                    </p>
                                                );
                                            }
                                            return filtered.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        k.setSelectedCustomer(
                                                            c.id,
                                                        );
                                                        k.setShowCustomerDropdown(
                                                            false,
                                                        );
                                                        k.setCustomerSearch("");
                                                        if (
                                                            k.orderType ===
                                                            "delivery"
                                                        ) {
                                                            k.setDeliveryCustomerName(
                                                                c.name,
                                                            );
                                                        }
                                                        if (
                                                            k.orderType ===
                                                            "takeaway"
                                                        ) {
                                                            k.setTakeawayCustomerName(
                                                                c.name,
                                                            );
                                                        }
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-indigo-50 transition"
                                                >
                                                    <span
                                                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${k.TIER_COLORS[c.tier] ? "bg-gradient-to-br from-indigo-400 to-indigo-600" : "bg-slate-300"}`}
                                                    >
                                                        {c.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-slate-700 truncate">
                                                            {c.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 truncate">
                                                            {c.phone
                                                                ? c.phone
                                                                : ""}
                                                            {c.code
                                                                ? ` · ${c.code}`
                                                                : ""}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${k.TIER_COLORS[c.tier] ?? k.TIER_COLORS.bronze}`}
                                                    >
                                                        {c.tier}
                                                    </span>
                                                </button>
                                            ));
                                        })()}
                                    </div>,
                                    document.body,
                                )}
                        </div>
                    </div>

                    {/* Takeaway — Nama Pelanggan */}
                    {k.orderType === "takeaway" && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-emerald-50/60 px-4 py-2.5">
                                <h3 className="text-xs font-semibold text-emerald-800">
                                    Nama Pelanggan (Takeaway)
                                </h3>
                            </div>
                            <div className="p-3">
                                <input
                                    type="text"
                                    value={k.takeawayCustomerName}
                                    onChange={(e) =>
                                        k.setTakeawayCustomerName(
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ketik nama atau pilih pelanggan di atas..."
                                    className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                />
                            </div>
                        </div>
                    )}
                    {/* Delivery fields */}
                    {k.orderType === "delivery" && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <button
                                type="button"
                                onClick={() =>
                                    k.setDeliveryInfoOpen(!k.deliveryInfoOpen)
                                }
                                className="flex w-full items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 transition hover:bg-slate-100/50"
                            >
                                <h3 className="text-xs font-semibold text-slate-700">
                                    Info Pengiriman
                                </h3>
                                <svg
                                    className={`h-4 w-4 text-slate-400 transition-transform ${k.deliveryInfoOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                    />
                                </svg>
                            </button>
                            {k.deliveryInfoOpen && (
                                <div className="space-y-3 p-3">
                                    {/* Nama Penerima */}
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">
                                            Nama Penerima{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={k.deliveryCustomerName}
                                            onChange={(e) =>
                                                k.setDeliveryCustomerName(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ketik nama atau pilih pelanggan di bawah..."
                                            className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">
                                            Alamat Pengiriman{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={k.deliveryAddress}
                                            onChange={(e) =>
                                                k.setDeliveryAddress(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Jl. Contoh No. 123, Kecamatan..."
                                            className="block w-full rounded-lg border-slate-300 text-xs shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">
                                            Biaya Antar / Ongkir
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-slate-400">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={k.deliveryFee}
                                                onChange={(e) =>
                                                    k.setDeliveryFee(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="0"
                                                className="block w-full rounded-lg border-slate-300 py-1.5 pl-8 text-xs shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Service: Laundry weight */}
                    {k.isService && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-violet-50/60 px-4 py-2.5">
                                <h3 className="text-xs font-semibold text-violet-800">
                                    Detail Layanan
                                </h3>
                            </div>
                            <div className="p-3">
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    Berat (kg)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={k.serviceWeight}
                                    onChange={(e) =>
                                        k.setServiceWeight(e.target.value)
                                    }
                                    placeholder="0"
                                    className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                                />
                            </div>
                        </div>
                    )}

                    {/* Rental: Duration */}
                    {k.isRental && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-cyan-50/60 px-4 py-2.5">
                                <h3 className="text-xs font-semibold text-cyan-800">
                                    Detail Sewa
                                </h3>
                            </div>
                            <div className="p-3">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="mb-1 block text-xs font-medium text-slate-600">
                                            Durasi
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={k.rentalDuration}
                                            onChange={(e) =>
                                                k.setRentalDuration(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                    <div className="w-28">
                                        <label className="mb-1 block text-xs font-medium text-slate-600">
                                            Satuan
                                        </label>
                                        <select
                                            value={k.rentalUnit}
                                            onChange={(e) =>
                                                k.setRentalUnit(e.target.value)
                                            }
                                            className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                                        >
                                            <option value="per_hour">
                                                Per Jam
                                            </option>
                                            <option value="per_day">
                                                Per Hari
                                            </option>
                                            <option value="per_week">
                                                Per Minggu
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ticket: Event + Slot */}
                    {k.isTicket && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-rose-50/60 px-4 py-2.5">
                                <h3 className="text-xs font-semibold text-rose-800">
                                    Detail Tiket
                                </h3>
                            </div>
                            <div className="p-3 space-y-2">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Nama Event / Acara
                                    </label>
                                    <input
                                        type="text"
                                        value={k.ticketEvent}
                                        onChange={(e) =>
                                            k.setTicketEvent(e.target.value)
                                        }
                                        placeholder="Contoh: Avengers, Futsal Lap. A"
                                        className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Slot / Jadwal
                                    </label>
                                    <input
                                        type="text"
                                        value={k.ticketSlot}
                                        onChange={(e) =>
                                            k.setTicketSlot(e.target.value)
                                        }
                                        placeholder="Contoh: 14:00 - 15:00"
                                        className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hospitality: Room */}
                    {k.isHospitality && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-amber-50/60 px-4 py-2.5">
                                <h3 className="text-xs font-semibold text-amber-800">
                                    Detail Kamar
                                </h3>
                            </div>
                            <div className="p-3">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="mb-1 block text-xs font-medium text-slate-600">
                                            No. Kamar
                                        </label>
                                        <input
                                            type="text"
                                            value={k.roomNumber}
                                            onChange={(e) =>
                                                k.setRoomNumber(e.target.value)
                                            }
                                            placeholder="Contoh: 101, Deluxe A"
                                            className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="mb-1 block text-xs font-medium text-slate-600">
                                            Tamu
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={k.guestCount}
                                            onChange={(e) =>
                                                k.setGuestCount(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cart items */}
                    <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Keranjang{" "}
                                <span className="text-slate-400">
                                    ({k.cart.length})
                                </span>
                            </h3>
                            {k.cart.length > 0 && (
                                <button
                                    onClick={k.clearCart}
                                    className="text-xs text-red-500 hover:text-red-700 transition"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 p-3">
                            {k.cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <svg
                                        className="mb-2 h-10 w-10 text-slate-200"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.3}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                                        />
                                    </svg>
                                    <p className="text-sm text-slate-400">
                                        Keranjang kosong
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Pilih produk di sebelah kiri
                                    </p>
                                </div>
                            ) : (
                                k.cart.map((item) => (
                                    <CartRow
                                        key={item.cartId}
                                        item={item}
                                        onQty={k.changeQty}
                                        onRemove={k.removeItem}
                                    />
                                ))
                            )}
                        </div>

                        {/* Note */}
                        {k.cart.length > 0 && (
                            <div className="border-t border-slate-100 px-3 py-2">
                                <input
                                    type="text"
                                    value={k.note}
                                    onChange={(e) => k.setNote(e.target.value)}
                                    placeholder="Catatan transaksi..."
                                    className="block w-full rounded-xl border-slate-200 bg-slate-50 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                        )}

                        {/* Totals */}
                        <div className="border-t border-slate-200 p-3 space-y-2">
                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-medium text-slate-800">
                                    {k.fmt(k.subtotal)}
                                </span>
                            </div>
                            {k.totalPromoDisc > 0 && (
                                <div className="flex items-center justify-between text-sm text-emerald-600">
                                    <span className="inline-flex items-center gap-1">
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 6h.008v.008H6V6z"
                                            />
                                        </svg>
                                        Diskon Promo
                                    </span>
                                    <span className="font-semibold">
                                        -{k.fmt(k.totalPromoDisc)}
                                    </span>
                                </div>
                            )}
                            {k.cartPromoDiscount > 0 && (
                                <div className="flex items-center justify-between text-sm text-emerald-600">
                                    <span className="inline-flex items-center gap-1">
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 6h.008v.008H6V6z"
                                            />
                                        </svg>
                                        {k.cartPromoName || "Diskon Keranjang"}
                                    </span>
                                    <span className="font-semibold">
                                        -{k.fmt(k.cartPromoDiscount)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="w-20 text-xs text-slate-500">
                                    Diskon
                                </span>
                                <div className="relative flex-1">
                                    <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-slate-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={k.discount}
                                        onChange={(e) =>
                                            k.setDiscount(e.target.value)
                                        }
                                        className="block w-full rounded-lg border-slate-200 py-1 pl-7 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-20 text-xs text-slate-500">
                                    Pajak
                                </span>
                                <div className="relative flex-1">
                                    <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-slate-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={k.tax}
                                        onChange={(e) =>
                                            k.setTax(e.target.value)
                                        }
                                        className="block w-full rounded-lg border-slate-200 py-1 pl-7 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                                    />
                                </div>
                            </div>
                            {k.orderType === "delivery" &&
                                Number(k.deliveryFee) > 0 && (
                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                            <svg
                                                className="h-3.5 w-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                                                />
                                            </svg>
                                            Ongkir
                                        </span>
                                        <span className="font-medium text-slate-700">
                                            {k.fmt(Number(k.deliveryFee))}
                                        </span>
                                    </div>
                                )}
                            <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2">
                                <span className="text-sm font-semibold text-indigo-800">
                                    Total
                                </span>
                                <span className="text-lg font-bold text-indigo-700">
                                    {k.fmt(k.grandTotal)}
                                </span>
                            </div>
                            <button
                                type="button"
                                disabled={
                                    k.cart.length === 0 ||
                                    k.submitting ||
                                    (k.orderType === "dine_in" &&
                                        (k.isCafe || k.isBooth) &&
                                        !k.selectedTable)
                                }
                                onClick={() => k.setShowPayment(true)}
                                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {k.submitting
                                    ? "Memproses..."
                                    : k.orderType === "dine_in" &&
                                        (k.isCafe || k.isBooth) &&
                                        !k.selectedTable
                                      ? "Pilih meja dulu"
                                      : `Bayar ${k.cart.length > 0 ? k.fmt(k.grandTotal) : ""}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Cart Backdrop */}
            {k.cartPanelOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
                    onClick={() => k.setCartPanelOpen(false)}
                />
            )}

            {/* Mobile Floating Cart Button */}
            <button
                type="button"
                onClick={() => k.setCartPanelOpen(true)}
                className={`fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:from-indigo-600 hover:to-violet-700 md:hidden ${k.cartPanelOpen ? "hidden" : ""}`}
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
                    />
                </svg>
                Keranjang
                {k.cart.length > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600">
                        {k.cart.length}
                    </span>
                )}
            </button>

            {/* Modals */}
            {k.modifierTarget && (
                <ModifierModal
                    product={k.modifierTarget}
                    onConfirm={(mods, note) => {
                        k.addToCart(k.modifierTarget, null, mods, note);
                        k.setModifierTarget(null);
                    }}
                    onClose={() => k.setModifierTarget(null)}
                />
            )}
            {k.showPayment && (
                <PaymentModal
                    grandTotal={k.grandTotal}
                    paymentMethods={paymentMethods}
                    pgMethods={pgMethods}
                    onConfirm={k.handleConfirmPayment}
                    onClose={() => k.setShowPayment(false)}
                    submitting={k.submitting}
                />
            )}
            {k.showReceipt && k.receiptData && (
                <ReceiptModal
                    receipt={k.receiptData}
                    storeName={storeName}
                    footer={receiptFooter}
                    onClose={() => k.setShowReceipt(false)}
                    onNewTransaction={() => k.setShowReceipt(false)}
                />
            )}
            {k.showHistory && (
                <HistoryPanel
                    sales={k.historyList}
                    onClose={() => k.setShowHistory(false)}
                    onPrint={k.handlePrintHistory}
                />
            )}
            {k.pgModalData && (
                <PGPaymentModal
                    pgData={{
                        pg_trx_id: k.pgModalData.pgTrxId,
                        payment_type: k.pgModalData.paymentType,
                        qr_code: k.pgModalData.qrCode,
                        qr_image_url: k.pgModalData.qrImageUrl,
                        va_number: k.pgModalData.vaNumber,
                        va_bank: k.pgModalData.vaBank,
                        payment_url: k.pgModalData.paymentUrl,
                    }}
                    amount={k.pgModalData.amount}
                    onSuccess={k.handlePgSuccess}
                    onClose={() => k.setPgModalData(null)}
                />
            )}

            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                isOpen={k.showScanner}
                onClose={() => k.setShowScanner(false)}
                onScan={k.handleBarcodeScan}
            />
        </AuthenticatedLayout>
    );
}
