import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Show({ branch, store, employees = [] }) {
    const { flash } = usePage().props;

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{branch.name}</h2>
                        <p className="text-xs text-slate-500">{store?.name ?? "-"} — {branch.code}</p>
                    </div>
                    <Link href={route("developer.branches.edit", branch.id)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={branch.name} />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            <div className="mx-auto max-w-4xl space-y-5">
                {/* Info */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl font-bold text-indigo-600">
                            {branch.code?.charAt(0) || "?"}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-slate-900">{branch.name}</h1>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">{branch.code}</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${branch.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                    {branch.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                        {branch.phone && <p>📞 {branch.phone}</p>}
                        {branch.address && <p>📍 {branch.address}</p>}
                    </div>
                </div>

                {/* Employees */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Karyawan ({employees.length})</h3>
                    {employees.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Posisi</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Akun</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map((e) => (
                                    <tr key={e.id}>
                                        <td className="px-4 py-3 font-medium text-slate-800">{e.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{e.position || "-"}</td>
                                        <td className="px-4 py-3">{e.user ? `${e.user.name} (${e.user.email})` : <span className="text-slate-400">-</span>}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                {e.is_active ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="py-8 text-center text-sm text-slate-400">Belum ada karyawan</p>
                    )}
                </div>

                <Link href={route("developer.branches.index")} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    ← Kembali
                </Link>
            </div>
        </DeveloperLayout>
    );
}
