import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import Button from "@/Components/ui/Button";
import Dropdown from '@/Components/Dropdown';
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const TYPE_LABELS = {
    percentage: 'Persen',
    fixed_amount: 'Nominal',
    buy_x_get_y: 'Beli X Gratis Y',
    bundle: 'Bundle',
    tiered: 'Harga Tiered',
    member_price: 'Harga Member',
    bogo: 'Beli X Gratis Produk',
};

const TYPE_COLORS = {
    percentage: 'bg-amber-50 text-amber-700',
    fixed_amount: 'bg-success/10 text-success',
    buy_x_get_y: 'bg-sky-50 text-sky-700',
    bundle: 'bg-violet-50 text-violet-700',
    tiered: 'bg-cyan-50 text-cyan-700',
    member_price: 'bg-pink-50 text-pink-700',
    bogo: 'bg-orange-50 text-orange-700',
};

const SCOPE_META = {
    item: { label: 'Per Item', icon: '📦', color: 'bg-blue-50 text-blue-700' },
    cart: { label: 'Keranjang', icon: '🛒', color: 'bg-purple-50 text-purple-700' },
};

function formatDiscount(promo) {
    if (promo.type === 'percentage') return `${Number(promo.discount_value)}%`;
    if (promo.type === 'fixed_amount') return `Rp ${Number(promo.discount_value).toLocaleString('id-ID')}`;
    if (promo.type === 'tiered' || promo.type === 'member_price') return `Rp ${Number(promo.tier_price || 0).toLocaleString('id-ID')}`;
    if (promo.type === 'bogo' || promo.type === 'buy_x_get_y') return `Beli ${promo.discount_value} gratis 1`;
    return promo.discount_value;
}

function PromoStatus({ promo }) {
    const now = new Date();
    const start = promo.start_date ? new Date(promo.start_date) : null;
    const end = promo.end_date ? new Date(promo.end_date) : null;

    if (!promo.is_active) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Nonaktif
            </span>
        );
    }
    if (start && start > now) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-sky-50 text-sky-700">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                Terjadwal
            </span>
        );
    }
    if (end && end < now) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-destructive/10 text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Berakhir
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-success/10 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success/100 animate-pulse" />
            Aktif
        </span>
    );
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isPromoActive(promo) {
    if (!promo.is_active) return false;
    const now = new Date();
    const s = promo.start_date ? new Date(promo.start_date) : null;
    const e = promo.end_date ? new Date(promo.end_date) : null;
    if (s && s > now) return false;
    if (e && e < now) return false;
    return true;
}

export default function Index({ promotions }) {
    const { auth } = usePage().props;
    const canManage = (auth.permissions ?? []).includes('promotion.create');
    const promos = promotions || [];

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const now = new Date();

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return promos.filter((p) => {
            if (filterType !== 'all' && p.type !== filterType) return false;
            if (filterStatus === 'active' && !isPromoActive(p)) return false;
            if (filterStatus === 'scheduled' && !(p.is_active && p.start_date && new Date(p.start_date) > now)) return false;
            if (filterStatus === 'ended' && !(p.is_active && p.end_date && new Date(p.end_date) < now)) return false;
            if (filterStatus === 'inactive' && p.is_active) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                (TYPE_LABELS[p.type] || '').toLowerCase().includes(q)
            );
        });
    }, [promos, search, filterType, filterStatus]);

    const stats = useMemo(() => {
        const total = promos.length;
        const active = promos.filter(isPromoActive).length;
        const scheduled = promos.filter((p) => p.is_active && p.start_date && new Date(p.start_date) > now).length;
        const types = new Set(promos.map((p) => p.type)).size;
        return { total, active, scheduled, types };
    }, [promos]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setProcessing(true);
        router.delete(route('admin.promotions.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setDeleteTarget(null); },
        });
    };

    const STATUS_LABELS = {
        all: 'Semua Status',
        active: 'Aktif',
        scheduled: 'Terjadwal',
        ended: 'Berakhir',
        inactive: 'Nonaktif',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">Promo</h2>
                    {canManage && (
                        <Button
                            as={Link}
                            href={route('admin.promotions.create')}
                            icon={Plus}
                        >
                            <span className="hidden sm:inline">Tambah Promo</span>
                            <span className="sm:hidden">Tambah</span>
                        </Button>
                    )}
                </div>
            }
        >
            <Head title="Promo" />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground/30 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Promo</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-emerald-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Aktif</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.active}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-sky-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Terjadwal</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.scheduled}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-primary-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Jenis Tipe</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.types}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama promo, kode, atau tipe..."
                                className="block w-full rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-sm transition hover:bg-muted">
                                        <span className={filterType !== 'all' ? 'text-foreground' : 'text-muted-foreground'}>
                                            {filterType === 'all' ? 'Semua Tipe' : TYPE_LABELS[filterType]}
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="48">
                                    <button onClick={() => setFilterType('all')} className={`block w-full px-4 py-2.5 text-left text-sm transition ${filterType === 'all' ? 'bg-primary-50 font-medium text-primary-600' : 'text-muted-foreground hover:bg-muted'}`}>Semua Tipe</button>
                                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                                        <button key={key} onClick={() => setFilterType(key)} className={`block w-full px-4 py-2.5 text-left text-sm transition ${filterType === key ? 'bg-primary-50 font-medium text-primary-600' : 'text-muted-foreground hover:bg-muted'}`}>{label}</button>
                                    ))}
                                </Dropdown.Content>
                            </Dropdown>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-sm transition hover:bg-muted">
                                        <span className={filterStatus !== 'all' ? 'text-foreground' : 'text-muted-foreground'}>
                                            {STATUS_LABELS[filterStatus]}
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="48">
                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                        <button key={key} onClick={() => setFilterStatus(key)} className={`block w-full px-4 py-2.5 text-left text-sm transition ${filterStatus === key ? 'bg-primary-50 font-medium text-primary-600' : 'text-muted-foreground hover:bg-muted'}`}>{label}</button>
                                    ))}
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">{promos.length}</span>{' '}
                            promo
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promo</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipe</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cakupan</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Diskon</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Periode</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    {canManage && (
                                        <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 7 : 6} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                                    </svg>
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-muted-foreground">
                                                    {search || filterType !== 'all' || filterStatus !== 'all'
                                                        ? 'Promo tidak ditemukan'
                                                        : 'Belum ada promo'}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {search || filterType !== 'all' || filterStatus !== 'all'
                                                        ? 'Coba ubah filter atau kata kunci'
                                                        : 'Klik "Tambah Promo" untuk membuat promo baru'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((promo) => (
                                        <tr key={promo.id} className="transition hover:bg-muted/50">
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-violet-50 text-sm">
                                                        {SCOPE_META[promo.scope]?.icon ?? '🏷️'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">{promo.name}</p>
                                                        <p className="font-mono text-xs text-muted-foreground">{promo.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[promo.type] || 'bg-muted text-muted-foreground'}`}>
                                                    {TYPE_LABELS[promo.type] || promo.type}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${(SCOPE_META[promo.scope] ?? {}).color || 'bg-muted text-muted-foreground'}`}>
                                                    {SCOPE_META[promo.scope]?.label ?? promo.scope}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span className="text-sm font-semibold text-foreground">{formatDiscount(promo)}</span>
                                                {promo.products_count > 0 && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">{promo.products_count} produk</p>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                                                {formatDate(promo.start_date)} — {formatDate(promo.end_date)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <PromoStatus promo={promo} />
                                            </td>
                                            {canManage && (
                                                <td className="whitespace-nowrap px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            href={route('admin.promotions.edit', promo.id)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" strokeWidth={1.8} />
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteTarget(promo)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-3 p-3 md:hidden">
                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                </svg>
                            </div>
                            <p className="mt-4 text-sm font-medium text-muted-foreground">Belum ada promo</p>
                        </div>
                    ) : (
                        filtered.map((promo) => (
                            <div key={promo.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">{promo.name}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{promo.code}</p>
                                    </div>
                                    <PromoStatus promo={promo} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Tipe</p>
                                        <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[promo.type] || 'bg-muted text-muted-foreground'}`}>
                                            {TYPE_LABELS[promo.type] || promo.type}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground">Diskon</p>
                                        <p className="mt-0.5 font-semibold text-foreground">{formatDiscount(promo)}</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {formatDate(promo.start_date)} — {formatDate(promo.end_date)}
                                </p>
                                {canManage && (
                                    <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                                        <Link
                                            href={route('admin.promotions.edit', promo.id)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/70"
                                        >
                                            <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => setDeleteTarget(promo)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-red-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                                            Hapus
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                open={!!deleteTarget}
                title={`Hapus promo ${deleteTarget?.name}?`}
                description="Data promo ini akan dihapus permanen."
                processing={processing}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
