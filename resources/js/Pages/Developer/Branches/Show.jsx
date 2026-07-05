import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const TYPE_LABEL = {
    retail: 'Retail',
    fnb: 'FnB / Cafe',
    service: 'Service',
    rental: 'Rental',
    ticket: 'Tiket',
    hospitality: 'Hospitality',
    laundry: 'Service',
    parking: 'Parkir',
    session: 'Rental',
};

export default function BranchShow({ store, branch, employees }) {
    const { flash } = usePage().props;

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {branch.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {store.name} — Cabang
                        </p>
                    </div>
                    <Link
                        href={route('developer.stores.branches.edit', [store, branch])}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={`${branch.name} — ${store.name}`} />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {flash.success}
                </div>
            )}

            <div className="mx-auto max-w-4xl space-y-5">
                {/* Branch Info Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl font-bold text-indigo-600">
                                {branch.code?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-slate-900">{branch.name}</h1>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">
                                        {branch.code}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${branch.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {branch.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Toko: <Link href={route('developer.stores.show', store.id)} className="font-medium text-indigo-600 hover:underline">{store.name}</Link>
                                    <span className="ml-2 text-slate-400">({TYPE_LABEL[store.store_type] || store.store_type})</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                            <p className="text-xl font-bold text-slate-800">{employees.length}</p>
                            <p className="text-xs text-slate-500">Karyawan</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                            <p className="text-xl font-bold text-slate-800">{employees.filter(e => e.user).length}</p>
                            <p className="text-xs text-slate-500">Punya Akun</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                            <p className="text-xl font-bold text-slate-800">{employees.filter(e => e.is_active).length}</p>
                            <p className="text-xs text-slate-500">Aktif</p>
                        </div>
                    </div>

                    {/* Branch Details */}
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                        {branch.phone && (
                            <p className="flex items-center gap-2">
                                <span className="text-slate-400">📞</span>
                                {branch.phone}
                            </p>
                        )}
                        {branch.address && (
                            <p className="flex items-center gap-2">
                                <span className="text-slate-400">📍</span>
                                {branch.address}
                            </p>
                        )}
                    </div>
                </div>

                {/* Employees List */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Karyawan & User Terhubung
                        </h3>
                        <span className="text-xs text-slate-400">
                            {employees.length} karyawan
                        </span>
                    </div>

                    {employees.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-100 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nama</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Posisi</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Akun User</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Telepon</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{emp.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{emp.position || '-'}</td>
                                            <td className="px-4 py-3">
                                                {emp.user ? (
                                                    <div>
                                                        <p className="font-medium text-slate-800">{emp.user.name}</p>
                                                        <p className="text-xs text-slate-400">{emp.user.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Belum ada akun</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{emp.phone || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {emp.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 text-center">
                            <span className="text-4xl mb-2">👥</span>
                            <p className="text-sm font-medium text-slate-600">Belum ada karyawan</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Karyawan dapat ditambahkan oleh owner toko melalui halaman kelola karyawan.
                            </p>
                        </div>
                    )}
                </div>

                {/* Back Button */}
                <Link
                    href={route('developer.stores.branches.index', store)}
                    className="inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    ← Kembali ke Daftar Cabang
                </Link>
            </div>
        </DeveloperLayout>
    );
}
