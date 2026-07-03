import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const TYPE_COLOR = {
    retail:      'bg-blue-100 text-blue-700',
    fnb:         'bg-orange-100 text-orange-700',
    service:     'bg-violet-100 text-violet-700',
    rental:      'bg-yellow-100 text-yellow-700',
    ticket:      'bg-rose-100 text-rose-700',
    hospitality: 'bg-amber-100 text-amber-700',
    // backward compat
    laundry: 'bg-violet-100 text-violet-700',
    parking: 'bg-slate-100 text-slate-700',
    session: 'bg-yellow-100 text-yellow-700',
};
const TYPE_LABEL = {
    retail:      'Retail',
    fnb:         'FnB / Cafe',
    service:     'Service',
    rental:      'Rental',
    ticket:      'Tiket',
    hospitality: 'Hospitality',
    // backward compat
    laundry: 'Service', parking: 'Parkir', session: 'Rental',
};

function RoleBadge({ role }) {
    const c = {owner:'bg-amber-100 text-amber-700',admin:'bg-blue-100 text-blue-700',kasir:'bg-green-100 text-green-700'};
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c[role]??'bg-slate-100 text-slate-600'}`}>{role}</span>;
}

export default function Show({ store, usersWithRole, allUsers, plans, defaultModules, allFeatures }) {
    const { flash } = usePage().props;
    const [assignId, setAssignId] = useState('');
    const [activeTab, setActiveTab] = useState('info'); // info | plan | modules | users

    // Form plan & modules
    const planForm = useForm({
        plan:            store.plan            ?? 'free',
        plan_expires_at: store.plan_expires_at ?? '',
        max_users:       store.max_users       ?? 1,
        max_branches:    store.max_branches    ?? 1,
    });

    const modulesForm = useForm({
        modules: store.modules ?? { pos_modes: [], features: [] },
    });

    const assignOwner = () => {
        if (!assignId) return;
        router.post(route('developer.stores.assign-owner', store.id), { user_id: assignId }, {
            onSuccess: () => setAssignId(''),
        });
    };

    const revokeOwner = (userId) => {
        if (!confirm('Cabut akses user ini dari toko?')) return;
        router.delete(route('developer.stores.revoke-owner', store.id), { data: { user_id: userId } });
    };

    const savePlan = (e) => {
        e.preventDefault();
        planForm.patch(route('developer.stores.update', store.id), {
            data: { ...planForm.data, code: store.code, name: store.name, store_type: store.store_type, is_active: store.is_active },
            onSuccess: () => {},
        });
    };

    const saveModules = (e) => {
        e.preventDefault();
        router.patch(route('developer.stores.update', store.id), {
            code: store.code, name: store.name, store_type: store.store_type, is_active: store.is_active,
            modules: modulesForm.data.modules,
        }, { onSuccess: () => {} });
    };

    const toggleFeature = (key) => {
        const cur = modulesForm.data.modules?.features ?? [];
        const next = cur.includes(key) ? cur.filter(f => f !== key) : [...cur, key];
        modulesForm.setData('modules', { ...modulesForm.data.modules, features: next });
    };

    const resetModules = () => {
        const def = defaultModules[store.store_type];
        if (def) modulesForm.setData('modules', def);
    };

    const planInfo = plans[planForm.data.plan] ?? plans.free;

    const TABS = [
        { key: 'info',    label: 'Info' },
        { key: 'plan',    label: 'Paket' },
        { key: 'modules', label: 'Fitur/Modul' },
        { key: 'users',   label: 'Pengguna' },
    ];

    return (
        <DeveloperLayout header={<span className="font-semibold">{store.name}</span>}>
            <Head title={store.name} />
            <div className="mx-auto max-w-4xl space-y-5">

                {/* Flash */}
                {flash?.success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">✅ {flash.success}</div>}
                {flash?.error   && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">❌ {flash.error}</div>}

                {/* Header card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                                {({ retail:'🏪', fnb:'☕', service:'✂️', rental:'🔑', ticket:'🎟️', hospitality:'🏨', laundry:'👕', parking:'🅿️', session:'🖥️' })[store.store_type] ?? '🏬'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-slate-900">{store.name}</h1>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[store.store_type]}`}>
                                        {TYPE_LABEL[store.store_type] ?? store.store_type}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${store.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {store.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${plans[store.plan]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                                        {plans[store.plan]?.label ?? store.plan}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Kode: <span className="font-mono">{store.code}</span></p>
                            </div>
                        </div>
                        <Link href={route('developer.stores.edit', store.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                            Edit Info
                        </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-3">
                        {[
                            { label: 'Cabang', value: store.branches?.length ?? 0 },
                            { label: 'Pengguna', value: store.users?.length ?? 0 },
                            { label: 'Transaksi', value: store.sales_count ?? 0 },
                            { label: 'Max User/Branch', value: `${store.max_users ?? 1} / ${store.max_branches ?? 1}` },
                        ].map(s => (
                            <div key={s.label} className="rounded-lg bg-slate-50 p-3 text-center">
                                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                                <p className="text-xs text-slate-500">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${activeTab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Info */}
                {activeTab === 'info' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 text-sm text-slate-600">
                        {store.phone   && <p>📞 {store.phone}</p>}
                        {store.email   && <p>✉️ {store.email}</p>}
                        {store.address && <p>📍 {store.address}</p>}
                        <div className="mt-3">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Cabang</h3>
                            <div className="space-y-1.5">
                                {store.branches?.map(b => (
                                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                        <span className="font-medium text-slate-700">{b.name}
                                            <span className="ml-2 font-mono text-xs text-slate-400">{b.code}</span>
                                        </span>
                                        <span className={`text-xs font-medium ${b.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {b.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Link href={route('developer.stores.branches.create', store.id)}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
                                + Tambah Cabang
                            </Link>
                        </div>
                    </div>
                )}

                {/* Tab: Paket */}
                {activeTab === 'plan' && (
                    <form onSubmit={savePlan} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
                        <h3 className="text-sm font-semibold text-slate-800">Pengaturan Paket Langganan</h3>

                        {/* Plan selector */}
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(plans).map(([key, p]) => {
                                const PLAN_COLORS = { free: 'bg-slate-100 text-slate-600', basic: 'bg-blue-100 text-blue-700', pro: 'bg-indigo-100 text-indigo-700' };
                                return (
                                    <button key={key} type="button"
                                        onClick={() => {
                                            planForm.setData('plan', key);
                                            planForm.setData('max_users', p.max_users >= 999 ? 9999 : p.max_users);
                                            planForm.setData('max_branches', p.max_branches >= 999 ? 9999 : p.max_branches);
                                        }}
                                        className={`rounded-xl border-2 p-4 text-center transition ${planForm.data.plan === key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${PLAN_COLORS[key] ?? 'bg-slate-100 text-slate-600'}`}>{p.label}</span>
                                        <p className="mt-2 text-xs text-slate-500">Max {p.max_users >= 999 ? '∞' : p.max_users} user</p>
                                        <p className="text-xs text-slate-500">Max {p.max_branches >= 999 ? '∞' : p.max_branches} cabang</p>
                                        <p className="mt-1 text-[10px] text-slate-400">{p.features?.includes('*') ? 'Semua fitur' : `${p.features?.length ?? 0} fitur`}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Berlaku Hingga</label>
                                <input type="date" value={planForm.data.plan_expires_at}
                                    onChange={e => planForm.setData('plan_expires_at', e.target.value)}
                                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
                                <p className="mt-1 text-xs text-slate-400">Kosongkan jika tidak ada batas waktu</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Override Max User</label>
                                <input type="number" min="1" value={planForm.data.max_users}
                                    onChange={e => planForm.setData('max_users', e.target.value)}
                                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button type="submit" disabled={planForm.processing}
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                {planForm.processing ? 'Menyimpan...' : 'Simpan Paket'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Tab: Modules */}
                {activeTab === 'modules' && (
                    <form onSubmit={saveModules} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">Fitur yang Aktif</h3>
                            <button type="button" onClick={resetModules}
                                className="text-xs text-slate-500 hover:text-indigo-600 underline">
                                Reset ke default ({TYPE_LABEL[store.store_type]})
                            </button>
                        </div>

                        <p className="text-xs text-slate-500">Toggle fitur yang bisa dipakai di toko ini. Fitur yang nonaktif tidak akan muncul di sidebar owner.</p>

                        <div className="divide-y divide-slate-100">
                            {allFeatures.map(f => {
                                const active = (modulesForm.data.modules?.features ?? []).includes(f.key);
                                const relevantModes = f.modes.includes('*') || f.modes.some(m => (store.modules?.pos_modes ?? []).includes(m));
                                return (
                                    <div key={f.key} className={`flex items-center justify-between py-3 ${!relevantModes ? 'opacity-40' : ''}`}>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{f.label}</p>
                                            <p className="text-xs text-slate-400">
                                                {f.modes.includes('*') ? 'Semua tipe' : `Mode: ${f.modes.join(', ')}`}
                                                {!relevantModes && ' · Tidak relevan dengan tipe toko ini'}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => toggleFeature(f.key)}
                                            className={`relative h-5 w-9 rounded-full transition ${active ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${active ? 'left-4' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                            <p className="text-xs text-slate-400">
                                {(modulesForm.data.modules?.features ?? []).length} fitur aktif
                            </p>
                            <button type="submit" disabled={modulesForm.processing}
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                {modulesForm.processing ? 'Menyimpan...' : 'Simpan Fitur'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Tab: Users */}
                {activeTab === 'users' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800">Pengguna & Akses</h3>

                        <div className="flex gap-2">
                            <select value={assignId} onChange={e => setAssignId(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
                                <option value="">— Pilih user —</option>
                                {allUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            <button onClick={assignOwner} disabled={!assignId}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                                Assign Owner
                            </button>
                        </div>

                        <div className="space-y-2">
                            {usersWithRole.map(u => (
                                <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{u.name}</p>
                                        <p className="text-xs text-slate-400">{u.email}</p>
                                        <div className="mt-1 flex gap-1">
                                            {u.roles?.map(r => <RoleBadge key={r} role={r} />)}
                                        </div>
                                    </div>
                                    <button onClick={() => revokeOwner(u.id)}
                                        className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                                        Cabut
                                    </button>
                                </div>
                            ))}
                            {!usersWithRole.length && <p className="text-sm text-slate-400">Belum ada pengguna.</p>}
                        </div>
                    </div>
                )}

                <Link href={route('developer.stores.index')}
                    className="inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    ← Kembali
                </Link>
            </div>
        </DeveloperLayout>
    );
}
