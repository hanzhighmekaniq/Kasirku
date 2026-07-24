import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import OfflineIndicator from "@/Components/OfflineIndicator";
import { useStoreModules } from "@/Hooks/useStoreModules";
import { buildNavGroups } from "@/Config/navConfig";
import {
    useSidebarOrder,
    applyCustomOrderToItems,
} from "@/Hooks/useSidebarOrder";
import { NavIcons, GroupIcons } from "@/Components/NavIcons";
import { useTheme } from "@/Theme/ThemeProvider";
import {
    GripVertical,
    Search,
    Moon,
    Sun,
    Settings,
    LogOut,
    User,
    ArrowLeft,
} from "lucide-react";

/* ─── Type-mismatch modal ───────────────────────────────────── */
/**
 * Muncul ketika middleware CheckFeatureAccess mendeteksi bahwa tipe toko
 * tidak mendukung fitur yang dicoba diakses.
 * Data datang dari flash.typeBlock yang di-share HandleInertiaRequests.
 */
function TypeMismatchModal({ data, onClose }) {
    if (!data) return null;

    const { featureLabel, currentType, supportedTypes = [] } = data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm overflow-hidden bg-popover text-popover-foreground shadow-xl rounded-2xl">
                {/* Top banner */}
                <div className="px-5 py-4 text-white bg-gradient-to-r from-rose-400 to-pink-500">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 text-xl shrink-0 rounded-xl bg-white/20">
                            🚫
                        </span>
                        <div>
                            <p className="text-[11px] font-medium text-rose-100 uppercase tracking-wide">
                                Tipe Toko Tidak Sesuai
                            </p>
                            <h2 className="text-base font-bold leading-tight">
                                {featureLabel ?? "Fitur ini"}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Maaf, fitur{" "}
                        <span className="font-semibold text-foreground">
                            {featureLabel ?? "ini"}
                        </span>{" "}
                        tidak tersedia untuk tipe toko{" "}
                        <span className="font-semibold text-rose-600">
                            {currentType?.label ?? "Anda"}
                        </span>
                        .
                    </p>

                    {supportedTypes.length > 0 && (
                        <div className="px-4 py-3 border rounded-lg border-border bg-muted">
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                                Fitur ini tersedia untuk:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {supportedTypes.map((t) => (
                                    <span
                                        key={t.code}
                                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                                    >
                                        {t.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border bg-muted">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-sm font-semibold text-primary-foreground transition rounded-lg bg-primary hover:bg-primary/90"
                    >
                        Mengerti, Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Store type ─────────────────────────────────────────────── */
const TYPE_COLOR = {
    retail: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
    fnb: "bg-orange-50 text-orange-600 ring-1 ring-orange-100",
    service: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
    rental: "bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100",
    ticket: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
    hospitality: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
    // backward compat — fallback ke mode baru
    laundry: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
    session: "bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100",
    parking: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};
const TYPE_LABEL = {
    retail: "Retail",
    fnb: "FnB",
    service: "Service",
    rental: "Rental",
    ticket: "Tiket",
    hospitality: "Hotel",
    // backward compat
    laundry: "Service",
    session: "Rental",
    parking: "Parkir",
};
const TYPE_ICON = {
    retail: "🏪",
    fnb: "☕",
    service: "✂️",
    rental: "🔑",
    ticket: "🎟️",
    hospitality: "🏨",
    parking: "🅿️",
    session: "🎮",
};

/* ─── Badge ─────────────────────────────────────────────────── */
const BADGE_BG = {
    indigo: "bg-primary/10 text-primary",
    orange: "bg-orange-50 text-orange-500",
    violet: "bg-violet-50 text-violet-500",
    cyan: "bg-cyan-50 text-cyan-500",
};
function Badge({ label, color = "indigo" }) {
    return (
        <span
            className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_BG[color] ?? BADGE_BG.indigo}`}
        >
            {label}
        </span>
    );
}

/* ─── Nav item ───────────────────────────────────────────────── */
function NavItem({ item, collapsed, onClick, reorderMode, onDragStart }) {
    const active = Array.isArray(item.current)
        ? item.current.some(c => route().current(c))
        : route().current(item.current);
    const locked = item.locked;

    // ── Reorder mode: unlocked items jadi draggable ──
    if (reorderMode && !locked) {
        return (
            <div
                draggable
                onDragStart={(e) => onDragStart && onDragStart(e, item.key)}
                className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition cursor-grab active:cursor-grabbing text-foreground hover:bg-accent hover:text-accent-foreground select-none"
            >
                <span className="flex items-center justify-center w-5 h-5 transition rounded shrink-0 text-foreground/70 group-hover:text-accent-foreground">
                    <GripVertical className="w-4 h-4" strokeWidth={2} />
                </span>
                <span className="flex-1 truncate text-[13px] font-medium">
                    {item.name}
                </span>
                {item.badge && !collapsed && (
                    <Badge label={item.badge} color={item.badgeColor} />
                )}
            </div>
        );
    }

    if (collapsed) {
        // ── Collapsed: ikon presisi center, tinggi konsisten ──
        return (
            <Link
                href={locked ? "#" : item.href}
                onClick={locked ? (e) => e.preventDefault() : onClick}
                title={item.name}
                className={`group relative flex h-9 w-full items-center justify-center rounded-lg transition-all
                    ${locked
                        ? "cursor-not-allowed text-sidebar-foreground/50"
                        : active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
            >
                {/* Active left indicator */}
                {active && !locked && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                )}
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                    <NavIcons name={item.icon} className="h-[17px] w-[17px]" />
                </span>
            </Link>
        );
    }

    // ── Locked item (expanded) ──
    if (locked) {
        return (
            <div
                className="group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition cursor-not-allowed"
                title="🔓 Upgrade Plan untuk mengakses fitur ini"
            >
                <span className="flex items-center justify-center w-5 h-5 rounded-md shrink-0 text-sidebar-foreground/40">
                    <NavIcons name={item.icon} className="h-[15px] w-[15px]" />
                </span>
                {!collapsed && (
                    <span className="flex-1 truncate text-[13px] font-medium text-sidebar-foreground/40 line-through decoration-border">
                        {item.name}
                    </span>
                )}
                {!collapsed && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        🔓
                    </span>
                )}
            </div>
        );
    }

    // ── Normal item ──
    const content = (
        <>
            <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${active
                    ? "text-primary-foreground"
                    : "text-foreground/70 group-hover:text-accent-foreground"
                    }`}
            >
                <NavIcons name={item.icon} className="h-[15px] w-[15px]" />
            </span>
            <span
                className={`flex-1 truncate text-[13px] font-medium transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                    } ${active ? "text-primary-foreground" : "text-foreground"}`}
            >
                {item.name}
            </span>
            {item.badge && (
                <span
                    className={`shrink-0 transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}
                >
                    <Badge label={item.badge} color={item.badgeColor} />
                </span>
            )}
        </>
    );

    return (
        <Link
            href={item.href}
            onClick={onClick}
            title={collapsed ? item.name : undefined}
            className={`group flex items-center gap-2.5 rounded-lg px-1 py-2.5 transition-all
                ${active
                    ? "bg-primary text-base-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }
                ${collapsed ? "justify-center px-0" : ""}`}
        >
            {content}
        </Link>
    );
}

/* ─── Nav group ──────────────────────────────────────────────── */
function NavGroup({ group, collapsed, onNavigate, reorderMode, onReorder }) {
    const hasActive = group.items.some((i) =>
        Array.isArray(i.current) ? i.current.some(c => route().current(c)) : route().current(i.current)
    );
    const [open, setOpen] = useState(() => {
        if (hasActive) return true;
        try {
            const s = localStorage.getItem("sg-" + group.key);
            return s !== null ? JSON.parse(s) : hasActive;
        } catch {
            return hasActive;
        }
    });

    // ── Drag & drop state ──
    const [dragOverKey, setDragOverKey] = useState(null);
    const [dragOverPosition, setDragOverPosition] = useState(null);

    const handleItemDragStart = (e, key) => {
        e.dataTransfer.setData("text/plain", key);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const targetKey = e.currentTarget.dataset.itemKey;
        const rect = e.currentTarget.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        setDragOverKey(targetKey);
        setDragOverPosition(e.clientY < midY ? "above" : "below");
    };

    const handleDragLeave = () => {
        setDragOverKey(null);
        setDragOverPosition(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const draggedKey = e.dataTransfer.getData("text/plain");
        const targetKey = e.currentTarget.dataset.itemKey;

        const unlockedItems = group.items.filter((i) => !i.locked);
        const fromIndex = unlockedItems.findIndex((i) => i.key === draggedKey);
        if (fromIndex === -1) return;

        const targetItem = group.items.find((i) => i.key === targetKey);
        let toIndex;
        if (targetItem?.locked) {
            // Drop di atas item locked → taruh di akhir unlocked
            toIndex = unlockedItems.length;
        } else {
            toIndex = unlockedItems.findIndex((i) => i.key === targetKey);
            if (dragOverPosition === "below") toIndex++;
        }

        // Adjust saat drag ke bawah (elemen bergeser)
        if (fromIndex < toIndex) toIndex--;

        const newOrder = unlockedItems.map((i) => i.key);
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);

        if (onReorder) onReorder(group.key, newOrder);
        setDragOverKey(null);
    };

    const toggle = () => {
        const next = !open;
        setOpen(next);
        try {
            localStorage.setItem("sg-" + group.key, JSON.stringify(next));
        } catch { }
    };

    if (collapsed) {
        return (
            <div className="space-y-0.5 pb-1.5">
                <div className="w-6 h-px mx-auto my-2 bg-border" />
                {group.items.map((item) => (
                    <NavItem
                        key={item.key}
                        item={item}
                        collapsed
                        onClick={onNavigate}
                        reorderMode={false}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="pb-2">
            <button
                onClick={toggle}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${hasActive
                    ? "text-primary"
                    : "text-sidebar-foreground/50 hover:bg-muted hover:text-foreground"
                    }`}
            >
                <GroupIcons
                    name={group.icon}
                    className={`h-3.5 w-3.5 ${hasActive ? "text-primary" : "text-sidebar-foreground/50"}`}
                />
                <span className="flex-1 text-left">{group.label}</span>
                <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${hasActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                    {group.items.filter((i) => !i.locked).length}
                </span>
                <svg
                    className={`h-3 w-3 shrink-0 transition-transform ${hasActive ? "text-primary" : "text-sidebar-foreground/50"} ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
            {open && (
                <div className="mt-1 space-y-0.5 ml-2 pl-3 border-l-2 border-border">
                    {group.items.map((item, index) => {
                        // Tambahkan divider sebelum item LOCKED pertama
                        const prevItem = group.items[index - 1];
                        const showDivider =
                            item.locked && prevItem && !prevItem.locked;

                        // Drop indicator
                        const isDragOver = dragOverKey === item.key;
                        const showDropAbove =
                            isDragOver && dragOverPosition === "above";
                        const showDropBelow =
                            isDragOver && dragOverPosition === "below";

                        return (
                            <div
                                key={item.key}
                                data-item-key={item.key}
                                onDragOver={
                                    reorderMode ? handleDragOver : undefined
                                }
                                onDragLeave={
                                    reorderMode ? handleDragLeave : undefined
                                }
                                onDrop={reorderMode ? handleDrop : undefined}
                                className={`${showDropAbove ? "border-t-2 border-primary" : ""} ${showDropBelow ? "border-b-2 border-primary" : ""}`}
                            >
                                {showDivider && (
                                    <div className="flex items-center gap-2 px-3 my-2">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                            🔒 PREMIUM
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                )}
                                <NavItem
                                    item={item}
                                    collapsed={false}
                                    onClick={onNavigate}
                                    reorderMode={reorderMode}
                                    onDragStart={handleItemDragStart}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── Workspace Switcher (sidebar: toko + cabang jadi satu panel) ── */
function WorkspaceSwitcher({
    collapsed,
    currentStore,
    userStores = [],
    currentBranch,
    branches = [],
    canSwitch,
}) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 260 });
    const btnRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current?.contains(e.target)) return;
            if (btnRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    if (!currentStore) return null;

    const hasStoreChoice = canSwitch && userStores.length > 1;
    const hasBranchChoice = canSwitch && branches.length > 1;
    const clickable = hasStoreChoice || hasBranchChoice;

    const toggle = () => {
        if (!clickable) return;
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + 6,
                left: rect.left,
                width: collapsed ? 220 : rect.width,
            });
        }
        setOpen((o) => !o);
    };

    const switchStore = (storeId) => {
        setOpen(false);
        router.post(
            route("admin.store.switch"),
            { store_id: storeId },
            { preserveState: false },
        );
    };

    const switchBranch = (branchId) => {
        setOpen(false);
        router.post(
            route("admin.branch.switch"),
            { branch_id: branchId },
            { preserveState: false },
        );
    };

    const typeIcon = TYPE_ICON[currentStore.type] || "🏬";
    const typeLabel = TYPE_LABEL[currentStore.type] || currentStore.type;
    const typeColor =
        TYPE_COLOR[currentStore.type] ||
        "bg-muted text-muted-foreground ring-1 ring-muted";

    const Trigger = clickable ? "button" : "div";

    return (
        <div className={collapsed ? "flex justify-center" : "px-4"}>
            <Trigger
                ref={btnRef}
                type={clickable ? "button" : undefined}
                onClick={clickable ? toggle : undefined}
                title={
                    collapsed
                        ? `${currentStore.name}${currentBranch ? " · " + currentBranch.name : ""}`
                        : undefined
                }
                className={`flex items-center rounded-xl border transition ${collapsed
                    ? "h-9 w-9 justify-center border-border bg-muted"
                    : "w-full gap-2.5 border-border bg-muted px-3 py-2.5 text-left"
                    } ${clickable ? "hover:border-primary hover:bg-primary/10 cursor-pointer" : "cursor-default"}`}
            >
                <span className="flex items-center justify-center text-sm rounded-lg h-7 w-7 shrink-0 bg-muted">
                    {typeIcon}
                </span>
                {!collapsed && (
                    <>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-[13px] font-semibold text-foreground">
                                {currentStore.name}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                {currentBranch && (
                                    <span className="truncate">
                                        📍 {currentBranch.name}
                                    </span>
                                )}
                                <span
                                    className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${typeColor}`}
                                >
                                    {typeLabel}
                                </span>
                            </div>
                        </div>
                        {clickable && (
                            <svg
                                className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                    </>
                )}
            </Trigger>

            {open && clickable && (
                <div
                    ref={panelRef}
                    style={{
                        position: "fixed",
                        top: pos.top,
                        left: pos.left,
                        width: pos.width,
                    }}
                    className="z-50 overflow-hidden bg-popover text-popover-foreground border shadow-xl rounded-xl border-border"
                >
                    {hasStoreChoice && (
                        <>
                            <div className="px-3 py-2 border-b border-border">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-popover-foreground/60">
                                    Toko
                                </p>
                            </div>
                            {userStores.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => switchStore(s.id)}
                                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition hover:bg-accent ${s.id === currentStore.id
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-popover-foreground/70"
                                        }`}
                                >
                                    <span
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${s.id === currentStore.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {s.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="flex-1 truncate">
                                        {s.name}
                                    </span>
                                    {s.id === currentStore.id && (
                                        <svg
                                            className="ml-auto h-3.5 w-3.5 shrink-0 text-primary"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M4.5 12.75l6 6 9-13.5"
                                            />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </>
                    )}

                    {hasBranchChoice && (
                        <>
                            <div
                                className={`border-b border-border px-3 py-2 ${hasStoreChoice ? "border-t" : ""}`}
                            >
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-popover-foreground/60">
                                    Cabang
                                </p>
                            </div>
                            {branches.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => switchBranch(b.id)}
                                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition hover:bg-accent ${b.id === currentBranch?.id
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-popover-foreground/70"
                                        }`}
                                >
                                    <span
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${b.id === currentBranch?.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {b.code?.charAt(0) ?? b.name.charAt(0)}
                                    </span>
                                    <span className="flex-1 truncate">
                                        {b.name}
                                    </span>
                                    {b.id === currentBranch?.id && (
                                        <svg
                                            className="ml-auto h-3.5 w-3.5 shrink-0 text-primary"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M4.5 12.75l6 6 9-13.5"
                                            />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function SidebarContent({
    collapsed,
    onNavigate,
    user,
    currentStore,
    userStores,
    currentBranch,
    branches,
    canSwitchContext,
}) {
    const modules = useStoreModules();
    const groups = buildNavGroups(modules);
    const { customOrder, saveGroupOrder } = useSidebarOrder();
    const [reorderMode, setReorderMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { isDark, preference, setMode } = useTheme();
    const navRef = useRef(null);

    // Apply custom ordering — unlocked items ikut urutan user, locked tetap di bawah
    const orderedGroups = groups.map((group) => ({
        ...group,
        items: applyCustomOrderToItems(
            group.items,
            customOrder[group.key] || [],
        ),
    }));

    const handleReorder = (groupKey, newOrder) => {
        saveGroupOrder(groupKey, newOrder);
    };

    // Filter groups berdasarkan search query
    const filteredGroups = searchQuery.trim()
        ? orderedGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) =>
                    item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                ),
            }))
            .filter((group) => group.items.length > 0)
        : orderedGroups;

    // Toggle sederhana light<->dark (mode "system" diubah ke pilihan manual
    // begitu user menekan switch ini). Pengaturan lebih lengkap — pilih
    // template & mode "system" — ada di halaman Theme Picker.
    const toggleTheme = () => {
        setMode(isDark ? "light" : "dark");
    };

    useEffect(() => {
        if (navRef.current) {
            const s = localStorage.getItem("sidebar-scroll");
            if (s) navRef.current.scrollTop = parseInt(s, 10);
        }
    }, []);

    // Escape key to exit reorder mode
    useEffect(() => {
        if (!reorderMode) return;
        const handler = (e) => {
            if (e.key === "Escape") setReorderMode(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [reorderMode]);

    return (
        <div className="flex flex-col h-full overflow-hidden border-r bg-sidebar border-border ">
            {/* Brand */}
            <div
                className={`flex h-[68px] shrink-0 items-center border-b border-border bg-sidebar ${collapsed ? "justify-center px-3" : "px-5"}`}
            >
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 shadow-lg shrink-0 rounded-xl bg-primary shadow-primary/30">
                        <ApplicationLogo className="w-5 h-5 text-white fill-current" />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-400 ring-2 ring-emerald-100" />
                    </div>
                    <div
                        className={`leading-tight transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 w-0 overflow-hidden ml-0" : "opacity-100 w-auto"}`}
                    >
                        <span className="block text-[15px] font-bold tracking-tight text-sidebar-foreground whitespace-nowrap">
                            KasirKu
                        </span>
                        <span className="block text-[11px] font-medium text-sidebar-foreground/60 whitespace-nowrap">
                            Point of Sale System
                        </span>
                    </div>
                </div>
            </div>

            {/* Workspace switcher — toko & cabang */}
            <div
                className={`shrink-0 ${collapsed ? "pt-3 pb-1" : "pt-4 pb-1"}`}
            >
                <WorkspaceSwitcher
                    collapsed={collapsed}
                    currentStore={currentStore}
                    userStores={userStores}
                    currentBranch={currentBranch}
                    branches={branches}
                    canSwitch={canSwitchContext}
                />
            </div>

            {/* Search & Theme Toggle */}
            {!collapsed && (
                <div className="px-4 pt-3 pb-3 space-y-3 shrink-0">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-sidebar-foreground/50" />
                        <input
                            type="text"
                            placeholder="Cari menu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-border bg-muted pl-10 pr-3 py-2.5 text-sm text-sidebar-foreground placeholder-sidebar-foreground/50 transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                        />
                    </div>

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between rounded-xl bg-muted border border-border px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center rounded-lg h-7 w-7 bg-sidebar">
                                {isDark ? (
                                    <Moon className="w-4 h-4 text-sidebar-foreground" />
                                ) : (
                                    <Sun className="w-4 h-4 text-amber-600" />
                                )}
                            </div>
                            <span className="text-sm font-medium text-sidebar-foreground/70">
                                Tema
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                            className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${isDark ? "bg-primary" : "bg-border"
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full shadow-sm transition-all duration-300 ${isDark
                                    ? "translate-x-5 bg-primary-foreground text-primary"
                                    : "translate-x-0 bg-white text-black"
                                    }`}
                            >
                                {isDark ? (
                                    // Dark Mode - Moon putih, bulatan hitam
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="size-3"
                                    >
                                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                                    </svg>
                                ) : (
                                    // Light Mode - Sun hitam, bulatan putih
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="size-3"
                                    >
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2" />
                                        <path d="M12 20v2" />
                                        <path d="m4.93 4.93 1.41 1.41" />
                                        <path d="m17.66 17.66 1.41 1.41" />
                                        <path d="M2 12h2" />
                                        <path d="M20 12h2" />
                                        <path d="m6.34 17.66-1.41 1.41" />
                                        <path d="m19.07 4.93-1.41 1.41" />
                                    </svg>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav
                ref={navRef}
                onScroll={(e) =>
                    localStorage.setItem(
                        "sidebar-scroll",
                        String(e.target.scrollTop),
                    )
                }
                className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <div className="space-y-1">
                    {reorderMode && !collapsed && (
                        <div className="mb-3 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5 text-center">
                            <p className="text-xs font-semibold text-primary">
                                🎯 Drag & drop untuk mengatur urutan menu
                            </p>
                        </div>
                    )}
                    {filteredGroups.map((group) => (
                        <NavGroup
                            key={group.key}
                            group={group}
                            collapsed={collapsed}
                            onNavigate={onNavigate}
                            reorderMode={reorderMode}
                            onReorder={handleReorder}
                        />
                    ))}
                    {searchQuery &&
                        filteredGroups.length === 0 &&
                        !collapsed && (
                            <div className="py-12 text-center">
                                <div className="flex items-center justify-center mx-auto mb-3 rounded-full h-14 w-14 bg-muted">
                                    <Search className="w-6 h-6 text-sidebar-foreground/50" />
                                </div>
                                <p className="text-sm font-medium text-sidebar-foreground/70">
                                    Menu tidak ditemukan
                                </p>
                                <p className="mt-1 text-xs text-sidebar-foreground/50">
                                    Coba kata kunci lain
                                </p>
                            </div>
                        )}
                </div>
            </nav>

            {/* User Profile Card */}
            <div
                className={`shrink-0 border-t border-border bg-sidebar transition-all duration-300 ease-in-out ${collapsed ? "p-2" : "p-3"}`}
            >
                {collapsed ? (
                    <div className="flex justify-center">
                        <button
                            onClick={() =>
                                router.visit(route("admin.profile.edit"))
                            }
                            className="flex items-center justify-center text-xs font-bold text-primary-foreground transition-all rounded-lg shadow-sm h-9 w-9 bg-primary hover:shadow-md"
                        >
                            {user?.name?.charAt(0).toUpperCase()}
                        </button>
                    </div>
                ) : (
                    <div className="p-3 shadow-lg rounded-xl bg-muted">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-primary-foreground rounded-lg shadow-md bg-primary">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-muted bg-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-sidebar-foreground truncate">
                                    {user?.name}
                                </p>
                                <p className="truncate text-[10px] text-sidebar-foreground/60">
                                    {user?.email}
                                </p>
                            </div>
                            <button
                                onClick={() => router.post(route("logout"))}
                                className="flex items-center justify-center transition-all rounded-lg h-7 w-7 bg-sidebar-foreground/10 text-sidebar-foreground/60 hover:bg-red-500/20 hover:text-red-400"
                                title="Keluar"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Main layout ────────────────────────────────────────────── */
export default function AuthenticatedLayout({ header, children, noPadding = false, backUrl, headerRight }) {
    const {
        auth,
        currentStore,
        userStores = [],
        currentBranch,
        branches = [],
        flash,
    } = usePage().props;
    const user = auth?.user;

    // Hanya owner/admin/supervisor yang boleh ganti toko/branch
    // Karyawan biasa (kasir, gudang) false → switcher tersembunyi, branch terkunci
    const canSwitchContext = auth?.canSwitch === true;

    // Modal tipe toko tidak sesuai — diisi dari flash.typeBlock
    const [typeBlock, setTypeBlock] = useState(flash?.typeBlock ?? null);
    // Sync setiap kali flash berubah (navigasi Inertia)
    useEffect(() => {
        if (flash?.typeBlock) setTypeBlock(flash.typeBlock);
    }, [flash?.typeBlock]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("sidebar-collapsed") ?? "false",
            );
        } catch {
            return false;
        }
    });

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
        } catch { }
    };

    const onNavigate = () => setSidebarOpen(false);
    const sidebarW = collapsed ? "w-[70px]" : "w-[240px]";

    return (
        <div className="min-h-screen bg-background">
            {/* Type-mismatch modal */}
            <TypeMismatchModal
                data={typeBlock}
                onClose={() => setTypeBlock(null)}
            />

            {/* Desktop sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 hidden overflow-hidden transition-[width] duration-300 ease-in-out lg:block ${sidebarW}`}
            >
                <SidebarContent
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                    user={user}
                    currentStore={currentStore}
                    userStores={userStores}
                    currentBranch={currentBranch}
                    branches={branches}
                    canSwitchContext={canSwitchContext}
                />
            </aside>

            {/* Mobile drawer */}
            <div
                className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}
            >
                <div
                    onClick={() => setSidebarOpen(false)}
                    className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
                />
                <aside
                    className={`absolute inset-y-0 left-0 w-[280px] overflow-hidden shadow-xl transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <SidebarContent
                        collapsed={false}
                        onNavigate={onNavigate}
                        user={user}
                        currentStore={currentStore}
                        userStores={userStores}
                        currentBranch={currentBranch}
                        branches={branches}
                        canSwitchContext={canSwitchContext}
                    />
                </aside>
            </div>

            {/* Main */}
            <div
                className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out ${collapsed ? "lg:pl-[70px]" : "lg:pl-[240px]"}`}
            >
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-[56px] items-center gap-2.5 border-b border-border bg-sidebar backdrop-blur-md px-4 sm:px-6 shadow-sm">
                    {/* Mobile menu */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex items-center justify-center transition-colors rounded-lg h-7 w-7 text-sidebar-foreground/60 hover:bg-muted lg:hidden"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                            />
                        </svg>
                    </button>

                    {/* Desktop collapse */}
                    <button
                        onClick={toggleCollapse}
                        className="items-center justify-center hidden transition-colors rounded-lg h-7 w-7 text-sidebar-foreground/60 hover:bg-muted hover:text-foreground lg:flex"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
                            />
                        </svg>
                    </button>

                    <div className="hidden w-px h-6 bg-border sm:block" />

                    {/* Page title & Back Button */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        {backUrl && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    if (typeof backUrl === "function") {
                                        backUrl(e);
                                    } else if (typeof backUrl === "string") {
                                        router.visit(backUrl, { preserveScroll: true });
                                    }
                                }}
                                aria-label="Kembali"
                                title="Kembali"
                                className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <ArrowLeft className="size-4" strokeWidth={2} />
                            </button>
                        )}
                        <h1 className="text-sm font-semibold text-sidebar-foreground">
                            {header}
                        </h1>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {headerRight && (
                            <div className="flex items-center gap-1.5 border-r border-border/50 pr-2 mr-1">
                                {headerRight}
                            </div>
                        )}
                        
                        {/* Toko & cabang kini dikelola dari sidebar (WorkspaceSwitcher) */}
                        <OfflineIndicator />

                        {/* User menu */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2.5 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-muted/80 hover:border-primary transition-all shadow-sm">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="hidden max-w-[8rem] truncate sm:block text-xs font-semibold">
                                        {user?.name}
                                    </span>
                                    <svg
                                        className="h-3.5 w-3.5 text-sidebar-foreground/50"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                {/* Mobile-only user info (toko/cabang sudah ada di sidebar) */}
                                <div className="lg:hidden px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center justify-center text-sm font-bold text-primary-foreground rounded-lg shadow-sm h-9 w-9 shrink-0 bg-primary">
                                            {user?.name
                                                ?.charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate text-foreground">
                                                {user?.name}
                                            </p>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:hidden my-1.5 border-t border-border" />
                                <Dropdown.Link
                                    href={route("admin.profile.edit")}
                                >
                                    <span className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                        Profil Saya
                                    </span>
                                </Dropdown.Link>
                                <Dropdown.Link
                                    href={route("admin.settings.index")}
                                >
                                    <span className="flex items-center gap-2">
                                        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                                        Pengaturan
                                    </span>
                                </Dropdown.Link>
                                <div className="my-1.5 border-t border-border" />
                                <Dropdown.Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                >
                                    <span className="flex items-center gap-2">
                                        <LogOut className="h-3.5 w-3.5 text-rose-400" />
                                        <span className="text-rose-600">
                                            Keluar
                                        </span>
                                    </span>
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Flash — pesan sukses/error statis */}
                {flash?.success && (
                    <div className="mx-5 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                        {flash.error}
                    </div>
                )}
                {flash?.warning && (
                    <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                        {flash.warning}
                    </div>
                )}

                <main className={noPadding ? "flex-1 flex flex-col overflow-hidden bg-background " : "flex-1 p-4 bg-background"}>
                    {noPadding ? children : (
                        <div className="mx-auto w-full max-w-[1920px]">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
