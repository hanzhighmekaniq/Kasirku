import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const SYSTEM_ROLE_INFO = {
    owner:      { color: 'bg-amber-100 text-amber-700',   icon: '👑', desc: 'Akses penuh toko + kelola role & user' },
    admin:      { color: 'bg-blue-100 text-blue-700',     icon: '🛠️', desc: 'Kelola operasional harian' },
    supervisor: { color: 'bg-violet-100 text-violet-700', icon: '👁️', desc: 'Pengawas shift & laporan' },
    kasir:      { color: 'bg-green-100 text-green-700',   icon: '🖥️', desc: 'Operator POS' },
    gudang:     { color: 'bg-orange-100 text-orange-700', icon: '📦', desc: 'Kelola stok & pembelian' },
    kitchen:    { color: 'bg-red-100 text-red-700',       icon: '👨‍🍳', desc: 'Update status masak (FnB)' },
};

// Semua permission dikelompokkan
const PERMISSION_GROUPS = {
    'Transaksi':    ['sale.create','sale.view','sale.void','sale.discount','sale.return'],
    'Produk':       ['product.view','product.create','product.edit','product.delete','product.import'],
    'Stok':         ['stock.view','stock.adjustment','stock.opname','stock.transfer','stock.waste'],
    'Pembelian':    ['purchase.view','purchase.create','purchase.edit','purchase.delete','purchase.return'],
    'Pelanggan':    ['customer.view','customer.create','customer.edit','customer.delete','customer.deposit'],
    'Karyawan':     ['employee.view','employee.create','employee.edit','employee.delete'],
    'Laporan':      ['report.sales','report.purchase','report.stock','report.expense','report.shift','report.commission'],
    'Shift':        ['shift.open','shift.close','shift.view'],
    'Pengeluaran':  ['expense.view','expense.create','expense.edit','expense.delete'],
    'Promo':        ['promotion.view','promotion.create','promotion.edit','promotion.delete'],
    'Meja/Kitchen': ['table.view','table.manage','kitchen.view','kitchen.update'],
    'Antrian/Booking': ['queue.view','queue.manage','booking.view','booking.create','booking.edit','booking.cancel'],
    'Membership':   ['membership.view','membership.create','membership.edit'],
    'Komisi':       ['commission.view','commission.approve'],
    'Supplier':     ['supplier.view','supplier.create','supplier.edit','supplier.delete'],
    'Pengaturan':   ['setting.view','setting.edit','setting.payment_method','setting.payment_gateway','setting.module'],
};

function PermModal({ open, onClose, onSave, editRole, permissions }) {
    const [selected, setSelected] = useState(() =>
        new Set(editRole?.permissions ?? [])
    );
    const toggle = (p) => setSelected(prev => {
        const next = new Set(prev);
        next.has(p) ? next.delete(p) : next.add(p);
        return next;
    });
    const toggleGroup = (perms) => {
        const allOn = perms.every(p => selected.has(p));
        setSelected(prev => {
            const next = new Set(prev);
            perms.forEach(p => allOn ? next.delete(p) : next.add(p));
            return next;
        });
    };
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="font-semibold text-slate-800">
                        {editRole ? `Edit Permission — ${editRole.name}` : 'Atur Permission'}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
                    {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                        const allOn = perms.every(p => selected.has(p));
                        return (
                            <div key={group}>
                                <div className="mb-2 flex items-center gap-2">
                                    <button type="button" onClick={() => toggleGroup(perms)}
                                        className={`rounded px-2 py-0.5 text-xs font-semibold ${allOn ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {group}
                                    </button>
                                    <span className="text-xs text-slate-400">{perms.filter(p => selected.has(p)).length}/{perms.length}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {perms.map(p => (
                                        <button key={p} type="button" onClick={() => toggle(p)}
                                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${selected.has(p) ? 'bg-indigo-500 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300'}`}>
                                            {p.split('.')[1]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
                    <button onClick={() => onSave([...selected])}
                        className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                        Simpan Permission
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Index({ roles, permissions }) {
    const { flash } = usePage().props;
    const [modal, setModal]       = useState(null); // null | 'create' | { role }
    const [permModal, setPermModal] = useState(null);

    const createForm = useForm({ name: '', description: '', permissions: [] });
    const editForm   = useForm({ name: '', description: '', permissions: [] });

    const openCreate = () => {
        createForm.reset();
        setModal('create');
    };

    const openEdit = (role) => {
        editForm.setData({
            name:        role.name,
            description: role.description ?? '',
            permissions: role.permissions ?? [],
        });
        setModal({ role });
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('admin.roles.store'), {
            onSuccess: () => setModal(null),
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(route('admin.roles.update', modal.role.id), {
            onSuccess: () => setModal(null),
        });
    };

    const deleteRole = (role) => {
        if (!confirm(`Hapus role "${role.name}"?`)) return;
        router.delete(route('admin.roles.destroy', role.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-slate-800">Role & Permission</h2>}>
            <Head title="Role & Permission" />

            {flash?.success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✅ {flash.success}</div>}
            {flash?.error   && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">❌ {flash.error}</div>}

            <div className="max-w-4xl space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Kelola role dan permission yang berlaku di toko ini.</p>
                        <p className="text-xs text-slate-400 mt-0.5">Role sistem (bawaan) tidak bisa dihapus, tapi custom bisa dibuat bebas.</p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Buat Role Baru
                    </button>
                </div>

                {/* Role list */}
                <div className="space-y-3">
                    {roles.map(role => {
                        const info = SYSTEM_ROLE_INFO[role.name];
                        return (
                            <div key={role.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{info?.icon ?? '🔒'}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${info?.color ?? 'bg-slate-100 text-slate-600'}`}>
                                                    {role.name}
                                                </span>
                                                {role.is_system && (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Sistem</span>
                                                )}
                                                {!role.is_system && (
                                                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">Custom</span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">{role.description ?? info?.desc ?? ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="text-xs text-slate-400">{role.permissions?.length ?? 0} permission</span>
                                        <button onClick={() => setPermModal(role)}
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                            Atur Permission
                                        </button>
                                        {!role.is_system && (
                                            <>
                                                <button onClick={() => openEdit(role)}
                                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                                    Edit
                                                </button>
                                                <button onClick={() => deleteRole(role)}
                                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                                                    Hapus
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {/* Permission badges */}
                                {role.permissions?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {role.permissions.slice(0, 12).map(p => (
                                            <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{p}</span>
                                        ))}
                                        {role.permissions.length > 12 && (
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">+{role.permissions.length - 12} lagi</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Modal */}
            {modal === 'create' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-800">Buat Role Baru</h3>
                        </div>
                        <form onSubmit={submitCreate} className="p-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Role *</label>
                                <input value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    placeholder="cth: operator, kurir, resepsionis" />
                                {createForm.errors.name && <p className="mt-1 text-xs text-red-500">{createForm.errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
                                <input value={createForm.data.description} onChange={e => createForm.setData('description', e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    placeholder="Deskripsi singkat role ini" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setModal(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
                                <button type="submit" disabled={createForm.processing}
                                    className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                    Buat Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {modal?.role && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 px-6 py-4">
                            <h3 className="font-semibold text-slate-800">Edit Role — {modal.role.name}</h3>
                        </div>
                        <form onSubmit={submitEdit} className="p-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Role *</label>
                                <input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                                {editForm.errors.name && <p className="mt-1 text-xs text-red-500">{editForm.errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
                                <input value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setModal(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
                                <button type="submit" disabled={editForm.processing}
                                    className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permission Modal */}
            <PermModal
                open={!!permModal}
                editRole={permModal}
                permissions={permissions}
                onClose={() => setPermModal(null)}
                onSave={(perms) => {
                    router.put(route('admin.roles.update', permModal.id), {
                        name:        permModal.name,
                        description: permModal.description,
                        permissions: perms,
                    }, { onSuccess: () => setPermModal(null) });
                }}
            />
        </AuthenticatedLayout>
    );
}
