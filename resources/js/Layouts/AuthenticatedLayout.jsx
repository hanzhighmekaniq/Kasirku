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
import { Check, GripVertical } from "lucide-react";

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
            <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
                {/* Top banner */}
                <div className="bg-gradient-to-r from-rose-400 to-pink-500 px-5 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl">
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
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Maaf, fitur{" "}
                        <span className="font-semibold text-slate-800">
                            {featureLabel ?? "ini"}
                        </span>{" "}
                        tidak tersedia untuk tipe toko{" "}
                        <span className="font-semibold text-rose-600">
                            {currentType?.label ?? "Anda"}
                        </span>
                        .
                    </p>

                    {supportedTypes.length > 0 && (
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-500 mb-1.5">
                                Fitur ini tersedia untuk:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {supportedTypes.map((t) => (
                                    <span
                                        key={t.code}
                                        className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                                    >
                                        {t.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition"
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

/* ─── Badge ─────────────────────────────────────────────────── */
const BADGE_BG = {
    indigo: "bg-indigo-50 text-indigo-500",
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
    const active = route().current(item.current);
    const locked = item.locked;

    // ── Reorder mode: unlocked items jadi draggable ──
    if (reorderMode && !locked) {
        return (
            <div
                draggable
                onDragStart={(e) => onDragStart && onDragStart(e, item.key)}
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition cursor-grab active:cursor-grabbing text-slate-500 hover:bg-slate-50 hover:text-slate-700 select-none"
            >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded text-slate-300 group-hover:text-slate-600 transition">
                    <GripVertical className="h-4 w-4" strokeWidth={1.8} />
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

    if (locked) {
        // ── Locked item: transparan, tidak bisa diklik, teks "🔓 Upgrade Plan" ──
        return (
            <div
                className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition cursor-not-allowed ${
                    collapsed ? "justify-center" : ""
                }`}
                title="🔓 Upgrade Plan untuk mengakses fitur ini"
            >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-slate-300">
                    <NavIcons name={item.icon} className="h-[15px] w-[15px]" />
                </span>
                {!collapsed && (
                    <span className="flex-1 truncate text-[13px] font-medium text-slate-300 line-through decoration-slate-200">
                        {item.name}
                    </span>
                )}
                {!collapsed && (
                    <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
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
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md transition ${
                    active
                        ? "text-indigo-600"
                        : "text-slate-400 group-hover:text-slate-600"
                }`}
            >
                <NavIcons name={item.icon} className="h-[15px] w-[15px]" />
            </span>
            <span
                className={`flex-1 truncate text-[13px] font-medium transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}
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
            {active && (
                <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 transition-all duration-300 ease-in-out ${collapsed ? "opacity-0" : "opacity-100"}`}
                />
            )}
        </>
    );

    return (
        <Link
            href={item.href}
            onClick={onClick}
            title={collapsed ? item.name : undefined}
            className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all
                ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}
                ${collapsed ? "justify-center px-2" : ""}`}
        >
            {content}
        </Link>
    );
}

/* ─── Nav group ──────────────────────────────────────────────── */
function NavGroup({ group, collapsed, onNavigate, reorderMode, onReorder }) {
    const hasActive = group.items.some((i) => route().current(i.current));
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
        } catch {}
    };

    if (collapsed) {
        return (
            <div className="space-y-0.5 pb-1">
                <div className="my-2 mx-3 h-px bg-slate-100" />
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
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    hasActive
                        ? "bg-indigo-50/80 text-indigo-600"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-500"
                }`}
            >
                <GroupIcons
                    name={group.icon}
                    className={`h-4 w-4 ${hasActive ? "" : "opacity-60"}`}
                />
                <span className="flex-1 text-left">{group.label}</span>
                {hasActive && !open && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                )}
                <svg
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${hasActive ? "text-indigo-400" : "text-slate-300"} ${open ? "rotate-180" : ""}`}
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
                <div className="mt-1 space-y-0.5 border-l-2 border-indigo-100 pl-2 ml-4">
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
                                className={`${showDropAbove ? "border-t-2 border-indigo-500" : ""} ${showDropBelow ? "border-b-2 border-indigo-500" : ""}`}
                            >
                                {showDivider && (
                                    <div className="my-2 flex items-center gap-2 px-2.5">
                                        <div className="h-px flex-1 bg-slate-100" />
                                        <span className="text-[10px] font-medium text-slate-400">
                                            🔒 Upgrade Plan
                                        </span>
                                        <div className="h-px flex-1 bg-slate-100" />
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

/* ─── Store Switcher (topbar) ────────────────────────────────── */
function StoreSwitcher({ currentStore, userStores }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const switchStore = (storeId) => {
        setOpen(false);
        router.post(
            route("admin.store.switch"),
            { store_id: storeId },
            {
                preserveState: false,
            },
        );
    };

    return (
        <div ref={ref} className="relative hidden sm:block">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
                <svg
                    className="h-3.5 w-3.5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.375.375 0 01.375.375v1.875c0 .207-.168.375-.375.375H6.75a.375.375 0 01-.375-.375v-1.875A.375.375 0 016.75 18z"
                    />
                </svg>
                <span className="max-w-[7rem] truncate">
                    {currentStore.name}
                </span>
                <svg
                    className={`h-3 w-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
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
                <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Ganti Toko
                        </p>
                    </div>
                    {userStores.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => switchStore(s.id)}
                            className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition hover:bg-slate-50 ${
                                s.id === currentStore.id
                                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                                    : "text-slate-700"
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                    s.id === currentStore.id
                                        ? "bg-indigo-500 text-white"
                                        : "bg-slate-200 text-slate-600"
                                }`}
                            >
                                {s.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="flex-1 truncate">{s.name}</span>
                            {s.id === currentStore.id && (
                                <svg
                                    className="ml-auto h-3.5 w-3.5 shrink-0 text-indigo-500"
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
                </div>
            )}
        </div>
    );
}

/* ─── Branch Switcher (topbar) ───────────────────────────────── */
function BranchSwitcher({ currentBranch, branches }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const switchBranch = (branchId) => {
        setOpen(false);
        router.post(
            route("admin.branch.switch"),
            { branch_id: branchId },
            {
                preserveState: false,
            },
        );
    };

    return (
        <div ref={ref} className="relative hidden sm:block">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
                <svg
                    className="h-3.5 w-3.5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 21h16.5M4.5 21V8.25A2.25 2.25 0 016.75 6h10.5a2.25 2.25 0 012.25 2.25V21"
                    />
                </svg>
                {currentBranch.name}
                <svg
                    className={`h-3 w-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
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
                <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Ganti Cabang
                        </p>
                    </div>
                    {branches.map((b) => (
                        <button
                            key={b.id}
                            onClick={() => switchBranch(b.id)}
                            className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition hover:bg-slate-50 ${
                                b.id === currentBranch.id
                                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                                    : "text-slate-700"
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                    b.id === currentBranch.id
                                        ? "bg-indigo-500 text-white"
                                        : "bg-slate-200 text-slate-600"
                                }`}
                            >
                                {b.code?.charAt(0) ?? b.name.charAt(0)}
                            </span>
                            {b.name}
                            {b.id === currentBranch.id && (
                                <svg
                                    className="ml-auto h-3.5 w-3.5 text-indigo-500"
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
                </div>
            )}
        </div>
    );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function SidebarContent({ collapsed, onNavigate }) {
    const { currentStore, userStores } = usePage().props;
    const modules = useStoreModules();
    const groups = buildNavGroups(modules);
    const { customOrder, saveGroupOrder } = useSidebarOrder();
    const [reorderMode, setReorderMode] = useState(false);
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

    /** Helper: extract store type code as string, whether accessor returns string or object */
    const storeTypeCode = (() => {
        const st =
            currentStore?.store_type ?? currentStore?.storeType ?? "retail";
        if (typeof st === "string") return st;
        if (st && typeof st === "object") return st?.code ?? "retail";
        return "retail";
    })();

    return (
        <div className="flex h-full flex-col overflow-hidden bg-white border-r border-slate-200">
            {/* Brand */}
            <div
                className={`flex h-[57px] shrink-0 items-center border-b border-slate-100 ${collapsed ? "justify-center px-3" : "px-4"}`}
            >
                <div className="flex items-center gap-2.5">
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
                        <ApplicationLogo className="h-4 w-4 fill-current text-white" />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-400" />
                    </div>
                    <div
                        className={`leading-none transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 w-0 overflow-hidden ml-0" : "opacity-100 w-auto ml-1"}`}
                    >
                        <span className="block text-[13px] font-bold tracking-tight text-slate-800 whitespace-nowrap">
                            SIM-KASIR
                        </span>
                        <span className="block text-[10px] text-slate-400 whitespace-nowrap">
                            Point of Sale
                        </span>
                    </div>
                </div>
            </div>

            {/* Store info */}
            {currentStore && (
                <div
                    className={`mx-3 mt-3 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 transition-all duration-300 ease-in-out ${collapsed ? "max-h-0 opacity-0 mt-0 border-0" : "max-h-24 opacity-100"}`}
                >
                    <div className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-600">
                                {currentStore.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-700">
                                    {currentStore.name}
                                </p>
                                <span
                                    className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLOR[storeTypeCode] ?? TYPE_COLOR.retail}`}
                                >
                                    {TYPE_LABEL[storeTypeCode] ?? storeTypeCode}
                                </span>
                            </div>
                            {userStores?.length > 1 && (
                                <Link
                                    href={route("admin.store.select")}
                                    title="Ganti Toko"
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                                        />
                                    </svg>
                                </Link>
                            )}
                        </div>
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
                className="flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <div className="space-y-0.5">
                    {reorderMode && (
                        <div className="mb-2 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-center">
                            <p className="text-[10px] font-medium text-indigo-600">
                                Drag & drop untuk mengatur urutan menu
                            </p>
                        </div>
                    )}
                    {orderedGroups.map((group) => (
                        <NavGroup
                            key={group.key}
                            group={group}
                            collapsed={collapsed}
                            onNavigate={onNavigate}
                            reorderMode={reorderMode}
                            onReorder={handleReorder}
                        />
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div
                className={`shrink-0 overflow-hidden border-t border-slate-100 transition-all duration-300 ease-in-out ${collapsed ? "max-h-0 opacity-0 border-t-0" : "max-h-10 opacity-100"}`}
            >
                <div className="px-4 py-2.5 text-center">
                    <span className="text-[10px] text-slate-400">
                        © {new Date().getFullYear()} SIM-KASIR
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ─── Main layout ────────────────────────────────────────────── */
export default function AuthenticatedLayout({ header, children }) {
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
        } catch {}
    };

    const onNavigate = () => setSidebarOpen(false);
    const sidebarW = collapsed ? "w-[60px]" : "w-[220px]";

    return (
        <div className="min-h-screen bg-[#f8f9fb]">
            {/* Type-mismatch modal */}
            <TypeMismatchModal
                data={typeBlock}
                onClose={() => setTypeBlock(null)}
            />

            {/* Desktop sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 hidden overflow-hidden transition-[width] duration-300 ease-in-out lg:block ${sidebarW}`}
            >
                <SidebarContent collapsed={collapsed} onNavigate={onNavigate} />
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
                    className={`absolute inset-y-0 left-0 w-[220px] overflow-hidden shadow-xl transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <SidebarContent collapsed={false} onNavigate={onNavigate} />
                </aside>
            </div>

            {/* Main */}
            <div
                className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out ${collapsed ? "lg:pl-[60px]" : "lg:pl-[220px]"}`}
            >
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-[57px] items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-5   ">
                    {/* Mobile menu */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
                    >
                        <svg
                            className="h-5 w-5"
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
                        className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 lg:flex"
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
                                d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
                            />
                        </svg>
                    </button>

                    <div className="h-5 w-px bg-slate-200" />

                    {/* Page title */}
                    <div className="min-w-0 flex-1 truncate text-sm text-slate-700">
                        {header}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Store switcher — hanya owner/manager yang punya multi-store */}
                        {currentStore &&
                            userStores?.length > 1 &&
                            canSwitchContext && (
                                <StoreSwitcher
                                    currentStore={currentStore}
                                    userStores={userStores}
                                />
                            )}

                        {/* Branch badge / switcher */}
                        {currentBranch &&
                            // Karyawan biasa: badge static saja, tidak bisa ganti branch
                            (!canSwitchContext ? (
                                <span className="hidden items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 sm:flex">
                                    <svg
                                        className="h-3.5 w-3.5 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.8}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 21h16.5M4.5 21V8.25A2.25 2.25 0 016.75 6h10.5a2.25 2.25 0 012.25 2.25V21"
                                        />
                                    </svg>
                                    <span>{currentBranch.name}</span>
                                    <svg
                                        className="h-3 w-3 text-slate-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                        />
                                    </svg>
                                </span>
                            ) : branches?.length > 1 ? (
                                <BranchSwitcher
                                    currentBranch={currentBranch}
                                    branches={branches}
                                />
                            ) : (
                                <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 sm:flex">
                                    <svg
                                        className="h-3.5 w-3.5 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.8}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 21h16.5M4.5 21V8.25A2.25 2.25 0 016.75 6h10.5a2.25 2.25 0 012.25 2.25V21"
                                        />
                                    </svg>
                                    {currentBranch.name}
                                </span>
                            ))}

                        <OfflineIndicator />

                        {/* User menu */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="hidden max-w-[8rem] truncate sm:block text-xs">
                                        {user?.name}
                                    </span>
                                    <svg
                                        className="h-3.5 w-3.5 text-slate-400"
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
                                <Dropdown.Link
                                    href={route("admin.profile.edit")}
                                >
                                    Profil Saya
                                </Dropdown.Link>
                                <div className="my-1 border-t border-slate-100" />
                                <Dropdown.Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                >
                                    Keluar
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

                <main className="flex-1 p-1 sm:p-2">{children}</main>
            </div>
        </div>
    );
}
