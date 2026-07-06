import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Show({ branch, store, employees = [] }) {
    const { flash } = usePage().props;

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {branch.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {store?.name ?? "-"} — {branch.code}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href={route("developer.branches.edit", branch.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.7}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                />
                            </svg>
                            Edit
                        </Link>
                        <Link
                            href={route("developer.branches.index")}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            ← Kembali
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={branch.name} />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                    </svg>
                    {flash.error}
                </div>
            )}

            <div className="mx-auto max-w-4xl space-y-5">
                {/* Info Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-600 shadow-sm">
                            {branch.code?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-bold text-slate-900">
                                    {branch.name}
                                </h1>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs text-slate-500">
                                    {branch.code}
                                </span>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        branch.is_active
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {branch.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                            </div>
                            {(branch.phone || branch.address) && (
                                <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                                    {branch.phone && (
                                        <p className="flex items-center gap-1.5">
                                            <span className="text-base">
                                                📞
                                            </span>{" "}
                                            {branch.phone}
                                        </p>
                                    )}
                                    {branch.address && (
                                        <p className="flex items-center gap-1.5">
                                            <span className="text-base">
                                                📍
                                            </span>{" "}
                                            {branch.address}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Employees */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
                        <h3 className="text-sm font-bold text-slate-900">
                            Karyawan
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            {employees.length}
                        </span>
                    </div>
                    {employees.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-6 py-3">Nama</th>
                                    <th className="px-6 py-3">Posisi</th>
                                    <th className="px-6 py-3">Akun</th>
                                    <th className="px-6 py-3 text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map((e) => (
                                    <tr
                                        key={e.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                                            {e.name}
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            {e.position || "-"}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            {e.user ? (
                                                <span className="text-slate-700">
                                                    {e.user.name}{" "}
                                                    <span className="text-xs text-slate-400">
                                                        ({e.user.email})
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    e.is_active
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                {e.is_active
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center py-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl mb-3">
                                👤
                            </div>
                            <p className="text-sm font-medium text-slate-500">
                                Belum ada karyawan
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Karyawan akan muncul saat ditugaskan ke cabang
                                ini
                            </p>
                        </div>
                    )}
                </div>

                <Link
                    href={route("developer.branches.index")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    ← Kembali
                </Link>
            </div>
        </DeveloperLayout>
    );
}
