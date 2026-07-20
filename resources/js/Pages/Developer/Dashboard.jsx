import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, usePage } from "@inertiajs/react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function Dashboard({
    stats,
    recentStores,
    storeRevenues,
    storeTypes,
}) {
    const { allStoreTypes = [] } = usePage().props;

    const getTypeMeta = (code) => {
        return (
            allStoreTypes.find((t) => t.code === code) ?? {
                icon: "🏬",
                label: code,
            }
        );
    };
    const statCards = [
        {
            label: "Total Toko",
            value: stats.total_stores,
            sub: `${stats.active_stores} aktif`,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.375.375 0 01.375.375v1.875c0 .207-.168.375-.375.375H6.75a.375.375 0 01-.375-.375v-1.875A.375.375 0 016.75 18z",
        },
        {
            label: "Total User",
            value: stats.total_users,
            sub: "semua peran",
            color: "text-primary-600",
            bg: "bg-primary-50",
            icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
        },
        {
            label: "Penjualan Hari Ini",
            value: fmt(stats.today_sales),
            sub: "semua toko",
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
        },
        {
            label: "Total Revenue",
            value: fmt(stats.total_revenue),
            sub: "sepanjang waktu",
            color: "text-violet-600",
            bg: "bg-violet-50",
            icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
        },
    ];

    return (
        <DeveloperLayout
            header={
                <h2 className="text-lg font-semibold text-slate-800">
                    Developer Dashboard
                </h2>
            }
        >
            <Head title="Developer Dashboard" />

            {/* Stat Cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {statCards.map((s) => (
                    <div
                        key={s.label}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div
                            className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}
                        >
                            <svg
                                className={`h-5 w-5 ${s.color}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d={s.icon}
                                />
                            </svg>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            {s.label}
                        </p>
                        <p
                            className={`mt-0.5 text-2xl font-bold leading-tight ${s.color}`}
                        >
                            {s.value}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Store Type Distribution */}
            {storeTypes && Object.keys(storeTypes).length > 0 && (
                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                        Distribusi Tipe Toko
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(storeTypes).map(([type, count]) => {
                            const tm = getTypeMeta(type);
                            return (
                                <span
                                    key={type}
                                    className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                                >
                                    <span>{tm.icon}</span>
                                    <span>{tm.label}</span>
                                    <span className="ml-1 rounded-full bg-white/60 px-1.5 py-0.5 font-bold">
                                        {count}
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Toko Terbaru */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Toko Terbaru
                        </h3>
                        <Link
                            href={route("developer.stores.index")}
                            className="text-xs text-primary-600 hover:underline"
                        >
                            Lihat semua →
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {(!recentStores || recentStores.length === 0) && (
                            <p className="px-5 py-8 text-center text-sm text-slate-400">
                                Belum ada toko.
                            </p>
                        )}
                        {recentStores?.map((s) => {
                            const tm = getTypeMeta(s.store_type);
                            return (
                                <Link
                                    key={s.id}
                                    href={route("developer.stores.show", s.id)}
                                    className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">
                                            {tm.icon}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {s.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {s.code} · {s.users_count ?? 0}{" "}
                                                user · {s.sales_count ?? 0}{" "}
                                                transaksi
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                    >
                                        {s.is_active ? "Aktif" : "Nonaktif"}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Revenue per Toko */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Revenue per Toko
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {(!storeRevenues || storeRevenues.length === 0) && (
                            <p className="px-5 py-8 text-center text-sm text-slate-400">
                                Belum ada data transaksi.
                            </p>
                        )}
                        {storeRevenues?.map((s, i) => {
                            const tm = getTypeMeta(s.store_type);
                            return (
                                <Link
                                    key={s.id}
                                    href={route("developer.stores.show", s.id)}
                                    className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                            #{i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {s.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {s.sale_count} transaksi ·{" "}
                                                {tm.icon}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-emerald-600 text-sm">
                                        {fmt(s.revenue)}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                    {
                        label: "Buat Toko Baru",
                        href: route("developer.stores.create"),
                        icon: "🏪",
                        color: "bg-emerald-500",
                    },
                    {
                        label: "Tambah User",
                        href: route("developer.users.create"),
                        icon: "👤",
                        color: "bg-primary-500",
                    },
                    {
                        label: "Kelola Paket",
                        href: route("developer.plans.index"),
                        icon: "📦",
                        color: "bg-violet-500",
                    },
                    {
                        label: "Lihat Cabang",
                        href: route("developer.branches.index"),
                        icon: "🏢",
                        color: "bg-amber-500",
                    },
                ].map((a) => (
                    <Link
                        key={a.label}
                        href={a.href}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
                    >
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.color} text-white text-base`}
                        >
                            {a.icon}
                        </span>
                        {a.label}
                    </Link>
                ))}
            </div>
        </DeveloperLayout>
    );
}
