import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import BranchForm from './BranchForm';

export default function Edit({ branch }) {
    const { data, setData, put, processing, errors } = useForm({
        code: branch.code || '',
        name: branch.name || '',
        phone: branch.phone || '',
        address: branch.address || '',
        is_active: !!branch.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.branches.update', branch.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.branches.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Edit Outlet / Cabang</h2>
                </div>
            }
        >
            <Head title="Edit Outlet / Cabang" />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Informasi Cabang</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Perbarui detail cabang "{branch.name}".</p>
                    </div>
                    <div className="p-6">
                        <BranchForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Perubahan"
                            cancelHref={route('admin.branches.index')}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
