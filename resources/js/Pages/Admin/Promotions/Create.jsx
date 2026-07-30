import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import SectionCard from '@/Components/ui/SectionCard';
import { useForm } from '@inertiajs/react';
import PromotionForm from './PromotionForm';

export default function Create({ buckets = [], customerTiers = [], scopeSupport = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'percentage',
        scope: 'item',
        discount_value: '',
        min_purchase_amount: '',
        max_discount_amount: '',
        min_quantity: '',
        tier_price: '',
        customer_tier_id: '',
        start_date: '',
        end_date: '',
        start_hour: '',
        end_hour: '',
        applicable_days: [],
        free_product_id: '',
        free_variant_id: '',
        free_quantity: '',
        is_active: true,
        max_usage: '',
        items: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.promotions.store'));
    };

    return (
        <AuthenticatedLayout
            backUrl={route('admin.promotions.index')}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">Promo</div>
                    <div className="text-[11px] text-muted-foreground">Tambah</div>
                </div>
            }>
            <PageHeader
                title="Tambah Promo"
                breadcrumbs={['Admin', 'Promo', 'Tambah']}
                heading={
                    <>
                        Tambah{' '}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Promo
                        </span>
                    </>
                }
                description="Buat promo baru untuk mendorong penjualan di kasir."
            />

            <div className="mx-auto max-w-2xl">
                <SectionCard
                    title="Detail Promo"
                    subtitle="Tipe promo menentukan field mana yang perlu diisi."
                >
                    <PromotionForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Promo"
                        cancelHref={route('admin.promotions.index')}
                        buckets={buckets}
                        scopeSupport={scopeSupport}
                        customerTiers={customerTiers}
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
