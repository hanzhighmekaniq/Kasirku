import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
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
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.payment-methods.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Tambah Metode Pembayaran</h2>
                </div>
            }
        >
            <Head title="Tambah Metode Pembayaran" />

            <div className="mx-auto max-w-2xl">
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
