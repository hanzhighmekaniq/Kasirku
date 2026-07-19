import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import * as ReactDOM from "react-dom";
import {
    ScanLine,
    Search,
    History,
    Maximize2,
    Minimize2,
    X,
    Trash2,
    UserRound,
    Pencil,
    Truck,
    PackageCheck,
    Clock,
    CreditCard,
    ShoppingCart,
    ChevronRight,
    CircleCheck,
    LayoutGrid,
    MessageSquare,
    Tag,
    Pause,
    Layers,
    GripVertical,
} from "lucide-react";

import { useStoreModules } from "@/Hooks/useStoreModules";
import PGPaymentModal from "@/Pages/Admin/PGPaymentModal";
import BarcodeScanner from "@/Components/BarcodeScanner";

import ModifierModal from "../components/ModifierModal";
import VariantModal from "../components/legacy/VariantModal";
import UnitModal from "../components/legacy/UnitModal";
import PaymentModal from "../components/PaymentModal";
import ReceiptModal from "../components/ReceiptModal";
import HistoryPanel from "../components/HistoryPanel";
import CartRow from "../components/CartRow";
import ModeSpecificPanel from "../components/ModeSpecificPanel";
import StockAlertModal from "../components/StockAlertModal";

import Tooltip from "../components/ui/Tooltip";
import TipButton from "../components/ui/TipButton";
import ShiftModal from "../components/modals/ShiftModal";
import CustomerModal from "../components/modals/CustomerModal";
import TransactionInfoModal from "../components/modals/TransactionInfoModal";
import NoteModal from "../components/modals/NoteModal";
import AdjustmentModal from "../components/modals/AdjustmentModal";
import HeldTransactionsModal from "../components/modals/HeldTransactionsModal";

export default function KasirLayout({
    k,
    props,
    mainContent,
    searchBar,
    categoryChips,
    showSearch = true,
}) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showHeldModal, setShowHeldModal] = useState(false);

    const {
        tables = [],
        paymentMethods,
        pgMethods = [],
        storeName,
        receiptFooter,
        activeShift,
    } = props;

    /* ── Shift: tampil sesuai permission user ──────────────────────
     * Sembunyikan seluruh UI shift bila store tidak punya fitur shift
     * ATAU user tidak punya izin shift apa pun. Kasir yang WAJIB shift
     * (punya shift.open, bukan manager/developer) diblok checkout sampai
     * shift dibuka — sesuai middleware EnsureActiveShift di backend.
     */
    const { can, hasShift } = useStoreModules();
    const isDeveloper = usePage().props?.auth?.isDeveloper ?? false;
    const canOpenShift = can("shift.open");
    const canViewShift = can("shift.view");
    const canManageShift = can("shift.manage");
    const showShiftUI =
        hasShift && (canOpenShift || canViewShift || canManageShift);
    const shiftEnforced =
        hasShift && canOpenShift && !canManageShift && !isDeveloper;
    const blockedByShift = shiftEnforced && !activeShift;

    // Keyboard shortcuts: Esc keluar fullscreen, F11 toggle, "/" fokus cari.
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape" && isFullscreen) {
                setIsFullscreen(false);
                e.preventDefault();
            }
            if (e.key === "F11") {
                e.preventDefault();
                setIsFullscreen((p) => !p);
            }
            if (
                e.key === "/" &&
                !isFullscreen &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA"
            ) {
                e.preventDefault();
                k.barcodeRef?.current?.focus();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isFullscreen]);

    /* ── derived ── */
    const showTableSelector =
        (k.isCafe || k.isBooth || k.isHospitality) &&
        k.orderType === k.tableTriggerOrderType &&
        tables.length > 0;
    const tableGate = showTableSelector && !k.selectedTable;
    const selectedCustomerObj = k.customers.find(
        (c) => String(c.id) === String(k.selectedCustomer),
    );
    const isDelivery = k.orderType === "delivery";
    const isTakeaway = k.orderType === "takeaway";
    const isWholesale = k.isRetail && k.orderType === "wholesale";
    const hasDeliveryInfo = !!(
        k.deliveryAddress &&
        (k.deliveryCustomerName || k.selectedCustomer)
    );
    const discountBadge =
        k.discountType === "percent" && Number(k.discountValue) > 0
            ? `${k.discountValue}%`
            : null;
    const taxBadge =
        [
            k.taxName,
            k.taxType === "percent" && Number(k.taxValue) > 0
                ? `${k.taxValue}%`
                : null,
        ]
            .filter(Boolean)
            .join(" ") || null;
    const heldCount = k.heldTransactions?.length ?? 0;
    const noteActive = !!(k.note && k.note.trim());
    const adjustActive = k.discount > 0 || k.tax > 0;

    /* ── header (mode badge + quick actions) ── */
    const headerContent = (
        <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold text-slate-800">Kasir</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    <span>{k.modeConfig.icon}</span>
                    {k.modeConfig.label}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                {heldCount > 0 && (
                    <div className="relative">
                        <Tooltip label="Transaksi Ditahan">
                            <button
                                type="button"
                                onClick={() => setShowHeldModal(true)}
                                aria-label="Transaksi Ditahan"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                            >
                                <Layers size={17} strokeWidth={2} />
                            </button>
                        </Tooltip>
                        <span className="absolute -right-1 -bottom-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-sm">
                            {heldCount}
                        </span>
                    </div>
                )}
                <TipButton
                    label="Riwayat Transaksi"
                    icon={History}
                    variant="subtle"
                    onClick={() => k.setShowHistory(true)}
                />
                <TipButton
                    label={isFullscreen ? "Keluar Fullscreen (Esc)" : "Fullscreen (F11)"}
                    icon={isFullscreen ? Minimize2 : Maximize2}
                    variant="subtle"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                />
            </div>
        </div>
    );

    /* ── shift banner (permission-gated) ── */
    const shiftBanner = (() => {
        if (!showShiftUI) return null;
        if (activeShift) {
            return (
                <div className="flex items-center gap-2.5 border-b border-emerald-100 bg-emerald-50/70 px-4 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                        <CircleCheck size={16} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-[13px] font-semibold text-emerald-800">
                            Shift {activeShift.shift_no} aktif
                        </p>
                        <p className="text-[11px] text-emerald-600">
                            Kas awal {k.fmt(activeShift.opening_cash)}
                        </p>
                    </div>
                    {canViewShift && (
                        <Tooltip label="Detail / Tutup Shift">
                            <Link
                                href={route(
                                    "admin.cashier-shifts.show",
                                    activeShift.id,
                                )}
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                            >
                                Detail
                                <ChevronRight size={13} />
                            </Link>
                        </Tooltip>
                    )}
                </div>
            );
        }
        if (canOpenShift) {
            return (
                <div className="flex items-center gap-2.5 border-b border-amber-100 bg-amber-50/70 px-4 py-2.5">
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500" />
                    <p className="flex-1 text-[13px] font-medium text-amber-800">
                        Belum ada shift aktif
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowShiftModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-amber-600"
                    >
                        <Clock size={13} />
                        Buka Shift
                    </button>
                </div>
            );
        }
        return null;
    })();

    /* ── search bar (default) ── */
    const defaultSearchBar = (
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Search size={18} />
            </div>
            <input
                ref={k.barcodeRef}
                type="text"
                value={k.search}
                onChange={(e) => k.setSearch(e.target.value)}
                placeholder="Cari produk atau ketik barcode... ( / )"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
            <TipButton
                label="Scan Barcode (Kamera)"
                icon={ScanLine}
                variant="solid"
                size="lg"
                onClick={() => k.setShowScanner(true)}
            />
        </div>
    );

    /* ── info strip: customer + table + transaction info ── */
    const infoStrip = (
        <div className="shrink-0 space-y-2 border-b border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-stretch gap-2">
                {/* Table / room selector (fnb & hospitality) */}
                {showTableSelector && (
                    <div className="relative w-[46%] shrink-0">
                        {k.selectedTable ? (
                            <div className="flex h-full items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                                <LayoutGrid
                                    size={15}
                                    className="shrink-0 text-slate-500"
                                />
                                <span className="truncate text-xs font-semibold text-slate-700">
                                    {k.tableLabel}{" "}
                                    {
                                        tables.find(
                                            (t) =>
                                                String(t.id) ===
                                                String(k.selectedTable),
                                        )?.table_number
                                    }
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        k.setSelectedTable("");
                                        k.setTableSearch("");
                                    }}
                                    aria-label="Hapus pilihan meja"
                                    className="ml-auto shrink-0 rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                >
                                    <X size={13} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    ref={k.tableInputRef}
                                    type="text"
                                    placeholder={`Pilih ${k.tableLabel.toLowerCase()}...`}
                                    value={k.tableSearch}
                                    onFocus={(e) => {
                                        const r =
                                            e.target.getBoundingClientRect();
                                        k.setTableDropdownPos({
                                            top: r.bottom + 4,
                                            left: r.left,
                                            width: r.width,
                                        });
                                        k.setShowTableDropdown(true);
                                    }}
                                    onChange={(e) => {
                                        k.setTableSearch(e.target.value);
                                        const r =
                                            e.target.getBoundingClientRect();
                                        k.setTableDropdownPos({
                                            top: r.bottom + 4,
                                            left: r.left,
                                            width: r.width,
                                        });
                                        k.setShowTableDropdown(true);
                                    }}
                                    className={`w-full rounded-xl border py-2 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-slate-200 ${tableGate ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}
                                />
                            </div>
                        )}
                        {k.showTableDropdown &&
                            !k.selectedTable &&
                            ReactDOM.createPortal(
                                <div
                                    ref={k.tableDropdownRef}
                                    className="z-[9999] max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
                                    style={{
                                        position: "fixed",
                                        top: k.tableDropdownPos.top,
                                        left: k.tableDropdownPos.left,
                                        width: k.tableDropdownPos.width,
                                    }}
                                >
                                    {(() => {
                                        const q = k.tableSearch
                                            .toLowerCase()
                                            .trim();
                                        const filtered = tables.filter(
                                            (t) =>
                                                !q ||
                                                String(t.table_number).includes(
                                                    q,
                                                ) ||
                                                String(t.capacity).includes(q),
                                        );
                                        if (filtered.length === 0)
                                            return (
                                                <p className="px-3 py-3 text-center text-xs text-slate-400">
                                                    Tidak ada{" "}
                                                    {k.tableLabel.toLowerCase()}
                                                </p>
                                            );
                                        return filtered.map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    k.setSelectedTable(t.id);
                                                    k.setShowTableDropdown(
                                                        false,
                                                    );
                                                    k.setTableSearch("");
                                                }}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-slate-50"
                                            >
                                                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                                                    {t.table_number}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-slate-700">
                                                        {k.tableLabel}{" "}
                                                        {t.table_number}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        Kapasitas {t.capacity}
                                                    </p>
                                                </div>
                                            </button>
                                        ));
                                    })()}
                                </div>,
                                document.body,
                            )}
                    </div>
                )}

                {/* Customer selector */}
                {selectedCustomerObj ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold uppercase text-white">
                            {selectedCustomerObj.name?.charAt(0) ?? "?"}
                        </span>
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="truncate text-[13px] font-semibold text-slate-800">
                                {selectedCustomerObj.name}
                            </p>
                            {selectedCustomerObj.tier && (
                                <p className="truncate text-[10px] text-slate-400">
                                    {selectedCustomerObj.tier} ·{" "}
                                    {k.fmtShort(selectedCustomerObj.points)} pts
                                </p>
                            )}
                        </div>
                        <TipButton
                            label="Ganti Pelanggan"
                            icon={Pencil}
                            size="sm"
                            onClick={() => setShowCustomerModal(true)}
                        />
                        <TipButton
                            label="Hapus Pelanggan"
                            icon={X}
                            size="sm"
                            variant="danger"
                            onClick={() => {
                                k.setSelectedCustomer("");
                                k.setCustomerSearch("");
                            }}
                        />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowCustomerModal(true)}
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-[13px] font-semibold transition ${isWholesale ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50"}`}
                    >
                        <UserRound size={16} className="shrink-0" />
                        <span className="truncate">
                            Pilih Pelanggan
                            {isWholesale && (
                                <span className="text-rose-500"> *</span>
                            )}
                        </span>
                    </button>
                )}
            </div>

            {/* Transaction-info chip: delivery / pickup */}
            {isDelivery && (
                <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${hasDeliveryInfo ? "border-slate-200 bg-white hover:bg-slate-50" : "border-amber-300 bg-amber-50 hover:bg-amber-100"}`}
                >
                    <Truck
                        size={16}
                        className={`shrink-0 ${hasDeliveryInfo ? "text-slate-500" : "text-amber-600"}`}
                    />
                    <div className="min-w-0 flex-1 leading-tight">
                        {hasDeliveryInfo ? (
                            <>
                                <p className="truncate text-[13px] font-semibold text-slate-800">
                                    {k.deliveryCustomerName ||
                                        selectedCustomerObj?.name}
                                    {k.deliveryPhone
                                        ? ` · ${k.deliveryPhone}`
                                        : ""}
                                </p>
                                <p className="truncate text-[11px] text-slate-400">
                                    {k.deliveryAddress}
                                </p>
                            </>
                        ) : (
                            <span className="text-[13px] font-semibold text-amber-700">
                                Isi Info Pengiriman
                                <span className="text-rose-500"> *</span>
                            </span>
                        )}
                    </div>
                    <Pencil size={14} className="shrink-0 text-slate-400" />
                </button>
            )}
            {isTakeaway && (
                <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
                >
                    <PackageCheck size={16} className="shrink-0 text-slate-500" />
                    <div className="min-w-0 flex-1 leading-tight">
                        {k.takeawayCustomerName ? (
                            <>
                                <p className="truncate text-[13px] font-semibold text-slate-800">
                                    {k.takeawayCustomerName}
                                    {k.takeawayPhone
                                        ? ` · ${k.takeawayPhone}`
                                        : ""}
                                </p>
                                {k.pickupTime && (
                                    <p className="truncate text-[11px] text-slate-400">
                                        Ambil {k.pickupTime}
                                    </p>
                                )}
                            </>
                        ) : (
                            <span className="text-[13px] font-medium text-slate-500">
                                Info Pengambilan{" "}
                                <span className="text-slate-400">(opsional)</span>
                            </span>
                        )}
                    </div>
                    <Pencil size={14} className="shrink-0 text-slate-400" />
                </button>
            )}
        </div>
    );

    const posContent = (topPadding) => (
        <>
            <Head title="Kasir" />
            <style>{`
                @media (min-width: 768px) {
                    .kasir-main-content { margin-right: ${k.sidebarWidth}px !important; }
                }
            `}</style>
            <div
                className={`kasir-main-content flex ${topPadding} transition-all duration-300`}
            >
                {/* LEFT: product panel */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    {shiftBanner}
                    {showSearch && (searchBar || defaultSearchBar)}
                    {categoryChips}
                    {mainContent}
                </div>
            </div>

            {/* RIGHT: cart sidebar — fixed full-height, resizable */}
            <aside
                className="fixed right-0 z-30 flex flex-col border-l border-slate-200 bg-white shadow-xl max-md:hidden"
                style={{
                    top: isFullscreen ? "0" : "65px",
                    height: isFullscreen ? "100vh" : "calc(100vh - 65px)",
                    width: `${k.sidebarWidth}px`,
                }}
            >
                {/* Resize handle — sisi kiri sidebar, dengan grip icon supaya jelas bisa digeser */}
                <div
                    onMouseDown={k.startSidebarResize}
                    className="group absolute inset-y-0 -left-2 z-50 flex w-4 cursor-col-resize items-center justify-center"
                    title="Geser untuk mengubah lebar keranjang"
                >
                    <div className="h-full w-1 bg-transparent transition group-hover:bg-indigo-400/50 group-active:bg-indigo-500/60" />
                    <div className="absolute flex h-14 w-4 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition group-hover:border-indigo-300 group-hover:text-indigo-500 group-hover:shadow-md">
                        <GripVertical size={12} strokeWidth={2.5} />
                    </div>
                </div>

                {/* Fullscreen quick actions */}
                {isFullscreen && (
                    <div className="flex items-stretch gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
                        {heldCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowHeldModal(true)}
                                className="relative flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                <Layers size={16} />
                                <span className="hidden sm:inline">Ditahan</span>
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                                    {heldCount}
                                </span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => k.setShowHistory(true)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <History size={16} />
                            <span className="hidden sm:inline">Riwayat</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(false)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Minimize2 size={16} />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                )}

                {/* Order type tabs */}
                <div className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-white">
                    {k.orderOpts.map((o) => (
                        <button
                            key={o.v}
                            onClick={() => k.handleOrderTypeChange(o.v)}
                            className={`py-2.5 text-[13px] font-semibold transition ${k.orderType === o.v ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                            {o.l}
                        </button>
                    ))}
                </div>

                {/* Info strip */}
                {infoStrip}

                {/* Mode-specific fields (non-retail) */}
                <div className="shrink-0 empty:hidden [&>*]:m-3 [&>*]:mb-0">
                    <ModeSpecificPanel k={k} />
                </div>

                {/* Cart header */}
                <div className="flex shrink-0 items-center justify-between border-b border-t border-slate-100 bg-white px-4 py-2.5">
                    <h3 className="text-sm font-bold text-slate-800">
                        Keranjang{" "}
                        <span className="font-normal text-slate-400">
                            ({k.cart.length})
                        </span>
                    </h3>
                    {k.cart.length > 0 && (
                        <TipButton
                            label="Kosongkan Keranjang"
                            icon={Trash2}
                            size="sm"
                            variant="danger"
                            onClick={k.clearCart}
                        />
                    )}
                </div>

                {/* Cart items — satu-satunya area yang scroll */}
                <div className="flex-1 space-y-1.5 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {k.cart.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                            <div className="mb-3 rounded-2xl bg-slate-100 p-4">
                                <ShoppingCart
                                    size={34}
                                    className="text-slate-300"
                                />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">
                                Keranjang kosong
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                                Pilih produk atau scan barcode
                            </p>
                        </div>
                    ) : (
                        k.cart.map((item) => (
                            <CartRow
                                key={item.cartId}
                                item={item}
                                onQty={k.changeQty}
                                onRemove={k.removeItem}
                                productImage={
                                    props.products.find(
                                        (p) => p.id === item.productId,
                                    )?.image || null
                                }
                            />
                        ))
                    )}
                </div>

                {/* Bottom: aksi cepat + totals + pay (pinned) */}
                <div className="shrink-0 space-y-3 border-t border-slate-200 bg-white px-4 py-3">
                    {/* Aksi cepat: Catatan + Diskon */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setShowNoteModal(true)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-semibold transition ${noteActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                        >
                            <MessageSquare size={15} />
                            Catatan
                            {noteActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAdjustModal(true)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-semibold transition ${adjustActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                        >
                            <Tag size={15} />
                            Diskon
                            {adjustActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            )}
                        </button>
                    </div>

                    {/* Ringkasan total */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[13px] text-slate-500">
                            <span>Subtotal</span>
                            <span className="font-medium tabular-nums text-slate-700">
                                {k.fmt(k.subtotal)}
                            </span>
                        </div>

                        {k.totalPromoDisc > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-emerald-600">
                                <span>Diskon Promo</span>
                                <span className="font-semibold tabular-nums">
                                    −{k.fmt(k.totalPromoDisc)}
                                </span>
                            </div>
                        )}
                        {k.cartPromoDiscount > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-emerald-600">
                                <span>
                                    {k.cartPromoName || "Diskon Keranjang"}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    −{k.fmt(k.cartPromoDiscount)}
                                </span>
                            </div>
                        )}

                        {/* Diskon manual — klik untuk ubah */}
                        {k.discount > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(true)}
                                className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-emerald-600 transition hover:bg-emerald-50"
                            >
                                <span>
                                    Diskon
                                    {discountBadge ? ` (${discountBadge})` : ""}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    −{k.fmt(k.discount)}
                                </span>
                            </button>
                        )}

                        {/* Pajak manual — klik untuk ubah */}
                        {k.tax > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(true)}
                                className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-slate-500 transition hover:bg-slate-50"
                            >
                                <span>{taxBadge || "Pajak"}</span>
                                <span className="font-medium tabular-nums text-slate-700">
                                    {k.fmt(k.tax)}
                                </span>
                            </button>
                        )}

                        {/* Ongkir */}
                        {isDelivery && Number(k.deliveryFee) > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-slate-500">
                                <span>Ongkir</span>
                                <span className="font-medium tabular-nums text-slate-700">
                                    {k.fmt(Number(k.deliveryFee))}
                                </span>
                            </div>
                        )}

                        {/* TOTAL */}
                        <div className="mt-1 flex items-baseline justify-between border-t-2 border-slate-100 pt-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Total
                            </span>
                            <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-slate-900">
                                {k.fmt(k.roundedGrandTotal ?? k.grandTotal)}
                            </span>
                        </div>
                    </div>

                    {/* Aksi bawah: Tahan + Bayar */}
                    {blockedByShift ? (
                        <button
                            type="button"
                            onClick={() => setShowShiftModal(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-amber-600"
                        >
                            <Clock size={18} />
                            Buka Shift Dulu
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={k.cart.length === 0}
                                onClick={() => k.holdTransaction()}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[14px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Tahan transaksi (simpan sementara)"
                            >
                                <Pause size={16} />
                                Tahan
                            </button>
                            <button
                                type="button"
                                disabled={
                                    k.cart.length === 0 ||
                                    k.submitting ||
                                    !!k.missingRequiredField ||
                                    tableGate
                                }
                                onClick={() => k.setShowPayment(true)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-[15px] font-bold tracking-tight text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {k.submitting ? (
                                    "Memproses..."
                                ) : tableGate ? (
                                    `Pilih ${k.tableLabel} dulu`
                                ) : k.missingRequiredField ? (
                                    k.missingRequiredField
                                ) : (
                                    <>
                                        <CreditCard size={18} />
                                        <span>
                                            Bayar
                                            {k.cart.length > 0
                                                ? ` • ${k.fmt(k.roundedGrandTotal ?? k.grandTotal)}`
                                                : ""}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile cart sidebar — overlay */}
            <aside
                className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 md:hidden ${k.cartPanelOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Mobile header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-800">
                        Keranjang
                    </h3>
                    <TipButton
                        label="Tutup Keranjang"
                        icon={X}
                        onClick={() => k.setCartPanelOpen(false)}
                    />
                </div>

                {/* Order type tabs */}
                <div className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-white">
                    {k.orderOpts.map((o) => (
                        <button
                            key={o.v}
                            onClick={() => k.handleOrderTypeChange(o.v)}
                            className={`py-2.5 text-[13px] font-semibold transition ${k.orderType === o.v ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                            {o.l}
                        </button>
                    ))}
                </div>

                {/* Info strip */}
                {infoStrip}

                {/* Mode-specific fields (non-retail) */}
                <div className="shrink-0 empty:hidden [&>*]:m-3 [&>*]:mb-0">
                    <ModeSpecificPanel k={k} />
                </div>

                {/* Cart header */}
                <div className="flex shrink-0 items-center justify-between border-b border-t border-slate-100 bg-white px-4 py-2.5">
                    <h3 className="text-sm font-bold text-slate-800">
                        Keranjang{" "}
                        <span className="font-normal text-slate-400">
                            ({k.cart.length})
                        </span>
                    </h3>
                    {k.cart.length > 0 && (
                        <TipButton
                            label="Kosongkan Keranjang"
                            icon={Trash2}
                            size="sm"
                            variant="danger"
                            onClick={k.clearCart}
                        />
                    )}
                </div>

                {/* Cart items */}
                <div className="flex-1 space-y-1.5 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {k.cart.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                            <div className="mb-3 rounded-2xl bg-slate-100 p-4">
                                <ShoppingCart size={34} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">Keranjang kosong</p>
                            <p className="mt-0.5 text-xs text-slate-400">Pilih produk atau scan barcode</p>
                        </div>
                    ) : (
                        k.cart.map((item) => (
                            <CartRow
                                key={item.cartId}
                                item={item}
                                onQty={k.changeQty}
                                onRemove={k.removeItem}
                                productImage={props.products.find((p) => p.id === item.productId)?.image || null}
                            />
                        ))
                    )}
                </div>

                {/* Bottom: totals + pay */}
                <div className="shrink-0 space-y-3 border-t border-slate-200 bg-white px-4 py-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setShowNoteModal(true)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-semibold transition ${noteActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                        >
                            <MessageSquare size={15} />
                            Catatan
                            {noteActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAdjustModal(true)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-semibold transition ${adjustActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                        >
                            <Tag size={15} />
                            Diskon
                            {adjustActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[13px] text-slate-500">
                            <span>Subtotal</span>
                            <span className="font-medium tabular-nums text-slate-700">{k.fmt(k.subtotal)}</span>
                        </div>
                        {k.totalPromoDisc > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-emerald-600">
                                <span>Diskon Promo</span>
                                <span className="font-semibold tabular-nums">−{k.fmt(k.totalPromoDisc)}</span>
                            </div>
                        )}
                        {k.cartPromoDiscount > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-emerald-600">
                                <span>{k.cartPromoName || "Diskon Keranjang"}</span>
                                <span className="font-semibold tabular-nums">−{k.fmt(k.cartPromoDiscount)}</span>
                            </div>
                        )}
                        {k.discount > 0 && (
                            <button type="button" onClick={() => setShowAdjustModal(true)} className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-emerald-600 transition hover:bg-emerald-50">
                                <span>Diskon{discountBadge ? ` (${discountBadge})` : ""}</span>
                                <span className="font-semibold tabular-nums">−{k.fmt(k.discount)}</span>
                            </button>
                        )}
                        {k.tax > 0 && (
                            <button type="button" onClick={() => setShowAdjustModal(true)} className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-slate-500 transition hover:bg-slate-50">
                                <span>{taxBadge || "Pajak"}</span>
                                <span className="font-medium tabular-nums text-slate-700">{k.fmt(k.tax)}</span>
                            </button>
                        )}
                        {isDelivery && Number(k.deliveryFee) > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-slate-500">
                                <span>Ongkir</span>
                                <span className="font-medium tabular-nums text-slate-700">{k.fmt(Number(k.deliveryFee))}</span>
                            </div>
                        )}
                        <div className="mt-1 flex items-baseline justify-between border-t-2 border-slate-100 pt-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Total</span>
                            <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-slate-900">
                                {k.fmt(k.roundedGrandTotal ?? k.grandTotal)}
                            </span>
                        </div>
                    </div>

                    {blockedByShift ? (
                        <button type="button" onClick={() => setShowShiftModal(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-amber-600">
                            <Clock size={18} />
                            Buka Shift Dulu
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button type="button" disabled={k.cart.length === 0} onClick={() => k.holdTransaction()} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[14px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" title="Tahan transaksi (simpan sementara)">
                                <Pause size={16} />
                                Tahan
                            </button>
                            <button
                                type="button"
                                disabled={k.cart.length === 0 || k.submitting || !!k.missingRequiredField || tableGate}
                                onClick={() => k.setShowPayment(true)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-[15px] font-bold tracking-tight text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {k.submitting ? "Memproses..." : tableGate ? `Pilih ${k.tableLabel} dulu` : k.missingRequiredField ? k.missingRequiredField : (
                                    <>
                                        <CreditCard size={18} />
                                        <span>Bayar{k.cart.length > 0 ? ` • ${k.fmt(k.roundedGrandTotal ?? k.grandTotal)}` : ""}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile cart backdrop */}
            {k.cartPanelOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
                    onClick={() => k.setCartPanelOpen(false)}
                />
            )}

            {/* Mobile floating cart button */}
            <button
                type="button"
                onClick={() => k.setCartPanelOpen(true)}
                className={`fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-xl transition-all hover:scale-105 hover:bg-slate-700 active:scale-95 md:hidden ${k.cartPanelOpen ? "hidden" : ""}`}
            >
                <ShoppingCart size={22} />
                Keranjang
                {k.cart.length > 0 && (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-extrabold text-slate-900 shadow-md">
                        {k.cart.length}
                    </span>
                )}
            </button>

            {/* ── POS modals (baru) ── */}
            {showShiftUI && (
                <ShiftModal
                    show={showShiftModal}
                    onClose={() => setShowShiftModal(false)}
                />
            )}
            <CustomerModal
                show={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                k={k}
            />
            <TransactionInfoModal
                show={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                k={k}
            />
            <NoteModal
                show={showNoteModal}
                onClose={() => setShowNoteModal(false)}
                k={k}
            />
            <AdjustmentModal
                show={showAdjustModal}
                onClose={() => setShowAdjustModal(false)}
                k={k}
            />
            <HeldTransactionsModal
                show={showHeldModal}
                onClose={() => setShowHeldModal(false)}
                k={k}
            />

            {/* ── Existing modals ── */}
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
            {k.variantTarget && (
                <VariantModal
                    product={k.variantTarget}
                    onConfirm={(variant, qty, note) => {
                        k.addToCart(
                            k.variantTarget,
                            variant,
                            [],
                            note,
                            null,
                            qty,
                        );
                        k.setVariantTarget(null);
                    }}
                    onClose={() => k.setVariantTarget(null)}
                />
            )}
            {k.unitTarget && (
                <UnitModal
                    product={k.unitTarget}
                    onConfirm={(unit, qty) => {
                        k.addToCart(k.unitTarget, null, [], "", unit, qty);
                        k.setUnitTarget(null);
                    }}
                    onClose={() => k.setUnitTarget(null)}
                />
            )}
            {k.showPayment && (
                <PaymentModal
                    grandTotal={k.grandTotal}
                    roundedGrandTotal={k.roundedGrandTotal}
                    roundingAdjustment={k.roundingAdjustment}
                    paymentMethods={paymentMethods}
                    pgMethods={pgMethods}
                    onConfirm={k.handleConfirmPayment}
                    onClose={() => k.setShowPayment(false)}
                    submitting={k.submitting}
                    selectedCustomer={k.selectedCustomer}
                    customers={k.customers}
                    onSelectCustomer={k.setSelectedCustomer}
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
            <BarcodeScanner
                isOpen={k.showScanner}
                onClose={() => k.setShowScanner(false)}
                onScan={k.handleBarcodeScan}
            />
            {k.stockAlert && (
                <StockAlertModal
                    productName={k.stockAlert.productName}
                    available={k.stockAlert.available}
                    requested={k.stockAlert.requested}
                    unitLabel={k.stockAlert.unitLabel}
                    onClose={() => k.setStockAlert(null)}
                />
            )}
        </>
    );

    if (isFullscreen) {
        // z-40 (di bawah lapisan modal z-50). Modal baru (Shift/Customer/
        // Diskon/Pajak/Info) memakai headlessui Dialog yang di-portal ke
        // document.body pada z-50 — jadi kalau kontainer fullscreen berada di
        // z-[100], modal tersembunyi di belakangnya. Menurunkan ke z-40 membuat
        // semua modal tampil konsisten seperti mode non-fullscreen. Aman karena
        // AuthenticatedLayout tidak dirender saat fullscreen.
        return (
            <div className="fixed inset-0 z-40 flex flex-col overflow-x-hidden bg-[#f1f3f6] p-3">
                {posContent("h-full")}
            </div>
        );
    }

    return (
        <AuthenticatedLayout header={headerContent}>
            {posContent("h-[calc(100vh-65px)] sm:h-[calc(100vh-73px)]")}
        </AuthenticatedLayout>
    );
}
