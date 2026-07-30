import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import Button from '@/Components/ui/Button';
import Select from '@/Components/ui/Select';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import { Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Eye,
    Layers,
    Package,
    Pencil,
    Percent,
    Plus,
    Search,
    ShoppingCart,
    Tag,
    Ticket,
    Trash2,
    Users,
} from 'lucide-react';

const TYPE_LABELS = {
    percentage: 'Persen',
    fixed_amount: 'Nominal',
    buy_x_get_y: 'Beli X Gratis Y',
    bundle: 'Bundle',
    tiered: 'Harga Tiered',
    member_price: 'Harga Member',
    bogo: 'Beli X Gratis Produk',
};

/**
 * Warna badge tipe promo.
 *
 * Kelas ditulis lengkap (bukan hasil interpolasi) supaya tidak dibuang Tailwind
 * saat build, dan memakai pola `-500/10` + `dark:text-*-400` yang sama dengan
 * badge tier di halaman Pelanggan — bukan pasangan `-100/-700` yang dulu dipakai
 * di sini dan terlihat terlalu pekat di light mode.
 */
const TYPE_STYLES = {
    percentage: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    fixed_amount: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    buy_x_get_y: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    bundle: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    tiered: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    member_price: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    bogo: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

/** Ikon tipe promo — konsisten dengan halaman detail promo. */
const TYPE_ICONS = {
    percentage: Percent,
    fixed_amount: Tag,
    buy_x_get_y: Package,
    bundle: Layers,
    tiered: Layers,
    member_price: Users,
    bogo: Package,
};

const SCOPE_META = {
    item: { label: 'Per Item', icon: Package },
    cart: { label: 'Keranjang', icon: ShoppingCart },
};

const TYPE_OPTS = [
    { value: '', label: 'Semua Tipe' },
    ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTS = [
    { value: '', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'scheduled', label: 'Terjadwal' },
    { value: 'ended', label: 'Berakhir' },
    { value: 'inactive', label: 'Nonaktif' },
];

function formatDiscount(promo) {
    if (promo.type === 'percentage') return `${Number(promo.discount_value)}%`;
    if (promo.type === 'fixed_amount') return `Rp ${Number(promo.discount_value).toLocaleString('id-ID')}`;
    if (promo.type === 'tiered' || promo.type === 'member_price') return `Rp ${Number(promo.tier_price || 0).toLocaleString('id-ID')}`;
    if (promo.type === 'bogo' || promo.type === 'buy_x_get_y') return `Beli ${promo.discount_value} gratis 1`;
    return promo.discount_value;
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Status turunan dari is_active + rentang tanggal. */
function promoState(promo, now = new Date()) {
    if (!promo.is_active) return 'inactive';
    if (promo.start_date && new Date(promo.start_date) > now) return 'scheduled';
    if (promo.end_date && new Date(promo.end_date) < now) return 'ended';
    return 'active';
}

const STATE_STYLES = {
    active: 'bg-success/10 text-success',
    scheduled: 'bg-primary/10 text-primary',
    ended: 'bg-destructive/10 text-destructive',
    inactive: 'bg-muted text-muted-foreground',
};

const STATE_LABELS = {
    active: 'Aktif',
    scheduled: 'Terjadwal',
    ended: 'Berakhir',
    inactive: 'Nonaktif',
};

function PromoStatus({ promo }) {
    const state = promoState(promo);
    const pulse = state === 'active' || state === 'scheduled';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_STYLES[state]}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse ? 'animate-pulse' : ''}`} />
            {STATE_LABELS[state]}
        </span>
    );
}

function TypeBadge({ type }) {
    const Icon = TYPE_ICONS[type] ?? Tag;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[type] ?? 'bg-muted text-muted-foreground'}`}
        >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            {TYPE_LABELS[type] ?? type}
        </span>
    );
}

function ScopeBadge({ scope }) {
    const meta = SCOPE_META[scope];
    const Icon = meta?.icon ?? ShoppingCart;

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            {meta?.label ?? scope}
        </span>
    );
}

function EmptyState({ filtered }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Ticket className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
                {filtered ? 'Promo tidak ditemukan' : 'Belum ada promo'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {filtered
                    ? 'Coba ubah filter atau kata kunci.'
                    : 'Buat promo pertama untuk mendorong penjualan di kasir.'}
            </p>
        </div>
    );
}

function RowActions({ promo, onDelete, canManage }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <Link
                href={route('admin.promotions.show', promo.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Detail"
            >
                <Eye className="h-4 w-4" strokeWidth={1.7} />
            </Link>
            {canManage && (
                <>
                    <Link
                        href={route('admin.promotions.edit', promo.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                        title="Edit"
                    >
                        <Pencil className="h-4 w-4" strokeWidth={1.7} />
                    </Link>
                    <button
                        onClick={() => onDelete(promo)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                    </button>
                </>
            )}
        </div>
    );
}

export default function Index({ promotions }) {
    const { auth } = usePage().props;
    const canManage = (auth.permissions ?? []).includes('promotion.create');
    const promos = promotions || [];

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const now = new Date();

        return promos.filter((p) => {
            if (typeFilter && p.type !== typeFilter) return false;
            if (statusFilter && promoState(p, now) !== statusFilter) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                (TYPE_LABELS[p.type] || '').toLowerCase().includes(q)
            );
        });
    }, [promos, search, typeFilter, statusFilter]);

    const stats = useMemo(() => {
        const now = new Date();
        const byState = promos.map((p) => promoState(p, now));

        return {
            total: promos.length,
            active: byState.filter((s) => s === 'active').length,
            scheduled: byState.filter((s) => s === 'scheduled').length,
            types: new Set(promos.map((p) => p.type)).size,
        };
    }, [promos]);

    const isFiltering = !!search || !!typeFilter || !!statusFilter;

    const handleDelete = () => {
        if (!deleteTarget) return;
        setProcessing(true);
        router.delete(route('admin.promotions.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">Promo</div>
                    <div className="text-[11px] text-muted-foreground">Manajemen</div>
                </div>
            }>
            <PageHeader
                title="Promo"
                breadcrumbs={['Admin', 'Penjualan', 'Promo']}
                heading={
                    <>
                        Kelola{' '}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Promo & Diskon
                        </span>
                    </>
                }
                description="Atur diskon, bundle, harga member, dan flash sale yang dipakai kasir."
            />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Promo</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-success bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Aktif</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.active}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-primary bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Terjadwal</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.scheduled}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-warning bg-card p-4 shadow-sm">
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
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                strokeWidth={1.8}
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama promo, kode, atau tipe..."
                                className="block w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <Select
                            options={TYPE_OPTS}
                            value={typeFilter}
                            onChange={setTypeFilter}
                            placeholder="Semua Tipe"
                            className="sm:min-w-[180px]"
                        />
                        <Select
                            options={STATUS_OPTS}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Semua Status"
                            className="sm:min-w-[160px]"
                        />
                        {/* Desktop & tablet: tombol menyatu dengan toolbar tabel.
                            Di mobile disembunyikan, digantikan FAB di pojok kanan bawah. */}
                        {canManage && (
                            <Button
                                as={Link}
                                href={route('admin.promotions.create')}
                                icon={Plus}
                                size="lg"
                                className="hidden shrink-0 sm:inline-flex"
                            >
                                Tambah Promo
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">{promos.length}</span>{' '}
                            promo
                        </p>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState filtered={isFiltering} />
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-border text-sm">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th className="px-4 py-3.5 text-left font-semibold">Promo</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Tipe</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Cakupan</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Diskon</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Periode</th>
                                        <th className="px-4 py-3.5 text-center font-semibold">Status</th>
                                        <th className="px-4 py-3.5 text-right font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {filtered.map((promo) => (
                                        <tr
                                            key={promo.id}
                                            className="transition hover:bg-[rgb(var(--color-table-hover))]"
                                        >
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={route('admin.promotions.show', promo.id)}
                                                    className="font-medium text-foreground transition hover:text-primary"
                                                >
                                                    {promo.name}
                                                </Link>
                                                <p className="font-mono text-xs text-muted-foreground">
                                                    {promo.code}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <TypeBadge type={promo.type} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <ScopeBadge scope={promo.scope} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <span className="font-semibold text-foreground">
                                                    {formatDiscount(promo)}
                                                </span>
                                                {promo.products_count > 0 && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {promo.products_count} produk
                                                    </p>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                                                {formatDate(promo.start_date)} — {formatDate(promo.end_date)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-center">
                                                <PromoStatus promo={promo} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <RowActions
                                                    promo={promo}
                                                    onDelete={setDeleteTarget}
                                                    canManage={canManage}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-border md:hidden">
                            {filtered.map((promo) => (
                                <div key={promo.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={route('admin.promotions.show', promo.id)}
                                                className="block truncate font-medium text-foreground transition hover:text-primary"
                                            >
                                                {promo.name}
                                            </Link>
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {promo.code}
                                            </p>
                                        </div>
                                        <PromoStatus promo={promo} />
                                    </div>

                                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                        <TypeBadge type={promo.type} />
                                        <ScopeBadge scope={promo.scope} />
                                    </div>

                                    <div className="mt-2.5 flex items-baseline justify-between gap-3 text-xs">
                                        <p className="text-muted-foreground">
                                            {formatDate(promo.start_date)} — {formatDate(promo.end_date)}
                                        </p>
                                        <p className="shrink-0 text-sm font-semibold text-foreground">
                                            {formatDiscount(promo)}
                                        </p>
                                    </div>

                                    <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                                        <Link
                                            href={route('admin.promotions.show', promo.id)}
                                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                        >
                                            <Eye className="h-3.5 w-3.5" strokeWidth={1.7} />
                                            Detail
                                        </Link>
                                        {canManage && (
                                            <>
                                                <Link
                                                    href={route('admin.promotions.edit', promo.id)}
                                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteTarget(promo)}
                                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                                                    Hapus
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!deleteTarget}
                title="Hapus promo?"
                description={
                    deleteTarget
                        ? `Promo "${deleteTarget.name}" akan dihapus permanen. Transaksi yang sudah memakai promo ini tidak berubah.`
                        : 'Tindakan ini tidak dapat dibatalkan.'
                }
                confirmLabel="Hapus"
                processing={processing}
                onConfirm={handleDelete}
                onClose={() => {
                    if (!processing) setDeleteTarget(null);
                }}
            />

            {/* FAB — mobile only, menggantikan tombol tambah di toolbar tabel.
                Disembunyikan saat modal terbuka supaya tidak menimpa panelnya. */}
            {canManage && !deleteTarget && (
                <Button
                    as={Link}
                    href={route('admin.promotions.create')}
                    icon={Plus}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl sm:hidden"
                    title="Tambah Promo"
                />
            )}
        </AuthenticatedLayout>
    );
}
