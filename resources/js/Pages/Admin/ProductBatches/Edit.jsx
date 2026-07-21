import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import ProductBatchForm from './ProductBatchForm';

export default function Edit({ batch, products, branches }) {
    const { data, setData, put, processing, errors } = useForm({
        product_id:    batch.product_id   ?? '',
        branch_id:     batch.branch_id    ?? '',
        batch_no:      batch.batch_no     ?? '',
        purchase_date: batch.purchase_date ?? '',
        expiry_date:   batch.expiry_date  ?? '',
        quantity:      batch.quantity     ?? '',
        cost_price:    batch.cost_price   ?? '',
        _cost_locked:  true,
    });

    const submit = (e) => { e.preventDefault(); put(route('admin.product-batches.update', batch.id)); };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.product-batches.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Edit Batch Produk</h2>
                </div>
            }
        >
            <Head title="Edit Batch Produk" />
            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Informasi Batch</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Perbarui batch <span className="font-medium text-foreground">{batch.batch_no}</span> — {batch.product?.name}.
                        </p>
                    </div>
                    <div className="p-6">
                        <ProductBatchForm data={data} setData={setData} errors={errors} processing={processing} onSubmit={submit} submitLabel="Simpan Perubahan" cancelHref={route('admin.product-batches.index')} products={products} branches={branches} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
