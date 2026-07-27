import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import StockTabs from '@/Components/StockTabs';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function UnbatchedSales({ items }) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((i) =>
            (i.sale_no ?? '').toLowerCase().includes(q) ||
            (i.product_name ?? '').toLowerCase().includes(q) ||
            (i.product_sku ?? '').toLowerCase().includes(q)
        );
    }, [items, search]);

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">Stok</div>
                    <div className="text-[11px] text-muted-foreground">Batch & Expiry</div>
                </div>
            }
        >
            <Head title="Penjualan Tanpa Batch" />

            <PageHeader
                title="Penjualan Tanpa Batch"
                breadcrumbs={['Admin', 'Stok', 'Batch & Expiry', 'Tanpa Batch']}
                heading={
                    <>
                        Penjualan{' '}
                        <span className="bg-gradient-to-r from-warning to-destructive bg-clip-text text-transparent">
                            Tanpa Batch
                        </span>
                    </>
                }
                description="Item penjualan yang produknya dilacak batch, namun batch tidak tercatat saat transaksi."
                backUrl={route('admin.product-batches.index')}
            />

            <StockTabs />

            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={2} />
                <div className="text-sm text-foreground">
                    <p className="font-medium">Apa ini?</p>
                    <p className="mt-0.5 text-muted-foreground">
                        Item ini muncul karena stok dipotong sebelum sistem FEFO aktif, atau karena batch produk habis
                        saat penjualan. Gunakan{' '}
                        <Link href={route('admin.stock-opnames.index')} className="text-primary underline underline-offset-2">
                            Opname Stok
                        </Link>{' '}
                        untuk menyelaraskan saldo batch.
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari no. penjualan / produk..."
                                className="block w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground shadow-sm transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">{filtered.length} dari {items.length} item</span>
                    </div>
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left">No. Penjualan</th>
                                <th className="px-4 py-3 text-left">Tgl Jual</th>
                                <th className="px-4 py-3 text-left">Produk</th>
                                <th className="px-4 py-3 text-left">Variant</th>
                                <th className="px-4 py-3 text-left">Kemasan</th>
                                <th className="px-4 py-3 text-right">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-background">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <p className="text-sm font-medium text-foreground">
                                            {search ? 'Item tidak ditemukan' : 'Semua penjualan sudah tercatat batch-nya'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => (
                                    <tr key={item.id} className="transition hover:bg-muted/30">
                                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-primary">{item.sale_no ?? '-'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDate(item.sale_date)}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <p className="font-medium text-foreground">{item.product_name}</p>
                                            <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{item.variant_name ?? '-'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{item.packaging_unit ?? '-'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">{item.quantity}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-3 p-3 md:hidden">
                    {filtered.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            {search ? 'Item tidak ditemukan' : 'Semua penjualan sudah tercatat batch-nya'}
                        </p>
                    ) : (
                        filtered.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-mono text-xs font-semibold text-primary">{item.sale_no}</p>
                                        <p className="mt-0.5 text-sm font-medium text-foreground">{item.product_name}</p>
                                        {(item.variant_name || item.packaging_unit) && (
                                            <p className="text-xs text-muted-foreground">
                                                {[item.variant_name, item.packaging_unit].filter(Boolean).join(' - ')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">{fmtDate(item.sale_date)}</p>
                                        <p className="mt-0.5 font-semibold text-foreground">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
