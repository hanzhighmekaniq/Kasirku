import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { Clock, Hash, Phone, Plus, User, X } from 'lucide-react';

const STATUS_META = {
    waiting: { label: 'Menunggu', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    serving: { label: 'Dilayani', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
    completed: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    cancelled: { label: 'Batal', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
};

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || STATUS_META.waiting;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${status === 'waiting' || status === 'serving' ? 'animate-pulse' : ''}`} />
            {meta.label}
        </span>
    );
}

function AddQueueModal({ open, onClose, processing }) {
    const [form, setForm] = useState({ customer_name: '', customer_phone: '', notes: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('admin.queue.store'), form, {
            preserveScroll: true,
            onSuccess: () => {
                setForm({ customer_name: '', customer_phone: '', notes: '' });
                onClose();
            },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Tambah Antrian</h3>
                    <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Nama Pelanggan</label>
                        <input
                            type="text"
                            value={form.customer_name}
                            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                            maxLength={100}
                            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                            placeholder="Opsional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">No. Telepon</label>
                        <input
                            type="text"
                            value={form.customer_phone}
                            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                            maxLength={20}
                            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                            placeholder="Opsional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Catatan</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            maxLength={500}
                            rows={2}
                            className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                            placeholder="Opsional"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            Batal
                        </button>
                        <button type="submit" disabled={processing} className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60">
                            {processing ? 'Menambahkan...' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function QueueCard({ queue, onStatusChange, onDelete }) {
    const meta = STATUS_META[queue.status] || STATUS_META.waiting;

    return (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            {/* Queue Number */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xl font-bold text-primary-700">
                {queue.queue_number}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                        {queue.customer_name || 'Tanpa Nama'}
                    </p>
                    <StatusBadge status={queue.status} />
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    {queue.customer_phone && (
                        <span className="flex items-center gap-1">
                            <Phone size={11} /> {queue.customer_phone}
                        </span>
                    )}
                    {queue.served_at && (
                        <span className="flex items-center gap-1">
                            <Clock size={11} /> Dilayani {formatTime(queue.served_at)}
                        </span>
                    )}
                    {queue.notes && (
                        <span className="truncate text-slate-400">{queue.notes}</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
                {queue.status === 'waiting' && (
                    <button
                        onClick={() => onStatusChange(queue.id, 'serving')}
                        className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600"
                    >
                        Layani
                    </button>
                )}
                {queue.status === 'serving' && (
                    <button
                        onClick={() => onStatusChange(queue.id, 'completed')}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                    >
                        Selesai
                    </button>
                )}
                {(queue.status === 'waiting' || queue.status === 'serving') && (
                    <>
                        <button
                            onClick={() => onStatusChange(queue.id, 'cancelled')}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => onDelete(queue)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                        >
                            Hapus
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Index({ queues = [], stats = {} }) {
    const { flash } = usePage().props;
    const [showAdd, setShowAdd] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleStatusChange = useCallback((id, status) => {
        router.patch(route('admin.queue.update-status', id), { status }, { preserveScroll: true });
    }, []);

    const handleDelete = useCallback((queue) => {
        if (!confirm(`Hapus antrian #${queue.queue_number}?`)) return;
        router.delete(route('admin.queue.destroy', queue.id), { preserveScroll: true });
    }, []);

    const activeQueues = queues.filter((q) => q.status === 'waiting' || q.status === 'serving');
    const doneQueues = queues.filter((q) => q.status === 'completed' || q.status === 'cancelled');

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Antrian</h2>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:from-primary-600 hover:to-primary-700"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Tambah Antrian</span>
                    </button>
                </div>
            }
        >
            <Head title="Antrian" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}

            {/* Stats */}
            <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                    { label: 'Menunggu', value: stats.waiting ?? 0, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                    { label: 'Dilayani', value: stats.serving ?? 0, color: 'text-sky-600 bg-sky-50 border-sky-200' },
                    { label: 'Selesai', value: stats.completed ?? 0, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                ].map((s) => (
                    <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Active queues */}
            {activeQueues.length > 0 && (
                <section className="mb-6">
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                        Antrian Aktif ({activeQueues.length})
                    </h3>
                    <div className="space-y-2">
                        {activeQueues.map((q) => (
                            <QueueCard key={q.id} queue={q} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty state */}
            {activeQueues.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <Hash size={40} className="text-slate-300" />
                    <h3 className="mt-4 text-base font-semibold text-slate-800">Antrian Kosong</h3>
                    <p className="mt-1 text-sm text-slate-500">Belum ada pelanggan dalam antrian hari ini.</p>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                        <Plus size={16} /> Tambah Antrian
                    </button>
                </div>
            )}

            {/* Done queues */}
            {doneQueues.length > 0 && (
                <section className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-slate-500">
                        Riwayat Hari Ini ({doneQueues.length})
                    </h3>
                    <div className="space-y-2 opacity-70">
                        {doneQueues.map((q) => (
                            <QueueCard key={q.id} queue={q} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                        ))}
                    </div>
                </section>
            )}

            <AddQueueModal open={showAdd} onClose={() => setShowAdd(false)} processing={processing} />
        </AuthenticatedLayout>
    );
}
