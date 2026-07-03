import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const STORE_TYPE_ICON = {
    retail: '🏪', fnb: '☕', service: '✂️', laundry: '👕',
    rental: '🔑', parking: '🅿️', session: '🖥️',
    minimarket: '🏪', cafe: '☕', booth_coffee: '🧋',
};

export default function Index({ users, stores }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); // all | developer | store_user
    const [deleting, setDeleting] = useState(null);

    const filtered = users.filter((u) => {
        const matchSearch = !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchType =
            filterType === 'all' ||
            (filterType === 'developer' && u.is_developer) ||
            (filterType === 'store_user' && !u.is_developer);
        return matchSearch && matchType;
    });

    const handleDelete = (user) => {
        if (!confirm(`Hapus user "${user.name}" (${user.email})?`)) return;
        setDeleting(user.id);
        router.delete(route('developer.users.destroy', user.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Kelola User</h2>
                        <p className="text-xs text-slate-500">{users.length} user terdaftar</p>
                    </div>
                    <Link href={route('developer.users.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Tambah User
                    </Link>
                </div>
            }
        >
            <Head title="Kelola User" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    ✅ {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    ❌ {flash.error}
                </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Cari nama atau email..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                </div>
                <div className="flex gap-2">
                    {[['all','Semua'], ['developer','Developer'], ['store_user','Store User']].map(([v, l]) => (
                        <button key={v} onClick={() => setFilterType(v)}
                            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${filterType === v ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <span className="mb-3 text-5xl">👤</span>
                        <p className="font-semibold text-slate-800">Tidak ada user ditemukan</p>
                        <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau kata kunci pencarian.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5">User</th>
                                    <th className="px-5 py-3.5">Tipe</th>
                                    <th className="px-5 py-3.5">Toko & Peran</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((u) => (
                                    <tr key={u.id} className="transition hover:bg-slate-50/70">
                                        {/* User info */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${u.is_developer ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{u.name}</p>
                                                    <p className="text-xs text-slate-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Tipe */}
                                        <td className="px-5 py-4">
                                            {u.is_developer ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                                    <span>⚡</span> Developer
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                    <span>👤</span> Store User
                                                </span>
                                            )}
                                        </td>
                                        {/* Toko */}
                                        <td className="px-5 py-4">
                                            {u.is_developer ? (
                                                <span className="text-xs text-slate-400 italic">Akses semua toko</span>
                                            ) : u.stores?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {u.stores.map((s) => (
                                                        <Link key={s.id} href={route('developer.stores.show', s.id)}
                                                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                                                            {STORE_TYPE_ICON[s.store_type] ?? '🏬'} {s.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-slate-400">Belum ada toko</span>
                                            )}
                                        </td>
                                        {/* Aksi */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={route('developer.users.show', u.id)} title="Detail"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
                                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </Link>
                                                <Link href={route('developer.users.edit', u.id)} title="Edit"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600">
                                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                    </svg>
                                                </Link>
                                                <button onClick={() => handleDelete(u)} disabled={deleting === u.id} title="Hapus"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DeveloperLayout>
    );
}
