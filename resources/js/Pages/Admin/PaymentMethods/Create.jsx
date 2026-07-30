import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/Components/PageHeader';
import SectionCard from '@/Components/ui/SectionCard';
import PaymentMethodForm from './PaymentMethodForm';

export default function Create({ types }) {
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        type: '',
        provider: '',
        account_number: '',
        account_name: '',
        image: null,
        is_active: true,
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('image', file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setData('image', null);
        setImagePreview(null);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.payment-methods.store'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">Tambah Metode Pembayaran</div>
                    <div className="text-[11px] text-muted-foreground">Metode bayar baru untuk kasir</div>
                </div>
            }
            backUrl={route('admin.payment-methods.index')}
        >
            <PageHeader
                title="Tambah Metode Pembayaran"
                breadcrumbs={['Admin', 'Pengaturan', 'Metode Pembayaran', 'Tambah']}
                heading="Tambah Metode Pembayaran"
                description="Tambah metode pembayaran baru yang bisa dipilih kasir saat transaksi."
            />

            <div className="mx-auto w-full max-w-2xl">
                <SectionCard
                    title="Informasi Metode Pembayaran"
                    subtitle="Tambah metode pembayaran baru yang bisa dipilih kasir saat transaksi."
                >
                    <PaymentMethodForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Metode Pembayaran"
                        cancelHref={route('admin.payment-methods.index')}
                        types={types}
                        imagePreview={imagePreview}
                        onImageChange={handleImageChange}
                        onRemoveImage={handleRemoveImage}
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
