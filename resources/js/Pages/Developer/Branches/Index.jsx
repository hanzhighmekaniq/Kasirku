import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function Index({ branches = [], stores = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState(null);

    const q = search.trim().toLowerCase();
    const filtered = q
        ? branches.filter(
              (b) =>
                  b.name.toLowerCase().includes(q) ||
                  b.code.toLowerCase().includes(q) ||
                  (b.store?.name ?? "").toLowerCase().includes(q),
          )
        : branches;

    function handleDelete(b) {
        if (!confirm(`Hapus "${b.name}"?`)) return;
        setDeleting(b.id);
        router.delete(route("developer.branches.destroy", b.id), {
            onFinish: () => setDeleting(null),
        });
    }

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">
                        Cabang ({filtered.length})
                    </h2>
                    <Link
                        href={route("developer.branches.create")}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        + Tambah
                    </Link>
                </div>
            }
        >
            <Head title="Cabang" />

            {flash?.success && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            <div className="mb-4">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari cabang..."
                    className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-4xl mb-2">🏢</p>
                        <p className="text-slate-500">Belum ada cabang</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Cabang</th>
                                <th className="px-4 py-3">Toko</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((b, i) => (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-slate-800">{b.name}</p>
                                        <p className="font-mono text-xs text-slate-400">{b.code}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{b.store?.name ?? "-"}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                        }`}>
                                            {b.is_active ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={route("developer.branches.show", b.id)} className="text-xs text-blue-600 hover:underline">Detail</Link>
                                            <Link href={route("developer.branches.edit", b.id)} className="text-xs text-amber-600 hover:underline">Edit</Link>
                                            <button onClick={() => handleDelete(b)} disabled={deleting === b.id} className="text-xs text-red-600 hover:underline disabled:opacity-40">
                                                {deleting === b.id ? "..." : "Hapus"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DeveloperLayout>
    );
}
