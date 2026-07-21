import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import SummaryCards from './components/SummaryCards';

export default function Stock({ summary, lowStock = [], byCategory = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-foreground">Laporan Stok</h2>}>
            <Head title="Laporan Stok" />
            {flash?.success && <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-end">
                <Link href={route('admin.reports.index')} className="text-sm font-medium text-primary-600 hover:underline">← Ringkasan</Link>
            </div>

            <SummaryCards items={[
                { label: 'Total Produk', value: summary?.total_products ?? 0 },
                { label: 'Stok Menipis (≤5)', value: summary?.low_stock ?? 0 },
                { label: 'Stok Habis', value: summary?.out_of_stock ?? 0 },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-foreground">Produk Stok Menipis</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                                <th className="px-4 py-2.5">Produk</th>
                                <th className="px-4 py-2.5">SKU</th>
                                <th className="px-4 py-2.5">Kategori</th>
                                <th className="px-4 py-2.5 text-right">Stok</th>
                            </tr></thead>
                            <tbody>{lowStock.length > 0 ? lowStock.map((p) => (
                                <tr key={p.id} className="border-t border-border">
                                    <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku || '—'}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.total_stock <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-700'}`}>
                                            {p.total_stock}
                                        </span>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Semua stok aman</td></tr>}</tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Per Kategori</h3>
                    {byCategory.length > 0 ? byCategory.map((c, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <span className="text-sm text-foreground">{c.category}</span>
                            <span className="text-sm font-medium text-foreground">{c.total_stock} stok</span>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">Belum ada data</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
