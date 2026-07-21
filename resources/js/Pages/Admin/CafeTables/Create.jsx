import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import CafeTableForm from './CafeTableForm';

export default function Create({ branches }) {
    const { data, setData, post, processing, errors } = useForm({
        branch_id: '',
        table_number: '',
        capacity: 4,
        status: 'available',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.cafe-tables.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.cafe-tables.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Tambah Meja Cafe</h2>
                </div>
            }
        >
            <Head title="Tambah Meja Cafe" />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Detail Meja</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Isi informasi meja yang akan ditambahkan.</p>
                    </div>
                    <div className="p-6">
                        <CafeTableForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Meja"
                            cancelHref={route('admin.cafe-tables.index')}
                            branches={branches}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
