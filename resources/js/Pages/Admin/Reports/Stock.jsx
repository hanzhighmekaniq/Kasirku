import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import SummaryCards from './components/SummaryCards';

export default function Stock({ summary, lowStock = [], byCategory = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-slate-800">Laporan Stok</h2>}>
            <Head title="Laporan Stok" />
            {flash?.success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-end">
                <Link href={route('admin.reports.index')} className="text-sm font-medium text-primary-600 hover:underline">← Ringkasan</Link>
            </div>

            <SummaryCards items={[
                { label: 'Total Produk', value: summary?.total_products ?? 0 },
                { label: 'Stok Menipis (≤5)', value: summary?.low_stock ?? 0 },
                { label: 'Stok Habis', value: summary?.out_of_stock ?? 0 },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-800">Produk Stok Menipis</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                                <th className="px-4 py-2.5">Produk</th>
                                <th className="px-4 py-2.5">SKU</th>
                                <th className="px-4 py-2.5">Kategori</th>
                                <th className="px-4 py-2.5 text-right">Stok</th>
                            </tr></thead>
                            <tbody>{lowStock.length > 0 ? lowStock.map((p) => (
                                <tr key={p.id} className="border-t border-slate-100">
                                    <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.sku || '—'}</td>
                                    <td className="px-4 py-2.5 text-slate-600">{p.category}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.total_stock <= 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                                            {p.total_stock}
                                        </span>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Semua stok aman</td></tr>}</tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Per Kategori</h3>
                    {byCategory.length > 0 ? byCategory.map((c, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <span className="text-sm text-slate-700">{c.category}</span>
                            <span className="text-sm font-medium text-slate-800">{c.total_stock} stok</span>
                        </div>
                    )) : <p className="text-sm text-slate-500">Belum ada data</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
