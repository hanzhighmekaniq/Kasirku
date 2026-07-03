import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import PromotionForm from './PromotionForm';

export default function Create({ products }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'percentage',
        scope: 'item',
        discount_value: '',
        min_purchase_amount: '',
        max_discount_amount: '',
        min_quantity: '',
        tier_price: '',
        customer_tier: '',
        start_date: '',
        end_date: '',
        start_hour: '',
        end_hour: '',
        free_product_id: '',
        is_active: true,
        product_ids: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.promotions.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.promotions.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Tambah Promo</h2>
                </div>
            }
        >
            <Head title="Tambah Promo" />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Detail Promo</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Isi informasi promo yang akan ditawarkan ke pelanggan.</p>
                    </div>
                    <div className="p-6">
                        <PromotionForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Promo"
                            cancelHref={route('admin.promotions.index')}
                            products={products}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
