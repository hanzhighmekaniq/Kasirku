import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import SectionCard from '@/Components/ui/SectionCard';
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
        max_usage: '',
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
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Tambah Promo</h2>
                </div>
            }
        >
            <Head title="Tambah Promo" />

            <div className="mx-auto max-w-2xl">
                <SectionCard
                    title="Detail Promo"
                    subtitle="Buat promo baru untuk meningkatkan penjualan"
                >
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
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
