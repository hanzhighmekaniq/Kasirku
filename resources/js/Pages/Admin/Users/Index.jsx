import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const ROLE_COLOR = {
    owner:      'bg-amber-100 text-amber-700',
    admin:      'bg-blue-100 text-blue-700',
    supervisor: 'bg-violet-100 text-violet-700',
    kasir:      'bg-green-100 text-green-700',
    gudang:     'bg-orange-100 text-orange-700',
    kitchen:    'bg-red-100 text-red-700',
};

function RoleBadge({ role }) {
    return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLOR[role] ?? 'bg-slate-100 text-slate-600'}`}>
            {role}
        </span>
    );
}

export default function Index({ storeUsers, roles, branches, canInvite, planInfo }) {
    const { flash } = usePage().props;
    const [showInvite, setShowInvite] = useState(false);
    const [editUser, setEditUser]     = useState(null);

    const inviteForm = useForm({
        name:      '',
        email:     '',
        password:  '',
        role:      'kasir',
        branch_id: '',
        position:  '',
    });

    const submitInvite = (e) => {
        e.preventDefault();
        inviteForm.post(route('admin.store-users.invite'), {
            onSuccess: () => { setShowInvite(false); inviteForm.reset(); },
        });
    };

    const assignRole = (userId, role) => {
        router.patch(route('admin.store-users.assign-role', userId), { role });
    };

    const revoke = (user) => {
        if (!confirm(`Cabut akses "${user.name}" dari toko ini?`)) return;
        router.delete(route('admin.store-users.revoke', user.id));
    };

    const inp = (err) =>
        `block w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${err ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'}`;

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-slate-800">Pengguna & Akses</h2>}>
            <Head title="Pengguna & Akses" />

            {flash?.success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✅ {flash.success}</div>}
            {flash?.error   && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">❌ {flash.error}</div>}

            <div className="max-w-3xl space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">
                            {storeUsers.length} / {planInfo?.max_users ?? '∞'} pengguna
                            {planInfo && (
                                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                    Paket {planInfo.label}
                                </span>
                            )}
                        </p>
                        {!canInvite && (
                            <p className="mt-0.5 text-xs text-amber-600">
                                ⚠️ Batas pengguna paket {planInfo?.label} tercapai. Upgrade untuk menambah lebih banyak.
                            </p>
                        )}
                    </div>
                    <button onClick={() => setShowInvite(true)}
                        disabled={!canInvite}
                        title={!canInvite ? `Batas ${planInfo?.max_users} user paket ${planInfo?.label} tercapai` : ''}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Undang Pengguna
                    </button>
                </div>

                {/* User List */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {storeUsers.length === 0 ? (
                        <div className="flex flex-col items-center py-12 text-center">
                            <span className="mb-3 text-4xl">👥</span>
                            <p className="font-semibold text-slate-800">Belum ada pengguna</p>
                            <p className="mt-1 text-sm text-slate-400">Undang pengguna pertama untuk mulai beroperasi.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5">Pengguna</th>
                                    <th className="px-5 py-3.5">Cabang</th>
                                    <th className="px-5 py-3.5">Role</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {storeUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/60">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-slate-800">{u.name}</p>
                                                    <p className="text-xs text-slate-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {u.branch?.name ?? <span className="italic text-slate-400">Semua cabang</span>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <select
                                                defaultValue={u.roles?.[0] ?? ''}
                                                onChange={e => assignRole(u.id, e.target.value)}
                                                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200">
                                                <option value="">— Pilih Role —</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.name}>{r.name}</option>
                                                ))}
                                            </select>
                                            {u.roles?.length > 0 && (
                                                <div className="mt-1 flex gap-1">
                                                    {u.roles.map(r => <RoleBadge key={r} role={r} />)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button onClick={() => revoke(u)}
                                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                                                Cabut Akses
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-800">Undang Pengguna Baru</h3>
                            <button onClick={() => setShowInvite(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={submitInvite} className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-slate-700">Nama *</label>
                                    <input value={inviteForm.data.name} onChange={e => inviteForm.setData('name', e.target.value)}
                                        className={inp(inviteForm.errors.name)} placeholder="Nama lengkap" />
                                    {inviteForm.errors.name && <p className="mt-1 text-xs text-red-500">{inviteForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">Email *</label>
                                    <input type="email" value={inviteForm.data.email} onChange={e => inviteForm.setData('email', e.target.value)}
                                        className={inp(inviteForm.errors.email)} placeholder="email@..." />
                                    {inviteForm.errors.email && <p className="mt-1 text-xs text-red-500">{inviteForm.errors.email}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">Password *</label>
                                    <input type="password" value={inviteForm.data.password} onChange={e => inviteForm.setData('password', e.target.value)}
                                        className={inp(inviteForm.errors.password)} placeholder="Min. 6 karakter" />
                                    {inviteForm.errors.password && <p className="mt-1 text-xs text-red-500">{inviteForm.errors.password}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">Role *</label>
                                    <select value={inviteForm.data.role} onChange={e => inviteForm.setData('role', e.target.value)}
                                        className={inp(inviteForm.errors.role)}>
                                        {roles.filter(r => !r.is_system || r.name !== 'owner').map(r => (
                                            <option key={r.id} value={r.name}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">Cabang</label>
                                    <select value={inviteForm.data.branch_id} onChange={e => inviteForm.setData('branch_id', e.target.value)}
                                        className={inp()}>
                                        <option value="">Semua cabang</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">Posisi / Jabatan</label>
                                    <input value={inviteForm.data.position} onChange={e => inviteForm.setData('position', e.target.value)}
                                        className={inp()} placeholder="cth: Kasir, Barista..." />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-1">
                                <button type="button" onClick={() => setShowInvite(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
                                <button type="submit" disabled={inviteForm.processing}
                                    className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                    {inviteForm.processing ? 'Mengundang...' : 'Undang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
