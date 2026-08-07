import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle, Send, XCircle } from 'lucide-react';

export default function Show({ transfer }) {
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { items, from_branch, to_branch, user } = transfer;

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

    const handleStatus = (status) => {
        setProcessing(true);
        router.patch(route('admin.stock-transfers.updateStatus', transfer.id), { status }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmingStatus(null); },
        });
    };

    return (
        <AuthenticatedLayout
            backUrl={route('admin.stock-transfers.index')}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Stok
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Detail Transfer
                    </div>
                </div>
            }
        >
            <Head title={`Transfer ${transfer.transfer_no}`} />
            <PageHeader
                title={`Transfer ${transfer.transfer_no}`}
                breadcrumbs={["Admin", "Stok", "Transfer Stok", "Detail"]}
                heading={
                    <>
                        Detail{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {transfer.transfer_no}
                        </span>
                    </>
                }
                description={`Perpindahan stok dari ${from_branch?.name ?? '—'} ke ${to_branch?.name ?? '—'}.`}
                backUrl={route('admin.stock-transfers.index')}
            />

            {/* Status badge + actions */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={transfer.status} />
                {transfer.status === 'pending' && (
                    <>
                        <button
                            onClick={() => setConfirmingStatus('in_transit')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition hover:bg-primary/90"
                        >
                            <Send className="h-4 w-4" strokeWidth={2} />
                            Kirim
                        </button>
                        <button
                            onClick={() => setConfirmingStatus('cancelled')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive bg-card px-3.5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                        >
                            <XCircle className="h-4 w-4" strokeWidth={2} />
                            Batalkan
                        </button>
                    </>
                )}
                {transfer.status === 'in_transit' && (
                    <>
                        <button
                            onClick={() => setConfirmingStatus('received')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-success px-3.5 py-2 text-sm font-semibold text-success-foreground shadow-md shadow-success/30 transition hover:bg-success/90"
                        >
                            <CheckCircle className="h-4 w-4" strokeWidth={2} />
                            Terima
                        </button>
                        <button
                            onClick={() => setConfirmingStatus('cancelled')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive bg-card px-3.5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                        >
                            <XCircle className="h-4 w-4" strokeWidth={2} />
                            Batalkan
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Main */}
                <div className="space-y-5 lg:col-span-2">
                    {/* Info */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Informasi Transfer</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoRow label="No. Transfer" value={transfer.transfer_no} />
                                <InfoRow label="Tanggal" value={fmtDate(transfer.transfer_date)} />
                                <InfoRow label="Cabang Asal" value={from_branch?.name ?? '—'} />
                                <InfoRow label="Cabang Tujuan" value={to_branch?.name ?? '—'} />
                                <InfoRow label="Oleh" value={user?.name ?? '—'} />
                                {transfer.notes && <InfoRow label="Catatan" value={transfer.notes} />}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Item Transfer</h3>
                        </div>
                        {/* Desktop table — di mobile diganti kartu di bawah */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold">#</th>
                                        <th className="px-5 py-3 text-left font-semibold">Produk</th>
                                        <th className="px-5 py-3 text-left font-semibold">Qty</th>
                                        <th className="px-5 py-3 text-left font-semibold">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{idx + 1}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5">
                                                <p className="text-sm font-semibold text-foreground">{item.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-foreground">{item.quantity}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{item.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-border md:hidden">
                            {items.map((item, idx) => (
                                <div key={item.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                <span className="text-muted-foreground">{idx + 1}. </span>
                                                {item.product?.name}
                                            </p>
                                            <p className="truncate font-mono text-xs text-muted-foreground">{item.product?.sku}</p>
                                        </div>
                                        <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    {item.notes && (
                                        <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Ringkasan</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Item</dt>
                                    <dd className="font-medium text-foreground">{items.length} produk</dd>
                                </div>
                                <div className="my-2 border-t border-border" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-foreground">Total Qty</dt>
                                    <dd className="text-lg font-bold text-foreground">{totalItems}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">Status</h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <InfoRow label="Status" value={<StatusBadge status={transfer.status} />} isRaw />
                                <InfoRow label="Dibuat" value={fmtDate(transfer.created_at)} />
                                {transfer.updated_at !== transfer.created_at && (
                                    <InfoRow label="Diupdate" value={fmtDate(transfer.updated_at)} />
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm status modal */}
            {confirmingStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => !processing && setConfirmingStatus(null)}>
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                                confirmingStatus === 'received' ? 'bg-success/10' :
                                confirmingStatus === 'in_transit' ? 'bg-primary/10' : 'bg-destructive/10'
                            }`}>
                                {confirmingStatus === 'received'
                                    ? <CheckCircle className="h-6 w-6 text-success" strokeWidth={1.8} />
                                    : confirmingStatus === 'in_transit'
                                        ? <Send className="h-6 w-6 text-primary" strokeWidth={1.8} />
                                        : <XCircle className="h-6 w-6 text-destructive" strokeWidth={1.8} />
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-popover-foreground">
                                    {confirmingStatus === 'in_transit' ? 'Kirim Transfer?' :
                                     confirmingStatus === 'received' ? 'Terima Transfer?' : 'Batalkan Transfer?'}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {confirmingStatus === 'in_transit'
                                        ? 'Transfer akan ditandai dalam perjalanan ke cabang tujuan.'
                                        : confirmingStatus === 'received'
                                            ? 'Stok akan diterima di cabang tujuan. Tindakan ini tidak dapat dibatalkan.'
                                            : 'Transfer akan dibatalkan dan tidak ada perubahan stok.'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button onClick={() => setConfirmingStatus(null)} disabled={processing} className="inline-flex justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60">Batal</button>
                            <button
                                onClick={() => handleStatus(confirmingStatus)}
                                disabled={processing}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
                                    confirmingStatus === 'received'
                                        ? 'bg-success text-success-foreground shadow-success/30 hover:bg-success/90 focus:ring-success'
                                        : confirmingStatus === 'in_transit'
                                            ? 'bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90 focus:ring-primary'
                                            : 'bg-destructive text-destructive-foreground shadow-destructive/30 hover:bg-destructive/90 focus:ring-destructive'
                                }`}
                            >
                                {processing ? 'Memproses...' :
                                 confirmingStatus === 'in_transit' ? 'Ya, Kirim' :
                                 confirmingStatus === 'received' ? 'Ya, Terima' : 'Ya, Batalkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function InfoRow({ label, value, isRaw }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={`text-right ${isRaw ? '' : 'font-medium text-foreground'}`}>{value}</dd>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        pending: 'bg-warning/10 text-warning',
        in_transit: 'bg-primary/10 text-primary',
        received: 'bg-success/10 text-success',
        cancelled: 'bg-destructive/10 text-destructive',
    };
    const label = {
        pending: 'Pending',
        in_transit: 'Dalam Perjalanan',
        received: 'Diterima',
        cancelled: 'Dibatalkan',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
            {label[status] ?? status}
        </span>
    );
}
