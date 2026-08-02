import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import Dropdown from "@/Components/Dropdown";
import OfflineIndicator from "@/Components/OfflineIndicator";
import NotificationBell from "@/Components/NotificationBell";
import { useStoreModules } from "@/Hooks/useStoreModules";
import { buildNavGroups } from "@/Config/navConfig";
import {
    useSidebarOrder,
    applyCustomLayout,
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
    Store as StoreIcon,
    Coffee,
    Scissors,
    KeyRound,
    Ticket,
    Hotel,
    CircleParking,
    Gamepad2,
    MapPin,
    Check,
    ChevronRight,
    X,
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
                <div className="px-5 py-4 text-destructive-foreground bg-destructive">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 text-xl shrink-0 rounded-xl bg-white/20">
                            🚫
                        </span>
                        <div>
                            <p className="text-[11px] font-medium text-destructive-foreground/80 uppercase tracking-wide">
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
                        <span className="font-semibold text-destructive">
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

/* ─── Store type ───────────────────────────────────────────────
 * Warna badge tipe toko.
 *
 * Pola `-500/10` untuk latar + `text-*-600` / `dark:text-*-400` untuk teks —
 * sama seperti badge di halaman Promo & Pelanggan. Latar semi-transparan ikut
 * menumpuk di atas surface tema aktif, jadi satu set kelas ini aman di light
 * MAUPUN dark tanpa pasangan `dark:bg-*` terpisah. Pola lama (`-50` + `dark:bg-*-900/30`)
 * mengunci warna latar ke palet Tailwind sehingga bertabrakan dengan preset
 * tema dan berubah drastis saat mode diganti.
 */
const TYPE_COLOR = {
    retail: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    fnb: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    service: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    rental: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ticket: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    hospitality: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    // backward compat — fallback ke mode baru
    laundry: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    session: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    parking: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
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
/**
 * Kode tipe toko dari props `currentStore`.
 *
 * `store_type` bisa datang sebagai objek relasi (`{ code, label, ... }`) — itu
 * bentuk yang dikirim HandleInertiaRequests — atau string kode pada payload
 * lama. Keduanya ditangani di sini supaya badge/ikon tipe tidak jatuh ke
 * fallback generik.
 */
function storeTypeCode(store) {
    const raw = store?.store_type ?? store?.type;

    return typeof raw === "string" ? raw : (raw?.code ?? null);
}

/**
 * Ikon lucide per tipe toko — dipakai di brand mark sidebar (bukan emoji)
 * supaya bentuknya konsisten dengan ikon lain di layout dan ikut warna tema.
 */
const TYPE_LUCIDE = {
    retail: StoreIcon,
    fnb: Coffee,
    service: Scissors,
    rental: KeyRound,
    ticket: Ticket,
    hospitality: Hotel,
    // backward compat
    laundry: Scissors,
    parking: CircleParking,
    session: Gamepad2,
};

/* ─── Brand mark ─────────────────────────────────────────────────
 * Logo toko kalau ada; kalau tidak, jatuh ke ikon sesuai tipe toko.
 * Menggantikan logo Laravel yang sebelumnya statis di sini.
 */
function StoreMark({ store }) {
    const [broken, setBroken] = useState(false);
    const logo = store?.logo
        ? /^https?:\/\//.test(store.logo)
            ? store.logo
            : `/storage/${store.logo}`
        : null;

    if (logo && !broken) {
        return (
            <img
                src={logo}
                alt={store?.name ?? "Logo toko"}
                onError={() => setBroken(true)}
                className="h-6 w-6 rounded-md object-contain"
            />
        );
    }

    const Icon = TYPE_LUCIDE[storeTypeCode(store)] ?? StoreIcon;

    return (
        <Icon
            className="w-5 h-5 text-primary-foreground"
            strokeWidth={2}
        />
    );
}

/* ─── Theme toggle (icon only) ──────────────────────────────────── */
function ThemeIconButton({ isDark, onToggle, collapsed = false }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            title={isDark ? "Mode terang" : "Mode gelap"}
            aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            className={`flex shrink-0 items-center justify-center rounded-xl border border-border bg-muted transition hover:border-primary hover:bg-primary/10 ${collapsed ? "h-9 w-9" : "w-[44px] self-stretch"}`}
        >
            {isDark ? (
                <Moon className="w-4 h-4 text-sidebar-foreground" strokeWidth={2} />
            ) : (
                <Sun className="w-4 h-4 text-warning" strokeWidth={2} />
            )}
        </button>
    );
}

/* ─── Badge ───────────────────────────────────────────────────
 * Badge kecil di item nav (POS, FnB, Service). Ikut pola `-500/10` yang sama
 * dengan badge tipe toko supaya kontrasnya tetap saat mode diganti.
 */
const BADGE_BG = {
    indigo: "bg-primary/10 text-primary",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};
function Badge({ label, color = "indigo", active = false }) {
    // Di item yang aktif, latarnya sudah `bg-primary`. Badge default
    // (`bg-primary/10 text-primary`) jadi setara warna latar dan hilang, jadi
    // versi aktifnya dibalik memakai pasangan foreground.
    return (
        <span
            className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : (BADGE_BG[color] ?? BADGE_BG.indigo)
            }`}
        >
            {label}
        </span>
    );
}

/* ─── Active state ───────────────────────────────────────────────
 * Satu-satunya sumber kebenaran "item ini sedang aktif?" — dipakai NavItem
 * maupun NavGroup supaya highlight item dan auto-open grup tidak pernah beda.
 *
 * `item.current` boleh string atau array pola Ziggy (mis. "admin.products.*").
 * Dua hal yang dijaga di sini:
 *
 *  1. Pola kosong/undefined dibuang. `route().current(undefined)` di Ziggy
 *     mengembalikan NAMA route saat ini (string non-kosong = truthy), jadi
 *     item tanpa pola akan tampak aktif di SEMUA halaman. Di-guard di sini.
 *  2. Hasilnya dipaksa boolean supaya tidak ada nilai truthy nyasar.
 */
function isItemActive(item) {
    const patterns = (
        Array.isArray(item?.current) ? item.current : [item?.current]
    ).filter(Boolean);

    return patterns.some((pattern) => route().current(pattern) === true);
}

/* ─── Nav item ───────────────────────────────────────────────── */
function NavItem({ item, collapsed, onClick, reorderMode, onDragStart }) {
    const active = isItemActive(item);
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
                    <Badge
                        label={item.badge}
                        color={item.badgeColor}
                        active={active}
                    />
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
                    ? "bg-primary text-primary-foreground"
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
    const hasActive = group.items.some(isItemActive);
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
                                        <span className="text-[9px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
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

/* ─── Workspace picker ──────────────────────────────────────────
 * Ambang jumlah cabang: sampai sejumlah ini daftar cabang masih enak dibaca
 * sebagai dropdown. Lebih dari itu (atau kalau user punya lebih dari satu
 * toko) pemilihan dipindah ke modal yang punya kolom pencarian.
 */
const BRANCH_DROPDOWN_LIMIT = 6;

/** Satu baris pilihan — dipakai baik di dropdown maupun di modal. */
function PickerOption({
    label,
    sub,
    initial,
    active = false,
    trailing = "check",
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                active
                    ? "bg-primary/10 text-primary"
                    : "text-popover-foreground/80 hover:bg-accent hover:text-accent-foreground"
            }`}
        >
            <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold uppercase ${
                    active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                }`}
            >
                {initial}
            </span>
            <span className="min-w-0 flex-1">
                <span
                    className={`block truncate text-[13px] ${active ? "font-semibold" : "font-medium"}`}
                >
                    {label}
                </span>
                {sub && (
                    <span className="block truncate text-[11px] text-muted-foreground">
                        {sub}
                    </span>
                )}
            </span>
            {trailing === "chevron" ? (
                <ChevronRight
                    className="w-4 h-4 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                />
            ) : (
                active && (
                    <Check
                        className="w-4 h-4 shrink-0 text-primary"
                        strokeWidth={2.5}
                    />
                )
            )}
        </button>
    );
}

/** Skeleton daftar saat opsi toko/cabang masih diambil dari server. */
function PickerSkeleton() {
    return (
        <div className="space-y-1.5 p-1.5">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                >
                    <div className="w-7 h-7 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                        <div className="w-1/2 h-2.5 rounded bg-muted animate-pulse" />
                        <div className="w-1/3 h-2 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Workspace picker modal ─────────────────────────────────────
 * Dipakai kalau opsinya banyak. Alurnya dua langkah bila user punya lebih
 * dari satu toko: pilih toko dulu → baru cabangnya. Toko dan cabang dikirim
 * dalam satu request (`admin.store.switch` menerima `branch_id` opsional),
 * jadi tidak ada halaman perantara.
 *
 * Daftar toko + cabangnya datang dari prop optional `storeBranchOptions`,
 * ditarik lewat partial reload saat modal dibuka supaya payload halaman
 * biasa tetap ringan.
 */
function WorkspacePickerModal({
    open,
    onClose,
    currentStore,
    currentBranch,
    branches = [],
    userStores = [],
    canPickStore,
}) {
    const { storeBranchOptions } = usePage().props;
    const [step, setStep] = useState("store");
    const [pickedStore, setPickedStore] = useState(null);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);

    // Reset state tiap kali dibuka & ambil opsi kalau belum ada di props.
    useEffect(() => {
        if (!open) return;
        setQuery("");
        setStep(canPickStore ? "store" : "branch");
        setPickedStore(canPickStore ? null : currentStore);

        // Hanya perlu tarik daftar toko+cabang saat user bisa ganti toko;
        // untuk satu toko, prop `branches` yang selalu ada sudah cukup.
        if (canPickStore && !storeBranchOptions) {
            setLoading(true);
            router.reload({
                only: ["storeBranchOptions"],
                onFinish: () => setLoading(false),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    useEffect(() => {
        if (open) searchRef.current?.focus();
    }, [open, step]);

    if (!open) return null;

    const stores = storeBranchOptions ?? userStores;
    const q = query.trim().toLowerCase();
    const matches = (o) =>
        !q ||
        (o.name ?? "").toLowerCase().includes(q) ||
        (o.code ?? "").toLowerCase().includes(q);

    /** Cabang milik satu toko — dari opsi server, fallback ke prop `branches`. */
    const branchesOf = (store) => {
        if (!store) return [];
        const fromOptions = stores.find((s) => s.id === store.id)?.branches;
        if (fromOptions) return fromOptions;

        return store.id === currentStore?.id ? branches : [];
    };

    const switchStore = (storeId, branchId = null) => {
        onClose();
        router.post(
            route("admin.store.switch"),
            { store_id: storeId, branch_id: branchId },
            { preserveState: false },
        );
    };

    const switchBranch = (branchId) => {
        onClose();
        if (branchId === currentBranch?.id) return;
        router.post(
            route("admin.branch.switch"),
            { branch_id: branchId },
            { preserveState: false },
        );
    };

    const pickStore = (store) => {
        const list = branchesOf(store);

        // Masih ada pilihan cabang → lanjut ke langkah kedua.
        if (list.length > 1) {
            setPickedStore(store);
            setStep("branch");
            setQuery("");

            return;
        }

        if (store.id === currentStore?.id) {
            onClose();

            return;
        }

        switchStore(store.id, list[0]?.id ?? null);
    };

    const pickBranch = (branch) => {
        if (!pickedStore || pickedStore.id === currentStore?.id) {
            switchBranch(branch.id);

            return;
        }

        switchStore(pickedStore.id, branch.id);
    };

    const onStoreStep = step === "store";
    const options = onStoreStep ? stores : branchesOf(pickedStore);
    const filtered = options.filter(matches);
    const showSkeleton = loading && options.length === 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh]">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                    {!onStoreStep && canPickStore && (
                        <button
                            type="button"
                            onClick={() => {
                                setStep("store");
                                setQuery("");
                            }}
                            title="Kembali ke daftar toko"
                            className="flex items-center justify-center transition rounded-lg h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                        </button>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                            {onStoreStep ? "Pilih Toko" : "Pilih Cabang"}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                            {onStoreStep
                                ? `${stores.length} toko tersedia`
                                : (pickedStore?.name ??
                                  currentStore?.name ??
                                  "")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        title="Tutup"
                        className="flex items-center justify-center transition rounded-lg h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-border">
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            strokeWidth={1.8}
                        />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={
                                onStoreStep
                                    ? "Cari nama atau kode toko..."
                                    : "Cari nama atau kode cabang..."
                            }
                            className="block w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                    </div>
                </div>

                {/* List */}
                {showSkeleton ? (
                    <PickerSkeleton />
                ) : filtered.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <p className="text-sm font-medium text-foreground">
                            {onStoreStep
                                ? "Toko tidak ditemukan"
                                : "Cabang tidak ditemukan"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Coba kata kunci lain.
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[45vh] space-y-0.5 overflow-y-auto p-1.5">
                        {onStoreStep
                            ? filtered.map((s) => {
                                  const list = branchesOf(s);
                                  const typeLabel =
                                      TYPE_LABEL[storeTypeCode(s)] ?? null;
                                  const sub = [
                                      typeLabel,
                                      list.length > 0
                                          ? `${list.length} cabang`
                                          : null,
                                      s.code,
                                  ]
                                      .filter(Boolean)
                                      .join(" · ");

                                  return (
                                      <PickerOption
                                          key={s.id}
                                          label={s.name}
                                          sub={sub}
                                          initial={s.name?.charAt(0)}
                                          active={s.id === currentStore?.id}
                                          trailing={
                                              list.length > 1
                                                  ? "chevron"
                                                  : "check"
                                          }
                                          onClick={() => pickStore(s)}
                                      />
                                  );
                              })
                            : filtered.map((b) => (
                                  <PickerOption
                                      key={b.id}
                                      label={b.name}
                                      sub={b.code}
                                      initial={(b.code ?? b.name)?.charAt(0)}
                                      active={
                                          pickedStore?.id ===
                                              currentStore?.id &&
                                          b.id === currentBranch?.id
                                      }
                                      onClick={() => pickBranch(b)}
                                  />
                              ))}
                    </div>
                )}

                {/* Footer hint */}
                <div className="flex items-center gap-2 border-t border-border bg-muted px-4 py-2.5">
                    <p className="text-[11px] text-muted-foreground">
                        {onStoreStep && canPickStore
                            ? "Pilih toko dulu, cabangnya menyusul."
                            : "Tekan Esc untuk menutup."}
                    </p>
                </div>
            </div>
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
    const [modalOpen, setModalOpen] = useState(false);
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

    // Modal dipakai kalau ada pilihan toko (butuh alur 2 langkah) atau kalau
    // daftar cabangnya sudah terlalu panjang untuk dropdown.
    const useModal =
        hasStoreChoice || branches.length > BRANCH_DROPDOWN_LIMIT;

    const toggle = () => {
        if (!clickable) return;

        if (useModal) {
            setOpen(false);
            setModalOpen(true);

            return;
        }

        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + 6,
                left: rect.left,
                width: collapsed ? 220 : Math.max(rect.width, 220),
            });
        }
        setOpen((o) => !o);
    };

    const switchBranch = (branchId) => {
        setOpen(false);
        if (branchId === currentBranch?.id) return;
        router.post(
            route("admin.branch.switch"),
            { branch_id: branchId },
            { preserveState: false },
        );
    };

    const typeCode = storeTypeCode(currentStore);
    const TypeIcon = TYPE_LUCIDE[typeCode] ?? StoreIcon;
    const typeLabel = TYPE_LABEL[typeCode] || typeCode || "Toko";
    const typeColor =
        TYPE_COLOR[typeCode] ||
        "bg-muted text-muted-foreground ring-1 ring-muted";

    const Trigger = clickable ? "button" : "div";

    return (
        <div className={collapsed ? "flex justify-center" : "min-w-0 flex-1"}>
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
                {/* Pasangan bg-primary + text-primary-foreground dipakai supaya
                    kontras ikonnya dijamin di light maupun dark, apa pun preset
                    tema yang aktif. */}
                <span className="flex items-center justify-center rounded-lg h-7 w-7 shrink-0 bg-primary text-primary-foreground">
                    <TypeIcon className="h-4 w-4" strokeWidth={2} />
                </span>
                {!collapsed && (
                    <>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-[13px] font-semibold text-foreground">
                                {currentStore.name}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                {currentBranch && (
                                    <span className="flex min-w-0 items-center gap-1">
                                        <MapPin
                                            className="h-3 w-3 shrink-0"
                                            strokeWidth={2}
                                        />
                                        <span className="truncate">
                                            {currentBranch.name}
                                        </span>
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

            {/* Dropdown ringkas — hanya untuk kasus sedikit cabang & satu toko */}
            {open && clickable && !useModal && (
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
                    <div className="px-3 py-2 border-b border-border">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-popover-foreground/60">
                            Cabang
                        </p>
                    </div>
                    <div className="space-y-0.5 p-1.5">
                        {branches.map((b) => (
                            <PickerOption
                                key={b.id}
                                label={b.name}
                                sub={b.code}
                                initial={(b.code ?? b.name)?.charAt(0)}
                                active={b.id === currentBranch?.id}
                                onClick={() => switchBranch(b.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Modal pemilih — banyak cabang dan/atau multi toko */}
            {clickable && useModal && (
                <WorkspacePickerModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    currentStore={currentStore}
                    currentBranch={currentBranch}
                    branches={branches}
                    userStores={userStores}
                    canPickStore={hasStoreChoice}
                />
            )}
        </div>
    );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function SidebarContent({
    collapsed,
    onNavigate,
    currentStore,
    userStores,
    currentBranch,
    branches,
    canSwitchContext,
}) {
    const modules = useStoreModules();
    const groups = buildNavGroups(modules);
    const { prefs, saveGroupOrder } = useSidebarOrder();
    const [reorderMode, setReorderMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { isDark, preference, setMode } = useTheme();
    const navRef = useRef(null);

    // Terapkan preferensi user: urutan grup, urutan item dalam grup, dan
    // pemindahan item antar grup. Grup/item yang belum pernah diatur user
    // tetap memakai urutan default dari buildNavGroups().
    const orderedGroups = applyCustomLayout(groups, prefs);

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
                        <StoreMark store={currentStore} />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-success ring-2 ring-success/20" />
                    </div>
                    <div
                        className={`min-w-0 leading-tight transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 w-0 overflow-hidden ml-0" : "opacity-100 w-auto"}`}
                    >
                        <span className="block text-[15px] font-bold tracking-tight text-sidebar-foreground whitespace-nowrap">
                            KasirKu
                        </span>
                        <span className="block max-w-[150px] truncate text-[11px] font-medium text-sidebar-foreground/60">
                            {currentStore?.name ?? "Point of Sale System"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Workspace switcher (kiri) + toggle tema (kanan) — satu baris.
                Saat collapsed keduanya ditumpuk vertikal & di-center. */}
            <div
                className={`shrink-0 ${collapsed ? "px-2 pt-3" : "px-4 pt-4"}`}
            >
                <div
                    className={
                        collapsed
                            ? "flex flex-col items-center gap-2"
                            : `flex items-stretch gap-2 ${currentStore ? "" : "justify-end"}`
                    }
                >
                    <WorkspaceSwitcher
                        collapsed={collapsed}
                        currentStore={currentStore}
                        userStores={userStores}
                        currentBranch={currentBranch}
                        branches={branches}
                        canSwitch={canSwitchContext}
                    />
                    <ThemeIconButton
                        isDark={isDark}
                        onToggle={toggleTheme}
                        collapsed={collapsed}
                    />
                </div>
            </div>

            {/* Search */}
            {!collapsed && (
                <div className="px-4 pt-3 pb-1 shrink-0">
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

            {/* Profil user & logout sengaja TIDAK ada di sidebar — semuanya
                dikelola dari dropdown user di topbar. */}
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
        storePlan,
        impersonating,
    } = usePage().props;
    const user = auth?.user;

    const stopImpersonating = () => {
        router.post(route("stop-impersonating"));
    };

    // Metrik plan yang sudah >= ambang near-limit (default 80%) — dipakai
    // untuk banner "mendekati limit plan" di bawah topbar.
    const nearLimitThreshold = storePlan?.near_limit_threshold ?? 80;
    const metricLabels = {
        users: "user",
        branches: "cabang",
        products: "produk",
        transactions: "transaksi bulan ini",
    };
    const nearLimitMetrics = Object.entries(storePlan?.usage ?? {}).filter(
        ([, m]) => m.percentage !== null && m.percentage >= nearLimitThreshold,
    );

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
                <header className="sticky top-0 z-20 flex h-[56px] items-center gap-2.5 border-b border-border bg-sidebar px-4 sm:px-6 shadow-sm">
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
                            <div className="flex items-center">
                                {headerRight}
                            </div>
                        )}

                        {/* Toko & cabang kini dikelola dari sidebar (WorkspaceSwitcher) */}
                        <OfflineIndicator />
                        <NotificationBell />

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
                                {/* Identitas user — satu-satunya tempat nama &
                                    email ditampilkan (sidebar sudah bersih) */}
                                <div className="px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative shrink-0">
                                            <div className="flex items-center justify-center text-sm font-bold text-primary-foreground rounded-lg shadow-sm h-9 w-9 bg-primary">
                                                {user?.name
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-popover bg-success" />
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
                                <div className="my-1.5 border-t border-border" />
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
                                        <LogOut className="h-3.5 w-3.5 text-destructive/70" />
                                        <span className="text-destructive">
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
                    <div className="mx-5 mt-4 rounded-lg border border-success/20 bg-success/10 px-4 py-2.5 text-sm text-success">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-5 mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                        {flash.error}
                    </div>
                )}
                {flash?.warning && (
                    <div className="mx-5 mt-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-2.5 text-sm text-warning">
                        {flash.warning}
                    </div>
                )}

                {/* Banner permanen selama sesi impersonation aktif */}
                {impersonating && (
                    <div className="flex items-center justify-between gap-3 bg-warning px-5 py-2.5 text-sm font-medium text-warning-foreground">
                        <span>
                            🔍 {impersonating.impersonator_name} sedang login
                            sebagai akun ini untuk keperluan support.
                        </span>
                        <button
                            onClick={stopImpersonating}
                            className="shrink-0 rounded-lg bg-warning-foreground/10 px-3 py-1 text-xs font-semibold transition hover:bg-warning-foreground/20"
                        >
                            Kembali ke Developer
                        </button>
                    </div>
                )}

                {/* Banner mendekati limit plan (>= near_limit_threshold, default 80%) */}
                {nearLimitMetrics.length > 0 && (
                    <div className="mx-5 mt-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-2.5 text-sm text-warning">
                        <span className="font-semibold">
                            Mendekati limit paket {storePlan?.label}:
                        </span>{" "}
                        {nearLimitMetrics
                            .map(
                                ([key, m]) =>
                                    `${m.current}/${m.max} ${metricLabels[key] ?? key}`,
                            )
                            .join(" · ")}
                        . Upgrade paket untuk menambah kapasitas.
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
