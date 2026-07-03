import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Booking / Reservasi</h2>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="hidden sm:inline">Tambah Booking</span>
                        <span className="sm:hidden">Tambah</span>
                    </button>
                </div>
            }
        >
            <Head title="Booking / Reservasi" />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => handleStatusFilter('')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                !statusFilter
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:max-w-xs">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari..."
                                className="block w-full rounded-xl border-slate-300 pl-9 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <p className="text-sm text-slate-500 whitespace-nowrap">
                            Total <span className="font-semibold text-slate-700">{filtered.length}</span> booking
                        </p>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {search || statusFilter ? 'Booking tidak ditemukan' : 'Belum ada booking'}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {search || statusFilter ? 'Coba filter atau kata kunci lain.' : 'Mulai dengan menambahkan booking baru.'}
                        </p>
                        {!search && !statusFilter && (
                            <button
                                onClick={openCreate}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Tambah Booking
                            </button>
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
                    <div className="border-t border-slate-100 px-4 py-3">
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
            {deleting && (
                <ConfirmDeleteModal
                    booking={deleting}
                    onConfirm={confirmDelete}
                    onClose={() => setDeleting(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
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
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-6 py-3.5">No. Booking</th>
                            <th className="px-6 py-3.5">Pelanggan</th>
                            <th className="px-6 py-3.5">Mulai</th>
                            <th className="px-6 py-3.5">Selesai</th>
                            <th className="px-6 py-3.5 text-center">Tamu</th>
                            <th className="px-6 py-3.5 text-center">Status</th>
                            <th className="px-6 py-3.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((b) => (
                            <tr key={b.id} className="transition hover:bg-slate-50/70">
                                <td className="px-6 py-4 font-mono text-xs font-semibold text-indigo-600">
                                    {b.booking_no}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-800">{b.customer_name}</p>
                                        {b.customer_phone && (
                                            <p className="text-xs text-slate-400">{b.customer_phone}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-xs whitespace-nowrap">
                                    {formatDateTime(b.booking_start_at)}
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-xs whitespace-nowrap">
                                    {formatDateTime(b.booking_end_at)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
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
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                                            title="Edit"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDelete(b)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                            title="Hapus"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
                {items.map((b) => (
                    <div key={b.id} className="flex flex-col gap-2 p-4">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0">
                                <p className="font-mono text-xs font-semibold text-indigo-600">{b.booking_no}</p>
                                <p className="font-medium text-slate-800">{b.customer_name}</p>
                                {b.customer_phone && (
                                    <p className="text-xs text-slate-400">{b.customer_phone}</p>
                                )}
                            </div>
                            <StatusBadge status={b.status} />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>Mulai: {formatDateTime(b.booking_start_at)}</span>
                            {b.booking_end_at && <span>• Selesai: {formatDateTime(b.booking_end_at)}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {b.guest_count || '—'} tamu
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onEdit(b)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(b)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
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
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                        {editing ? 'Edit Booking' : 'Tambah Booking'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={onSubmit} className="max-h-[70vh] overflow-y-auto p-6">
                    <div className="space-y-4">
                        {/* Customer Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Nama Pelanggan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.customer_name}
                                onChange={set('customer_name')}
                                required
                                maxLength={200}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        {/* Customer Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Telepon
                            </label>
                            <input
                                type="text"
                                value={form.customer_phone}
                                onChange={set('customer_phone')}
                                maxLength={30}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        {/* Customer Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Pelanggan Terdaftar
                            </label>
                            <select
                                value={form.customer_id}
                                onChange={set('customer_id')}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">— Pilih Pelanggan —</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Employee Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Karyawan
                            </label>
                            <select
                                value={form.employee_id}
                                onChange={set('employee_id')}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Mulai <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.booking_start_at}
                                    onChange={set('booking_start_at')}
                                    required
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Selesai
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.booking_end_at}
                                    onChange={set('booking_end_at')}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                        </div>

                        {/* Guest count + Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Jumlah Tamu
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.guest_count}
                                    onChange={set('guest_count')}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.status}
                                    onChange={set('status')}
                                    required
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Catatan
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={set('notes')}
                                rows={3}
                                maxLength={500}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : editing ? 'Simpan' : 'Buat Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ConfirmDeleteModal({ booking, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-800">Hapus booking?</h3>
                <p className="mt-2 text-sm text-slate-500">
                    Booking <span className="font-mono font-semibold text-slate-700">{booking.booking_no}</span> untuk{' '}
                    <span className="font-semibold text-slate-700">{booking.customer_name}</span> akan dihapus permanen.
                </p>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

function Pagination({ links }) {
    const items = links.filter((l) => !isNaN(l.label));
    if (items.length === 0) return null;

    return (
        <nav className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
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
                                        ? 'text-slate-600 hover:bg-slate-100'
                                        : 'cursor-not-allowed text-slate-300'
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
                                        ? 'text-slate-600 hover:bg-slate-100'
                                        : 'cursor-not-allowed text-slate-300'
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
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : link.url
                                    ? 'text-slate-600 hover:bg-slate-100'
                                    : 'cursor-not-allowed text-slate-300'
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
