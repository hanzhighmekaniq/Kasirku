import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const STORE_TYPE = {
    retail:      { label: 'Retail',        icon: '🏪', cls: 'bg-blue-50 text-blue-700' },
    fnb:         { label: 'FnB / Cafe',    icon: '☕', cls: 'bg-orange-50 text-orange-700' },
    service:     { label: 'Service',       icon: '✂️', cls: 'bg-violet-50 text-violet-700' },
    rental:      { label: 'Rental',        icon: '🔑', cls: 'bg-yellow-50 text-yellow-700' },
    ticket:      { label: 'Tiket',         icon: '🎟️', cls: 'bg-rose-50 text-rose-700' },
    hospitality: { label: 'Hospitality',   icon: '🏨', cls: 'bg-amber-50 text-amber-700' },
    // backward compat
    laundry: { label: 'Service', icon: '👕', cls: 'bg-violet-50 text-violet-700' },
    parking: { label: 'Parkir',  icon: '🅿️', cls: 'bg-slate-50 text-slate-700' },
    session: { label: 'Rental',  icon: '🖥️', cls: 'bg-yellow-50 text-yellow-700' },
};

export default function Index({ stores }) {
    const { flash } = usePage().props;
    const [deleting, setDeleting] = useState(null);

    const handleDelete = (store) => {
        if (!confirm(`Hapus toko "${store.name}"? Semua data terkait akan ikut terhapus.`)) return;
        setDeleting(store.id);
        router.delete(route('developer.stores.destroy', store.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Kelola Toko</h2>
                    <Link href={route('developer.stores.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:to-teal-700">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Tambah Toko
                    </Link>
                </div>
            }
        >
            <Head title="Kelola Toko" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {flash.success}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {stores.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <span className="text-5xl mb-4">🏬</span>
                        <p className="text-base font-semibold text-slate-800">Belum ada toko</p>
                        <p className="text-sm text-slate-500 mt-1">Mulai dengan menambahkan toko pertama.</p>
                        <Link href={route('developer.stores.create')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:to-teal-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Tambah Toko
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5">Toko</th>
                                    <th className="px-5 py-3.5">Tipe</th>
                                    <th className="px-5 py-3.5 text-center">User</th>
                                    <th className="px-5 py-3.5 text-center">Cabang</th>
                                    <th className="px-5 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stores.map((s) => {
                                    const tm = STORE_TYPE[s.store_type] ?? { label: s.store_type, icon: '🏬', cls: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <tr key={s.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">{tm.icon}</span>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{s.name}</p>
                                                        <p className="text-xs font-mono text-slate-400">{s.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tm.cls}`}>{tm.label}</span>
                                            </td>
                                            <td className="px-5 py-4 text-center text-slate-600">{s.users_count ?? 0}</td>
                                            <td className="px-5 py-4 text-center text-slate-600">{s.branches_count ?? 0}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {s.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('developer.stores.show', s.id)} title="Detail"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </Link>
                                                    <Link href={route('developer.stores.branches.index', s.id)} title="Kelola Cabang" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v4.099" /></svg>
                                                    </Link>
                                                    <Link href={route('developer.stores.edit', s.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                                    </Link>
                                                    <button onClick={() => handleDelete(s)} disabled={deleting === s.id} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DeveloperLayout>
    );
}
