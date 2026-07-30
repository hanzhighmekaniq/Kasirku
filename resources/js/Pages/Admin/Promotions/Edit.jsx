import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import SectionCard from '@/Components/ui/SectionCard';
import { useForm } from '@inertiajs/react';
import PromotionForm from './PromotionForm';

export default function Edit({
    promotion,
    promotionItems = [],
    buckets = [],
    customerTiers = [],
    scopeSupport = {},
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: promotion.name || '',
        type: promotion.type || 'percentage',
        scope: promotion.scope || 'item',
        discount_value: promotion.discount_value || '',
        min_purchase_amount: promotion.min_purchase_amount || '',
        max_discount_amount: promotion.max_discount_amount || '',
        min_quantity: promotion.min_quantity || '',
        tier_price: promotion.tier_price || '',
        customer_tier_id: promotion.customer_tier_id || '',
        start_date: promotion.start_date || '',
        end_date: promotion.end_date || '',
        start_hour: promotion.start_hour || '',
        end_hour: promotion.end_hour || '',
        applicable_days: promotion.applicable_days || [],
        free_product_id: promotion.free_product_id || '',
        free_variant_id: promotion.free_variant_id || '',
        free_quantity: promotion.free_quantity ?? '',
        is_active: promotion.is_active ?? true,
        max_usage: promotion.max_usage ?? '',
        items: promotionItems,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.promotions.update', promotion.id));
    };

    return (
        <AuthenticatedLayout
            backUrl={route('admin.promotions.index')}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">Promo</div>
                    <div className="text-[11px] text-muted-foreground">Edit</div>
                </div>
            }>
            <PageHeader
                title={`Edit ${promotion.name}`}
                breadcrumbs={['Admin', 'Promo', 'Edit']}
                heading={
                    <>
                        Edit{' '}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Promo
                        </span>
                    </>
                }
                description={`Ubah pengaturan promo "${promotion.name}".`}
            />

            <div className="mx-auto max-w-2xl">
                <SectionCard
                    title="Detail Promo"
                    subtitle={`Kode promo: ${promotion.code}`}
                >
                    <PromotionForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Perubahan"
                        cancelHref={route('admin.promotions.index')}
                        buckets={buckets}
                        scopeSupport={scopeSupport}
                        customerTiers={customerTiers}
                        promotion={promotion}
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
