import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Konstanta ────────────────────────────────────────────────────────────────
const SYSTEM_ROLE_META = {
    owner:      { icon: '👑', color: 'amber',  desc: 'Akses penuh toko + kelola role & user' },
    admin:      { icon: '🛠️', color: 'blue',   desc: 'Kelola operasional harian' },
    supervisor: { icon: '👁️', color: 'violet', desc: 'Pengawas shift & laporan' },
    kasir:      { icon: '🖥️', color: 'green',  desc: 'Operator POS harian' },
    gudang:     { icon: '📦', color: 'orange', desc: 'Kelola stok & pembelian' },
    kitchen:    { icon: '👨‍🍳', color: 'red',   desc: 'Update status masak (FnB)' },
};

const COLOR_MAP = {
    amber:  'bg-amber-50 text-amber-700 ring-amber-200',
    blue:   'bg-blue-50 text-blue-700 ring-blue-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    green:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    red:    'bg-red-50 text-red-700 ring-red-200',
    custom: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

const PERMISSION_GROUPS = {
    'Transaksi':       ['sale.create','sale.view','sale.void','sale.discount','sale.return'],
    'Produk':          ['product.view','product.create','product.edit','product.delete','product.import'],
    'Stok':            ['stock.view','stock.adjustment','stock.opname','stock.transfer','stock.waste'],
    'Pembelian':       ['purchase.view','purchase.create','purchase.edit','purchase.delete','purchase.return'],
    'Pelanggan':       ['customer.view','customer.create','customer.edit','customer.delete','customer.deposit'],
    'Karyawan':        ['employee.view','employee.create','employee.edit','employee.delete'],
    'Laporan':         ['report.sales','report.purchase','report.stock','report.expense','report.shift','report.commission'],
    'Shift':           ['shift.open','shift.close','shift.view','shift.manage'],
    'Pengeluaran':     ['expense.view','expense.create','expense.edit','expense.delete'],
    'Promo':           ['promotion.view','promotion.create','promotion.edit','promotion.delete'],
    'Meja & Kitchen':  ['table.view','table.manage','kitchen.view','kitchen.update'],
    'Antrian & Booking': ['queue.view','queue.manage','booking.view','booking.create','booking.edit','booking.cancel'],
    'Membership':      ['membership.view','membership.create','membership.edit'],
    'Komisi':          ['commission.view','commission.approve'],
    'Supplier':        ['supplier.view','supplier.create','supplier.edit','supplier.delete'],
    'Pengaturan':      ['setting.view','setting.edit','setting.payment_method','setting.payment_gateway','setting.module'],
};

const PERM_LABEL = {
    create: 'Buat', view: 'Lihat', edit: 'Edit', delete: 'Hapus',
    void: 'Void', discount: 'Diskon', return: 'Retur', import: 'Import',
    adjustment: 'Penyesuaian', opname: 'Opname', transfer: 'Transfer', waste: 'Waste',
    deposit: 'Deposit', open: 'Buka', close: 'Tutup', manage: 'Kelola',
    approve: 'Approve', update: 'Update', sales: 'Penjualan', purchase: 'Pembelian',
    stock: 'Stok', expense: 'Pengeluaran', shift: 'Shift', commission: 'Komisi',
    payment_method: 'Metode', payment_gateway: 'Gateway', module: 'Modul',
    cancel: 'Batal',
};

// ── Permission Modal ──────────────────────────────────────────────────────────
function PermModal({ role, onClose, onSave }) {
    const [selected, setSelected] = useState(() => new Set(role?.permissions ?? []));

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

    const isSystem = role?.is_system;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            {isSystem ? 'Lihat Permission —' : 'Atur Permission —'}
                            <span className="ml-1.5 text-indigo-600">{role?.name}</span>
                        </h3>
                        {isSystem && (
                            <p className="mt-0.5 text-xs text-slate-400">Role sistem — permission tidak bisa diubah. Duplikat untuk membuat versi custom.</p>
                        )}
                    </div>
                    <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                        const activeCount = perms.filter(p => selected.has(p)).length;
                        const allOn = activeCount === perms.length;
                        return (
                            <div key={group}>
                                <div className="mb-2.5 flex items-center gap-2">
                                    {!isSystem ? (
                                        <button type="button" onClick={() => toggleGroup(perms)}
                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${allOn ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                            {group}
                                        </button>
                                    ) : (
                                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{group}</span>
                                    )}
                                    <span className="text-[11px] text-slate-400">{activeCount}/{perms.length} aktif</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {perms.map(p => {
                                        const key = p.split('.')[1];
                                        const on  = selected.has(p);
                                        return (
                                            <button key={p} type="button"
                                                disabled={isSystem}
                                                onClick={() => !isSystem && toggle(p)}
                                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                                    on
                                                        ? 'bg-indigo-500 text-white shadow-sm'
                                                        : 'border border-slate-200 bg-white text-slate-400'
                                                } ${!isSystem && !on ? 'hover:border-indigo-300 hover:text-indigo-500' : ''} ${isSystem ? 'cursor-default' : ''}`}>
                                                {PERM_LABEL[key] ?? key}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                        {isSystem ? 'Tutup' : 'Batal'}
                    </button>
                    {!isSystem && (
                        <button onClick={() => onSave([...selected])}
                            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                            Simpan Permission
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Role Form Modal ───────────────────────────────────────────────────────────
function RoleFormModal({ title, form, onClose, onSubmit }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="text-base font-bold text-slate-900">{title}</h3>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Nama Role *</label>
                        <input
                            value={form.data.name}
                            onChange={e => form.setData('name', e.target.value)}
                            placeholder="cth: kasirdapur, operator-shift2, resepsionis"
                            className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        {form.errors.name && <p className="mt-1.5 text-xs text-red-500">{form.errors.name}</p>}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Deskripsi</label>
                        <input
                            value={form.data.description}
                            onChange={e => form.setData('description', e.target.value)}
                            placeholder="Deskripsi singkat fungsi role ini"
                            className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                    <p className="text-xs text-slate-400">Permission bisa diatur setelah role dibuat lewat tombol "Atur Permission".</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                            Batal
                        </button>
                        <button type="submit" disabled={form.processing}
                            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                            {form.processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Index({ roles, permissions }) {
    const { flash } = usePage().props;
    const [permModal,   setPermModal]   = useState(null); // role object
    const [createModal, setCreateModal] = useState(false);
    const [editModal,   setEditModal]   = useState(null); // role object

    const createForm = useForm({ name: '', description: '' });
    const editForm   = useForm({ name: '', description: '' });

    const systemRoles = roles.filter(r => r.is_system);
    const customRoles = roles.filter(r => !r.is_system);

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('admin.roles.store'), {
            onSuccess: () => { setCreateModal(false); createForm.reset(); },
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.put(route('admin.roles.update', editModal.id), {
            onSuccess: () => setEditModal(null),
        });
    };

    const handleDuplicate = (role) => {
        router.post(route('admin.roles.duplicate', role.id), {}, { preserveScroll: true });
    };

    const handleDelete = (role) => {
        if (!confirm(`Hapus role "${role.name}"? User yang memakai role ini akan kehilangan aksesnya.`)) return;
        router.delete(route('admin.roles.destroy', role.id), { preserveScroll: true });
    };

    const handleSavePerms = (perms) => {
        router.put(route('admin.roles.update', permModal.id), {
            name:        permModal.name,
            description: permModal.description,
            permissions: perms,
        }, { onSuccess: () => setPermModal(null), preserveScroll: true });
    };

    const openEdit = (role) => {
        editForm.setData({ name: role.name, description: role.description ?? '' });
        setEditModal(role);
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">Role & Permission</span>
            </div>
        }>
            <Head title="Role & Permission" />

            {flash?.success && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    {flash.success}
                </div>
            )}

            <div className="max-w-4xl space-y-8">

                {/* ── Role Sistem ── */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Role Sistem</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Dibuat otomatis, tidak bisa dihapus. Duplikat untuk membuat versi custom yang bisa dimodifikasi.</p>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {systemRoles.map(role => {
                            const meta  = SYSTEM_ROLE_META[role.name] ?? { icon: '🔒', color: 'custom' };
                            const clr   = COLOR_MAP[meta.color] ?? COLOR_MAP.custom;
                            return (
                                <div key={role.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{meta.icon}</span>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${clr}`}>{role.name}</span>
                                                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Sistem</span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-400">{role.description ?? meta.desc}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permission count */}
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-slate-400">{role.permissions?.length ?? 0} permission aktif</span>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => setPermModal(role)}
                                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                                                Lihat Permission
                                            </button>
                                            <button onClick={() => handleDuplicate(role)}
                                                title="Duplikat sebagai role custom"
                                                className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                                                Duplikat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Role Custom ── */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Role Custom</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Buat role dengan nama dan permission sesuai kebutuhan bisnis kamu.</p>
                        </div>
                        <button onClick={() => setCreateModal(true)}
                            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Buat Role Baru
                        </button>
                    </div>

                    {customRoles.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                            <p className="text-sm font-medium text-slate-500">Belum ada role custom</p>
                            <p className="mt-1 text-xs text-slate-400">Buat dari nol atau duplikat role sistem di atas sebagai template</p>
                            <button onClick={() => setCreateModal(true)}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Buat Role Baru
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {customRoles.map(role => (
                                <div key={role.id} className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm ring-1 ring-indigo-50 transition hover:shadow-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg">✏️</span>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">{role.name}</span>
                                                    <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-500">Custom</span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-400">{role.description || 'Tidak ada deskripsi'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-slate-400">{role.permissions?.length ?? 0} permission · {role.users_count ?? 0} user</span>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => setPermModal(role)}
                                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                                Atur Permission
                                            </button>
                                            <button onClick={() => openEdit(role)}
                                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(role)}
                                                className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                                                Hapus
                                            </button>
                                        </div>
                                    </div>

                                    {/* Permission pills preview */}
                                    {role.permissions?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {role.permissions.slice(0, 8).map(p => (
                                                <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{p}</span>
                                            ))}
                                            {role.permissions.length > 8 && (
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">+{role.permissions.length - 8} lagi</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Modals */}
            {permModal && (
                <PermModal
                    role={permModal}
                    onClose={() => setPermModal(null)}
                    onSave={handleSavePerms}
                />
            )}
            {createModal && (
                <RoleFormModal
                    title="Buat Role Custom Baru"
                    form={createForm}
                    onClose={() => { setCreateModal(false); createForm.reset(); }}
                    onSubmit={handleCreate}
                />
            )}
            {editModal && (
                <RoleFormModal
                    title={`Edit Role — ${editModal.name}`}
                    form={editForm}
                    onClose={() => setEditModal(null)}
                    onSubmit={handleEdit}
                />
            )}
        </AuthenticatedLayout>
    );
}
