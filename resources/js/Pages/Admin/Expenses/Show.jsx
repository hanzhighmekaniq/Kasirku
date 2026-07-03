import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_CONFIG = {
    draft: { label: 'Draft', className: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500' },
    posted: { label: 'Posted', className: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500' },
    cancelled: { label: 'Dibatalkan', className: 'bg-slate-100 text-slate-500', dotColor: 'bg-slate-400' },
};

function StatusBadge({ status, large }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.className} ${large ? 'text-sm px-4 py-1.5' : ''}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
            {cfg.label}
        </span>
    );
}

function formatRupiah(val) {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Show({ expense }) {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [nextStatus, setNextStatus] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleStatusChange = (status) => {
        setNextStatus(status);
        setShowStatusModal(true);
    };

    const confirmStatusChange = () => {
        setProcessing(true);
        router.patch(route('admin.expenses.updateStatus', expense.id), { status: nextStatus }, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setShowStatusModal(false);
                setNextStatus('');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.expenses.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Detail Pengeluaran</h2>
                </div>
            }
        >
            <Head title={`Pengeluaran - ${expense.expense_no}`} />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">No. Pengeluaran</p>
                            <h3 className="mt-1 text-xl font-bold text-slate-800">{expense.expense_no}</h3>
                        </div>
                        <StatusBadge status={expense.status} large />
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Tanggal</p>
                            <p className="mt-0.5 text-sm font-medium text-slate-800">{formatDate(expense.expense_date)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Kategori</p>
                            <p className="mt-0.5 text-sm font-medium text-slate-800">{expense.expense_category?.name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Jumlah</p>
                            <p className="mt-0.5 text-lg font-bold text-rose-600">{formatRupiah(expense.amount)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Dicatat oleh</p>
                            <p className="mt-0.5 text-sm font-medium text-slate-800">{expense.user?.name || '—'}</p>
                        </div>
                        {expense.notes && (
                            <div className="sm:col-span-2">
                                <p className="text-xs font-medium text-slate-500">Catatan</p>
                                <p className="mt-0.5 text-sm text-slate-700 whitespace-pre-wrap">{expense.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Actions */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">Aksi Status</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 p-6">
                        {expense.status === 'draft' && (
                            <>
                                <button
                                    onClick={() => handleStatusChange('posted')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Post
                                </button>
                                <button
                                    onClick={() => handleStatusChange('cancelled')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Batalkan
                                </button>
                            </>
                        )}
                        {expense.status === 'posted' && (
                            <button
                                onClick={() => handleStatusChange('cancelled')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Batalkan
                            </button>
                        )}
                        {expense.status === 'cancelled' && (
                            <p className="text-sm text-slate-500 italic">Pengeluaran telah dibatalkan.</p>
                        )}
                    </div>
                </div>

                {/* Back */}
                <div className="flex justify-end">
                    <Link
                        href={route('admin.expenses.index')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Kembali ke Daftar
                    </Link>
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        onClick={() => !processing && setShowStatusModal(false)}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                        <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${nextStatus === 'posted' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                {nextStatus === 'posted' ? (
                                    <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-slate-900">
                                    {nextStatus === 'posted' ? 'Post pengeluaran?' : 'Batalkan pengeluaran?'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {nextStatus === 'posted'
                                        ? 'Pengeluaran akan ditandai sebagai posted dan tidak dapat diedit.'
                                        : 'Pengeluaran akan dibatalkan. Tindakan ini dapat mengubah status kembali.'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                disabled={processing}
                                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={processing}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-60 ${
                                    nextStatus === 'posted'
                                        ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700'
                                        : 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-700'
                                }`}
                            >
                                {processing ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Memproses...
                                    </>
                                ) : (
                                    nextStatus === 'posted' ? 'Ya, Post' : 'Ya, Batalkan'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
