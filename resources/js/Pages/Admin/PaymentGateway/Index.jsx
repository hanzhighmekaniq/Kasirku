import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { ArrowLeftRight, CreditCard, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";

const PROVIDER_META = {
    midtrans: {
        label: "Midtrans",
        gradient: "from-green-500 to-teal-600",
        ring: "ring-green-200",
        bg: "bg-green-50",
        text: "text-green-700",
        iconBg: "bg-green-100",
        iconText: "text-green-600",
        desc: "QRIS, GoPay, VA Bank, Gerai Retail",
        logo: "🟢",
    },
    xendit: {
        label: "Xendit",
        gradient: "from-purple-500 to-indigo-600",
        ring: "ring-purple-200",
        bg: "bg-purple-50",
        text: "text-purple-700",
        iconBg: "bg-purple-100",
        iconText: "text-purple-600",
        desc: "QRIS, VA, E-Wallet, Kartu Kredit",
        logo: "🟣",
    },
    doku: {
        label: "DOKU",
        gradient: "from-blue-500 to-cyan-600",
        ring: "ring-blue-200",
        bg: "bg-blue-50",
        text: "text-blue-700",
        iconBg: "bg-blue-100",
        iconText: "text-blue-600",
        desc: "QRIS, VA, Transfer Bank",
        logo: "🔵",
    },
    duitku: {
        label: "Duitku",
        gradient: "from-orange-500 to-red-500",
        ring: "ring-orange-200",
        bg: "bg-orange-50",
        text: "text-orange-700",
        iconBg: "bg-orange-100",
        iconText: "text-orange-600",
        desc: "QRIS, VA, Gerai Retail, E-Wallet",
        logo: "🟠",
    },
};

const METHOD_LABELS = {
    qris: { label: "QRIS", icon: "📱" },
    gopay: { label: "GoPay", icon: "🟢" },
    shopeepay: { label: "ShopeePay", icon: "🟠" },
    dana: { label: "DANA", icon: "🔵" },
    ovo: { label: "OVO", icon: "🟣" },
    bca_va: { label: "BCA", icon: "🏦" },
    mandiri_va: { label: "Mandiri", icon: "🏦" },
    bri_va: { label: "BRI", icon: "🏦" },
    bni_va: { label: "BNI", icon: "🏦" },
    permata_va: { label: "Permata", icon: "🏦" },
};

const PROVIDER_METHODS = {
    midtrans: [
        "qris",
        "gopay",
        "shopeepay",
        "dana",
        "ovo",
        "bca_va",
        "mandiri_va",
        "bri_va",
        "bni_va",
        "permata_va",
    ],
    xendit: [
        "qris",
        "bca_va",
        "mandiri_va",
        "bri_va",
        "bni_va",
        "gopay",
        "ovo",
        "dana",
    ],
    doku: ["qris", "bca_va", "mandiri_va", "bri_va", "bni_va", "permata_va"],
    duitku: [
        "qris",
        "bca_va",
        "mandiri_va",
        "bri_va",
        "bni_va",
        "gopay",
        "ovo",
        "shopeepay",
    ],
};

export default function Index({ gateways = [], stats = {} }) {
    const { flash } = usePage().props;
    const [toggling, setToggling] = useState(null);

    const handleToggle = (gateway) => {
        setToggling(gateway.id);
        router.patch(
            route("admin.payment-gateway.toggle", {
                store_payment_gateway: gateway.id,
            }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setToggling(null),
            },
        );
    };

    const [deleting, setDeleting] = useState(null);

    const handleToggleEnv = (gateway) => {
        router.patch(
            route("admin.payment-gateway.toggle-env", {
                store_payment_gateway: gateway.id,
            }),
            {},
            { preserveScroll: true },
        );
    };

    const confirmDelete = () => {
        if (!deleting) return;
        router.delete(
            route("admin.payment-gateway.destroy", {
                store_payment_gateway: deleting.id,
            }),
            { preserveScroll: true, onFinish: () => setDeleting(null) },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Payment Gateway
                        </h2>
                        <p className="text-sm text-slate-400">
                            Konfigurasi gateway pembayaran online
                        </p>
                    </div>
                    <Link
                        href={route("admin.payment-gateway.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">Tambah Gateway</span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title="Payment Gateway" />

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

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">
                        Total Gateway
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                        {stats.total ?? gateways.length}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Aktif</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                        {stats.active ?? 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">
                        Nonaktif
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                        {stats.inactive ?? 0}
                    </p>
                </div>
            </div>

            {/* Gateway Cards */}
            {gateways.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <CreditCard
                            className="h-8 w-8 text-slate-400"
                            strokeWidth={1.4}
                        />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-600">
                        Belum ada payment gateway
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Tambahkan gateway untuk menerima pembayaran online
                    </p>
                    <Link
                        href={route("admin.payment-gateway.create")}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Tambah Gateway
                    </Link>
                </div>
            ) : (
                <div className="p-2 lg:p-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {gateways.map((gw) => {
                        const meta = PROVIDER_META[gw.provider] ?? {};
                        const allMethods = PROVIDER_METHODS[gw.provider] ?? [];
                        const enabledSet = new Set(gw.enabled_methods ?? []);
                        const enabledCount = enabledSet.size;

                        return (
                            <div
                                key={gw.id}
                                className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                                    gw.is_active
                                        ? "border-slate-200/80"
                                        : "border-slate-200/80 opacity-60 grayscale hover:opacity-80 hover:grayscale-0"
                                }`}
                            >
                                {/* Decorative gradient accent bar */}
                                <div
                                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.gradient ?? "from-slate-400 to-slate-500"}`}
                                />

                                {/* Card Header */}
                                <div className="relative px-5 pt-5 pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Provider icon */}
                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient ?? "from-slate-400 to-slate-500"} text-xl shadow-md shadow-slate-200/50 ring-1 ring-white/20`}
                                            >
                                                <CreditCard
                                                    className="h-6 w-6 text-white"
                                                    strokeWidth={1.6}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-base font-bold text-slate-800">
                                                    {meta.label}
                                                </h3>
                                                <p className="text-xs text-slate-400">
                                                    {meta.desc}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status + Env badges */}
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
                                                    gw.is_active
                                                        ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                                                        : "bg-slate-100 text-slate-500 ring-slate-200"
                                                }`}
                                            >
                                                <span className={`relative flex h-2 w-2 ${
                                                    gw.is_active ? "" : ""
                                                }`}>
                                                    {gw.is_active && (
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                    )}
                                                    <span className={`relative inline-flex h-2 w-2 rounded-full ${gw.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                </span>
                                                {gw.is_active ? "Aktif" : "Nonaktif"}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${
                                                    gw.environment === "production"
                                                        ? "bg-amber-50 text-amber-600 ring-amber-200"
                                                        : "bg-sky-50 text-sky-600 ring-sky-200"
                                                }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                    gw.environment === "production" ? "bg-amber-400" : "bg-sky-400"
                                                }`} />
                                                {gw.environment === "production" ? "Production" : "Sandbox"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="mx-5 border-t border-slate-100" />

                                {/* Methods */}
                                <div className="px-5 py-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                            Metode
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                            {enabledCount}/{allMethods.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allMethods.map((key) => {
                                            const m = METHOD_LABELS[key] ?? {
                                                label: key,
                                                icon: "💳",
                                            };
                                            const enabled = enabledSet.has(key);
                                            return (
                                                <span
                                                    key={key}
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                                                        enabled
                                                            ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60"
                                                            : "bg-slate-50 text-slate-400 ring-1 ring-slate-100"
                                                    }`}
                                                >
                                                    <span className="text-xs">{m.icon}</span>
                                                    {m.label}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    {gw.merchant_id && (
                                        <div className="mt-3 flex items-center gap-1.5">
                                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                                Merchant
                                            </span>
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                                                {gw.merchant_id}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer — Actions */}
                                <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
                                    <button
                                        onClick={() => handleToggle(gw)}
                                        disabled={toggling === gw.id}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                            gw.is_active
                                                ? "bg-amber-50 text-amber-600 hover:bg-amber-100 hover:shadow-sm"
                                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:shadow-sm"
                                        }`}
                                        title={
                                            gw.is_active
                                                ? "Nonaktifkan"
                                                : "Aktifkan"
                                        }
                                    >
                                        {gw.is_active ? (
                                            <>
                                                <PowerOff
                                                    className="h-3.5 w-3.5"
                                                    strokeWidth={2}
                                                />{" "}
                                                Nonaktifkan
                                            </>
                                        ) : (
                                            <>
                                                <Power
                                                    className="h-3.5 w-3.5"
                                                    strokeWidth={2}
                                                />{" "}
                                                Aktifkan
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleToggleEnv(gw)}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                            gw.environment === "production"
                                                ? "bg-amber-50 text-amber-600 hover:bg-amber-100 hover:shadow-sm"
                                                : "bg-sky-50 text-sky-600 hover:bg-sky-100 hover:shadow-sm"
                                        }`}
                                        title={gw.environment === "production" ? "Switch ke Sandbox" : "Switch ke Production"}
                                    >
                                        <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2} />
                                        <span className="hidden sm:inline">{gw.environment === "production" ? "Sandbox" : "Production"}</span>
                                    </button>
                                    <Link
                                        href={route(
                                            "admin.payment-gateway.edit",
                                            { store_payment_gateway: gw.id },
                                        )}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-200 hover:shadow-sm"
                                    >
                                        <Pencil
                                            className="h-3.5 w-3.5"
                                            strokeWidth={2}
                                        />
                                    </Link>
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => setDeleting(gw)}
                                        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
                                    >
                                        <Trash2
                                            className="h-3.5 w-3.5"
                                            strokeWidth={2}
                                        />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleting && (
                <DeleteModal
                    gateway={deleting}
                    onConfirm={confirmDelete}
                    onClose={() => setDeleting(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

function DeleteModal({ gateway, onConfirm, onClose }) {
    const meta = PROVIDER_META[gateway.provider] ?? {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-md transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 sm:p-7"
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">Hapus gateway?</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">{meta.label}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        {gateway.merchant_id && (
                            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                                Merchant: {gateway.merchant_id}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex justify-center rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}
