import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Head, Link } from '@inertiajs/react';

const ROLE_BADGE = {
    developer: 'bg-violet-50 text-violet-700',
    admin:     'bg-blue-50 text-blue-700',
};

export default function Show({ user }) {
    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('developer.users.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Detail User</h2>
                </div>
            }
        >
            <Head title={`User — ${user.name}`} />

            <div className="mx-auto max-w-2xl space-y-5">
                {/* Profile Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <div className="flex items-center gap-4">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
                                <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">ID</dt>
                                <dd className="mt-1 text-sm text-slate-700">#{user.id}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dibuat</dt>
                                <dd className="mt-1 text-sm text-slate-700">
                                    {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Stores */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">Toko yang Diakses</h3>
                    </div>
                    <div className="p-6">
                        {user.stores && user.stores.length > 0 ? (
                            <div className="space-y-3">
                                {user.stores.map((store) => (
                                    <div key={store.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-600">
                                            {store.name.charAt(0).toUpperCase()}
                                        </span>
                                        <div>
                                            <p className="font-medium text-slate-800">{store.name}</p>
                                            <p className="text-xs text-slate-400">{store.code}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Belum ditugaskan ke toko mana pun.</p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Link href={route('developer.users.index')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Kembali
                    </Link>
                    <Link href={route('developer.users.edit', user.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:to-teal-700">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                        Edit User
                    </Link>
                </div>
            </div>
        </DeveloperLayout>
    );
}
