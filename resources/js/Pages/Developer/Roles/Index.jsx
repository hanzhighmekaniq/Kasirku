import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";

// ── Group permission berdasarkan prefix ─────────────────────────────────────────
const GROUP_META = {
    dashboard: { label: "Dashboard", icon: "📊", cls: "bg-blue-50 text-blue-700" },
    sale: { label: "Penjualan / POS", icon: "🛒", cls: "bg-emerald-50 text-emerald-700" },
    product: { label: "Produk", icon: "📦", cls: "bg-amber-50 text-amber-700" },
    stock: { label: "Stok", icon: "📋", cls: "bg-teal-50 text-teal-700" },
    purchase: { label: "Pembelian", icon: "🚚", cls: "bg-primary-50 text-primary-700" },
    supplier: { label: "Supplier", icon: "🏭", cls: "bg-slate-100 text-slate-700" },
    customer: { label: "Pelanggan", icon: "👤", cls: "bg-violet-50 text-violet-700" },
    membership: { label: "Membership", icon: "💳", cls: "bg-rose-50 text-rose-700" },
    employee: { label: "Karyawan", icon: "👥", cls: "bg-orange-50 text-orange-700" },
    commission: { label: "Komisi", icon: "💰", cls: "bg-yellow-50 text-yellow-700" },
    expense: { label: "Pengeluaran", icon: "💸", cls: "bg-red-50 text-red-700" },
    promotion: { label: "Promo & Diskon", icon: "🎁", cls: "bg-pink-50 text-pink-700" },
    table: { label: "Manajemen Meja", icon: "🪑", cls: "bg-cyan-50 text-cyan-700" },
    kitchen: { label: "Kitchen Display", icon: "🍳", cls: "bg-orange-50 text-orange-700" },
    queue: { label: "Antrian", icon: "🎫", cls: "bg-lime-50 text-lime-700" },
    booking: { label: "Booking / Reservasi", icon: "📅", cls: "bg-sky-50 text-sky-700" },
    shift: { label: "Shift Kasir", icon: "🕐", cls: "bg-purple-50 text-purple-700" },
    report: { label: "Laporan", icon: "📈", cls: "bg-green-50 text-green-700" },
    setting: { label: "Pengaturan", icon: "⚙️", cls: "bg-gray-100 text-gray-700" },
};

function getGroupMeta(group) {
    return GROUP_META[group] || { label: group, icon: "📌", cls: "bg-slate-50 text-slate-600" };
}

// ── Role style ─────────────────────────────────────────────────────────────────
const ROLE_STYLE = {
    owner: { cls: "border-amber-200 bg-amber-50/30", badge: "bg-amber-100 text-amber-700" },
    admin: { cls: "border-violet-200 bg-violet-50/30", badge: "bg-violet-100 text-violet-700" },
    supervisor: { cls: "border-blue-200 bg-blue-50/30", badge: "bg-blue-100 text-blue-700" },
    kasir: { cls: "border-sky-200 bg-sky-50/30", badge: "bg-sky-100 text-sky-700" },
    gudang: { cls: "border-teal-200 bg-teal-50/30", badge: "bg-teal-100 text-teal-700" },
    kitchen: { cls: "border-orange-200 bg-orange-50/30", badge: "bg-orange-100 text-orange-700" },
};

// ── Permission Group Component ──────────────────────────────────────────────────
function PermGroup({ group, permissions, selectedIds, onToggle, onToggleAll }) {
    const meta = getGroupMeta(group);
    const groupPerms = permissions.filter((p) => p.group === group);
    if (groupPerms.length === 0) return null;

    const allSelected = groupPerms.every((p) => selectedIds.includes(p.id));
    const someSelected = groupPerms.some((p) => selectedIds.includes(p.id));

    return (
        <div className="rounded-xl border border-slate-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => el && (el.indeterminate = !allSelected && someSelected)}
                        onChange={() => onToggleAll(group, groupPerms.map((p) => p.id))}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}>
                        {meta.icon} {meta.label}
                    </span>
                </label>
                <span className="text-xs text-slate-400">
                    {groupPerms.filter((p) => selectedIds.includes(p.id)).length}/{groupPerms.length}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                {groupPerms.map((p) => (
                    <label
                        key={p.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs transition select-none ${
                            selectedIds.includes(p.id)
                                ? "bg-primary-50 text-primary-700"
                                : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => onToggle(p.id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
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
        cls: "border-slate-200 bg-white",
        badge: "bg-slate-100 text-slate-600",
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
                        <h3 className="text-base font-bold text-slate-800 capitalize">{role.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                            {role.is_system ? "System" : "Custom"}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{role.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                        {selectedIds.length} permission
                    </span>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg
                            className={`h-5 w-5 transition ${expanded ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-slate-200 bg-white px-5 py-4">
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
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60"
                            >
                                {saving ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
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
                    <h2 className="text-lg font-semibold text-slate-800">Role & Permission</h2>
                    {selectedStore && (
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                            </svg>
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
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {flash.success}
                    </div>
                )}

                {/* Store Selector */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-800">Pilih Toko</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Pilih toko untuk melihat dan mengatur role & permission.
                        </p>
                    </div>
                    <div className="p-6">
                        <select
                            value={selectedStore?.id ?? ""}
                            onChange={(e) => handleStoreChange(e.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:max-w-md"
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
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-slate-800">Belum ada role</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Role untuk toko ini belum dibuat. Klik "Reset ke Default" untuk membuat role sistem.
                                </p>
                                <button
                                    onClick={() => setShowResetModal(true)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
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
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                            <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">Pilih toko terlebih dahulu</h3>
                        <p className="mt-1 text-sm text-slate-500">
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
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-slate-900">Reset role ke default?</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Semua role untuk toko <strong>{selectedStore.name}</strong> akan di-reset ke pengaturan default. <strong>Role custom akan hilang.</strong>
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setShowResetModal(false)}
                                disabled={resetting}
                                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={resetting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/30 transition hover:bg-amber-700 disabled:opacity-60"
                            >
                                {resetting ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
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
