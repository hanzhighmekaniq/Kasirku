import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import SectionCard from '@/Components/ui/SectionCard';
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
        max_usage: promotion.max_usage ?? '',
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
                <SectionCard
                    title="Detail Promo"
                    subtitle={`Edit informasi promo ${promotion.name}`}
                >
                    <PromotionForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Perubahan"
                        cancelHref={route('admin.promotions.index')}
                        products={products}
                        promotion={promotion}
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
