import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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
    Pause,
    Layers,
    GripVertical,
    LayoutGrid,
    MessageSquare,
    Tag,
} from "lucide-react";

import { useStoreModules } from "@/Hooks/useStoreModules";
import BarcodeScanner from "@/Components/BarcodeScanner";

import ModifierModal from "../components/ModifierModal";
import VariantModal from "../components/legacy/VariantModal";
import UnitModal from "../components/legacy/UnitModal";
import PaymentView from "../components/PaymentView";
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
                <h2 className="text-lg font-semibold text-foreground">Kasir</h2>

            </div>
            <div className="flex items-center gap-1.5">
                {showShiftUI && activeShift && (
                    <Tooltip label={canViewShift ? "Detail / Tutup Shift" : "Shift Aktif"}>
                        <Link
                            href={
                                canViewShift
                                    ? route("admin.cashier-shifts.show", activeShift.id)
                                    : "#"
                            }
                            className={`
            relative flex items-center justify-center
            h-9 w-9 sm:h-auto sm:w-auto
            sm:gap-2 sm:px-2 sm:py-1
            rounded-lg bg-muted border border-border
            transition
            ${canViewShift
                                    ? " cursor-pointer"
                                    : "cursor-default"
                                }
        `}
                            onClick={canViewShift ? undefined : (e) => e.preventDefault()}
                        >
                            <Clock size={17} className="shrink-0" />

                            {/* Indikator shift aktif — mobile */}
                            <span
                                className="
                sm:hidden
                absolute -top-0.5 -right-0.5
                h-2.5 w-2.5
                rounded-full
                bg-emerald-500
                border-2 border-background
            "
                            />

                            {/* Desktop */}
                            <div className="hidden sm:block leading-tight">
                                <div className="text-[14px] font-semibold text-foreground">
                                    Shift Aktif
                                </div>

                                <div className="text-[10px] text-muted-foreground">
                                    {activeShift.shift_no}
                                </div>
                            </div>
                        </Link>
                    </Tooltip>
                )}
                {heldCount > 0 && (
                    <div className="relative hidden md:block">
                        <Tooltip label="Transaksi Ditahan">
                            <button
                                type="button"
                                onClick={() => setShowHeldModal(true)}
                                aria-label="Transaksi Ditahan"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <Layers size={17} strokeWidth={2} />
                            </button>
                        </Tooltip>
                        <span className="absolute -right-1 -bottom-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-white shadow-sm">
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

    const paymentHeader = (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={async () => {
                    if (k.resumeSaleId && !k.receiptData) {
                        await k.handleCancelPendingSale(k.resumeSaleId);
                    }

                    k.setShowPayment(false);
                }}
                aria-label="Kembali"
                title="Kembali"
                className="
                inline-flex size-9 shrink-0 items-center justify-center
                rounded-lg border border-border
                text-muted-foreground
                transition-colors
                hover:bg-muted hover:text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            "
            >
                <ArrowLeft className="size-4" strokeWidth={2} />
            </button>

            <div className="h-5 w-px bg-border" />

            <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground">
                    Pembayaran
                </h2>

                {k.resumeSaleNo && (
                    <span className="font-mono text-xs text-muted-foreground">
                        {k.resumeSaleNo}
                    </span>
                )}
            </div>
        </div>
    );

    /* ── shift banner (permission-gated) ── */
    const shiftBanner = (() => {
        if (!showShiftUI) return null;
        // Active shift: badge is now in header, no banner needed
        if (activeShift) return null;
        // Not active + can open + NOT blocked: show subtle warning
        if (canOpenShift && !blockedByShift) {
            return (
                <div className="flex items-center gap-2.5 border-b border-warning/10 bg-warning/5 px-4 py-2.5">
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-warning" />
                    <p className="flex-1 text-[13px] font-medium text-warning">
                        Belum ada shift aktif
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowShiftModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-warning/90"
                    >
                        <Clock size={13} />
                        Buka Shift
                    </button>
                </div>
            );
        }
        return null;
    })();

    /* ── order context row: order type + customer/table/delivery ── */
    const orderContextRow = (
        <div className="border-b border-border bg-card px-3.5 py-2.5">
            <div className="flex items-center justify-between lg:justify-end gap-2">
                {/* LEFT group: order type + customer + table + delivery */}
                <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-w-0">
                    {/* Order type toggle */}
                    <div className="inline-flex shrink-0 rounded-xl bg-muted p-0.5">
                        {k.orderOpts.filter((o) => o.v !== "wholesale").map((o) => (
                            <button
                                key={o.v}
                                onClick={() => k.handleOrderTypeChange(o.v)}
                                className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold whitespace-nowrap transition ${k.orderType === o.v
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {o.l}
                            </button>
                        ))}
                    </div>

                    {/* Customer selector */}
                    {selectedCustomerObj ? (
                        <div className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-2.5">
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold uppercase text-primary-foreground">
                                {selectedCustomerObj.name?.charAt(0) ?? "?"}
                            </span>
                            <div className="hidden sm:block min-w-0 leading-tight">
                                <p className="truncate text-[12px] font-semibold text-foreground max-w-[120px]">
                                    {selectedCustomerObj.name}
                                </p>
                            </div>
                            <TipButton label="Ganti Pelanggan" icon={Pencil} size="sm" onClick={() => setShowCustomerModal(true)} />
                            <TipButton label="Hapus Pelanggan" icon={X} size="sm" variant="danger" onClick={() => { k.setSelectedCustomer(""); k.setCustomerSearch(""); }} />
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowCustomerModal(true)}
                            className={`flex h-9 shrink-0 items-center gap-2 rounded-xl border border-dashed px-2.5 text-[12px] font-semibold transition ${isWholesale ? "border-warning bg-warning/5 text-warning hover:bg-warning/10" : "border-border text-muted-foreground hover:border-border hover:bg-muted/50"}`}
                        >
                            <UserRound size={14} className="shrink-0" />
                            <span className="hidden sm:inline whitespace-nowrap">
                                Pelanggan
                                {isWholesale && <span className="text-destructive"> *</span>}
                            </span>
                        </button>
                    )}

                    {/* Table selector (fnb & hospitality) */}
                    {showTableSelector && (
                        <div className="relative shrink-0">
                            {k.selectedTable ? (
                                <div className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-2.5">
                                    <LayoutGrid size={14} className="shrink-0 text-muted-foreground" />
                                    <span className="truncate text-xs font-semibold text-card-foreground">
                                        {k.tableLabel}{" "}
                                        {tables.find((t) => String(t.id) === String(k.selectedTable))?.table_number}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => { k.setSelectedTable(""); k.setTableSearch(""); }}
                                        aria-label="Hapus pilihan meja"
                                        className="ml-auto shrink-0 rounded-full p-0.5 text-muted-foreground/60 transition hover:bg-muted hover:text-card-foreground"
                                    >
                                        <X size={12} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                                    <input
                                        ref={k.tableInputRef}
                                        type="text"
                                        placeholder={`Pilih ${k.tableLabel.toLowerCase()}...`}
                                        value={k.tableSearch}
                                        onFocus={(e) => {
                                            const r = e.target.getBoundingClientRect();
                                            k.setTableDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
                                            k.setShowTableDropdown(true);
                                        }}
                                        onChange={(e) => {
                                            k.setTableSearch(e.target.value);
                                            const r = e.target.getBoundingClientRect();
                                            k.setTableDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
                                            k.setShowTableDropdown(true);
                                        }}
                                        className={`h-9 w-40 rounded-xl border pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-border ${tableGate ? "border-warning bg-warning/5" : "border-border"}`}
                                    />
                                </div>
                            )}
                            {k.showTableDropdown &&
                                !k.selectedTable &&
                                ReactDOM.createPortal(
                                    <div
                                        ref={k.tableDropdownRef}
                                        className="z-[9999] max-h-52 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
                                        style={{
                                            position: "fixed",
                                            top: k.tableDropdownPos.top,
                                            left: k.tableDropdownPos.left,
                                            width: k.tableDropdownPos.width,
                                        }}
                                    >
                                        {(() => {
                                            const q = k.tableSearch.toLowerCase().trim();
                                            const filtered = tables.filter(
                                                (t) => !q || String(t.table_number).includes(q) || String(t.capacity).includes(q),
                                            );
                                            if (filtered.length === 0)
                                                return (
                                                    <p className="px-3 py-3 text-center text-xs text-muted-foreground/60">
                                                        Tidak ada {k.tableLabel.toLowerCase()}
                                                    </p>
                                                );
                                            return filtered.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => {
                                                        k.setSelectedTable(t.id);
                                                        k.setShowTableDropdown(false);
                                                        k.setTableSearch("");
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-muted/50"
                                                >
                                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                                        {t.table_number}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-card-foreground">
                                                            {k.tableLabel} {t.table_number}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground/60">
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

                    {/* Delivery info */}
                    {isDelivery && (
                        <button
                            type="button"
                            onClick={() => setShowInfoModal(true)}
                            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-left transition ${hasDeliveryInfo ? "border-border bg-card hover:bg-muted/50" : "border-warning bg-warning/5 hover:bg-warning/10"}`}
                        >
                            <Truck size={14} className={`shrink-0 ${hasDeliveryInfo ? "text-muted-foreground" : "text-warning"}`} />
                            <span className="hidden sm:inline text-[12px] font-medium whitespace-nowrap">
                                {hasDeliveryInfo
                                    ? (k.deliveryCustomerName || selectedCustomerObj?.name || "Info Kirim")
                                    : "Isi Info Kirim"
                                }
                            </span>
                            {!hasDeliveryInfo && <span className="text-destructive text-[12px]">*</span>}
                        </button>
                    )}
                </div>

                {/* RIGHT group: History + Keluar Fullscreen (fullscreen only) */}
                {isFullscreen && (
                    <div className="flex items-center gap-1.5 shrink-0 md:hidden">
                        <button
                            type="button"
                            onClick={() => k.setShowHistory(true)}
                            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            title="Riwayat Transaksi"
                        >
                            <History size={14} />
                            <span className="hidden sm:inline">Riwayat</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(false)}
                            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            title="Keluar Fullscreen"
                        >
                            <Minimize2 size={14} />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    /* ── search bar (default) ── */
    const defaultSearchBar = (
        <div className="flex items-center gap-2 border rounded-xl  border-border py-1 px-2 ">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Search size={18} />
            </div>
            <input
                ref={k.barcodeRef}
                type="text"
                value={k.search}
                onChange={(e) => k.setSearch(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        k.handleSearchEnter();
                    }
                }}
                placeholder="Cari produk atau ketik barcode... ( / )"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] lg:text-[15px] font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
            />
            <TipButton
                label="Scan Barcode (Kamera)"
                icon={ScanLine}
                variant="solid"
                size="md"
                onClick={() => k.setShowScanner(true)}
            />
        </div>
    );

    /* ── info strip: customer + table + transaction info ── */
    const infoStrip = (
        <div className="shrink-0 space-y-2 border-b border-border bg-card px-3 py-2.5">
            <div className="flex items-stretch gap-2">
                {/* Table / room selector (fnb & hospitality) */}
                {showTableSelector && (
                    <div className="relative w-[46%] shrink-0">
                        {k.selectedTable ? (
                            <div className="flex h-full items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-2.5 py-2">
                                <LayoutGrid
                                    size={15}
                                    className="shrink-0 text-muted-foreground"
                                />
                                <span className="truncate text-xs font-semibold text-card-foreground">
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
                                    className="ml-auto shrink-0 rounded-full p-0.5 text-muted-foreground/60 transition hover:bg-muted hover:text-card-foreground"
                                >
                                    <X size={13} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
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
                                    className={`w-full rounded-xl border py-2 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-border ${tableGate ? "border-warning bg-warning/5" : "border-border"}`}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Customer selector */}
                {selectedCustomerObj ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold uppercase text-primary-foreground">
                            {selectedCustomerObj.name?.charAt(0) ?? "?"}
                        </span>
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="truncate text-[13px] font-semibold text-foreground">
                                {selectedCustomerObj.name}
                            </p>
                            {selectedCustomerObj.tier && (
                                <p className="truncate text-[10px] text-muted-foreground/60">
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
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-[13px] font-semibold transition ${isWholesale ? "border-warning bg-warning/5 text-warning hover:bg-warning/10" : "border-border text-muted-foreground hover:border-border hover:bg-muted/50"}`}
                    >
                        <UserRound size={16} className="shrink-0" />
                        <span className="truncate">
                            Pilih Pelanggan
                            {isWholesale && (
                                <span className="text-destructive"> *</span>
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
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${hasDeliveryInfo ? "border-border bg-card hover:bg-muted/50" : "border-warning bg-warning/5 hover:bg-warning/10"}`}
                >
                    <Truck
                        size={16}
                        className={`shrink-0 ${hasDeliveryInfo ? "text-muted-foreground" : "text-warning"}`}
                    />
                    <div className="min-w-0 flex-1 leading-tight">
                        {hasDeliveryInfo ? (
                            <>
                                <p className="truncate text-[13px] font-semibold text-foreground">
                                    {k.deliveryCustomerName ||
                                        selectedCustomerObj?.name}
                                    {k.deliveryPhone
                                        ? ` · ${k.deliveryPhone}`
                                        : ""}
                                </p>
                                <p className="truncate text-[11px] text-muted-foreground/60">
                                    {k.deliveryAddress}
                                </p>
                            </>
                        ) : (
                            <span className="text-[13px] font-semibold text-warning">
                                Isi Info Pengiriman
                                <span className="text-destructive"> *</span>
                            </span>
                        )}
                    </div>
                    <Pencil size={14} className="shrink-0 text-muted-foreground/60" />
                </button>
            )}
            {isTakeaway && (
                <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left transition hover:bg-muted/50"
                >
                    <PackageCheck size={16} className="shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1 leading-tight">
                        {k.takeawayCustomerName ? (
                            <>
                                <p className="truncate text-[13px] font-semibold text-foreground">
                                    {k.takeawayCustomerName}
                                    {k.takeawayPhone
                                        ? ` · ${k.takeawayPhone}`
                                        : ""}
                                </p>
                                {k.pickupTime && (
                                    <p className="truncate text-[11px] text-muted-foreground/60">
                                        Ambil {k.pickupTime}
                                    </p>
                                )}
                            </>
                        ) : (
                            <span className="text-[13px] font-medium text-muted-foreground">
                                Info Pengambilan{" "}
                                <span className="text-muted-foreground/60">(opsional)</span>
                            </span>
                        )}
                    </div>
                    <Pencil size={14} className="shrink-0 text-muted-foreground/60" />
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
                <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden p-4">
                    {shiftBanner}
                    {showSearch && (searchBar || defaultSearchBar)}
                    {categoryChips}
                    {mainContent}
                    {/* Shift blocking overlay */}
                    {blockedByShift && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
                            <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                                    <Clock size={24} className="text-warning" />
                                </div>
                                <h3 className="text-base font-bold text-foreground">Shift belum aktif</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Buka shift kasir terlebih dahulu untuk mulai bertransaksi.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowShiftModal(true)}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                                >
                                    <Clock size={16} />
                                    Buka Shift Kasir
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: cart sidebar — fixed full-height, resizable */}
            <aside
                className="fixed right-0 z-30 flex flex-col border-l border-border bg-card shadow-xl max-md:hidden"
                style={{
                    top: isFullscreen ? "0" : "56px",
                    height: isFullscreen ? "100vh" : "calc(100vh - 56px)",
                    width: `${k.sidebarWidth}px`,
                }}
            >
                {/* Resize handle — sisi kiri sidebar, dengan grip icon supaya jelas bisa digeser */}
                <div
                    onMouseDown={k.startSidebarResize}
                    className="group absolute inset-y-0 -left-2 z-50 flex w-4 cursor-col-resize items-center justify-center"
                    title="Geser untuk mengubah lebar keranjang"
                >
                    <div className="h-full w-1 bg-transparent transition group-hover:bg-primary/50 group-active:bg-primary/60" />
                    <div className="absolute flex h-14 w-4 items-center justify-center rounded-full border border-border bg-card text-muted-foreground/60 shadow-sm transition group-hover:border-primary/30 group-hover:text-primary group-hover:shadow-md">
                        <GripVertical size={12} strokeWidth={2.5} />
                    </div>
                </div>

                {/* Fullscreen quick actions */}
                {isFullscreen && (
                    <div className="flex items-stretch gap-2 border-b border-border bg-muted/50 px-3 py-2">
                        {heldCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowHeldModal(true)}
                                className="relative flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted/80"
                            >
                                <Layers size={16} />
                                <span className="hidden sm:inline">Ditahan</span>
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-[10px] font-bold text-white">
                                    {heldCount}
                                </span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => k.setShowHistory(true)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted/80"
                        >
                            <History size={16} />
                            <span className="hidden sm:inline">Riwayat</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(false)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                        >
                            <Minimize2 size={16} />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                )}

                {/* Cart header */}
                <div className="flex shrink-0 items-center justify-between border-b border-t border-border bg-card px-4 py-2.5">
                    <h3 className="text-sm font-bold text-foreground">
                        Keranjang{" "}
                        <span className="font-normal text-muted-foreground/60">
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
                            <div className="mb-3 rounded-2xl bg-muted p-4">
                                <ShoppingCart
                                    size={34}
                                    className="text-muted-foreground/40"
                                />
                            </div>
                            <p className="text-sm font-semibold text-muted-foreground">
                                Keranjang kosong
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground/60">
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
                <div className="shrink-0 border-t border-border bg-card px-4 py-2.5 space-y-2.5">

                    {/* ── 1 baris: Pelanggan + Diantar + Info + Meja | Catatan + Diskon ── */}
                    <div className="flex w-full items-center justify-between gap-2">

                        {/* ── KIRI ── */}
                        <div className="flex items-center gap-1.5">

                            {/* Pelanggan */}
                            {selectedCustomerObj ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted/80"
                                >
                                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                                        {selectedCustomerObj.name?.charAt(0) ?? "?"}
                                    </span>

                                    <span className="max-w-[60px] truncate">
                                        {selectedCustomerObj.name}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            k.setSelectedCustomer("");
                                            k.setCustomerSearch("");
                                        }}
                                        className="ml-0.5 text-muted-foreground/50 hover:text-destructive"
                                    >
                                        <X size={10} strokeWidth={2.5} />
                                    </button>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
                                >
                                    <UserRound size={12} />
                                    <span>Tamu</span>
                                </button>
                            )}

                            <span className="h-3.5 w-px bg-border" />

                            {/* Toggle Diantar */}
                            <label className="inline-flex cursor-pointer select-none items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={isDelivery}
                                    onChange={(e) =>
                                        k.handleOrderTypeChange(
                                            e.target.checked ? "delivery" : "takeaway"
                                        )
                                    }
                                    className="h-3 w-3 rounded border-border accent-primary"
                                />
                                <span className="text-[11px] font-medium text-foreground">
                                    Antar
                                </span>
                            </label>

                            {/* Info Kirim */}
                            {isDelivery && (
                                <button
                                    type="button"
                                    onClick={() => setShowInfoModal(true)}
                                    className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-medium transition ${hasDeliveryInfo
                                        ? "bg-muted text-foreground hover:bg-muted/80"
                                        : "border border-dashed border-warning text-warning hover:bg-warning/5"
                                        }`}
                                >
                                    <Truck size={12} />
                                    <span className="max-w-[70px] truncate">
                                        {hasDeliveryInfo
                                            ? k.deliveryCustomerName || "Kirim"
                                            : "Info *"}
                                    </span>
                                </button>
                            )}

                            {/* Meja — FnB */}
                            {showTableSelector && k.selectedTable && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        k.setSelectedTable("");
                                        k.setTableSearch("");
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-muted px-1.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted/80"
                                >
                                    <LayoutGrid size={11} />
                                    <span>
                                        {
                                            tables.find(
                                                (t) =>
                                                    String(t.id) === String(k.selectedTable)
                                            )?.table_number
                                        }
                                    </span>
                                    <X
                                        size={10}
                                        strokeWidth={2.5}
                                        className="text-muted-foreground/50"
                                    />
                                </button>
                            )}

                        </div>

                        {/* ── KANAN ── */}
                        <div className="flex shrink-0 items-center gap-1.5">

                            {/* Catatan */}
                            <button
                                type="button"
                                onClick={() => setShowNoteModal(true)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[11px] font-medium transition ${noteActive
                                    ? "border-success/30 bg-success/10 text-success"
                                    : "border-border bg-muted text-foreground hover:bg-muted/80"
                                    }`}
                            >
                                <MessageSquare size={12} />
                                <span>Catatan</span>

                                {noteActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                )}
                            </button>

                            {/* Diskon */}
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(true)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[11px] font-medium transition ${adjustActive
                                    ? "border-success/30 bg-success/10 text-success"
                                    : "border-border bg-muted text-foreground hover:bg-muted/80"
                                    }`}
                            >
                                <Tag size={12} />
                                <span>Diskon</span>

                                {adjustActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                )}
                            </button>

                        </div>

                    </div>

                    {/* Ringkasan total */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-medium tabular-nums text-card-foreground">
                                {k.fmt(k.subtotal)}
                            </span>
                        </div>

                        {k.totalPromoDisc > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-success">
                                <span>Diskon Promo</span>
                                <span className="font-semibold tabular-nums">
                                    −{k.fmt(k.totalPromoDisc)}
                                </span>
                            </div>
                        )}
                        {k.cartPromoDiscount > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-success">
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
                                className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-success transition hover:bg-success/5"
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
                                className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-muted-foreground transition hover:bg-muted/50"
                            >
                                <span>{taxBadge || "Pajak"}</span>
                                <span className="font-medium tabular-nums text-card-foreground">
                                    {k.fmt(k.tax)}
                                </span>
                            </button>
                        )}

                        {/* Ongkir */}
                        {isDelivery && Number(k.deliveryFee) > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                                <span>Ongkir</span>
                                <span className="font-medium tabular-nums text-card-foreground">
                                    {k.fmt(Number(k.deliveryFee))}
                                </span>
                            </div>
                        )}

                        {/* TOTAL */}
                        <div className="mt-1 flex items-baseline justify-between border-t-2 border-border pt-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                                Total
                            </span>
                            <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-foreground">
                                {k.fmt(k.roundedGrandTotal ?? k.grandTotal)}
                            </span>
                        </div>
                    </div>

                    {/* Aksi bawah: Tahan + Bayar */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={k.cart.length === 0 || blockedByShift}
                            onClick={() => k.holdTransaction()}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted px-4 py-3.5 text-[14px] font-bold text-foreground transition hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40"
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
                                tableGate ||
                                blockedByShift
                            }
                            onClick={() => k.setShowPayment(true)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-[15px] font-bold tracking-tight text-white shadow-sm shadow-success/20 transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
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
                </div>
            </aside>

            {/* Mobile cart — bottom sheet (Gojek style) */}
            <aside
                className={`fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-border bg-card shadow-2xl transition-transform duration-300 md:hidden ${k.cartPanelOpen ? "translate-y-0" : "translate-y-full"}`}
                style={{ maxHeight: "85vh", borderRadius: "24px 24px 0 0" }}
            >
                {/* Drag handle */}
                <div className="flex items-center justify-center pt-2 pb-1">
                    <div className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
                </div>

                {/* Mobile header with held button */}
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                    <h3 className="text-sm font-bold text-foreground">
                        Keranjang{" "}
                        <span className="font-normal text-muted-foreground/60">
                            ({k.cart.length})
                        </span>
                    </h3>
                    <div className="flex items-center gap-1.5">
                        {heldCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowHeldModal(true)}
                                className="relative inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
                            >
                                <Layers size={14} />
                                Ditahan
                                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold text-white">
                                    {heldCount}
                                </span>
                            </button>
                        )}
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
                </div>

                {/* Cart items */}
                <div className="flex-1 space-y-1.5 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {k.cart.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 rounded-2xl bg-muted p-4">
                                <ShoppingCart size={34} className="text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-semibold text-muted-foreground">Keranjang kosong</p>
                            <p className="mt-0.5 text-xs text-muted-foreground/60">Pilih produk atau scan barcode</p>
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
                <div className="shrink-0 border-t border-border bg-card px-4 py-2.5 space-y-2.5">

                    {/* 1 baris: Pelanggan + Diantar + Info + Meja | Catatan + Diskon */}
                    <div className="flex w-full items-center justify-between gap-2">

                        {/* KIRI */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {selectedCustomerObj ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted/80"
                                >
                                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                                        {selectedCustomerObj.name?.charAt(0) ?? "?"}
                                    </span>

                                    <span className="max-w-[60px] truncate">
                                        {selectedCustomerObj.name}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            k.setSelectedCustomer("");
                                            k.setCustomerSearch("");
                                        }}
                                        className="ml-0.5 text-muted-foreground/50 hover:text-destructive"
                                    >
                                        <X size={10} strokeWidth={2.5} />
                                    </button>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
                                >
                                    <UserRound size={12} />
                                    <span>Tamu</span>
                                </button>
                            )}

                            <span className="h-3.5 w-px bg-border" />

                            {/* Antar */}
                            <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isDelivery}
                                    onChange={(e) =>
                                        k.handleOrderTypeChange(
                                            e.target.checked ? "delivery" : "takeaway"
                                        )
                                    }
                                    className="h-3 w-3 rounded border-border accent-primary"
                                />
                                <span className="text-[11px] font-medium text-foreground">
                                    Antar
                                </span>
                            </label>

                            {/* Info Kirim */}
                            {isDelivery && (
                                <button
                                    type="button"
                                    onClick={() => setShowInfoModal(true)}
                                    className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-medium transition ${hasDeliveryInfo
                                        ? "bg-muted text-foreground hover:bg-muted/80"
                                        : "border border-dashed border-warning text-warning hover:bg-warning/5"
                                        }`}
                                >
                                    <Truck size={12} />

                                    <span className="max-w-[70px] truncate">
                                        {hasDeliveryInfo
                                            ? k.deliveryCustomerName || "Kirim"
                                            : "Info *"}
                                    </span>
                                </button>
                            )}

                            {/* Meja */}
                            {showTableSelector && k.selectedTable && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        k.setSelectedTable("");
                                        k.setTableSearch("");
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-muted px-1.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted/80"
                                >
                                    <LayoutGrid size={11} />

                                    <span>
                                        {
                                            tables.find(
                                                (t) =>
                                                    String(t.id) === String(k.selectedTable)
                                            )?.table_number
                                        }
                                    </span>

                                    <X
                                        size={10}
                                        strokeWidth={2.5}
                                        className="text-muted-foreground/50"
                                    />
                                </button>
                            )}
                        </div>


                        {/* KANAN */}
                        <div className="flex shrink-0 items-center gap-1.5">

                            {/* Catatan */}
                            <button
                                type="button"
                                onClick={() => setShowNoteModal(true)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[11px] font-medium transition ${noteActive
                                    ? "border-success/30 bg-success/10 text-success"
                                    : "border-border bg-muted text-foreground hover:bg-muted/80"
                                    }`}
                            >
                                <MessageSquare size={12} />
                                <span>Catatan</span>

                                {noteActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                )}
                            </button>

                            {/* Diskon */}
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(true)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[11px] font-medium transition ${adjustActive
                                    ? "border-success/30 bg-success/10 text-success"
                                    : "border-border bg-muted text-foreground hover:bg-muted/80"
                                    }`}
                            >
                                <Tag size={12} />
                                <span>Diskon</span>

                                {adjustActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                )}
                            </button>

                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-medium tabular-nums text-card-foreground">{k.fmt(k.subtotal)}</span>
                        </div>
                        {k.totalPromoDisc > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-success">
                                <span>Diskon Promo</span>
                                <span className="font-semibold tabular-nums">−{k.fmt(k.totalPromoDisc)}</span>
                            </div>
                        )}
                        {k.cartPromoDiscount > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-success">
                                <span>{k.cartPromoName || "Diskon Keranjang"}</span>
                                <span className="font-semibold tabular-nums">−{k.fmt(k.cartPromoDiscount)}</span>
                            </div>
                        )}
                        {k.discount > 0 && (
                            <button type="button" onClick={() => setShowAdjustModal(true)} className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-success transition hover:bg-success/5">
                                <span>Diskon{discountBadge ? ` (${discountBadge})` : ""}</span>
                                <span className="font-semibold tabular-nums">−{k.fmt(k.discount)}</span>
                            </button>
                        )}
                        {k.tax > 0 && (
                            <button type="button" onClick={() => setShowAdjustModal(true)} className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-muted-foreground transition hover:bg-muted/50">
                                <span>{taxBadge || "Pajak"}</span>
                                <span className="font-medium tabular-nums text-card-foreground">{k.fmt(k.tax)}</span>
                            </button>
                        )}
                        {isDelivery && Number(k.deliveryFee) > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                                <span>Ongkir</span>
                                <span className="font-medium tabular-nums text-card-foreground">{k.fmt(Number(k.deliveryFee))}</span>
                            </div>
                        )}
                        <div className="mt-1 flex items-baseline justify-between border-t-2 border-border pt-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">Total</span>
                            <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-foreground">
                                {k.fmt(k.roundedGrandTotal ?? k.grandTotal)}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button type="button" disabled={k.cart.length === 0 || blockedByShift} onClick={() => k.holdTransaction()} className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted px-4 py-3.5 text-[14px] font-bold text-foreground transition hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40" title="Tahan transaksi (simpan sementara)">
                            <Pause size={16} />
                            Tahan
                        </button>
                        <button
                            type="button"
                            disabled={k.cart.length === 0 || k.submitting || !!k.missingRequiredField || tableGate || blockedByShift}
                            onClick={() => k.setShowPayment(true)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-[15px] font-bold tracking-tight text-white shadow-sm shadow-success/20 transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {k.submitting ? "Memproses..." : tableGate ? `Pilih ${k.tableLabel} dulu` : k.missingRequiredField ? k.missingRequiredField : (
                                <>
                                    <CreditCard size={18} />
                                    <span>Bayar{k.cart.length > 0 ? ` • ${k.fmt(k.roundedGrandTotal ?? k.grandTotal)}` : ""}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile cart backdrop */}
            {k.cartPanelOpen && (
                <div
                    className="fixed inset-0 z-40 bg-primary/60 backdrop-blur-sm md:hidden"
                    onClick={() => k.setCartPanelOpen(false)}
                />
            )}

            {/* Mobile floating cart button */}
            <button
                type="button"
                onClick={() => k.setCartPanelOpen(true)}
                className={`fixed bottom-8 right-4 z-30 flex items-center gap-1.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-white shadow-xl transition-all hover:scale-105 hover:bg-primary/80 active:scale-95 md:hidden ${k.cartPanelOpen ? "hidden" : ""}`}
            >
                <ShoppingCart size={16} />
                Keranjang
                {k.cart.length > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card text-[11px] font-extrabold text-foreground shadow-md">
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
                    onResumeSplit={k.handleResumeSplit}
                    onCancelSplit={k.handleCancelSplit}
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

    const renderPaymentView = () => (
        <PaymentView
            k={k}
            paymentMethods={paymentMethods}
            pgMethods={pgMethods}
            storeName={storeName}
            receiptFooter={receiptFooter}
            initialSaleId={k.resumeSaleId}
            initialSaleNo={k.resumeSaleNo}
            initialPgTransaction={k.initialPgTransaction}
        />
    );

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-40 flex flex-col overflow-x-hidden bg-background p-3">
                {k.showPayment ? renderPaymentView() : posContent("h-full")}
            </div>
        );
    }

    return (
        <AuthenticatedLayout header={k.showPayment ? paymentHeader : headerContent} noPadding>
            {k.showPayment ? renderPaymentView() : posContent("h-[calc(100vh-56px)]")}
        </AuthenticatedLayout>
    );
}
