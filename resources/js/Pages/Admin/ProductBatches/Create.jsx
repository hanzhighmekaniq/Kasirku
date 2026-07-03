import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import ProductBatchForm from './ProductBatchForm';

export default function Create({ products, branches }) {
    const { data, setData, post, processing, errors } = useForm({
        product_id:    '',
        branch_id:     '',
        batch_no:      '',
        purchase_date: '',
        expiry_date:   '',
        quantity:      '',
        cost_price:    '',
        _cost_locked:  false,
    });

    const submit = (e) => { e.preventDefault(); post(route('admin.product-batches.store')); };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.product-batches.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Tambah Batch Produk</h2>
                </div>
            }
        >
            <Head title="Tambah Batch Produk" />
            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Informasi Batch</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Catat batch baru untuk pelacakan stok dan tanggal kadaluarsa.</p>
                    </div>
                    <div className="p-6">
                        <ProductBatchForm data={data} setData={setData} errors={errors} processing={processing} onSubmit={submit} submitLabel="Simpan Batch" cancelHref={route('admin.product-batches.index')} products={products} branches={branches} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
