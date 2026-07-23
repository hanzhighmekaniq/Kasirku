import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import Button from '@/Components/ui/Button';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

const STATUS_LABELS = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    checked_in: 'Checked In',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
};

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    checked_in: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-orange-100 text-orange-700',
};

function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateTime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function toDatetimeLocal(str) {
    if (!str) return '';
    const d = new Date(str);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Index({ bookings, filters, customers, employees }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        customer_id: '',
        employee_id: '',
        customer_name: '',
        customer_phone: '',
        booking_start_at: '',
        booking_end_at: '',
        guest_count: '',
        status: 'pending',
        notes: '',
    });

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

    const openCreate = () => {
        setEditing(null);
        setForm({
            customer_id: '',
            employee_id: '',
            customer_name: '',
            customer_phone: '',
            booking_start_at: '',
            booking_end_at: '',
            guest_count: '',
            status: 'pending',
            notes: '',
        });
        setShowModal(true);
    };

    const openEdit = (booking) => {
        setEditing(booking);
        setForm({
            customer_id: booking.customer_id || '',
            employee_id: booking.employee_id || '',
            customer_name: booking.customer_name || '',
            customer_phone: booking.customer_phone || '',
            booking_start_at: toDatetimeLocal(booking.booking_start_at),
            booking_end_at: toDatetimeLocal(booking.booking_end_at),
            guest_count: booking.guest_count || '',
            status: booking.status,
            notes: booking.notes || '',
        });
        setShowModal(true);
    };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        const method = editing ? 'patch' : 'post';
        const url = editing
            ? route('admin.bookings.update', editing.id)
            : route('admin.bookings.store');

        router[method](url, form, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setShowModal(false);
            },
        });
    };

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
        <AuthenticatedLayout>
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
                    <Button onClick={openCreate} icon={Plus}>
                        <span className="hidden sm:inline">Tambah Booking</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
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
                            <Button onClick={openCreate} icon={Plus} className="mt-5">
                                Tambah Booking
                            </Button>
                        )}
                    </div>
                ) : (
                    <BookingTable
                        items={filtered}
                        onEdit={openEdit}
                        onDelete={setDeleting}
                    />
                )}

                {/* Pagination */}
                {bookings?.links && bookings.links.length > 3 && (
                    <div className="border-t border-border px-4 py-3">
                        <Pagination links={bookings.links} />
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <BookingModal
                    form={form}
                    setForm={setForm}
                    editing={editing}
                    processing={processing}
                    customers={customers || []}
                    employees={employees || []}
                    onSubmit={submit}
                    onClose={() => setShowModal(false)}
                />
            )}

            {/* Delete Confirmation Modal */}
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

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] || 'bg-muted text-muted-foreground'}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

function BookingTable({ items, onEdit, onDelete }) {
    return (
        <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <th className="px-6 py-3.5">No. Booking</th>
                            <th className="px-6 py-3.5">Pelanggan</th>
                            <th className="px-6 py-3.5">Mulai</th>
                            <th className="px-6 py-3.5">Selesai</th>
                            <th className="px-6 py-3.5 text-center">Tamu</th>
                            <th className="px-6 py-3.5 text-center">Status</th>
                            <th className="px-6 py-3.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((b) => (
                            <tr key={b.id} className="transition hover:bg-muted/50">
                                <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                                    {b.booking_no}
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
                                        <button
                                            onClick={() => onEdit(b)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4" strokeWidth={1.7} />
                                        </button>
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
                                <p className="font-mono text-xs font-semibold text-primary">{b.booking_no}</p>
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
                                <button
                                    onClick={() => onEdit(b)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                                >
                                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
                                    Edit
                                </button>
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

function BookingModal({ form, setForm, editing, processing, customers, employees, onSubmit, onClose }) {
    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-popover shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-lg font-semibold text-foreground">
                        {editing ? 'Edit Booking' : 'Tambah Booking'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-5 w-5" strokeWidth={2} />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="max-h-[70vh] overflow-y-auto p-6">
                    <div className="space-y-4">
                        {/* Customer Name */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Nama Pelanggan <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.customer_name}
                                onChange={set('customer_name')}
                                required
                                maxLength={200}
                                className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>

                        {/* Customer Phone */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Telepon
                            </label>
                            <input
                                type="text"
                                value={form.customer_phone}
                                onChange={set('customer_phone')}
                                maxLength={30}
                                className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>

                        {/* Customer Selection */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Pelanggan Terdaftar
                            </label>
                            <select
                                value={form.customer_id}
                                onChange={set('customer_id')}
                                className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            >
                                <option value="">— Pilih Pelanggan —</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Employee Selection */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Karyawan
                            </label>
                            <select
                                value={form.employee_id}
                                onChange={set('employee_id')}
                                className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            >
                                <option value="">— Pilih Karyawan —</option>
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date/Time row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Mulai <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.booking_start_at}
                                    onChange={set('booking_start_at')}
                                    required
                                    className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Selesai
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.booking_end_at}
                                    onChange={set('booking_end_at')}
                                    className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>
                        </div>

                        {/* Guest count + Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Jumlah Tamu
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.guest_count}
                                    onChange={set('guest_count')}
                                    className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Status <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={form.status}
                                    onChange={set('status')}
                                    required
                                    className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                >
                                    {editing ? (
                                        <>
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="checked_in">Checked In</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="no_show">No Show</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="checked_in">Checked In</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Catatan
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={set('notes')}
                                rows={3}
                                maxLength={500}
                                className="block w-full rounded-xl border-border bg-card text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" loading={processing}>
                            {processing ? 'Menyimpan...' : editing ? 'Simpan' : 'Buat Booking'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
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
