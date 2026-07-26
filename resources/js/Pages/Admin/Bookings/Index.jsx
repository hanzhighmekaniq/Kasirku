import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Button from '@/Components/ui/Button';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';
import StatusBadge, { STATUS_LABELS } from './StatusBadge';

function formatDateTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Index({ bookings, filters }) {
    const [deleting, setDeleting] = useState(null);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const data = bookings?.data || [];
        if (!q) return data;
        return data.filter(
            (b) =>
                b.booking_no.toLowerCase().includes(q) ||
                (b.customer_name || '').toLowerCase().includes(q) ||
                (b.customer_phone || '').toLowerCase().includes(q),
        );
    }, [bookings, search]);

    const statusFilter = filters?.status || '';

    const confirmDelete = () => {
        if (!deleting) return;
        router.delete(route('admin.bookings.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    const handleStatusFilter = (status) => {
        router.get(route('admin.bookings.index'), { status: status || undefined }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Booking
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <PageHeader
                title="Booking / Reservasi"
                breadcrumbs={["Admin", "Booking"]}
                heading={
                    <>
                        Kelola{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            booking
                        </span>{" "}
                        pelanggan
                    </>
                }
                description="Atur reservasi, jam kedatangan, dan status booking pelanggan."
                action={
                    <Link href={route('admin.bookings.create')}>
                        <Button icon={Plus}>
                            <span className="hidden sm:inline">Tambah Booking</span>
                            <span className="sm:hidden">Tambah</span>
                        </Button>
                    </Link>
                }
            />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => handleStatusFilter('')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                !statusFilter
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                            }`}
                        >
                            Semua
                        </button>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => handleStatusFilter(key)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    statusFilter === key
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:max-w-xs">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                <Search className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari..."
                                className="block w-full rounded-xl border-border bg-card pl-9 text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-nowrap">
                            Total <span className="font-semibold text-foreground">{filtered.length}</span> booking
                        </p>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search || statusFilter ? 'Booking tidak ditemukan' : 'Belum ada booking'}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search || statusFilter ? 'Coba filter atau kata kunci lain.' : 'Mulai dengan menambahkan booking baru.'}
                        </p>
                        {!search && !statusFilter && (
                            <Link href={route('admin.bookings.create')} className="mt-5">
                                <Button icon={Plus}>Tambah Booking</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <BookingTable items={filtered} onDelete={setDeleting} />
                )}

                {/* Pagination */}
                {bookings?.links && bookings.links.length > 3 && (
                    <div className="border-t border-border px-4 py-3">
                        <Pagination links={bookings.links} />
                    </div>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!deleting}
                title="Hapus booking?"
                description={
                    deleting
                        ? `Booking ${deleting.booking_no} untuk ${deleting.customer_name} akan dihapus permanen.`
                        : ""
                }
                onConfirm={confirmDelete}
                onClose={() => setDeleting(null)}
            />
        </AuthenticatedLayout>
    );
}

function BookingTable({ items, onDelete }) {
    return (
        <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead className="bg-popover text-left text-xs uppercase tracking-wide text-card-foreground">
                        <tr>
                            <th className="px-6 py-3.5 font-semibold">No. Booking</th>
                            <th className="px-6 py-3.5 font-semibold">Pelanggan</th>
                            <th className="px-6 py-3.5 font-semibold">Mulai</th>
                            <th className="px-6 py-3.5 font-semibold">Selesai</th>
                            <th className="px-6 py-3.5 text-center font-semibold">Tamu</th>
                            <th className="px-6 py-3.5 text-center font-semibold">Status</th>
                            <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {items.map((b) => (
                            <tr key={b.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                <td className="px-6 py-4">
                                    <Link
                                        href={route('admin.bookings.show', b.id)}
                                        className="font-mono text-xs font-semibold text-primary hover:underline"
                                    >
                                        {b.booking_no}
                                    </Link>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground">{b.customer_name}</p>
                                        {b.customer_phone && (
                                            <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                                    {formatDateTime(b.booking_start_at)}
                                </td>
                                <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                                    {formatDateTime(b.booking_end_at)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                        {b.guest_count || '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={b.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link
                                            href={route('admin.bookings.edit', b.id)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4" strokeWidth={1.7} />
                                        </Link>
                                        <button
                                            onClick={() => onDelete(b)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                            title="Hapus"
                                        >
                                            <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
                {items.map((b) => (
                    <div key={b.id} className="flex flex-col gap-2 p-4">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0">
                                <Link
                                    href={route('admin.bookings.show', b.id)}
                                    className="font-mono text-xs font-semibold text-primary"
                                >
                                    {b.booking_no}
                                </Link>
                                <p className="font-medium text-foreground">{b.customer_name}</p>
                                {b.customer_phone && (
                                    <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                                )}
                            </div>
                            <StatusBadge status={b.status} />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>Mulai: {formatDateTime(b.booking_start_at)}</span>
                            {b.booking_end_at && <span>• Selesai: {formatDateTime(b.booking_end_at)}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {b.guest_count || '—'} tamu
                            </span>
                            <div className="flex items-center gap-1">
                                <Link
                                    href={route('admin.bookings.edit', b.id)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                                >
                                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
                                    Edit
                                </Link>
                                <button
                                    onClick={() => onDelete(b)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

function Pagination({ links }) {
    const items = links.filter((l) => !isNaN(l.label));
    if (items.length === 0) return null;

    return (
        <nav className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
                Halaman
            </p>
            <div className="flex items-center gap-1">
                {links.map((link, i) => {
                    if (link.label.includes('Previous')) {
                        return (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs transition ${
                                    link.url
                                        ? 'text-muted-foreground hover:bg-muted'
                                        : 'cursor-not-allowed text-muted-foreground/50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: '&laquo;' }}
                            />
                        );
                    }
                    if (link.label.includes('Next')) {
                        return (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs transition ${
                                    link.url
                                        ? 'text-muted-foreground hover:bg-muted'
                                        : 'cursor-not-allowed text-muted-foreground/50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: '&raquo;' }}
                            />
                        );
                    }
                    return (
                        <button
                            key={i}
                            disabled={!link.url || link.active}
                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                            className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                                link.active
                                    ? 'bg-primary/10 text-primary'
                                    : link.url
                                    ? 'text-muted-foreground hover:bg-muted'
                                    : 'cursor-not-allowed text-muted-foreground/50'
                            }`}
                        >
                            {link.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
