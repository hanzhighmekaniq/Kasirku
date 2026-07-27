import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import ProductBatchForm from './ProductBatchForm';
import PageHeader from "@/Components/PageHeader";

export default function Edit({ batch, products, branches }) {
    const { data, setData, put, processing, errors } = useForm({
        product_id:    batch.product_id   ?? '',
        variant_id:    batch.variant_id   ?? '',
        packaging_unit_id: batch.packaging_unit_id ?? '',
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
            <Head title="Edit Batch Produk" />
            <PageHeader
                title="Edit Batch Produk"
                breadcrumbs={["Admin", "Stok", "Batch", "Edit"]}
                heading={
                    <>
                        Edit{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Batch Produk
                        </span>
                    </>
                }
                description={`Perbarui informasi untuk batch ${batch.batch_no}.`}
                backUrl={route('admin.product-batches.index')}
            />
            
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
