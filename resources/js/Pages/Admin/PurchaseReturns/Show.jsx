import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CircleDollarSign, RotateCcw } from 'lucide-react';
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const STATUS_CONFIG = {
    completed: { label: 'Selesai',    color: 'bg-success/10 text-success', dot: 'bg-success' },
    cancelled: { label: 'Dibatalkan', color: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.completed;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

const PAGE_TITLE = {
    retail: 'Retur Pembelian',
    fnb: 'Retur Bahan Baku',
    rental: 'Retur Pembelian Unit',
};

export default function Show({ purchaseReturn, storeType = 'retail' }) {
    const pageTitle = PAGE_TITLE[storeType] ?? 'Retur Pembelian';
    const [processing, setProcessing] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const handleCancel = () => {
        setProcessing(true);
        router.patch(route('admin.purchase-returns.updateStatus', purchaseReturn.id), { status: 'cancelled' }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setShowCancelModal(false); },
        });
    };

    return (
        <AuthenticatedLayout
            backUrl={route("admin.purchase-returns.index")}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        {pageTitle}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        {purchaseReturn.return_no}
                    </div>
                </div>
            }>
            <PageHeader
                title={`${pageTitle} ${purchaseReturn.return_no}`}
                breadcrumbs={["Admin", pageTitle, purchaseReturn.return_no]}
                heading={
                    <div className="flex items-center gap-3">
                        <h2>
                            Detail{" "}
                            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                                {pageTitle}
                            </span>
                        </h2>
                        <StatusBadge status={purchaseReturn.status} />
                    </div>
                }
                description="Lihat rincian retur pembelian, produk, dan status."
                backUrl={route('admin.purchase-returns.index')}
            />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header Card */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">{purchaseReturn.return_no}</h3>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Dibuat oleh {purchaseReturn.user?.name || 'System'} • {formatDateTime(purchaseReturn.created_at)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {purchaseReturn.status === 'completed' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={processing}
                                        className="inline-flex items-center rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow transition hover:bg-secondary/80 disabled:opacity-60"
                                    >
                                        Batalkan Retur
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pembelian Asal</p>
                                <Link
                                    href={route('admin.purchases.show', purchaseReturn.purchase_id)}
                                    className="mt-1 text-sm font-semibold text-primary hover:text-primary/80"
                                >
                                    {purchaseReturn.purchase?.purchase_no || '-'}
                                </Link>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Supplier</p>
                                <p className="mt-1 text-sm font-medium text-foreground">{purchaseReturn.supplier?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tanggal Retur</p>
                                <p className="mt-1 text-sm font-medium text-foreground">{formatDate(purchaseReturn.return_date)}</p>
                            </div>
                        </div>
                        {purchaseReturn.notes && (
                            <div className="mt-4 rounded-xl bg-muted p-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Catatan</p>
                                <p className="mt-1 text-sm text-foreground">{purchaseReturn.notes}</p>
                            </div>
                        )}

                        {/* Payment impact info */}
                        {purchaseReturn.status === 'completed' && (
                            <div className="mt-4 rounded-xl bg-warning/10 border border-warning/20 p-4">
                                <div className="flex items-start gap-2">
                                    <CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-warning" strokeWidth={1.8} />
                                    <div>
                                        <p className="text-sm font-semibold text-warning">Dampak ke Pembayaran</p>
                                        <p className="mt-1 text-sm text-warning">
                                            Total retur sebesar <strong>{formatRupiah(purchaseReturn.total_amount)}</strong> telah dikurangi dari jumlah yang dibayar pada pembelian asal.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {purchaseReturn.status === 'cancelled' && (
                            <div className="mt-4 rounded-xl bg-muted border border-border p-4">
                                <div className="flex items-start gap-2">
                                    <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Retur Dibatalkan</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Retur ini dibatalkan. Stok dan pembayaran telah dikembalikan ke kondisi semula.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Item yang Diretur</h3>
                    </div>
                    <div className="p-6">
                        {/* Desktop */}
                        <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
                            <table className="w-full text-sm">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">Produk</th>
                                        <th className="px-4 py-3 text-center font-semibold">Qty</th>
                                        <th className="px-4 py-3 text-right font-semibold">Harga Satuan</th>
                                        <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {purchaseReturn.items.map((item) => (
                                        <tr key={item.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">{item.product?.name || '-'}</p>
                                                {/* Variant & satuan supaya baris multi-satuan tidak ambigu */}
                                                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                                    {item.variant?.name && (
                                                        <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                            {item.variant.name}
                                                        </span>
                                                    )}
                                                    {item.packaging_unit?.name && (
                                                        <span className="inline-flex items-center rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                                                            {item.packaging_unit.name}
                                                        </span>
                                                    )}
                                                    <span className="font-mono text-[11px] text-muted-foreground">
                                                        {item.product?.sku}
                                                    </span>
                                                </div>
                                                {item.reason && <p className="mt-0.5 text-xs italic text-warning">Alasan: {item.reason}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-foreground">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">{formatRupiah(item.cost_price)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-foreground">{formatRupiah(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="space-y-3 sm:hidden">
                            {purchaseReturn.items.map((item) => (
                                <div key={item.id} className="rounded-xl border border-border bg-background p-3">
                                    <p className="text-sm font-medium text-foreground">{item.product?.name || '-'}</p>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                        {item.variant?.name && (
                                            <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                {item.variant.name}
                                            </span>
                                        )}
                                        {item.packaging_unit?.name && (
                                            <span className="inline-flex items-center rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                                                {item.packaging_unit.name}
                                            </span>
                                        )}
                                        <span className="font-mono text-[11px] text-muted-foreground">
                                            {item.product?.sku}
                                        </span>
                                    </div>
                                    {item.reason && <p className="mt-1 text-xs italic text-warning">Alasan: {item.reason}</p>}
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">×{item.quantity} @ {formatRupiah(item.cost_price)}</span>
                                        <span className="font-semibold text-foreground">{formatRupiah(item.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="mt-4 border-t border-border pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">Total Retur</span>
                                <span className="text-lg font-bold text-primary">{formatRupiah(purchaseReturn.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDeleteModal
                open={showCancelModal}
                title={`Batalkan retur ${purchaseReturn.return_no}?`}
                description="Stok akan dikembalikan dan pembayaran pada pembelian asal akan dipulihkan. Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Ya, Batalkan Retur"
                processing={processing}
                onConfirm={handleCancel}
                onClose={() => setShowCancelModal(false)}
            />
        </AuthenticatedLayout>
    );
}
