import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import ProductBatchForm from './ProductBatchForm';
import PageHeader from "@/Components/PageHeader";

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
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Stok
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Batch & Expiry
                    </div>
                </div>
            }
        >
            <Head title="Tambah Batch Produk" />
            <PageHeader
                title="Tambah Batch Produk"
                breadcrumbs={["Admin", "Stok", "Batch", "Tambah"]}
                heading={
                    <>
                        Tambah{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Batch Produk
                        </span>
                    </>
                }
                description="Catat batch baru untuk pelacakan stok dan tanggal kadaluarsa."
                backUrl={route('admin.product-batches.index')}
            />
            
            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Informasi Batch</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Catat batch baru untuk pelacakan stok dan tanggal kadaluarsa.</p>
                    </div>
                    <div className="p-6">
                        <ProductBatchForm data={data} setData={setData} errors={errors} processing={processing} onSubmit={submit} submitLabel="Simpan Batch" cancelHref={route('admin.product-batches.index')} products={products} branches={branches} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
