import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect, useMemo } from "react";
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
    BadgeCheck,
    AlertTriangle,
} from "lucide-react";

import { useStoreModules } from "@/Hooks/useStoreModules";
import BarcodeScanner from "@/Components/BarcodeScanner";
import { buildTaxLabel, configureCurrency } from "../components/helpers";

import ModifierModal from "../components/ModifierModal";
import VariantModal from "../components/legacy/VariantModal";
import UnitModal from "../components/legacy/UnitModal";
import PaymentView from "../components/PaymentView";
import SuccessScreen from "../components/payment/SuccessScreen";
import ReceiptModal from "../components/ReceiptModal";
import HistoryPanel from "../components/HistoryPanel";
import CartRow from "../components/CartRow";
import ModeSpecificPanel from "../components/ModeSpecificPanel";
import StockAlertModal from "../components/StockAlertModal";
import ScanNotFoundModal from "../components/ScanNotFoundModal";
import { toast } from "sonner";

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
    const [showMembershipOffer, setShowMembershipOffer] = useState(false);

    const {
        tables = [],
        paymentMethods,
        pgMethods = [],
        storeName,
        receiptFooter,
        receiptHeader,
        storeAddress,
        storePhone,
        storeLogo,
        defaultTaxRate = 0,
        taxInclusive = false,
        currency = "IDR",
        decimalPlaces = 0,
        paymentEditLimitMinutes = null,
        paymentEditLimitLabel = null,
        activeShift,
        customerTiers = [],
    } = props;

    // Format mata uang di seluruh komponen kasir mengikuti pengaturan toko.
    // Dijalankan saat render (bukan di useEffect) supaya angka pada render
    // pertama sudah memakai konfigurasi yang benar.
    configureCurrency({ currency, decimalPlaces });

    const tierRankMap = useMemo(
        () => buildTierRankMap(customerTiers),
        [customerTiers],
    );

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

    // Auto-show membership offer panel saat pelanggan dipilih & ada upgrade
    // API error → toast notification (replaces ApiErrorToast component)
    useEffect(() => {
        if (k.apiError) {
            toast.error(k.apiError);
            k.setApiError(null);
        }
    }, [k.apiError]);

    useEffect(() => {
        if (!selectedCustomerObj || !k.sellableMemberships?.length) {
            setShowMembershipOffer(false);
            return;
        }
        const custRank = customerRank(selectedCustomerObj, tierRankMap);
        const hasUpgrade = k.sellableMemberships.some(
            (m) => m.product && membershipTierRank(m, tierRankMap) > custRank
                && !k.cart.some((c) => c.productId === m.product.id),
        );
        if (hasUpgrade) {
            setShowMembershipOffer(true);
        }
    }, [k.selectedCustomer]);

    // Enter → buka payment view, kalau cart tidak kosong & tidak ada blocker.
    // Tidak aktif saat sedang mengetik di input/textarea (biar tidak
    // mengganggu form lain), dan tidak aktif saat payment view sudah terbuka
    // (di situ Enter dipakai untuk hal lain, mis. submit angka bayar).
    useEffect(() => {
        const handler = (e) => {
            if (e.key !== "Enter") return;
            if (k.showPayment) return;
            if (
                document.activeElement?.tagName === "TEXTAREA" ||
                document.activeElement?.tagName === "INPUT"
            ) {
                return;
            }
            if (
                k.cart.length === 0 ||
                k.submitting ||
                !!k.missingRequiredField ||
                tableGate ||
                blockedByShift
            ) {
                return;
            }
            e.preventDefault();
            k.handleStartAndNavigateToPayment();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [
        k.showPayment,
        k.cart.length,
        k.submitting,
        k.missingRequiredField,
        tableGate,
        blockedByShift,
    ]);
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
    const taxBadge = buildTaxLabel({
        taxName: k.taxName,
        taxRate: k.taxType === "percent" ? k.taxValue : null,
    });
    const heldCount = k.heldTransactions?.length ?? 0;
    const noteActive = !!(k.note && k.note.trim());
    const adjustActive = k.discount > 0 || k.tax > 0;

    /* ── header (mode badge + quick actions) ── */
    const headerContent = (
        <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold text-foreground">Kasir</h2>
            </div>
        </div>
    );

    const headerRightContent = (
        <div className="flex items-center gap-1.5">
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
    );

    const paymentHeader = (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => k.requestPaymentBack()}
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

    /* ── sandbox banner ── */
    const { isSandbox } = usePage().props;
    const sandboxBanner = isSandbox ? (
        <div className="flex items-center gap-2.5 border-b border-warning/20 bg-warning/10 px-4 py-2">
            <AlertTriangle size={14} className="shrink-0 text-warning" strokeWidth={2.5} />
            <p className="text-[12px] font-semibold text-warning">
                Mode Sandbox — Pembayaran menggunakan uang test
            </p>
        </div>
    ) : null;

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
                            className={`flex h-9 shrink-0 items-center gap-2 rounded-xl border border-dashed px-2.5 text-[12px] font-semibold transition ${isWholesale ? "border-warning bg-warning/5 text-warning hover:bg-warning/10" : "border-border text-muted-foreground hover:border-border hover:bg-muted"}`}
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
                                <div className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-muted px-2.5">
                                    <LayoutGrid size={14} className="shrink-0 text-muted-foreground" />
                                    <span className="truncate text-xs font-semibold text-foreground">
                                        {k.tableLabel}{" "}
                                        {tables.find((t) => String(t.id) === String(k.selectedTable))?.table_number}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => { k.setSelectedTable(""); k.setTableSearch(""); }}
                                        aria-label="Hapus pilihan meja"
                                        className="ml-auto shrink-0 rounded-full p-0.5 text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
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
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-muted"
                                                >
                                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                                        {t.table_number}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-foreground">
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
                            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-left transition ${hasDeliveryInfo ? "border-border bg-card hover:bg-muted" : "border-warning bg-warning/5 hover:bg-warning/10"}`}
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
                variant="primary"
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
                                <div className="flex h-full items-center gap-1.5 rounded-xl border border-border bg-muted px-2.5 py-2">
                                <LayoutGrid
                                    size={15}
                                    className="shrink-0 text-muted-foreground"
                                />
                                <span className="truncate text-xs font-semibold text-foreground">
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
                                    className="ml-auto shrink-0 rounded-full p-0.5 text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
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
                            className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-[13px] font-semibold transition ${isWholesale ? "border-warning bg-warning/5 text-warning hover:bg-warning/10" : "border-border text-muted-foreground hover:border-border hover:bg-muted"}`}
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
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${hasDeliveryInfo ? "border-border bg-card hover:bg-muted" : "border-warning bg-warning/5 hover:bg-warning/10"}`}
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
                    className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left transition hover:bg-muted"
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
                    {sandboxBanner}
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
                className="fixed right-0 z-30 flex flex-col border-l border-border bg-background shadow-xl max-md:hidden"
                style={{
                    top: isFullscreen ? "0" : "56px",
                    height: isFullscreen ? "100vh" : "calc(100vh - 56px)",
                    width: `${k.sidebarWidth}px`,
                }}
            >
                {/* Resize handle — sisi kiri sidebar, dengan grip icon supaya jelas bisa digeser */}
                <div
                    onMouseDown={k.startSidebarResize}
                    onTouchStart={k.startSidebarResize}
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
                    <div className="flex items-stretch gap-2 border-b border-border bg-muted px-3 py-2">
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
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={18} className="text-primary" />
                        <h3 className="text-[15px] font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
                            Keranjang
                            <span className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-[11px] font-bold text-primary">
                                {k.cart.length}
                            </span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {heldCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowHeldModal(true)}
                                className="relative flex items-center justify-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-2 py-1 text-xs font-semibold text-warning transition-colors hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
                                title="Transaksi Ditahan"
                            >
                                <Layers size={14} />
                                <span className="hidden sm:inline">Ditahan</span>
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-white shadow-sm">
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

                {/* Cart items — satu-satunya area yang scroll */}
                <div className="flex-1 space-y-1.5 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                    {/* Tombol kecil buka panel membership — hanya muncul saat ada upgrade tersedia */}
                    {selectedCustomerObj && k.sellableMemberships?.length > 0 && !showMembershipOffer && (() => {
                        const r = customerRank(selectedCustomerObj, tierRankMap);
                        const hasUpgrade = k.sellableMemberships.some(
                            (m) => m.product && membershipTierRank(m, tierRankMap) > r
                                && !k.cart.some((c) => c.productId === m.product.id),
                        );
                        if (!hasUpgrade) return null;
                        return (
                            <button
                                type="button"
                                onClick={() => setShowMembershipOffer(true)}
                                className="flex w-full items-center gap-2 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2 text-left transition hover:bg-primary/15"
                            >
                                <BadgeCheck size={14} className="shrink-0 text-primary" strokeWidth={2} />
                                <span className="flex-1 truncate text-[12px] font-semibold text-primary">
                                    Ada penawaran upgrade membership
                                </span>
                                <span className="shrink-0 text-[10px] font-bold text-primary opacity-60">Lihat →</span>
                            </button>
                        );
                    })()}

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
                                onNoteChange={k.updateItemNote}
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

                    {/* ── 2 baris: Pelanggan + Diantar + Info + Meja | Catatan + Diskon ── */}
                    <div className="flex flex-col w-full gap-2">

                        {/* ── ATAS KIRI ── */}
                        <div className="flex flex-wrap items-center justify-start gap-1.5 w-full">



                            {/* Toggle Diantar */}
                            <label className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${isDelivery ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-muted-foreground"}`}>
                                <input
                                    type="checkbox"
                                    checked={isDelivery}
                                    onChange={(e) =>
                                        k.handleOrderTypeChange(
                                            e.target.checked ? "delivery" : "takeaway"
                                        )
                                    }
                                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                                />
                                <span>Antar</span>
                            </label>

                            {/* Info Kirim */}
                            {isDelivery && (
                                <button
                                    type="button"
                                    onClick={() => setShowInfoModal(true)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${hasDeliveryInfo
                                        ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                                        : "border-warning border-dashed bg-warning/5 text-warning hover:bg-warning/10"
                                        }`}
                                >
                                    <Truck size={13} />
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
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
                                >
                                    <LayoutGrid size={13} />
                                    <span>
                                        {
                                            tables.find(
                                                (t) =>
                                                    String(t.id) === String(k.selectedTable)
                                            )?.table_number
                                        }
                                    </span>
                                    <X
                                        size={11}
                                        strokeWidth={2.5}
                                        className="text-muted-foreground/50 hover:text-destructive"
                                    />
                                </button>
                            )}

                        </div>

                        {/* ── BAWAH FULL LEBAR── */}
                        <div className="flex items-center gap-1.5 w-full">
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
                                    <span>Pelanggan</span>
                                </button>
                            )}

                            <span className="h-3.5 w-px bg-border" />
                            {/* Catatan */}
                            <button
                                type="button"
                                onClick={() => setShowNoteModal(true)}
                                className={`flex-1 flex justify-center items-center gap-1 rounded-lg border px-1.5 py-1.5 text-[11px] font-medium transition ${noteActive
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
                                className={`flex-1 flex justify-center items-center gap-1 rounded-lg border px-1.5 py-1.5 text-[11px] font-medium transition ${adjustActive
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

                            {/* Membership upgrade — hanya muncul saat pelanggan dipilih & ada paket lebih tinggi */}
                            {selectedCustomerObj && k.sellableMemberships?.length > 0 && (() => {
                                const customerTierRank = customerRank(selectedCustomerObj, tierRankMap);
                                const nextUpgrade = [...k.sellableMemberships]
                                    .sort((a, b) => membershipTierRank(a, tierRankMap) - membershipTierRank(b, tierRankMap))
                                    .find((m) => {
                                        if (!m.product) return false;
                                        if (k.cart.some((c) => c.productId === m.product.id)) return false;
                                        return membershipTierRank(m, tierRankMap) > customerTierRank;
                                    });
                                if (!nextUpgrade) return null;
                                return (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            k.addToCart({
                                                id: nextUpgrade.product.id,
                                                name: nextUpgrade.name,
                                                sell_price: nextUpgrade.price,
                                                type: "membership",
                                                track_stock: false,
                                                unit: "pcs",
                                                is_sellable: false,
                                                stock: 999,
                                            });
                                        }}
                                        className="flex-1 flex justify-center items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-1.5 py-1.5 text-[11px] font-medium text-primary transition hover:bg-primary/20"
                                    >
                                        <BadgeCheck size={12} />
                                        <span className="truncate">Member</span>
                                    </button>
                                );
                            })()}

                        </div>

                    </div>

                    {/* Ringkasan total */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                            <span>Subtotal</span>
                                    <span className="font-medium tabular-nums text-foreground">
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
                                className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-muted-foreground transition hover:bg-muted"
                            >
                                <span>{taxBadge}</span>
                                        <span className="font-medium tabular-nums text-foreground">
                                    {k.fmt(k.tax)}
                                </span>
                            </button>
                        )}

                        {/* Ongkir */}
                        {isDelivery && Number(k.deliveryFee) > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                                <span>Ongkir</span>
                                        <span className="font-medium tabular-nums text-foreground">
                                    {k.fmt(Number(k.deliveryFee))}
                                </span>
                            </div>
                        )}

                        {/* Subsidi ongkir dari benefit membership */}
                        {isDelivery && k.shippingWaiver > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-success">
                                <span>
                                    Gratis ongkir
                                    {k.memberBenefit?.membership_name
                                        ? ` (${k.memberBenefit.membership_name})`
                                        : ""}
                                </span>
                                <span className="font-medium tabular-nums">
                                    −{k.fmt(k.shippingWaiver)}
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
                                 k.submitting ||
                                 k.cart.length === 0 ||
                                 k.missingRequiredField ||
                                 tableGate ||
                                 blockedByShift ||
                                 (!activeShift && canOpenShift)
                             }
                             onClick={() => k.handleStartAndNavigateToPayment()}
                             className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-[15px] font-bold tracking-tight text-white shadow-sm shadow-success/20 transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
                         >
                             {k.submitting ? (
                                 "Memproses..."
                             ) : tableGate ? (
                                 `Pilih ${k.tableLabel} dulu`
                             ) : k.missingRequiredField ? (
                                 k.missingRequiredField
                             ) : (!activeShift && canOpenShift) ? (
                                 "Buka Shift Dulu"
                             ) : (
                                 <>
                                     <CreditCard size={18} />
                                     <span>
                                         Bayar
                                            
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

                    {/* Tombol buka panel membership — mobile */}
                    {selectedCustomerObj && k.sellableMemberships?.length > 0 && !showMembershipOffer && (() => {
                        const r = customerRank(selectedCustomerObj, tierRankMap);
                        const hasUpgrade = k.sellableMemberships.some(
                            (m) => m.product && membershipTierRank(m, tierRankMap) > r
                                && !k.cart.some((c) => c.productId === m.product.id),
                        );
                        if (!hasUpgrade) return null;
                        return (
                            <button
                                type="button"
                                onClick={() => setShowMembershipOffer(true)}
                                className="flex w-full items-center gap-2 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2 text-left transition hover:bg-primary/15"
                            >
                                <BadgeCheck size={14} className="shrink-0 text-primary" strokeWidth={2} />
                                <span className="flex-1 truncate text-[12px] font-semibold text-primary">
                                    Ada penawaran upgrade membership
                                </span>
                                <span className="shrink-0 text-[10px] font-bold text-primary opacity-60">Lihat →</span>
                            </button>
                        );
                    })()}

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
                                onNoteChange={k.updateItemNote}
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
                                    <span>Pelanggan</span>
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

                            {/* Membership upgrade — sejajar Catatan & Diskon */}
                            {selectedCustomerObj && k.sellableMemberships?.length > 0 && (() => {
                                const customerTierRank = customerRank(selectedCustomerObj, tierRankMap);
                                const nextUpgrade = [...k.sellableMemberships]
                                    .sort((a, b) => membershipTierRank(a, tierRankMap) - membershipTierRank(b, tierRankMap))
                                    .find((m) => {
                                        if (!m.product) return false;
                                        if (k.cart.some((c) => c.productId === m.product.id)) return false;
                                        return membershipTierRank(m, tierRankMap) > customerTierRank;
                                    });
                                if (!nextUpgrade) return null;
                                return (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            k.addToCart({
                                                id: nextUpgrade.product.id,
                                                name: nextUpgrade.name,
                                                sell_price: nextUpgrade.price,
                                                type: "membership",
                                                track_stock: false,
                                                unit: "pcs",
                                                is_sellable: false,
                                                stock: 999,
                                            });
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-1.5 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/20"
                                    >
                                        <BadgeCheck size={12} />
                                        <span className="truncate">Member</span>
                                    </button>
                                );
                            })()}

                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-medium tabular-nums text-foreground">{k.fmt(k.subtotal)}</span>
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
                            <button type="button" onClick={() => setShowAdjustModal(true)} className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-1 py-0.5 text-[13px] text-muted-foreground transition hover:bg-muted">
                                <span>{taxBadge}</span>
                                <span className="font-medium tabular-nums text-foreground">{k.fmt(k.tax)}</span>
                            </button>
                        )}
                        {isDelivery && Number(k.deliveryFee) > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                                <span>Ongkir</span>
                                <span className="font-medium tabular-nums text-foreground">{k.fmt(Number(k.deliveryFee))}</span>
                            </div>
                        )}
                        {isDelivery && k.shippingWaiver > 0 && (
                            <div className="flex items-center justify-between text-[13px] text-success">
                                <span>Gratis ongkir{k.memberBenefit?.membership_name ? ` (${k.memberBenefit.membership_name})` : ""}</span>
                                <span className="font-medium tabular-nums">−{k.fmt(k.shippingWaiver)}</span>
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
                            onClick={() => k.handleStartAndNavigateToPayment()}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-[15px] font-bold tracking-tight text-white shadow-sm shadow-success/20 transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {k.submitting ? "Memproses..." : tableGate ? `Pilih ${k.tableLabel} dulu` : k.missingRequiredField ? k.missingRequiredField : (
                                <>
                                    <CreditCard size={18} />
                                    <span>Bayawdwaar</span>
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
                    header={receiptHeader}
                    storeAddress={storeAddress}
                    storePhone={storePhone}
                    storeLogo={storeLogo}
                    onClose={() => k.setShowReceipt(false)}
                    onNewTransaction={() => k.setShowReceipt(false)}
                />
            )}
            {k.showHistory && (
                <HistoryPanel
                    sales={k.historyList}
                    paymentMethods={paymentMethods}
                    onClose={() => k.setShowHistory(false)}
                    onPrint={k.handlePrintHistory}
                    onResumeSplit={k.handleResumeSplit}
                    onCancelSplit={k.handleCancelSplit}
                    onVoid={k.handleVoidSale}
                    onUpdatePayment={k.handleUpdatePayment}
                    paymentEditLimitMinutes={paymentEditLimitMinutes}
                    paymentEditLimitLabel={paymentEditLimitLabel}
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
            {k.scanNotFound && (
                <ScanNotFoundModal
                    barcode={k.scanNotFound}
                    onClose={() => k.setScanNotFound(null)}
                />
            )}
            {/* ApiErrorToast replaced with Sonner toast — see useEffect above */}
        </>
    );

    const renderPaymentView = () => (
        <PaymentView
            k={k}
            paymentMethods={paymentMethods}
            pgMethods={pgMethods}
            storeName={storeName}
            receiptFooter={receiptFooter}
            receiptHeader={receiptHeader}
            storeAddress={storeAddress}
            storePhone={storePhone}
            storeLogo={storeLogo}
            taxInclusive={taxInclusive}
            initialSaleId={k.resumeSaleId}
            initialSaleNo={k.resumeSaleNo}
            initialPgTransaction={k.initialPgTransaction}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
        />
    );

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-40 flex flex-col overflow-x-hidden bg-background p-3">
                {k.showPayment ? renderPaymentView() : posContent("h-full")}
                {k.successData && (
                    <SuccessScreen
                        data={k.successData}
                        storeName={storeName || 'Toko'}
                        receiptFooter={receiptFooter}
                        receiptHeader={receiptHeader}
                        storeAddress={storeAddress}
                        storePhone={storePhone}
                        storeLogo={storeLogo}
                        taxInclusive={taxInclusive}
                        onNewTransaction={() => {
                            k.clearCart();
                            k.setSuccessData(null);
                            router.visit(route('admin.kasir.index'));
                        }}
                        onSendWa={(receipt) => {
                            if (k.sendWhatsApp) k.sendWhatsApp(receipt, storeName || 'Toko');
                        }}
                        onClose={() => {
                            k.setSuccessData(null);
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <AuthenticatedLayout
            header={k.showPayment ? paymentHeader : headerContent}
            headerRight={headerRightContent}
            noPadding
        >
            {k.showPayment ? renderPaymentView() : posContent("h-[calc(100vh-56px)]")}
            {k.successData && (
                <SuccessScreen
                    data={k.successData}
                    storeName={storeName || 'Toko'}
                    receiptFooter={receiptFooter}
                    receiptHeader={receiptHeader}
                    storeAddress={storeAddress}
                    storePhone={storePhone}
                    storeLogo={storeLogo}
                    taxInclusive={taxInclusive}
                    onNewTransaction={() => {
                        k.clearCart();
                        k.setSuccessData(null);
                        router.visit(route('admin.kasir.index'));
                    }}
                    onSendWa={(receipt) => {
                        if (k.sendWhatsApp) k.sendWhatsApp(receipt, storeName || 'Toko');
                    }}
                    onClose={() => {
                        k.setSuccessData(null);
                    }}
                />
            )}

            {/* Membership Offer Slide-in Panel */}
            {showMembershipOffer && selectedCustomerObj && k.sellableMemberships?.length > 0 && (
                <MembershipOfferSlide
                    customer={selectedCustomerObj}
                    memberships={k.sellableMemberships}
                    cart={k.cart}
                    sidebarWidth={k.sidebarWidth}
                    tierRankMap={tierRankMap}
                    onAdd={(membership) => {
                        k.addToCart({
                            id: membership.product.id,
                            name: membership.name,
                            sell_price: membership.price,
                            type: "membership",
                            track_stock: false,
                            unit: "pcs",
                            is_sellable: false,
                            stock: 999,
                        });
                        setShowMembershipOffer(false);
                    }}
                    onClose={() => setShowMembershipOffer(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  MembershipOfferBar — ditampilkan di bawah panel pelanggan          */
/* ------------------------------------------------------------------ */
const TIER_RANK = { bronze: 1, silver: 2, gold: 3, platinum: 4 };

/**
 * Buat peta rank dari daftar tier dinamis.
 *
 * Dipakai di tempat yang sebelumnya memakai `TIER_RANK` hardcoded.
 * Fallback ke kamus tetap supaya mode kasir tetap jalan meski toko
 * belum punya data tier (mis. refresh cepat sebelum data terisi).
 */
function buildTierRankMap(customerTiers) {
    if (!customerTiers?.length) return TIER_RANK;
    const map = {};
    for (const tier of customerTiers) {
        map[String(tier.id)] = tier.rank;
        // Juga mapping nama lowercase supaya data lama yang masih pakai string tetap terbaca.
        map[tier.name.toLowerCase()] = tier.rank;
    }
    return map;
}

/** Ambil rank tier dari objek customer lewat tier_id (prioritas) atau nama tier lama. */
function customerRank(customer, tierRankMap) {
    if (!customer) return 0;
    if (customer.customer_tier_id) {
        return tierRankMap[String(customer.customer_tier_id)] ?? 0;
    }
    return tierRankMap[(customer.tier ?? "").toLowerCase()] ?? 0;
}

/** Ambil rank tier dari objek membership lewat maps_to_tier_id atau nama maps_to_tier lama. */
function membershipTierRank(membership, tierRankMap) {
    if (membership?.maps_to_tier_id) {
        return tierRankMap[String(membership.maps_to_tier_id)] ?? 0;
    }
    return tierRankMap[(membership?.maps_to_tier ?? "").toLowerCase()] ?? 0;
}

function MembershipOfferBar({ customer, memberships, cart, tierRankMap = {}, onAdd }) {
    const custRank = customerRank(customer, tierRankMap);

    const sorted = [...memberships].sort(
        (a, b) => membershipTierRank(a, tierRankMap) - membershipTierRank(b, tierRankMap),
    );

    const nextUpgrade = sorted.find((m) => {
        if (!m.product) return false;
        if (cart.some((c) => c.productId === m.product.id)) return false;
        return membershipTierRank(m, tierRankMap) > custRank;
    });

    // Jika pelanggan sudah di tier tertinggi atau semua paket sudah di keranjang,
    // tidak tampilkan banner
    if (!nextUpgrade) return null;

    const fmt = (n) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);

    const durationLabel =
        nextUpgrade.duration_type === "month"
            ? `${nextUpgrade.duration_value} bln`
            : nextUpgrade.duration_type === "year"
              ? `${nextUpgrade.duration_value} thn`
              : nextUpgrade.duration_type === "day"
                ? `${nextUpgrade.duration_value} hr`
                : `${nextUpgrade.duration_value}x kunjungan`;

    const tierLabel = nextUpgrade.maps_to_tier
        ? nextUpgrade.maps_to_tier.charAt(0).toUpperCase() + nextUpgrade.maps_to_tier.slice(1)
        : nextUpgrade.name;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onAdd(nextUpgrade)}
            onKeyDown={(e) => e.key === "Enter" && onAdd(nextUpgrade)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-left transition hover:bg-primary/10 active:scale-[0.98]"
        >
            <BadgeCheck
                size={15}
                className="shrink-0 text-primary"
                strokeWidth={2}
            />
            <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[12px] font-semibold text-primary">
                    Upgrade ke {nextUpgrade.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                    {fmt(nextUpgrade.price)} · {durationLabel}
                    {tierLabel ? ` · ${tierLabel}` : ""}
                </p>
            </div>
            <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                + Keranjang
            </span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  MembershipOfferSlide — panel slide dari kanan saat pilih pelanggan  */
/* ------------------------------------------------------------------ */
function MembershipOfferSlide({ customer, memberships, cart, sidebarWidth, onAdd, onClose, tierRankMap = {} }) {
    const custRank = customerRank(customer, tierRankMap);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 250);
    };

    const sorted = [...memberships].sort(
        (a, b) => membershipTierRank(a, tierRankMap) - membershipTierRank(b, tierRankMap),
    );

    const nextUpgrade = sorted.find((m) => {
        if (!m.product) return false;
        if (cart.some((c) => c.productId === m.product.id)) return false;
        return membershipTierRank(m, tierRankMap) > custRank;
    });

    if (!nextUpgrade) return null;

    const fmt = (n) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);

    const durationLabel =
        nextUpgrade.duration_type === "month"
            ? `${nextUpgrade.duration_value} Bulan`
            : nextUpgrade.duration_type === "year"
              ? `${nextUpgrade.duration_value} Tahun`
              : nextUpgrade.duration_type === "day"
                ? `${nextUpgrade.duration_value} Hari`
                : `${nextUpgrade.duration_value}x Kunjungan`;

    const tierLabel =
        nextUpgrade.maps_to_tier
            ? nextUpgrade.maps_to_tier.charAt(0).toUpperCase() + nextUpgrade.maps_to_tier.slice(1)
            : nextUpgrade.name;

    // Posisi: tepat di atas sidebar keranjang pada desktop, bottom sheet di mobile
    const panelRight = sidebarWidth ? `${sidebarWidth + 8}px` : "340px";

    return ReactDOM.createPortal(
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
                onClick={handleClose}
            />

            {/* Desktop: slide dari kanan */}
            <div
                className={`fixed bottom-24 z-50 w-72 rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 hidden md:block ${
                    visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                }`}
                style={{ right: panelRight }}
            >
                <MembershipOfferPanelContent
                    customer={customer}
                    nextUpgrade={nextUpgrade}
                    fmt={fmt}
                    durationLabel={durationLabel}
                    tierLabel={tierLabel}
                    onAdd={onAdd}
                    onClose={handleClose}
                />
            </div>

            {/* Mobile: bottom sheet slide dari bawah */}
            <div
                className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-card shadow-2xl transition-all duration-200 md:hidden ${
                    visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                }`}
            >
                {/* Drag handle */}
                <div className="flex items-center justify-center pt-2 pb-1">
                    <div className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
                </div>
                <MembershipOfferPanelContent
                    customer={customer}
                    nextUpgrade={nextUpgrade}
                    fmt={fmt}
                    durationLabel={durationLabel}
                    tierLabel={tierLabel}
                    onAdd={onAdd}
                    onClose={handleClose}
                />
            </div>
        </>,
        document.body,
    );
}

function MembershipOfferPanelContent({ customer, nextUpgrade, fmt, durationLabel, tierLabel, onAdd, onClose }) {
    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <BadgeCheck size={16} className="text-primary" strokeWidth={2} />
                    <span className="text-[13px] font-bold text-primary">Penawaran Upgrade</span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{customer.name}</span> saat ini tier{" "}
                    <span className="capitalize font-semibold">{customer.tier || "bronze"}</span>.
                    Tawarkan upgrade:
                </p>

                {/* Kartu paket */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-foreground">{nextUpgrade.name}</span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary capitalize">
                            {tierLabel}
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{durationLabel}</p>
                    <p className="text-base font-extrabold text-primary">{fmt(nextUpgrade.price)}</p>
                </div>

                {/* Tombol aksi */}
                <button
                    type="button"
                    onClick={() => onAdd(nextUpgrade)}
                    className="w-full rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
                >
                    + Tambah ke Keranjang
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-xl border border-border px-4 py-2 text-[12px] font-medium text-muted-foreground transition hover:bg-muted"
                >
                    Tidak, lanjut belanja
                </button>
            </div>
        </>
    );
}
