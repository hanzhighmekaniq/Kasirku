import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import EmployeeTabs from "@/Components/EmployeeTabs";
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import Button from '@/Components/ui/Button';
import {
    Calendar,
    ChefHat,
    Crown,
    Eye,
    Monitor,
    Package,
    Pencil,
    Settings,
    ShieldCheck,
    Store,
    Table2,
    Ticket,
    Truck,
    User,
    Users,
    Wallet,
} from 'lucide-react';

// ── Konstanta ────────────────────────────────────────────────────────────────
// Ikon & warna role sistem datang dari template (dikelola developer). Peta di
// bawah hanya menerjemahkan nama ikon/warna template ke komponen & class.
const ICON_MAP = {
    ShieldCheck, Crown, Eye, Monitor, Package, ChefHat, Users, User,
    Wallet, Settings, Truck, Store, Ticket, Calendar, Table2,
};

const COLOR_MAP = {
    amber:  'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
    blue:   'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
    violet: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800',
    sky:    'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800',
    teal:   'bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-800',
    green:  'bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-800',
    orange: 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-800',
    rose:   'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800',
    red:    'bg-red-100 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
    muted:  'bg-muted text-muted-foreground ring-border',
};

// Label & urutan grup permission (kunci = prefix nama permission). Grup yang
// tidak punya permission relevan untuk tipe toko ini otomatis tidak dirender.
const GROUP_META = {
    dashboard:  'Dashboard',
    sale:       'Transaksi',
    shift:      'Shift',
    product:    'Produk',
    stock:      'Stok',
    batch:      'Batch & Kadaluarsa',
    purchase:   'Pembelian',
    supplier:   'Supplier',
    customer:   'Pelanggan',
    membership: 'Membership',
    debt:       'Hutang / Kasbon',
    employee:   'Karyawan',
    commission: 'Komisi',
    expense:    'Pengeluaran',
    promotion:  'Promo',
    table:      'Manajemen Meja',
    kitchen:    'Kitchen Display',
    queue:      'Antrian',
    booking:    'Booking / Reservasi',
    report:     'Laporan',
    setting:    'Pengaturan',
};

const GROUP_ORDER = Object.keys(GROUP_META);

const PERM_LABEL = {
    create: 'Buat', view: 'Lihat', edit: 'Edit', delete: 'Hapus',
    void: 'Void', discount: 'Diskon', return: 'Retur', import: 'Import',
    adjustment: 'Penyesuaian', opname: 'Opname', transfer: 'Transfer', waste: 'Waste',
    deposit: 'Deposit', pay: 'Bayar', open: 'Buka', close: 'Tutup', manage: 'Kelola',
    approve: 'Approve', update: 'Update', sales: 'Penjualan', purchase: 'Pembelian',
    stock: 'Stok', expense: 'Pengeluaran', shift: 'Shift', commission: 'Komisi',
    payment_method: 'Metode', payment_gateway: 'Gateway', module: 'Modul',
    cancel: 'Batal',
};

function roleIcon(iconName) {
    return ICON_MAP[iconName] ?? ShieldCheck;
}

function colorClass(color) {
    return COLOR_MAP[color] ?? COLOR_MAP.muted;
}

function permLabel(name) {
    const action = name.split('.').slice(1).join('.');
    return PERM_LABEL[action] ?? action;
}

/**
 * Kelompokkan daftar nama permission jadi grup siap render.
 *
 * @param {string[]} permissions
 * @returns {{group: string, label: string, items: string[]}[]}
 */
function groupPermissions(permissions) {
    const map = {};
    permissions.forEach((name) => {
        const group = name.split('.')[0];
        if (!map[group]) map[group] = [];
        map[group].push(name);
    });

    const known = GROUP_ORDER.filter((g) => map[g]?.length);
    const unknown = Object.keys(map).filter((g) => !GROUP_META[g]).sort();

    return [...known, ...unknown].map((group) => ({
        group,
        label: GROUP_META[group] ?? group,
        items: map[group],
    }));
}

// ── Permission Modal ──────────────────────────────────────────────────────────
function PermModal({ role, permissions, onClose, onSave }) {
    const groups = useMemo(() => groupPermissions(permissions), [permissions]);

    // Permission di luar cakupan tipe toko (mis. kitchen.* di retail) tidak
    // dirender dan tidak ikut tersimpan — route-nya pun diblok feature
    // middleware, jadi menyimpannya cuma bikin daftar akses menyesatkan.
    const [selected, setSelected] = useState(
        () => new Set((role?.permissions ?? []).filter((p) => permissions.includes(p))),
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

    const isSystem = role?.is_system;

    // Overlay sengaja TIDAK memakai backdrop-blur: efek blur pada elemen
    // full-screen memaksa compositor merender ulang seluruh viewport tiap
    // frame, sementara modal ini berisi belasan kartu permission — itu yang
    // bikin terasa berat saat dibuka. Warna solid semi-transparan sudah cukup.
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4">
            <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-border max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <h3 className="text-base font-bold text-popover-foreground">
                            {isSystem ? 'Lihat Permission —' : 'Atur Permission —'}
                            <span className="ml-1.5 text-primary">{role?.label ?? role?.name}</span>
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {isSystem
                                ? 'Role sistem — permission tidak bisa diubah. Duplikat untuk membuat versi custom.'
                                : `Hanya menampilkan ${permissions.length} permission yang didukung tipe toko ini.`}
                        </p>
                    </div>
                    <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {groups.map(({ group, label, items }) => {
                            const activeCount = items.filter(p => selected.has(p)).length;
                            const allOn = activeCount === items.length;
                            return (
                                <div key={group} className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{label}</span>
                                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{activeCount}/{items.length} aktif</span>
                                        </div>
                                        {!isSystem && (
                                            <button type="button" onClick={() => toggleGroup(items)}
                                                className={`text-[10px] font-bold uppercase tracking-wider transition ${allOn ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground'}`}>
                                                {allOn ? 'Unselect All' : 'Select All'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {items.map(p => {
                                            const on = selected.has(p);
                                            return (
                                                <button key={p} type="button"
                                                    disabled={isSystem}
                                                    onClick={() => !isSystem && toggle(p)}
                                                    title={p}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                                        on
                                                            ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                                                            : 'bg-muted/30 text-muted-foreground border border-border'
                                                    } ${!isSystem && !on ? 'hover:bg-muted hover:text-foreground hover:border-border' : ''} ${!isSystem && on ? 'hover:bg-primary/90' : ''} ${isSystem ? 'cursor-default opacity-90' : ''}`}>
                                                    {permLabel(p)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                    <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                        {isSystem ? 'Tutup' : 'Batal'}
                    </button>
                    {!isSystem && (
                    <Button onClick={() => onSave([...selected])} className="px-5">
                        Simpan Permission
                    </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Role Form Modal ───────────────────────────────────────────────────────────
function RoleFormModal({ title, form, onClose, onSubmit, isCreate = false }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4">
            <div className="w-full max-w-md rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-border">
                <div className="border-b border-border px-6 py-4">
                    <h3 className="text-base font-bold text-popover-foreground">{title}</h3>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Nama Role <span className="text-destructive">*</span>
                        </label>
                        <input
                            value={form.data.name}
                            required
                            autoFocus
                            onChange={e => form.setData('name', e.target.value)}
                            placeholder="cth: kasirdapur, operator-shift2, resepsionis"
                            className="w-full py-2.5 px-3.5 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                        />
                        {form.errors.name && <p className="mt-1.5 text-xs text-destructive">{form.errors.name}</p>}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Deskripsi
                            <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70">(opsional)</span>
                        </label>
                        <input
                            value={form.data.description}
                            onChange={e => form.setData('description', e.target.value)}
                            placeholder="Deskripsi singkat fungsi role ini"
                            className="w-full py-2.5 px-3.5 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                        />
                    </div>

                    {isCreate && (
                        <div className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            <div className="text-xs leading-relaxed text-foreground/80">
                                <p className="font-semibold text-foreground">Langkah berikutnya: atur hak akses</p>
                                <p className="mt-0.5">
                                    Role dibuat tanpa hak akses apa pun. Setelah tersimpan, buka
                                    tombol <span className="font-semibold text-primary">Atur Permission</span> pada
                                    kartu role untuk menentukan menu dan tindakan yang boleh diakses.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                            Batal
                        </button>
                        <Button type="submit" loading={form.processing} className="px-5">
                            {isCreate ? 'Buat & Lanjut Atur Akses' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Index({ roles = [], permissions = [] }) {
    const [permModal,   setPermModal]   = useState(null); // role object
    const [createModal, setCreateModal] = useState(false);
    const [editModal,   setEditModal]   = useState(null); // role object
    const [deletingRole, setDeletingRole] = useState(null); // role object
    const [deleting, setDeleting] = useState(false);

    const createForm = useForm({ name: '', description: '' });
    const editForm   = useForm({ name: '', description: '' });

    // Role sistem di luar cakupan tipe toko (mis. kitchen di retail) tidak
    // dihapus oleh sync, jadi disembunyikan di sini — kecuali masih dipakai
    // user, supaya akses yang aktif tidak jadi tak terlihat.
    const systemRoles = roles.filter(
        r => r.is_system && (!r.out_of_scope || (r.users_count ?? 0) > 0),
    );
    const customRoles = roles.filter(r => !r.is_system);
    const hiddenCount = roles.filter(
        r => r.is_system && r.out_of_scope && (r.users_count ?? 0) === 0,
    ).length;

    const handleCreate = (e) => {
        e.preventDefault();
        const intendedName = createForm.data.name;

        createForm.post(route('admin.roles.store'), {
            onSuccess: (page) => {
                setCreateModal(false);
                createForm.reset();

                // Role baru selalu lahir tanpa permission, jadi langsung
                // bukakan pengaturan aksesnya — tanpa ini user harus mencari
                // sendiri kartu rolenya di daftar untuk melanjutkan.
                const created = page.props.roles?.find(
                    (r) => r.name === intendedName && !r.is_system,
                );
                if (created) setPermModal(created);
            },
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
        setDeletingRole(role);
    };

    const confirmDelete = () => {
        if (!deletingRole) return;
        setDeleting(true);
        router.delete(route('admin.roles.destroy', deletingRole.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeletingRole(null);
            }
        });
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
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Role & Permission
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <PageHeader
                title="Role & Permission"
                breadcrumbs={["Admin", "Role & Permission"]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Role & Hak Akses
                        </span>
                    </>
                }
                description="Atur peran dan batasan hak akses tiap pengguna di tokomu."
            />

            <EmployeeTabs />

            <Head title="Role & Permission" />

            <div className="w-full max-w-[1920px] space-y-8">

                {/* ── Role Sistem ── */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-foreground">Role Sistem</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Dibuat otomatis dari template sesuai tipe tokomu, tidak bisa dihapus.
                                Duplikat untuk membuat versi custom yang bisa dimodifikasi.
                            </p>
                        </div>
                    </div>

                    {systemRoles.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                            <p className="text-sm font-medium text-muted-foreground">Belum ada role sistem</p>
                            <p className="mt-1 text-xs text-muted-foreground">Template role untuk tipe toko ini belum disiapkan.</p>
                        </div>
                    ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {systemRoles.map(role => {
                            const Icon = roleIcon(role.icon);
                            const clr  = colorClass(role.color);
                            return (
                                <div key={role.id} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${clr}`}>
                                                <Icon className="h-5 w-5" strokeWidth={1.8} />
                                            </span>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${clr}`}>{role.label ?? role.name}</span>
                                                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Sistem</span>
                                                    {role.out_of_scope && (
                                                        <span
                                                            title="Role ini di luar cakupan tipe tokomu, tapi masih dipakai user"
                                                            className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                                                            Di luar cakupan
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">{role.description ?? '—'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permission count */}
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{role.permissions?.length ?? 0} permission · {role.users_count ?? 0} user</span>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => setPermModal(role)}
                                                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted">
                                                Lihat Permission
                                            </button>
                                            <button onClick={() => handleDuplicate(role)}
                                                title="Duplikat sebagai role custom"
                                                className="flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                                                Duplikat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    )}

                    {hiddenCount > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            {hiddenCount} role sistem disembunyikan karena tidak berlaku untuk tipe tokomu.
                        </p>
                    )}
                </section>

                {/* ── Role Custom ── */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-foreground">Role Custom</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Buat role dengan nama dan permission sesuai kebutuhan bisnis kamu.</p>
                        </div>
                        {/* Di mobile dipindah ke FAB kanan bawah */}
                        <Button onClick={() => setCreateModal(true)} className="hidden sm:inline-flex">
                            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Buat Role Baru
                        </Button>
                    </div>

                    {customRoles.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                            <p className="text-sm font-medium text-muted-foreground">Belum ada role custom</p>
                            <p className="mt-1 text-xs text-muted-foreground">Buat dari nol atau duplikat role sistem di atas sebagai template</p>
                            <Button onClick={() => setCreateModal(true)} className="mt-4">
                                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Buat Role Baru
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {customRoles.map(role => (
                                <div key={role.id} className="group rounded-2xl border border-primary/20 bg-card p-5 shadow-sm transition hover:shadow-md hover:border-primary/40">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <Pencil className="h-5 w-5" strokeWidth={1.8} />
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary ring-1 ring-primary/20">{role.name}</span>
                                                    <span className="rounded-full bg-primary/5 px-1.5 py-0.5 text-[10px] font-semibold text-primary/70">Custom</span>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">{role.description || 'Tidak ada deskripsi'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{role.permissions?.length ?? 0} permission · {role.users_count ?? 0} user</span>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => setPermModal(role)}
                                                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                                                Atur Permission
                                            </button>
                                            <button onClick={() => openEdit(role)}
                                                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(role)}
                                                className="rounded-lg border border-destructive/20 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                                                Hapus
                                            </button>
                                        </div>
                                    </div>

                                    {/* Permission pills preview */}
                                    {role.permissions?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {role.permissions.slice(0, 8).map(p => (
                                                <span key={p} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{p}</span>
                                            ))}
                                            {role.permissions.length > 8 && (
                                                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">+{role.permissions.length - 8} lagi</span>
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
                    permissions={permissions}
                    onClose={() => setPermModal(null)}
                    onSave={handleSavePerms}
                />
            )}
            {createModal && (
                <RoleFormModal
                    title="Buat Role Custom Baru"
                    form={createForm}
                    isCreate
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
            
            <ConfirmDeleteModal
                open={!!deletingRole}
                title={`Hapus Role "${deletingRole?.name}"?`}
                description="User yang memakai role ini akan kehilangan aksesnya. Tindakan ini tidak dapat dibatalkan."
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setDeletingRole(null)}
            />

            {/* FAB — mobile only. Disembunyikan saat ada modal terbuka supaya
                tidak menimpa panelnya. */}
            {!permModal && !createModal && !editModal && !deletingRole && (
                <Button
                    onClick={() => setCreateModal(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl sm:hidden"
                    title="Buat Role Baru"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </Button>
            )}
        </AuthenticatedLayout>
    );
}
