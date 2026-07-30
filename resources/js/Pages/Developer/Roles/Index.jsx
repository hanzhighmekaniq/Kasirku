import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Banknote,
    Calendar,
    ChefHat,
    ChevronDown,
    CircleCheck,
    ClipboardList,
    Clock,
    CreditCard,
    Factory,
    Gift,
    LayoutDashboard,
    Loader2,
    Package,
    Pin,
    Plus,
    RotateCcw,
    Settings,
    ShoppingCart,
    Table2,
    Ticket,
    TrendingUp,
    TriangleAlert,
    Truck,
    User,
    Users,
    Wallet,
} from "lucide-react";

// ── Group permission berdasarkan prefix ─────────────────────────────────────────
const GROUP_META = {
    dashboard: { label: "Dashboard", Icon: LayoutDashboard, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    sale: { label: "Penjualan / POS", Icon: ShoppingCart, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    product: { label: "Produk", Icon: Package, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    stock: { label: "Stok", Icon: ClipboardList, cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
    purchase: { label: "Pembelian", Icon: Truck, cls: "bg-primary/10 text-primary" },
    supplier: { label: "Supplier", Icon: Factory, cls: "bg-muted text-foreground" },
    customer: { label: "Pelanggan", Icon: User, cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
    membership: { label: "Membership", Icon: CreditCard, cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
    employee: { label: "Karyawan", Icon: Users, cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    commission: { label: "Komisi", Icon: Wallet, cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    expense: { label: "Pengeluaran", Icon: Banknote, cls: "bg-destructive/10 text-destructive" },
    promotion: { label: "Promo & Diskon", Icon: Gift, cls: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
    table: { label: "Manajemen Meja", Icon: Table2, cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
    kitchen: { label: "Kitchen Display", Icon: ChefHat, cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    queue: { label: "Antrian", Icon: Ticket, cls: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400" },
    booking: { label: "Booking / Reservasi", Icon: Calendar, cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
    shift: { label: "Shift Kasir", Icon: Clock, cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    report: { label: "Laporan", Icon: TrendingUp, cls: "bg-success/10 text-success" },
    setting: { label: "Pengaturan", Icon: Settings, cls: "bg-muted text-muted-foreground" },
};

function getGroupMeta(group) {
    return GROUP_META[group] || { label: group, Icon: Pin, cls: "bg-muted text-muted-foreground" };
}

// ── Role style ─────────────────────────────────────────────────────────────────
const ROLE_STYLE = {
    owner: { cls: "border-amber-200 bg-amber-100/30 dark:border-amber-800 dark:bg-amber-900/20", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    admin: { cls: "border-violet-200 bg-violet-100/30 dark:border-violet-800 dark:bg-violet-900/20", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
    supervisor: { cls: "border-blue-200 bg-blue-100/30 dark:border-blue-800 dark:bg-blue-900/20", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    kasir: { cls: "border-sky-200 bg-sky-100/30 dark:border-sky-800 dark:bg-sky-900/20", badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
    gudang: { cls: "border-teal-200 bg-teal-100/30 dark:border-teal-800 dark:bg-teal-900/20", badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
    kitchen: { cls: "border-orange-200 bg-orange-100/30 dark:border-orange-800 dark:bg-orange-900/20", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

// ── Permission Group Component ──────────────────────────────────────────────────
function PermGroup({ group, permissions, selectedIds, onToggle, onToggleAll }) {
    const meta = getGroupMeta(group);
    const groupPerms = permissions.filter((p) => p.group === group);
    if (groupPerms.length === 0) return null;

    const allSelected = groupPerms.every((p) => selectedIds.includes(p.id));
    const someSelected = groupPerms.some((p) => selectedIds.includes(p.id));

    return (
        <div className="rounded-xl border border-border bg-card text-card-foreground p-3">
            <div className="mb-2 flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => el && (el.indeterminate = !allSelected && someSelected)}
                        onChange={() => onToggleAll(group, groupPerms.map((p) => p.id))}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-ring/20"
                    />
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}>
                        <meta.Icon className="h-3 w-3" strokeWidth={2} />
                        {meta.label}
                    </span>
                </label>
                <span className="text-xs text-muted-foreground">
                    {groupPerms.filter((p) => selectedIds.includes(p.id)).length}/{groupPerms.length}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                {groupPerms.map((p) => (
                    <label
                        key={p.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs transition select-none ${
                            selectedIds.includes(p.id)
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => onToggle(p.id)}
                            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-ring/20"
                        />
                        {p.name.split(".").slice(1).join(".")}
                    </label>
                ))}
            </div>
        </div>
    );
}

// ── Role Card Component ─────────────────────────────────────────────────────────
function RoleCard({ role, allPermissions, onSave, saving }) {
    const [selectedIds, setSelectedIds] = useState([...role.permission_ids]);
    const [expanded, setExpanded] = useState(false);
    const [dirty, setDirty] = useState(false);

    const style = ROLE_STYLE[role.name] || {
        cls: "border-border bg-card",
        badge: "bg-muted text-muted-foreground",
    };

    const toggle = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
        setDirty(true);
    };

    const toggleAll = (group, ids) => {
        const allSelected = ids.every((id) => selectedIds.includes(id));
        setSelectedIds((prev) =>
            allSelected ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])],
        );
        setDirty(true);
    };

    const handleSave = () => {
        onSave(role.id, selectedIds, () => setDirty(false));
    };

    const groups = [...new Set(allPermissions.map((p) => p.group))].sort();

    return (
        <div className={`rounded-2xl border-2 ${style.cls} overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground capitalize">{role.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                            {role.is_system ? "System" : "Custom"}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{role.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {selectedIds.length} permission
                    </span>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <ChevronDown
                            className={`h-5 w-5 transition ${expanded ? "rotate-180" : ""}`}
                            strokeWidth={1.8}
                        />
                    </button>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-border bg-card text-card-foreground px-5 py-4">
                    <div className="space-y-3">
                        {groups.map((group) => (
                            <PermGroup
                                key={group}
                                group={group}
                                permissions={allPermissions}
                                selectedIds={selectedIds}
                                onToggle={toggle}
                                onToggleAll={toggleAll}
                            />
                        ))}
                    </div>
                    {dirty && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan Perubahan"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Index({ stores, selectedStore, roles, allPermissions }) {
    const { flash } = usePage().props;
    const [savingRoleId, setSavingRoleId] = useState(null);
    const [resetting, setResetting] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    const handleStoreChange = (storeId) => {
        router.get(
            route("developer.roles.index"),
            { store_id: storeId || undefined },
            { preserveState: false, preserveScroll: false },
        );
    };

    const handleSaveRole = (roleId, permissionIds, onDone) => {
        setSavingRoleId(roleId);
        router.post(
            route("developer.roles.update"),
            {
                store_id: selectedStore.id,
                role_id: roleId,
                permission_ids: permissionIds,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setSavingRoleId(null);
                    onDone();
                },
            },
        );
    };

    const handleReset = () => {
        setResetting(true);
        router.post(
            route("developer.roles.reset"),
            { store_id: selectedStore.id },
            {
                preserveScroll: true,
                onFinish: () => {
                    setResetting(false);
                    setShowResetModal(false);
                },
            },
        );
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">Role & Permission</h2>
                    {selectedStore && (
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2 text-sm font-medium text-warning transition hover:bg-warning/20"
                        >
                            <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
                            Reset ke Default
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Role & Permission" />

            <div className="space-y-6">
                {/* Flash message */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                        <CircleCheck className="h-5 w-5 shrink-0" strokeWidth={2} />
                        {flash.success}
                    </div>
                )}

                {/* Store Selector */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="border-b border-border bg-muted/60 px-6 py-4">
                        <h3 className="text-sm font-semibold text-foreground">Pilih Toko</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Pilih toko untuk melihat dan mengatur role & permission.
                        </p>
                    </div>
                    <div className="p-6">
                        <select
                            value={selectedStore?.id ?? ""}
                            onChange={(e) => handleStoreChange(e.target.value)}
                            className="block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20 sm:max-w-md"
                        >
                            <option value="">— Pilih Toko —</option>
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code}) — {s.store_type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Roles */}
                {selectedStore && (
                    <>
                        {roles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card text-card-foreground px-6 py-16 text-center shadow-sm">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                    <Users className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-foreground">Belum ada role</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Role untuk toko ini belum dibuat. Klik "Reset ke Default" untuk membuat role sistem.
                                </p>
                                <button
                                    onClick={() => setShowResetModal(true)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                                    Buat Role Default
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {roles.map((role) => (
                                    <RoleCard
                                        key={role.id}
                                        role={role}
                                        allPermissions={allPermissions}
                                        onSave={handleSaveRole}
                                        saving={savingRoleId === role.id}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {!selectedStore && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card text-card-foreground px-6 py-16 text-center shadow-sm">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                            <User className="h-8 w-8 text-primary" strokeWidth={1.5} />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">Pilih toko terlebih dahulu</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Pilih toko dari dropdown di atas untuk melihat role & permission.
                        </p>
                    </div>
                )}
            </div>

            {/* Reset Confirmation Modal */}
            {showResetModal && selectedStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        onClick={() => !resetting && setShowResetModal(false)}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl sm:p-7">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning/10">
                                <TriangleAlert className="h-6 w-6 text-warning" strokeWidth={1.8} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-foreground">Reset role ke default?</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Semua role untuk toko <strong>{selectedStore.name}</strong> akan di-reset ke pengaturan default. <strong>Role custom akan hilang.</strong>
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setShowResetModal(false)}
                                disabled={resetting}
                                className="inline-flex justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={resetting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-warning px-4 py-2.5 text-sm font-semibold text-warning-foreground shadow-sm transition hover:bg-warning/90 disabled:opacity-60"
                            >
                                {resetting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Mereset...
                                    </>
                                ) : (
                                    "Ya, Reset"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DeveloperLayout>
    );
}
