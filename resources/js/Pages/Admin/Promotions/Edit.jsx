import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PromotionForm from './PromotionForm';

export default function Edit({ promotion, products }) {
    const { data, setData, put, processing, errors } = useForm({
        name: promotion.name || '',
        type: promotion.type || 'percentage',
        scope: promotion.scope || 'item',
        discount_value: promotion.discount_value || '',
        min_purchase_amount: promotion.min_purchase_amount || '',
        max_discount_amount: promotion.max_discount_amount || '',
        min_quantity: promotion.min_quantity || '',
        tier_price: promotion.tier_price || '',
        customer_tier: promotion.customer_tier || '',
        start_date: promotion.start_date || '',
        end_date: promotion.end_date || '',
        start_hour: promotion.start_hour || '',
        end_hour: promotion.end_hour || '',
        free_product_id: promotion.free_product_id || '',
        is_active: promotion.is_active ?? true,
        product_ids: (promotion.products || []).map((p) => p.id),
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.promotions.update', promotion.id));
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
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Edit Promo</h2>
                </div>
            }
        >
            <Head title={`Edit ${promotion.name}`} />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Detail Promo</h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Edit informasi promo <span className="font-medium text-indigo-600">{promotion.name}</span>
                        </p>
                    </div>
                    <div className="p-6">
                        <PromotionForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Update Promo"
                            cancelHref={route('admin.promotions.index')}
                            products={products}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
