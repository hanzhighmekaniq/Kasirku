import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import SectionCard from '@/Components/ui/SectionCard';
import PaymentMethodForm from './PaymentMethodForm';

export default function Edit({ paymentMethod, types }) {
    const [imagePreview, setImagePreview] = useState(
        paymentMethod.image ? `/storage/${paymentMethod.image}` : null,
    );

    const { data, setData, post, processing, errors } = useForm({
        _method:      'put',
        code:         paymentMethod.code             ?? '',
        name:         paymentMethod.name             ?? '',
        type:         paymentMethod.type             ?? '',
        provider:     paymentMethod.provider         ?? '',
        account_number: paymentMethod.account_number ?? '',
        account_name:   paymentMethod.account_name   ?? '',
        image:        null,
        remove_image: false,
        is_active:    paymentMethod.is_active        ?? true,
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('image', file);
        setData('remove_image', false);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setData('image', null);
        setData('remove_image', true);
        setImagePreview(null);
    };

    const submit = (e) => {
        e.preventDefault();
        // PUT + multipart tidak didukung browser — kirim sebagai POST dengan
        // _method override (pola standar Laravel/Inertia untuk file upload).
        // `_method` harus ada di form data itu sendiri (bukan di options),
        // karena useForm().post() selalu mengirim state data-nya sendiri.
        post(route('admin.payment-methods.update', paymentMethod.id), {
            forceFormData: true,
        });
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
                    <h2 className="text-lg font-semibold text-foreground">Edit Metode Pembayaran</h2>
                </div>
            }
        >
            <Head title="Edit Metode Pembayaran" />

            <div className="mx-auto max-w-2xl">
                <SectionCard
                    title="Informasi Metode Pembayaran"
                    subtitle={<>Perbarui detail untuk <span className="font-medium text-foreground">{paymentMethod.name}</span>.</>}
                >
                    <PaymentMethodForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Perubahan"
                        cancelHref={route('admin.payment-methods.index')}
                        types={types}
                        imagePreview={imagePreview}
                        onImageChange={handleImageChange}
                        onRemoveImage={handleRemoveImage}
                        isTypeLocked={paymentMethod.type === 'cash' || paymentMethod.type === 'debt'}
                        lockedTypeName={paymentMethod.type === 'cash' ? 'Tunai' : 'Hutang/Kasbon'}
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
